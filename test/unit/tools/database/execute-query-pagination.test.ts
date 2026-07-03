import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerExecuteQueryTool } from '../../../../dist/tools/database/execute-query.js';
import { createMockContext } from '../../../helpers/mock-server.js';

interface PageMetadata {
  returnedRows: number;
  offset: number;
  hasMore: boolean;
  nextOffset?: number;
}

function contentTexts(result: Awaited<ReturnType<Client['callTool']>>): string[] {
  const content = result.content as Array<{ type: string; text: string }>;
  return content.map(item => item.text);
}

function parseMetadata(result: Awaited<ReturnType<Client['callTool']>>): PageMetadata {
  const summary = contentTexts(result)[1];
  const match = summary.match(/metadata: (\{.*\})/);
  expect(match, `metadata line missing in: ${summary}`).to.not.be.null;
  return JSON.parse(match![1]);
}

describe('Execute Query Pagination', () => {
  let client: Client;
  let server: McpServer;
  let context: ReturnType<typeof createMockContext>;

  beforeEach(async () => {
    context = createMockContext();
    server = new McpServer(
      { name: 'test-server', version: '0.0.0' },
      { capabilities: { tools: {} } }
    );
    registerExecuteQueryTool(server, context);

    client = new Client({ name: 'test-client', version: '0.0.0' }, { capabilities: {} });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

    await context.manager.connect('test-db', {
      type: 'sqlite',
      path: ':memory:',
      readOnly: false,
    });
    const adapter = context.manager.getAdapter('test-db')!;
    await adapter.execute('CREATE TABLE nums (n INTEGER)', []);
    await adapter.execute('INSERT INTO nums VALUES (1), (2), (3), (4), (5)', []);
  });

  afterEach(async () => {
    await context.manager.disconnectAll().catch(() => undefined);
    await client.close();
    await server.close();
  });

  function query(args: Record<string, unknown>) {
    return client.callTool({
      name: 'execute_query',
      arguments: { connectionId: 'test-db', sql: 'SELECT n FROM nums ORDER BY n', ...args },
    });
  }

  it('should return the first page with hasMore and nextOffset', async () => {
    const result = await query({ maxRows: 2, format: 'raw' });
    const [rows, summary] = contentTexts(result);

    expect(JSON.parse(rows)).to.deep.equal([{ n: 1 }, { n: 2 }]);
    expect(parseMetadata(result)).to.deep.equal({
      returnedRows: 2,
      offset: 0,
      hasMore: true,
      nextOffset: 2,
    });
    expect(summary).to.include('offset=2');
    expect(summary).to.include('More rows available');
  });

  it('should return the second page when offset is provided', async () => {
    const result = await query({ maxRows: 2, offset: 2, format: 'raw' });
    const [rows] = contentTexts(result);

    expect(JSON.parse(rows)).to.deep.equal([{ n: 3 }, { n: 4 }]);
    expect(parseMetadata(result)).to.deep.equal({
      returnedRows: 2,
      offset: 2,
      hasMore: true,
      nextOffset: 4,
    });
  });

  it('should report hasMore false on the final partial page', async () => {
    const result = await query({ maxRows: 2, offset: 4, format: 'raw' });
    const [rows, summary] = contentTexts(result);

    expect(JSON.parse(rows)).to.deep.equal([{ n: 5 }]);
    expect(parseMetadata(result)).to.deep.equal({
      returnedRows: 1,
      offset: 4,
      hasMore: false,
    });
    expect(summary).to.include('No more rows');
  });

  it('should report hasMore false when the last page ends exactly at the boundary', async () => {
    const adapter = context.manager.getAdapter('test-db')!;
    await adapter.execute('DELETE FROM nums WHERE n = 5', []);

    const result = await query({ maxRows: 2, offset: 2, format: 'raw' });
    const [rows] = contentTexts(result);

    expect(JSON.parse(rows)).to.deep.equal([{ n: 3 }, { n: 4 }]);
    expect(parseMetadata(result)).to.deep.equal({
      returnedRows: 2,
      offset: 2,
      hasMore: false,
    });
  });

  it('should return an empty page when offset is beyond the end', async () => {
    const result = await query({ maxRows: 2, offset: 10, format: 'raw' });
    const [rows] = contentTexts(result);

    expect(JSON.parse(rows)).to.deep.equal([]);
    expect(parseMetadata(result)).to.deep.equal({
      returnedRows: 0,
      offset: 10,
      hasMore: false,
    });
  });

  it('should not report pagination when the full result fits in one page', async () => {
    const result = await query({ maxRows: 10, format: 'raw' });

    expect(parseMetadata(result)).to.deep.equal({
      returnedRows: 5,
      offset: 0,
      hasMore: false,
    });
  });

  it('should mention export resources in the summary', async () => {
    const result = await query({ maxRows: 2 });
    const [, summary] = contentTexts(result);

    expect(summary).to.include('query-result://test-db/csv');
    expect(summary).to.include('query-result://test-db/json');
  });

  it('should store the last result capped at maxRows', async () => {
    await query({ maxRows: 2 });

    const stored = context.lastResults.get('test-db');
    expect(stored).to.exist;
    expect(stored!.rows).to.have.length(2);
    expect(stored!.hasMore).to.equal(true);
    expect(stored!.offset).to.equal(0);
  });
});
