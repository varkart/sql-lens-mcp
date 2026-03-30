import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import type { ConnectionConfig } from '../../dist/utils/types.js';

export interface TestContainerInfo {
  container: StartedTestContainer;
  config: ConnectionConfig;
}

export class TestContainers {
  private containers: Map<string, TestContainerInfo> = new Map();

  async startPostgreSQL(): Promise<TestContainerInfo> {
    const container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({
        POSTGRES_USER: 'testuser',
        POSTGRES_PASSWORD: 'testpass',
        POSTGRES_DB: 'testdb',
      })
      .withExposedPorts(5432)
      .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/))
      .start();

    const config: ConnectionConfig = {
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

  async startMySQL(): Promise<TestContainerInfo> {
    const container = await new GenericContainer('mysql:8.0')
      .withEnvironment({
        MYSQL_ROOT_PASSWORD: 'rootpass',
        MYSQL_DATABASE: 'testdb',
        MYSQL_USER: 'testuser',
        MYSQL_PASSWORD: 'testpass',
      })
      .withCommand(['--default-authentication-plugin=mysql_native_password'])
      .withExposedPorts(3306)
      .withWaitStrategy(Wait.forLogMessage(/ready for connections.*port: 3306/i))
      .withStartupTimeout(120000)
      .start();

    const config: ConnectionConfig = {
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

  async startMariaDB(): Promise<TestContainerInfo> {
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

    const config: ConnectionConfig = {
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

  async startMSSQL(): Promise<TestContainerInfo> {
    const container = await new GenericContainer('mcr.microsoft.com/mssql/server:2022-latest')
      .withEnvironment({
        ACCEPT_EULA: 'Y',
        SA_PASSWORD: 'YourStrong@Passw0rd',
        MSSQL_PID: 'Developer',
      })
      .withExposedPorts(1433)
      .withWaitStrategy(Wait.forLogMessage(/SQL Server is now ready for client connections/))
      .start();

    const config: ConnectionConfig = {
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

  async startAll(): Promise<Map<string, TestContainerInfo>> {
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

  async stopAll(): Promise<void> {
    console.log('Stopping test containers...');

    await Promise.all(
      Array.from(this.containers.values()).map(info =>
        info.container.stop().catch(err => console.error('Failed to stop container:', err.message))
      )
    );

    this.containers.clear();
    console.log('All test containers stopped');
  }

  getConfig(type: string): ConnectionConfig | undefined {
    return this.containers.get(type)?.config;
  }

  getAllConfigs(): Map<string, ConnectionConfig> {
    const configs = new Map<string, ConnectionConfig>();
    for (const [type, info] of this.containers.entries()) {
      configs.set(type, info.config);
    }
    return configs;
  }
}

let globalContainers: TestContainers | null = null;

export async function getTestContainers(): Promise<TestContainers> {
  if (!globalContainers) {
    globalContainers = new TestContainers();
    await globalContainers.startAll();
  }
  return globalContainers;
}

export async function cleanupTestContainers(): Promise<void> {
  if (globalContainers) {
    await globalContainers.stopAll();
    globalContainers = null;
  }
}
