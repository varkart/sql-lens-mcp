import * as mariadb from 'mariadb';
import { applyRowWindow } from './base.js';
import type { DatabaseAdapter, ReadOnlyEnforcement } from './base.js';
import type { ConnectionConfig, QueryResult, SchemaInfo, ExecuteOptions, ColumnInfo, TableInfo, ColumnDetail, ForeignKey } from '../../utils/types.js';
import { ConnectionError, QueryError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export class MariaDBAdapter implements DatabaseAdapter {
  readonly type = 'mariadb';
  readonly readOnlyEnforcement: ReadOnlyEnforcement = 'session';
  private pool: mariadb.Pool | null = null;
  private config: ConnectionConfig | null = null;
  private readOnlyMode = false;

  async connect(config: ConnectionConfig): Promise<void> {
    try {
      logger.debug('Connecting to MariaDB', { host: config.host, database: config.database });

      this.config = config;
      this.readOnlyMode = config.readOnly ?? false;

      const poolConfig: any = {
        host: config.host,
        port: config.port || 3306,
        database: config.database,
        user: config.user,
        password: config.password,
        connectionLimit: 5,
      };

      if (config.ssl) {
        poolConfig.ssl = typeof config.ssl === 'boolean' ? {} : config.ssl;
      }

      this.pool = mariadb.createPool(poolConfig);

      const connection = await this.pool.getConnection();
      try {
        if (this.readOnlyMode) {
          await connection.query('SET SESSION TRANSACTION READ ONLY');
        }
      } finally {
        connection.release();
      }

      logger.info('MariaDB connection established', { host: config.host, database: config.database });
    } catch (error) {
      const err = error as Error;
      logger.error('MariaDB connection failed', { error: err.message });
      throw new ConnectionError(`Failed to connect to MariaDB: ${err.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.config = null;
      logger.info('MariaDB connection closed');
    }
  }

  isConnected(): boolean {
    return this.pool !== null;
  }

  async execute(sql: string, params: unknown[] = [], options: ExecuteOptions = {}): Promise<QueryResult> {
    if (!this.pool) {
      throw new ConnectionError('Not connected to MariaDB');
    }

    const startTime = Date.now();
    const connection = await this.pool.getConnection();

    try {
      const readOnly = this.readOnlyMode || options.readOnly === true;
      await connection.query(readOnly ? 'SET SESSION TRANSACTION READ ONLY' : 'SET SESSION TRANSACTION READ WRITE');

      if (options.timeout) {
        await connection.query(`SET SESSION max_statement_time = ${options.timeout / 1000}`);
      }

      const result = await connection.query(sql, params);
      const executionTimeMs = Date.now() - startTime;

      const meta = result.meta;
      const columns: ColumnInfo[] = meta ? meta.map((field: any) => ({
        name: field.name(),
        type: field.type,
        nullable: true,
      })) : [];

      const rows = Array.isArray(result) ? result : [];
      const { rows: slicedRows, truncated } = applyRowWindow(rows, options);

      logger.debug('MariaDB query executed', { rowCount: slicedRows.length, executionTimeMs });

      return {
        columns,
        rows: slicedRows,
        rowCount: slicedRows.length,
        truncated,
        executionTimeMs,
        statement: sql,
      };
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('timeout') || err.message.includes('max_statement_time')) {
        throw new TimeoutError(`Query timeout: ${err.message}`);
      }
      throw new QueryError(`MariaDB query failed: ${err.message}`);
    } finally {
      connection.release();
    }
  }

  async getSchema(): Promise<SchemaInfo> {
    if (!this.pool || !this.config) {
      throw new ConnectionError('Not connected to MariaDB');
    }

    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = ?
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const tablesResult = await this.pool.query(tablesQuery, [this.config.database]);
    const tables: TableInfo[] = [];

    for (const tableRow of tablesResult) {
      const tableName = tableRow.table_name;

      const columnsQuery = `
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          column_key
        FROM information_schema.columns
        WHERE table_schema = ? AND table_name = ?
        ORDER BY ordinal_position
      `;

      const columnsResult = await this.pool.query(columnsQuery, [this.config.database, tableName]);

      const columns: ColumnDetail[] = columnsResult.map((col: any) => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        defaultValue: col.column_default,
        isPrimaryKey: col.column_key === 'PRI',
        maxLength: col.character_maximum_length,
      }));

      const fkQuery = `
        SELECT
          column_name,
          referenced_table_name,
          referenced_column_name
        FROM information_schema.key_column_usage
        WHERE table_schema = ?
          AND table_name = ?
          AND referenced_table_name IS NOT NULL
      `;

      const fkResult = await this.pool.query(fkQuery, [this.config.database, tableName]);

      const foreignKeys: ForeignKey[] = fkResult.map((fk: any) => ({
        column: fk.column_name,
        referencesTable: fk.referenced_table_name,
        referencesColumn: fk.referenced_column_name,
      }));

      const primaryKey = columns.filter(c => c.isPrimaryKey).map(c => c.name);

      let rowCount: number | undefined;
      try {
        const countResult = await this.pool.query(
          `SELECT COUNT(*) as count FROM \`${tableName}\``
        );
        rowCount = countResult[0].count;
      } catch {
        rowCount = undefined;
      }

      tables.push({
        name: tableName,
        columns,
        primaryKey: primaryKey.length > 0 ? primaryKey : undefined,
        foreignKeys,
        rowCount,
      });
    }

    return {
      tables,
      connectionId: '',
      databaseType: 'mariadb',
    };
  }

  async setReadOnly(readOnly: boolean): Promise<void> {
    if (!this.pool) {
      throw new ConnectionError('Not connected to MariaDB');
    }

    this.readOnlyMode = readOnly;
  }

  isReadOnly(): boolean {
    return this.readOnlyMode;
  }
}
