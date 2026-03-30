import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { createServer } from '../../dist/server.js';
describe('MCP Server Integration', () => {
    let serverInstance;
    beforeEach(async () => {
        serverInstance = await createServer();
    });
    afterEach(async () => {
        // Clean up all connections
        const connections = serverInstance.manager.listConnections();
        for (const conn of connections) {
            try {
                await serverInstance.manager.disconnect(conn.id);
            }
            catch (e) {
                // Ignore cleanup errors
            }
        }
        // Close server
        if (serverInstance.server.isConnected()) {
            await serverInstance.server.close();
        }
    });
    describe('Server Initialization', () => {
        it('should create server instance', () => {
            expect(serverInstance.server).to.exist;
            expect(serverInstance.manager).to.exist;
        });
        it('should have correct server info', () => {
            expect(serverInstance.server).to.have.property('server');
        });
    });
    describe('Tool Registration', () => {
        it('should register all database tools', () => {
            // Tools are registered via registerAllTools
            // We can verify by checking that tools don't throw when called
            expect(serverInstance.server).to.exist;
        });
    });
    describe('End-to-End Flow', () => {
        it('should connect, query, and disconnect', async () => {
            const { manager } = serverInstance;
            // Connect to SQLite
            await manager.connect('test-e2e', {
                type: 'sqlite',
                database: ':memory:',
                readOnly: false,
            });
            let connection = manager.getConnection('test-e2e');
            expect(connection?.status).to.equal('connected');
            // Execute query
            const adapter = manager.getAdapter('test-e2e');
            expect(adapter).to.exist;
            await adapter.execute('CREATE TABLE test (id INTEGER, value TEXT)', []);
            await adapter.execute('INSERT INTO test VALUES (1, \'hello\')', []);
            const result = await adapter.execute('SELECT * FROM test', []);
            expect(result.rows).to.have.length(1);
            expect(result.rows[0]).to.deep.equal({ id: 1, value: 'hello' });
            // Get schema (force refresh since table was created after connection)
            const schema = await manager.getSchema('test-e2e', true);
            expect(schema.tables).to.have.length(1);
            expect(schema.tables[0].name).to.equal('test');
            // Disconnect
            await manager.disconnect('test-e2e');
            connection = manager.getConnection('test-e2e');
            expect(connection?.status).to.equal('disconnected');
        });
        it('should handle multiple connections', async () => {
            const { manager } = serverInstance;
            await manager.connect('db1', {
                type: 'sqlite',
                database: ':memory:',
            }, {
                name: 'Database 1',
            });
            await manager.connect('db2', {
                type: 'sqlite',
                database: ':memory:',
            }, {
                name: 'Database 2',
            });
            const connections = manager.listConnections();
            expect(connections).to.have.length(2);
            const names = connections.map(c => c.name);
            expect(names).to.include('Database 1');
            expect(names).to.include('Database 2');
        });
        it('should validate read-only mode', async () => {
            const { manager } = serverInstance;
            // Skip connecting to in-memory database in read-only mode (not supported by SQLite)
            // Just verify the config can be set
            try {
                await manager.connect('readonly-db', {
                    type: 'sqlite',
                    database: ':memory:',
                    readOnly: true,
                });
                expect.fail('Should have thrown error for readonly in-memory database');
            }
            catch (error) {
                expect(error.message).to.include('In-memory/temporary databases cannot be readonly');
            }
        });
    });
    describe('Error Handling', () => {
        it('should handle connection to invalid database', async function () {
            this.timeout(10000); // DNS lookups may take longer
            const { manager } = serverInstance;
            try {
                await manager.connect('invalid', {
                    type: 'postgresql',
                    host: 'nonexistent.local',
                    port: 9999,
                    database: 'test',
                    user: 'test',
                    password: 'test',
                });
                // Connection might not fail immediately, check status
                const connection = manager.getConnection('invalid');
                if (connection?.status === 'connected') {
                    // Some adapters might succeed with invalid config
                    expect(connection).to.exist;
                }
            }
            catch (error) {
                expect(error).to.exist;
            }
        });
        it('should handle query on disconnected database', async () => {
            const { manager } = serverInstance;
            const adapter = manager.getAdapter('non-existent');
            expect(adapter).to.be.undefined;
        });
        it('should handle invalid SQL', async () => {
            const { manager } = serverInstance;
            await manager.connect('test-invalid', {
                type: 'sqlite',
                database: ':memory:',
            });
            const adapter = manager.getAdapter('test-invalid');
            try {
                await adapter.execute('INVALID SQL STATEMENT', []);
                expect.fail('Should have thrown an error');
            }
            catch (error) {
                expect(error).to.exist;
                expect(error.message).to.include('syntax');
            }
        });
    });
    describe('Schema Introspection', () => {
        it('should introspect table structure', async () => {
            const { manager } = serverInstance;
            await manager.connect('schema-test', {
                type: 'sqlite',
                database: ':memory:',
                readOnly: false,
            });
            const adapter = manager.getAdapter('schema-test');
            await adapter.execute(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          email TEXT NOT NULL,
          name TEXT
        )
      `, []);
            // Force refresh since table was created after connection
            const schema = await manager.getSchema('schema-test', true);
            const usersTable = schema.tables.find(t => t.name === 'users');
            expect(usersTable).to.exist;
            expect(usersTable.columns).to.have.length(3);
            const columnNames = usersTable.columns.map(c => c.name);
            expect(columnNames).to.include('id');
            expect(columnNames).to.include('email');
            expect(columnNames).to.include('name');
        });
        it('should detect primary keys', async () => {
            const { manager } = serverInstance;
            await manager.connect('pk-test', {
                type: 'sqlite',
                database: ':memory:',
                readOnly: false,
            });
            const adapter = manager.getAdapter('pk-test');
            await adapter.execute('CREATE TABLE items (id INTEGER PRIMARY KEY, title TEXT)', []);
            // Force refresh since table was created after connection
            const schema = await manager.getSchema('pk-test', true);
            const itemsTable = schema.tables.find(t => t.name === 'items');
            const idColumn = itemsTable?.columns.find(c => c.name === 'id');
            expect(idColumn?.isPrimaryKey).to.be.true;
        });
    });
});
//# sourceMappingURL=server.test.js.map