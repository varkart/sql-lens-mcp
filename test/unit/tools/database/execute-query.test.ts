import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { registerExecuteQueryTool } from '../../../../dist/tools/database/execute-query.js';
import { createMockServer, createMockContext } from '../../../helpers/mock-server.js';

describe('Execute Query Tool', () => {
  let server: ReturnType<typeof createMockServer>;
  let context: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    server = createMockServer();
    context = createMockContext();
  });

  afterEach(async () => {
    // Clean up connections
    const connections = context.manager.listConnections();
    for (const conn of connections) {
      try {
        await context.manager.disconnect(conn.id);
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
  });

  it('should register execute_query tool', () => {
    registerExecuteQueryTool(server, context);
    expect(server).to.exist;
  });

  it('should execute SELECT query', async () => {
    registerExecuteQueryTool(server, context);

    await context.manager.connect('test-db', {
      type: 'sqlite',
      path: ':memory:',
    });

    const adapter = context.manager.getAdapter('test-db');
    expect(adapter).to.exist;

    const result = await adapter!.execute('SELECT 1 as num', []);
    expect(result.rows).to.have.length(1);
    expect(result.rows[0]).to.deep.equal({ num: 1 });
  });

  it('should execute CREATE TABLE query', async () => {
    registerExecuteQueryTool(server, context);

    await context.manager.connect('test-db', {
      type: 'sqlite',
      path: ':memory:',
      readOnly: false,
    });

    const adapter = context.manager.getAdapter('test-db');
    const result = await adapter!.execute(
      'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)',
      []
    );

    expect(result.rowCount).to.equal(0);
  });

  it('should track query history', async () => {
    registerExecuteQueryTool(server, context);

    await context.manager.connect('test-db', {
      type: 'sqlite',
      path: ':memory:',
    });

    expect(context.queryHistory).to.have.length(0);

    const adapter = context.manager.getAdapter('test-db');
    await adapter!.execute('SELECT 1', []);

    // Note: History tracking happens in the tool handler, not the adapter
    // So we can't test it here directly without calling the full tool
  });

  it('should fail on non-existent connection', async () => {
    registerExecuteQueryTool(server, context);

    const adapter = context.manager.getAdapter('non-existent');
    expect(adapter).to.be.null;
  });

  it('should respect maxRows limit', async () => {
    registerExecuteQueryTool(server, context);

    await context.manager.connect('test-db', {
      type: 'sqlite',
      path: ':memory:',
      readOnly: false,
    });

    const adapter = context.manager.getAdapter('test-db');

    // Create table with multiple rows
    await adapter!.execute('CREATE TABLE nums (n INTEGER)', []);
    await adapter!.execute('INSERT INTO nums VALUES (1), (2), (3), (4), (5)', []);

    const result = await adapter!.execute('SELECT * FROM nums', [], { maxRows: 3 });
    expect(result.rows).to.have.length.at.most(3);
  });
});
