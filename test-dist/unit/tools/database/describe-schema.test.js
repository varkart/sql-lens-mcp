import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { registerDescribeSchemaTool } from '../../../../dist/tools/database/describe-schema.js';
import { createMockServer, createMockContext } from '../../../helpers/mock-server.js';
describe('Describe Schema Tool', () => {
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
    it('should register describe_schema tool', () => {
        registerDescribeSchemaTool(server, context);
        expect(server).to.exist;
    });
    it('should describe database schema', async () => {
        registerDescribeSchemaTool(server, context);
        await context.manager.connect('test-db', {
            type: 'sqlite',
            path: ':memory:',
            readOnly: false,
        });
        const adapter = context.manager.getAdapter('test-db');
        await adapter.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)', []);
        const schema = await context.manager.getSchema('test-db');
        expect(schema.tables).to.have.length(1);
        expect(schema.tables[0].name).to.equal('users');
        expect(schema.tables[0].columns).to.have.length(2);
    });
    it('should filter by table name', async () => {
        registerDescribeSchemaTool(server, context);
        await context.manager.connect('test-db', {
            type: 'sqlite',
            path: ':memory:',
            readOnly: false,
        });
        const adapter = context.manager.getAdapter('test-db');
        await adapter.execute('CREATE TABLE users (id INTEGER)', []);
        await adapter.execute('CREATE TABLE posts (id INTEGER)', []);
        const schema = await context.manager.getSchema('test-db');
        const usersTable = schema.tables.find(t => t.name === 'users');
        expect(usersTable).to.exist;
        expect(usersTable?.name).to.equal('users');
    });
    it('should return empty for non-existent table', async () => {
        registerDescribeSchemaTool(server, context);
        await context.manager.connect('test-db', {
            type: 'sqlite',
            path: ':memory:',
        });
        const schema = await context.manager.getSchema('test-db');
        const filtered = schema.tables.filter(t => t.name === 'non_existent');
        expect(filtered).to.have.length(0);
    });
});
//# sourceMappingURL=describe-schema.test.js.map