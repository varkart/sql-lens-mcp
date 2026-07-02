import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ElicitRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { ElicitResult } from '@modelcontextprotocol/sdk/types.js';
import { registerConnectTool } from '../../../dist/tools/database/connect.js';
import { registerExecuteQueryTool } from '../../../dist/tools/database/execute-query.js';
import { removeConnection } from '../../../dist/connections/persistence.js';
import { createMockContext } from '../../helpers/mock-server.js';

interface Session {
  client: Client;
  server: McpServer;
  context: ReturnType<typeof createMockContext>;
}

async function startSession(options: {
  elicitation?: boolean;
  onElicit?: () => ElicitResult;
}): Promise<Session> {
  const context = createMockContext();
  const server = new McpServer(
    { name: 'test-server', version: '0.0.0' },
    { capabilities: { tools: {} } }
  );
  registerConnectTool(server, context);
  registerExecuteQueryTool(server, context);

  const client = new Client(
    { name: 'test-client', version: '0.0.0' },
    { capabilities: options.elicitation ? { elicitation: {} } : {} }
  );
  if (options.elicitation && options.onElicit) {
    const onElicit = options.onElicit;
    client.setRequestHandler(ElicitRequestSchema, async () => onElicit());
  }

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

  return { client, server, context };
}

function textContent(result: Awaited<ReturnType<Client['callTool']>>): string {
  const content = result.content as Array<{ type: string; text: string }>;
  return content[0].text;
}

describe('Elicitation Flow', () => {
  const sessions: Session[] = [];
  const connectionIds: string[] = [];

  async function session(options: Parameters<typeof startSession>[0]): Promise<Session> {
    const created = await startSession(options);
    sessions.push(created);
    return created;
  }

  afterEach(async () => {
    for (const { client, server, context } of sessions.splice(0)) {
      await context.manager.disconnectAll().catch(() => undefined);
      await client.close();
      await server.close();
    }
    for (const id of connectionIds.splice(0)) {
      await removeConnection(id);
    }
  });

  it('should elicit missing parameters and connect', async () => {
    const { client } = await session({
      elicitation: true,
      onElicit: () => ({ action: 'accept', content: { path: ':memory:' } }),
    });
    connectionIds.push('elicit-connect');

    const result = await client.callTool({
      name: 'connect_database',
      arguments: { id: 'elicit-connect', type: 'sqlite' },
    });

    expect(textContent(result)).to.include("✓ Connected to sqlite database 'elicit-connect'");
  });

  it('should return a clear error listing missing parameters when elicitation is unsupported', async () => {
    const { client } = await session({ elicitation: false });

    const result = await client.callTool({
      name: 'connect_database',
      arguments: { id: 'no-elicit-connect', type: 'postgresql' },
    });

    expect(textContent(result)).to.equal(
      '✗ Missing required parameters for postgresql connection: host, database, user'
    );
  });

  it('should not connect when the user declines connection setup', async () => {
    const { client } = await session({
      elicitation: true,
      onElicit: () => ({ action: 'decline' }),
    });

    const result = await client.callTool({
      name: 'connect_database',
      arguments: { id: 'declined-connect', type: 'sqlite' },
    });

    expect(textContent(result)).to.equal('✗ Connection setup declined by user');
  });

  it('should block a destructive statement when the user declines confirmation', async () => {
    const { client, context } = await session({
      elicitation: true,
      onElicit: () => ({ action: 'decline' }),
    });
    connectionIds.push('confirm-decline');

    await context.manager.connect('confirm-decline', {
      type: 'sqlite',
      path: ':memory:',
      readOnly: false,
    });
    await context.manager
      .getAdapter('confirm-decline')!
      .execute('CREATE TABLE t (id INTEGER)', [], { timeout: 5000, maxRows: 10 });

    const result = await client.callTool({
      name: 'execute_query',
      arguments: { connectionId: 'confirm-decline', sql: 'DROP TABLE t' },
    });

    expect(textContent(result)).to.equal(
      '✗ Query not executed: destructive statement declined by user'
    );
  });

  it('should execute a destructive statement when the user confirms', async () => {
    const { client, context } = await session({
      elicitation: true,
      onElicit: () => ({ action: 'accept', content: { confirm: true } }),
    });
    connectionIds.push('confirm-accept');

    await context.manager.connect('confirm-accept', {
      type: 'sqlite',
      path: ':memory:',
      readOnly: false,
    });
    await context.manager
      .getAdapter('confirm-accept')!
      .execute('CREATE TABLE t (id INTEGER)', [], { timeout: 5000, maxRows: 10 });

    const result = await client.callTool({
      name: 'execute_query',
      arguments: { connectionId: 'confirm-accept', sql: 'DROP TABLE t' },
    });

    expect(textContent(result)).to.not.include('✗');
  });

  it('should execute destructive statements without confirmation when elicitation is unsupported', async () => {
    const { client, context } = await session({ elicitation: false });
    connectionIds.push('no-elicit-drop');

    await context.manager.connect('no-elicit-drop', {
      type: 'sqlite',
      path: ':memory:',
      readOnly: false,
    });
    await context.manager
      .getAdapter('no-elicit-drop')!
      .execute('CREATE TABLE t (id INTEGER)', [], { timeout: 5000, maxRows: 10 });

    const result = await client.callTool({
      name: 'execute_query',
      arguments: { connectionId: 'no-elicit-drop', sql: 'DROP TABLE t' },
    });

    expect(textContent(result)).to.not.include('✗');
  });
});
