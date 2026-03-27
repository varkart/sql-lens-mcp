import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { registerExploreDatabasePrompt } from '../../../../dist/tools/prompts/explore-database.js';
import { createMockServer, createMockContext } from '../../../helpers/mock-server.js';
describe('Explore Database Prompt', () => {
    let server;
    let context;
    beforeEach(() => {
        server = createMockServer();
        context = createMockContext();
    });
    afterEach(async () => {
        const connections = context.manager.listConnections();
        for (const conn of connections) {
            try {
                await context.manager.disconnect(conn.id);
            }
            catch (e) {
                // Ignore
            }
        }
    });
    it('should register explore-database prompt', () => {
        registerExploreDatabasePrompt(server, context);
        expect(server).to.exist;
    });
    it('should handle no connected databases', () => {
        registerExploreDatabasePrompt(server, context);
        const connections = context.manager.listConnections();
        expect(connections).to.have.length(0);
    });
    it('should work with connected database', async () => {
        registerExploreDatabasePrompt(server, context);
        await context.manager.connect('test-db', {
            type: 'sqlite',
            path: ':memory:',
            readOnly: false,
        });
        const adapter = context.manager.getAdapter('test-db');
        await adapter.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)', []);
        const schema = await context.manager.getSchema('test-db');
        expect(schema.tables).to.have.length(1);
        expect(schema.databaseType).to.equal('sqlite');
    });
});
//# sourceMappingURL=explore-database.test.js.map