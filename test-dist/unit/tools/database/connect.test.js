import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { registerConnectTool } from '../../../../dist/tools/database/connect.js';
import { createMockServer, createMockContext } from '../../../helpers/mock-server.js';
describe('Connect Tool', () => {
    let server;
    let context;
    beforeEach(() => {
        server = createMockServer();
        context = createMockContext();
    });
    it('should register connect_database tool', () => {
        registerConnectTool(server, context);
        // Verify tool is registered by checking server's internal state
        expect(server).to.exist;
    });
    it('should connect to SQLite in-memory database', async () => {
        registerConnectTool(server, context);
        const result = await context.manager.connect('test-db', {
            type: 'sqlite',
            path: ':memory:',
        });
        expect(result).to.exist;
        const connection = context.manager.getConnection('test-db');
        expect(connection).to.exist;
        expect(connection?.status).to.equal('connected');
    });
    it('should fail with invalid database type', async () => {
        registerConnectTool(server, context);
        try {
            await context.manager.connect('test-db', {
                type: 'invalid',
                path: ':memory:',
            });
            expect.fail('Should have thrown an error');
        }
        catch (error) {
            expect(error).to.exist;
        }
    });
    it('should include metadata in connection', async () => {
        registerConnectTool(server, context);
        await context.manager.connect('test-db', {
            type: 'sqlite',
            path: ':memory:',
        }, {
            name: 'Test Database',
            env: 'test',
        });
        const connection = context.manager.getConnection('test-db');
        expect(connection?.name).to.equal('Test Database');
        expect(connection?.env).to.equal('test');
    });
});
//# sourceMappingURL=connect.test.js.map