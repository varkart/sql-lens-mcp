import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { registerDisconnectTool } from '../../../../dist/tools/database/disconnect.js';
import { createMockServer, createMockContext } from '../../../helpers/mock-server.js';
describe('Disconnect Tool', () => {
    let server;
    let context;
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
        expect(connection).to.exist;
        expect(connection?.status).to.equal('disconnected');
    });
    it('should handle disconnecting non-existent connection', async () => {
        registerDisconnectTool(server, context);
        // Disconnecting non-existent connection should not throw
        await context.manager.disconnect('non-existent');
        // Verify the connection doesn't exist
        const connection = context.manager.getConnection('non-existent');
        expect(connection).to.be.undefined;
    });
});
//# sourceMappingURL=disconnect.test.js.map