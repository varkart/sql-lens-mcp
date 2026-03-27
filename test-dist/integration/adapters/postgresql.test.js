import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { PostgreSQLAdapter } from '../../../dist/connections/adapters/postgresql.js';
import { getTestContainers } from '../../helpers/containers.js';
describe('PostgreSQL Adapter Integration', function () {
    this.timeout(60000);
    let adapter;
    let config;
    before(async () => {
        const containers = await getTestContainers();
        const pgConfig = containers.getConfig('postgresql');
        if (!pgConfig) {
            throw new Error('PostgreSQL container not available');
        }
        config = pgConfig;
        adapter = new PostgreSQLAdapter();
    });
    after(async () => {
        if (adapter && adapter.isConnected()) {
            await adapter.disconnect();
        }
    });
    describe('Connection', () => {
        it('should connect to PostgreSQL', async () => {
            await adapter.connect(config);
            expect(adapter.isConnected()).to.be.true;
        });
        it('should disconnect from PostgreSQL', async () => {
            await adapter.disconnect();
            expect(adapter.isConnected()).to.be.false;
            await adapter.connect(config);
        });
    });
    describe('Query Execution', () => {
        before(async () => {
            if (!adapter.isConnected()) {
                await adapter.connect(config);
            }
        });
        it('should create a test table', async () => {
            const result = await adapter.execute(`
        CREATE TABLE IF NOT EXISTS test_users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            expect(result).to.have.property('executionTimeMs');
            expect(result.executionTimeMs).to.be.a('number');
        });
        it('should insert data', async () => {
            const result = await adapter.execute('INSERT INTO test_users (name, email) VALUES ($1, $2), ($3, $4)', ['Alice', 'alice@example.com', 'Bob', 'bob@example.com']);
            expect(result.rowCount).to.be.greaterThan(0);
        });
        it('should select data', async () => {
            const result = await adapter.execute('SELECT * FROM test_users ORDER BY id');
            expect(result.rows).to.have.lengthOf(2);
            expect(result.columns).to.have.lengthOf(4);
            expect(result.rows[0]).to.have.property('name', 'Alice');
            expect(result.rows[1]).to.have.property('name', 'Bob');
        });
        it('should handle parameterized queries', async () => {
            const result = await adapter.execute('SELECT * FROM test_users WHERE name = $1', ['Alice']);
            expect(result.rows).to.have.lengthOf(1);
            expect(result.rows[0]).to.have.property('email', 'alice@example.com');
        });
        it('should respect row limits', async () => {
            await adapter.execute('INSERT INTO test_users (name, email) SELECT generate_series(1, 100), \'user\' || generate_series(1, 100) || \'@example.com\'');
            const result = await adapter.execute('SELECT * FROM test_users', [], { maxRows: 10 });
            expect(result.rows).to.have.lengthOf(10);
            expect(result.truncated).to.be.true;
        });
    });
    describe('Schema Introspection', () => {
        before(async () => {
            if (!adapter.isConnected()) {
                await adapter.connect(config);
            }
        });
        it('should retrieve schema information', async () => {
            const schema = await adapter.getSchema();
            expect(schema).to.have.property('tables');
            expect(schema.tables).to.be.an('array');
            expect(schema.databaseType).to.equal('postgresql');
            const testUsersTable = schema.tables.find(t => t.name === 'test_users');
            expect(testUsersTable).to.exist;
            expect(testUsersTable?.columns).to.have.lengthOf(4);
            const idColumn = testUsersTable?.columns.find(c => c.name === 'id');
            expect(idColumn?.isPrimaryKey).to.be.true;
            const emailColumn = testUsersTable?.columns.find(c => c.name === 'email');
            expect(emailColumn).to.exist;
        });
        it('should include primary key information', async () => {
            const schema = await adapter.getSchema();
            const testUsersTable = schema.tables.find(t => t.name === 'test_users');
            expect(testUsersTable?.primaryKey).to.deep.equal(['id']);
        });
    });
    describe('Read-Only Mode', () => {
        it('should switch to read-only mode', async () => {
            if (!adapter.isConnected()) {
                await adapter.connect(config);
            }
            await adapter.setReadOnly(true);
            // This should fail in read-only mode
            try {
                await adapter.execute('INSERT INTO test_users (name, email) VALUES ($1, $2)', [
                    'Charlie',
                    'charlie@example.com',
                ]);
                expect.fail('Should have thrown an error in read-only mode');
            }
            catch (error) {
                expect(error).to.exist;
            }
            await adapter.setReadOnly(false);
        });
    });
});
//# sourceMappingURL=postgresql.test.js.map