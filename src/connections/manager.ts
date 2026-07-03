import type { DatabaseAdapter } from './adapters/base.js';
import type { ConnectionConfig, ActiveConnection } from '../utils/types.js';
import { PostgreSQLAdapter } from './adapters/postgresql.js';
import { MySQLAdapter } from './adapters/mysql.js';
import { SQLiteAdapter } from './adapters/sqlite.js';
import { MSSQLAdapter } from './adapters/mssql.js';
import { MariaDBAdapter } from './adapters/mariadb.js';
import { OracleAdapter } from './adapters/oracle.js';
import { DuckDBAdapter } from './adapters/duckdb.js';
import { SchemaIntrospector } from './schema-introspector.js';
import { addConnection, removeConnection, updateConnection } from './persistence.js';
import { ConnectionError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

type AdapterFactory = () => DatabaseAdapter;

export class ConnectionManager {
  private connections = new Map<string, ActiveConnection>();
  private adapters = new Map<string, DatabaseAdapter>();
  private adapterFactories = new Map<string, AdapterFactory>();
  private fullConfigs = new Map<string, ConnectionConfig>();
  private schemaIntrospector = new SchemaIntrospector();

  constructor() {
    this.registerAdapterFactory('postgresql', () => new PostgreSQLAdapter());
    this.registerAdapterFactory('mysql', () => new MySQLAdapter());
    this.registerAdapterFactory('sqlite', () => new SQLiteAdapter());
    this.registerAdapterFactory('mssql', () => new MSSQLAdapter());
    this.registerAdapterFactory('mariadb', () => new MariaDBAdapter());
    this.registerAdapterFactory('oracle', () => new OracleAdapter());
    this.registerAdapterFactory('duckdb', () => new DuckDBAdapter());
  }

  registerAdapterFactory(type: string, factory: AdapterFactory): void {
    this.adapterFactories.set(type, factory);
  }

  async connect(
    id: string,
    config: ConnectionConfig,
    options?: { name?: string; env?: string }
  ): Promise<void> {
    if (this.adapters.has(id)) {
      throw new ConnectionError(`Connection ${id} already exists`);
    }

    const factory = this.adapterFactories.get(config.type);
    if (!factory) {
      throw new ConnectionError(`Unsupported database type: ${config.type}`);
    }

    const adapter = factory();

    try {
      await adapter.connect(config);

      this.adapters.set(id, adapter);
      this.fullConfigs.set(id, config);

      const connection: ActiveConnection = {
        id,
        name: options?.name,
        env: options?.env,
        config: this.redactConfig(config),
        status: 'connected',
        connectedAt: new Date(),
      };

      this.connections.set(id, connection);

      const schema = await this.schemaIntrospector.getSchema(id, adapter);
      connection.schema = schema;

      await addConnection(id, {
        config,
        name: options?.name,
        env: options?.env,
      });

      logger.info('Connection established', { id, type: config.type });
    } catch (error) {
      const err = error as Error;
      logger.error('Connection failed', { id, error: err.message });
      throw error;
    }
  }

  async tryConnect(
    id: string,
    config: ConnectionConfig,
    options?: { name?: string; env?: string }
  ): Promise<void> {
    try {
      await this.connect(id, config, options);
    } catch (error) {
      const err = error as Error;

      this.fullConfigs.set(id, config);

      const connection: ActiveConnection = {
        id,
        name: options?.name,
        env: options?.env,
        config: this.redactConfig(config),
        status: 'failed',
        error: err.message,
      };

      this.connections.set(id, connection);

      await addConnection(id, {
        config,
        name: options?.name,
        env: options?.env,
      });

      logger.warn('Connection registered as failed', { id, error: err.message });
    }
  }

  async reconnect(id: string): Promise<void> {
    const connection = this.connections.get(id);
    if (!connection) {
      throw new ConnectionError(`Connection ${id} not found`);
    }

    if (this.adapters.has(id)) {
      await this.disconnect(id, { removePersisted: false });
    }

    const fullConfig = this.fullConfigs.get(id);
    if (!fullConfig) {
      throw new ConnectionError(`No config found for connection ${id}`);
    }

    await this.connect(id, fullConfig, {
      name: connection.name,
      env: connection.env,
    });
  }

  registerConnection(
    id: string,
    config: ConnectionConfig,
    options?: { name?: string; env?: string }
  ): void {
    this.fullConfigs.set(id, config);

    const connection: ActiveConnection = {
      id,
      name: options?.name,
      env: options?.env,
      config: this.redactConfig(config),
      status: 'disconnected',
    };

    this.connections.set(id, connection);
    logger.debug('Connection registered', { id });
  }

  async renameConnection(id: string, name: string): Promise<void> {
    const connection = this.connections.get(id);
    if (!connection) {
      throw new ConnectionError(`Connection ${id} not found`);
    }

    connection.name = name;
    await updateConnection(id, { name });
    logger.info('Connection renamed', { id, name });
  }

  async setConnectionEnv(id: string, env: string): Promise<void> {
    const connection = this.connections.get(id);
    if (!connection) {
      throw new ConnectionError(`Connection ${id} not found`);
    }

    connection.env = env;
    await updateConnection(id, { env });
    logger.info('Connection env updated', { id, env });
  }

  async editConnection(id: string, updates: Partial<ConnectionConfig>): Promise<void> {
    const connection = this.connections.get(id);
    if (!connection) {
      throw new ConnectionError(`Connection ${id} not found`);
    }

    const fullConfig = this.fullConfigs.get(id);
    if (!fullConfig) {
      throw new ConnectionError(`No config found for connection ${id}`);
    }

    const newConfig = {
      ...fullConfig,
      ...updates,
    };

    this.fullConfigs.set(id, newConfig);
    connection.config = this.redactConfig(newConfig);

    await updateConnection(id, { config: newConfig });
    logger.info('Connection config updated', { id });
  }

  async disconnect(id: string, options?: { removePersisted?: boolean }): Promise<void> {
    const adapter = this.adapters.get(id);
    if (adapter) {
      await adapter.disconnect();
      this.adapters.delete(id);
    }

    const connection = this.connections.get(id);
    if (connection) {
      connection.status = 'disconnected';
      connection.connectedAt = undefined;
      connection.schema = undefined;
    }

    this.schemaIntrospector.invalidate(id);

    if (options?.removePersisted) {
      await removeConnection(id);
      this.connections.delete(id);
      this.fullConfigs.delete(id);
    }

    logger.info('Connection disconnected', { id, removePersisted: options?.removePersisted });
  }

  async disconnectAll(): Promise<void> {
    const ids = Array.from(this.adapters.keys());

    for (const id of ids) {
      await this.disconnect(id, { removePersisted: false });
    }

    logger.info('All connections disconnected');
  }

  listConnections(): ActiveConnection[] {
    return Array.from(this.connections.values());
  }

  getConnection(id: string): ActiveConnection | undefined {
    return this.connections.get(id);
  }

  getAdapter(id: string): DatabaseAdapter | undefined {
    return this.adapters.get(id);
  }

  async getSchema(id: string, forceRefresh = false) {
    const adapter = this.adapters.get(id);
    if (!adapter) {
      throw new ConnectionError(`Connection ${id} not found or not connected`);
    }

    return this.schemaIntrospector.getSchema(id, adapter, forceRefresh);
  }

  private redactConfig(config: ConnectionConfig): ConnectionConfig {
    const redacted = { ...config };

    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'credential'];

    for (const key of Object.keys(redacted)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        (redacted as any)[key] = '***';
      }
    }

    return redacted;
  }
}
