import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { registerListConnectionsTool } from '../../../../dist/tools/database/list-connections.js';
import { createMockServer, createMockContext } from '../../../helpers/mock-server.js';
describe('List Connections Tool', () => {
    let server;
    let context;
    beforeEach(() => {
        server = createMockServer();
        context = createMockContext();
    });
    it('should register list_connections tool', () => {
        registerListConnectionsTool(server, context);
        expect(server).to.exist;
    });
    it('should return empty list when no connections', () => {
        registerListConnectionsTool(server, context);
        const connections = context.manager.listConnections();
        expect(connections).to.be.an('array');
        expect(connections).to.have.length(0);
    });
    it('should list all connections', async () => {
        registerListConnectionsTool(server, context);
        await context.manager.connect('db1', {
            type: 'sqlite',
            path: ':memory:',
        });
        await context.manager.connect('db2', {
            type: 'sqlite',
            path: ':memory:',
        }, {
            name: 'Test DB 2',
        });
        const connections = context.manager.listConnections();
        expect(connections).to.have.length(2);
        expect(connections[0].id).to.equal('db1');
        expect(connections[1].id).to.equal('db2');
        expect(connections[1].name).to.equal('Test DB 2');
    });
    it('should include connection status', async () => {
        registerListConnectionsTool(server, context);
        await context.manager.connect('db1', {
            type: 'sqlite',
            path: ':memory:',
        });
        const connections = context.manager.listConnections();
        expect(connections[0].status).to.equal('connected');
    });
});
//# sourceMappingURL=list-connections.test.js.map