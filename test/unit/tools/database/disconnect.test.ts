import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { registerDisconnectTool } from '../../../../dist/tools/database/disconnect.js';
import { createMockServer, createMockContext } from '../../../helpers/mock-server.js';

describe('Disconnect Tool', () => {
  let server: ReturnType<typeof createMockServer>;
  let context: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    server = createMockServer();
    context = createMockContext();
  });

  it('should register disconnect_database tool', () => {
    registerDisconnectTool(server, context);
    expect(server).to.exist;
  });

  it('should disconnect from database', async () => {
    registerDisconnectTool(server, context);

    // First connect
    await context.manager.connect('test-db', {
      type: 'sqlite',
      path: ':memory:',
    });

    let connection = context.manager.getConnection('test-db');
    expect(connection?.status).to.equal('connected');

    // Then disconnect
    await context.manager.disconnect('test-db');

    connection = context.manager.getConnection('test-db');
    expect(connection).to.be.undefined;
  });

  it('should handle disconnecting non-existent connection', async () => {
    registerDisconnectTool(server, context);

    try {
      await context.manager.disconnect('non-existent');
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).to.exist;
      expect((error as Error).message).to.include('not found');
    }
  });
});
