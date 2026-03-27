import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { registerConnectionsResource } from '../../../../dist/tools/resources/connections.js';
import { createMockServer, createMockContext } from '../../../helpers/mock-server.js';
describe('Connections Resource', () => {
    let server;
    let context;
    beforeEach(() => {
        server = createMockServer();
        context = createMockContext();
    });
    it('should register connections-list resource', () => {
        registerConnectionsResource(server, context);
        expect(server).to.exist;
    });
    it('should provide connection list data', async () => {
        registerConnectionsResource(server, context);
        await context.manager.connect('db1', {
            type: 'sqlite',
            path: ':memory:',
        });
        const connections = context.manager.listConnections();
        expect(connections).to.have.length(1);
        const json = JSON.stringify(connections, null, 2);
        expect(json).to.include('db1');
        expect(json).to.include('sqlite');
    });
});
//# sourceMappingURL=connections.test.js.map