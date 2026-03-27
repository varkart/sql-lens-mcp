import { GenericContainer, Wait } from 'testcontainers';
export class TestContainers {
    containers = new Map();
    async startPostgreSQL() {
        const container = await new GenericContainer('postgres:16-alpine')
            .withEnvironment({
            POSTGRES_USER: 'testuser',
            POSTGRES_PASSWORD: 'testpass',
            POSTGRES_DB: 'testdb',
        })
            .withExposedPorts(5432)
            .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/))
            .start();
        const config = {
            type: 'postgresql',
            host: container.getHost(),
            port: container.getMappedPort(5432),
            database: 'testdb',
            user: 'testuser',
            password: 'testpass',
        };
        const info = { container, config };
        this.containers.set('postgresql', info);
        return info;
    }
    async startMySQL() {
        const container = await new GenericContainer('mysql:8.4')
            .withEnvironment({
            MYSQL_ROOT_PASSWORD: 'rootpass',
            MYSQL_DATABASE: 'testdb',
            MYSQL_USER: 'testuser',
            MYSQL_PASSWORD: 'testpass',
        })
            .withExposedPorts(3306)
            .withWaitStrategy(Wait.forLogMessage(/ready for connections/))
            .start();
        const config = {
            type: 'mysql',
            host: container.getHost(),
            port: container.getMappedPort(3306),
            database: 'testdb',
            user: 'testuser',
            password: 'testpass',
        };
        const info = { container, config };
        this.containers.set('mysql', info);
        return info;
    }
    async startMariaDB() {
        const container = await new GenericContainer('mariadb:11.4')
            .withEnvironment({
            MARIADB_ROOT_PASSWORD: 'rootpass',
            MARIADB_DATABASE: 'testdb',
            MARIADB_USER: 'testuser',
            MARIADB_PASSWORD: 'testpass',
        })
            .withExposedPorts(3306)
            .withWaitStrategy(Wait.forLogMessage(/ready for connections/))
            .start();
        const config = {
            type: 'mariadb',
            host: container.getHost(),
            port: container.getMappedPort(3306),
            database: 'testdb',
            user: 'testuser',
            password: 'testpass',
        };
        const info = { container, config };
        this.containers.set('mariadb', info);
        return info;
    }
    async startMSSQL() {
        const container = await new GenericContainer('mcr.microsoft.com/mssql/server:2022-latest')
            .withEnvironment({
            ACCEPT_EULA: 'Y',
            SA_PASSWORD: 'YourStrong@Passw0rd',
            MSSQL_PID: 'Developer',
        })
            .withExposedPorts(1433)
            .withWaitStrategy(Wait.forLogMessage(/SQL Server is now ready for client connections/))
            .start();
        const config = {
            type: 'mssql',
            host: container.getHost(),
            port: container.getMappedPort(1433),
            database: 'master',
            user: 'sa',
            password: 'YourStrong@Passw0rd',
        };
        const info = { container, config };
        this.containers.set('mssql', info);
        return info;
    }
    async startAll() {
        console.log('Starting test containers...');
        await Promise.all([
            this.startPostgreSQL().catch(err => console.error('PostgreSQL failed:', err.message)),
            this.startMySQL().catch(err => console.error('MySQL failed:', err.message)),
            this.startMariaDB().catch(err => console.error('MariaDB failed:', err.message)),
            this.startMSSQL().catch(err => console.error('MSSQL failed:', err.message)),
        ]);
        console.log(`Started ${this.containers.size} test containers`);
        return this.containers;
    }
    async stopAll() {
        console.log('Stopping test containers...');
        await Promise.all(Array.from(this.containers.values()).map(info => info.container.stop().catch(err => console.error('Failed to stop container:', err.message))));
        this.containers.clear();
        console.log('All test containers stopped');
    }
    getConfig(type) {
        return this.containers.get(type)?.config;
    }
    getAllConfigs() {
        const configs = new Map();
        for (const [type, info] of this.containers.entries()) {
            configs.set(type, info.config);
        }
        return configs;
    }
}
let globalContainers = null;
export async function getTestContainers() {
    if (!globalContainers) {
        globalContainers = new TestContainers();
        await globalContainers.startAll();
    }
    return globalContainers;
}
export async function cleanupTestContainers() {
    if (globalContainers) {
        await globalContainers.stopAll();
        globalContainers = null;
    }
}
//# sourceMappingURL=containers.js.map