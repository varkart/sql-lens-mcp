import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { ConnectionManager } from '../../dist/connections/manager.js';
import { getTestContainers, cleanupTestContainers } from '../helpers/containers.js';
describe('Connection Manager Integration', function () {
    this.timeout(60000);
    let manager;
    let containerConfigs;
    before(async () => {
        const containers = await getTestContainers();
        containerConfigs = containers.getAllConfigs();
        manager = new ConnectionManager();
    });
    after(async () => {
        await manager.disconnectAll();
        await cleanupTestContainers();
    });
    describe('Multi-Database Connection', () => {
        it('should connect to PostgreSQL', async function () {
            const config = containerConfigs.get('postgresql');
            if (!config) {
                this.skip();
                return;
            }
            await manager.connect('test-pg', config);
            const connection = manager.getConnection('test-pg');
            expect(connection).to.exist;
            expect(connection?.status).to.equal('connected');
            expect(connection?.config.type).to.equal('postgresql');
        });
        it('should connect to MySQL', async function () {
            const config = containerConfigs.get('mysql');
            if (!config) {
                this.skip();
                return;
            }
            await manager.connect('test-mysql', config);
            const connection = manager.getConnection('test-mysql');
            expect(connection).to.exist;
            expect(connection?.status).to.equal('connected');
        });
        it('should connect to MariaDB', async function () {
            const config = containerConfigs.get('mariadb');
            if (!config) {
                this.skip();
                return;
            }
            await manager.connect('test-mariadb', config);
            const connection = manager.getConnection('test-mariadb');
            expect(connection).to.exist;
            expect(connection?.status).to.equal('connected');
        });
        it('should connect to MSSQL', async function () {
            const config = containerConfigs.get('mssql');
            if (!config) {
                this.skip();
                return;
            }
            await manager.connect('test-mssql', config);
            const connection = manager.getConnection('test-mssql');
            expect(connection).to.exist;
            expect(connection?.status).to.equal('connected');
        });
        it('should list all connections', () => {
            const connections = manager.listConnections();
            expect(connections.length).to.be.greaterThan(0);
            const connectedCount = connections.filter(c => c.status === 'connected').length;
            expect(connectedCount).to.be.greaterThan(0);
        });
    });
    describe('Cross-Database Queries', () => {
        it('should execute queries on multiple databases', async () => {
            const pgAdapter = manager.getAdapter('test-pg');
            const mysqlAdapter = manager.getAdapter('test-mysql');
            if (pgAdapter) {
                const pgResult = await pgAdapter.execute('SELECT 1 as value');
                expect(pgResult.rows).to.have.lengthOf(1);
            }
            if (mysqlAdapter) {
                const mysqlResult = await mysqlAdapter.execute('SELECT 1 as value');
                expect(mysqlResult.rows).to.have.lengthOf(1);
            }
        });
    });
    describe('Schema Management', () => {
        it('should retrieve schema from PostgreSQL', async function () {
            if (!containerConfigs.has('postgresql')) {
                this.skip();
                return;
            }
            const schema = await manager.getSchema('test-pg');
            expect(schema).to.have.property('tables');
            expect(schema.databaseType).to.equal('postgresql');
        });
        it('should cache schema information', async function () {
            if (!containerConfigs.has('postgresql')) {
                this.skip();
                return;
            }
            // First call with force refresh (no cache)
            const start1 = Date.now();
            await manager.getSchema('test-pg', true);
            const time1 = Date.now() - start1;
            // Second call from cache
            const start2 = Date.now();
            await manager.getSchema('test-pg', false);
            const time2 = Date.now() - start2;
            // Cached call should be faster (or at least not slower)
            expect(time2).to.be.at.most(time1);
        });
    });
    describe('Connection Lifecycle', () => {
        it('should reconnect a disconnected connection', async function () {
            const config = containerConfigs.get('postgresql');
            if (!config) {
                this.skip();
                return;
            }
            await manager.disconnect('test-pg', { removePersisted: false });
            let connection = manager.getConnection('test-pg');
            expect(connection?.status).to.equal('disconnected');
            await manager.reconnect('test-pg');
            connection = manager.getConnection('test-pg');
            expect(connection?.status).to.equal('connected');
        });
        it('should rename a connection', async () => {
            await manager.renameConnection('test-pg', 'Test PostgreSQL');
            const connection = manager.getConnection('test-pg');
            expect(connection?.name).to.equal('Test PostgreSQL');
        });
        it('should set connection environment', async () => {
            await manager.setConnectionEnv('test-pg', 'testing');
            const connection = manager.getConnection('test-pg');
            expect(connection?.env).to.equal('testing');
        });
    });
});
//# sourceMappingURL=connection-manager.test.js.map