import pg from 'pg';
import type { DatabaseAdapter } from './base.js';
import type { ConnectionConfig, QueryResult, SchemaInfo, ExecuteOptions, ColumnInfo, TableInfo, ColumnDetail, ForeignKey } from '../../utils/types.js';
import { ConnectionError, QueryError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

const { Pool } = pg;

export class PostgreSQLAdapter implements DatabaseAdapter {
  readonly type = 'postgresql';
  private pool: pg.Pool | null = null;
  private config: ConnectionConfig | null = null;
  private readOnlyMode = false;

  async connect(config: ConnectionConfig): Promise<void> {
    try {
      logger.debug('Connecting to PostgreSQL', { host: config.host, database: config.database });

      this.config = config;
      this.readOnlyMode = config.readOnly ?? false;

      const poolConfig: pg.PoolConfig = {
        host: config.host,
        port: config.port || 5432,
        database: config.database,
        user: config.user,
        password: config.password,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      };

      if (config.ssl) {
        poolConfig.ssl = typeof config.ssl === 'boolean' ? { rejectUnauthorized: false } : config.ssl;
      }

      this.pool = new Pool(poolConfig);

      const client = await this.pool.connect();
      try {
        if (this.readOnlyMode) {
          await client.query('SET default_transaction_read_only = true');
        }
      } finally {
        client.release();
      }

      logger.info('PostgreSQL connection established', { host: config.host, database: config.database });
    } catch (error) {
      const err = error as Error;
      logger.error('PostgreSQL connection failed', { error: err.message });
      throw new ConnectionError(`Failed to connect to PostgreSQL: ${err.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.config = null;
      logger.info('PostgreSQL connection closed');
    }
  }

  isConnected(): boolean {
    return this.pool !== null;
  }

  async execute(sql: string, params: unknown[] = [], options: ExecuteOptions = {}): Promise<QueryResult> {
    if (!this.pool) {
      throw new ConnectionError('Not connected to PostgreSQL');
    }

    const startTime = Date.now();
    const client = await this.pool.connect();

    try {
      if (options.timeout) {
        await client.query(`SET statement_timeout = ${options.timeout}`);
      }

      const result = await client.query(sql, params);
      const executionTimeMs = Date.now() - startTime;

      const columns: ColumnInfo[] = result.fields.map(field => ({
        name: field.name,
        type: this.mapPostgresType(field.dataTypeID),
        nullable: true,
      }));

      const maxRows = options.maxRows || 100000;
      const rows = result.rows.slice(0, maxRows);
      const truncated = result.rows.length > maxRows;

      // For INSERT/UPDATE/DELETE, use result.rowCount (affected rows)
      // For SELECT, use rows.length (returned rows)
      const actualRowCount = result.rowCount ?? rows.length;

      logger.debug('PostgreSQL query executed', { rowCount: actualRowCount, executionTimeMs });

      return {
        columns,
        rows,
        rowCount: actualRowCount,
        truncated,
        executionTimeMs,
        statement: sql,
      };
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('timeout') || err.message.includes('canceling statement')) {
        throw new TimeoutError(`Query timeout: ${err.message}`);
      }
      throw new QueryError(`PostgreSQL query failed: ${err.message}`);
    } finally {
      client.release();
    }
  }

  async getSchema(): Promise<SchemaInfo> {
    if (!this.pool || !this.config) {
      throw new ConnectionError('Not connected to PostgreSQL');
    }

    const tablesQuery = `
      SELECT
        t.table_schema,
        t.table_name,
        (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_schema, t.table_name
    `;

    const tablesResult = await this.pool.query(tablesQuery);
    const tables: TableInfo[] = [];

    for (const tableRow of tablesResult.rows) {
      const schema = tableRow.table_schema;
      const tableName = tableRow.table_name;

      const columnsQuery = `
        SELECT
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          c.character_maximum_length,
          (SELECT COUNT(*) > 0
           FROM information_schema.key_column_usage kcu
           JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
           WHERE tc.constraint_type = 'PRIMARY KEY'
             AND kcu.table_schema = c.table_schema
             AND kcu.table_name = c.table_name
             AND kcu.column_name = c.column_name) as is_primary_key
        FROM information_schema.columns c
        WHERE c.table_schema = $1 AND c.table_name = $2
        ORDER BY c.ordinal_position
      `;

      const columnsResult = await this.pool.query(columnsQuery, [schema, tableName]);

      const columns: ColumnDetail[] = columnsResult.rows.map(col => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        defaultValue: col.column_default,
        isPrimaryKey: col.is_primary_key,
        maxLength: col.character_maximum_length,
      }));

      const fkQuery = `
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = $1
          AND tc.table_name = $2
      `;

      const fkResult = await this.pool.query(fkQuery, [schema, tableName]);

      const foreignKeys: ForeignKey[] = fkResult.rows.map(fk => ({
        column: fk.column_name,
        referencesTable: fk.foreign_table_name,
        referencesColumn: fk.foreign_column_name,
      }));

      const primaryKey = columns.filter(c => c.isPrimaryKey).map(c => c.name);

      let rowCount: number | undefined;
      try {
        const countResult = await this.pool.query(
          `SELECT COUNT(*) as count FROM "${schema}"."${tableName}"`
        );
        rowCount = parseInt(countResult.rows[0].count, 10);
      } catch {
        rowCount = undefined;
      }

      tables.push({
        name: tableName,
        schema,
        columns,
        primaryKey: primaryKey.length > 0 ? primaryKey : undefined,
        foreignKeys,
        rowCount,
      });
    }

    return {
      tables,
      connectionId: '',
      databaseType: 'postgresql',
    };
  }

  async setReadOnly(readOnly: boolean): Promise<void> {
    if (!this.pool) {
      throw new ConnectionError('Not connected to PostgreSQL');
    }

    this.readOnlyMode = readOnly;
    const client = await this.pool.connect();
    try {
      await client.query(`SET default_transaction_read_only = ${readOnly ? 'true' : 'false'}`);
    } finally {
      client.release();
    }
  }

  private mapPostgresType(typeId: number): string {
    const typeMap: Record<number, string> = {
      16: 'boolean',
      20: 'bigint',
      21: 'smallint',
      23: 'integer',
      25: 'text',
      700: 'real',
      701: 'double precision',
      1043: 'varchar',
      1082: 'date',
      1114: 'timestamp',
      1184: 'timestamptz',
    };
    return typeMap[typeId] || 'unknown';
  }
}
