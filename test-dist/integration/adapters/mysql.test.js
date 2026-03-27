import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { MySQLAdapter } from '../../../dist/connections/adapters/mysql.js';
import { getTestContainers } from '../../helpers/containers.js';
describe('MySQL Adapter Integration', function () {
    this.timeout(60000);
    let adapter;
    let config;
    before(async () => {
        const containers = await getTestContainers();
        const mysqlConfig = containers.getConfig('mysql');
        if (!mysqlConfig) {
            throw new Error('MySQL container not available');
        }
        config = mysqlConfig;
        adapter = new MySQLAdapter();
    });
    after(async () => {
        if (adapter && adapter.isConnected()) {
            await adapter.disconnect();
        }
    });
    describe('Connection', () => {
        it('should connect to MySQL', async () => {
            await adapter.connect(config);
            expect(adapter.isConnected()).to.be.true;
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
        CREATE TABLE IF NOT EXISTS test_products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            expect(result).to.have.property('executionTimeMs');
        });
        it('should insert and select data', async () => {
            await adapter.execute('INSERT INTO test_products (name, price) VALUES (?, ?), (?, ?)', ['Product A', 19.99, 'Product B', 29.99]);
            const result = await adapter.execute('SELECT * FROM test_products ORDER BY id');
            expect(result.rows).to.have.lengthOf(2);
            expect(result.rows[0]).to.have.property('name', 'Product A');
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
            expect(schema.databaseType).to.equal('mysql');
            const testProductsTable = schema.tables.find(t => t.name === 'test_products');
            expect(testProductsTable).to.exist;
            expect(testProductsTable?.primaryKey).to.deep.equal(['id']);
        });
    });
});
//# sourceMappingURL=mysql.test.js.map