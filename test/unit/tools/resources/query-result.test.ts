import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerQueryResultResources } from '../../../../dist/tools/resources/query-result.js';
import { registerExecuteQueryTool } from '../../../../dist/tools/database/execute-query.js';
import { createMockServer, createMockContext } from '../../../helpers/mock-server.js';

describe('Query Result Resources', () => {
  let client: Client;
  let server: McpServer;
  let context: ReturnType<typeof createMockContext>;

  beforeEach(async () => {
    context = createMockContext();
    server = new McpServer(
      { name: 'test-server', version: '0.0.0' },
      { capabilities: { tools: {}, resources: {} } }
    );
    registerExecuteQueryTool(server, context);
    registerQueryResultResources(server, context);

    client = new Client({ name: 'test-client', version: '0.0.0' }, { capabilities: {} });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  });

  afterEach(async () => {
    await context.manager.disconnectAll().catch(() => undefined);
    await client.close();
    await server.close();
  });

  async function seedAndQuery(sqlValues: string, select = 'SELECT * FROM t ORDER BY id') {
    await context.manager.connect('test-db', {
      type: 'sqlite',
      path: ':memory:',
      readOnly: false,
    });
    const adapter = context.manager.getAdapter('test-db')!;
    await adapter.execute('CREATE TABLE t (id INTEGER, val TEXT)', []);
    await adapter.execute(`INSERT INTO t VALUES ${sqlValues}`, []);
    await client.callTool({
      name: 'execute_query',
      arguments: { connectionId: 'test-db', sql: select },
    });
  }

  it('should register query-result resources', () => {
    const freshServer = createMockServer();
    registerQueryResultResources(freshServer, createMockContext());
    expect(freshServer).to.exist;
  });

  it('should expose the last result as JSON array of row objects', async () => {
    await seedAndQuery(`(1, 'alice'), (2, 'bob')`);

    const result = await client.readResource({ uri: 'query-result://test-db/json' });
    const content = result.contents[0] as { mimeType: string; text: string };

    expect(content.mimeType).to.equal('application/json');
    expect(JSON.parse(content.text)).to.deep.equal([
      { id: 1, val: 'alice' },
      { id: 2, val: 'bob' },
    ]);
  });

  it('should expose the last result as CSV with proper escaping', async () => {
    await seedAndQuery(`(1, 'plain'), (2, 'a,b'), (3, 'say "hi"')`);

    const result = await client.readResource({ uri: 'query-result://test-db/csv' });
    const content = result.contents[0] as { mimeType: string; text: string };

    expect(content.mimeType).to.equal('text/csv');
    expect(content.text).to.equal('id,val\n1,plain\n2,"a,b"\n3,"say ""hi"""\n');
  });

  it('should reflect the most recent query only', async () => {
    await seedAndQuery(`(1, 'alice'), (2, 'bob')`);
    await client.callTool({
      name: 'execute_query',
      arguments: { connectionId: 'test-db', sql: 'SELECT val FROM t WHERE id = 2' },
    });

    const result = await client.readResource({ uri: 'query-result://test-db/json' });
    const content = result.contents[0] as { text: string };

    expect(JSON.parse(content.text)).to.deep.equal([{ val: 'bob' }]);
  });

  it('should list stored results for discovery', async () => {
    await seedAndQuery(`(1, 'alice')`);

    const listed = await client.listResources();
    const uris = listed.resources.map(r => r.uri);

    expect(uris).to.include('query-result://test-db/csv');
    expect(uris).to.include('query-result://test-db/json');
  });

  it('should fail when no result is stored for a connection', async () => {
    let error: Error | undefined;
    try {
      await client.readResource({ uri: 'query-result://unknown-db/csv' });
    } catch (e) {
      error = e as Error;
    }
    expect(error).to.exist;
    expect(error!.message).to.include('No query result available');
  });
});
