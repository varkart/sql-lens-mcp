import mysql from 'mysql2/promise';
import type { DatabaseAdapter } from './base.js';
import type { ConnectionConfig, QueryResult, SchemaInfo, ExecuteOptions, ColumnInfo, TableInfo, ColumnDetail, ForeignKey } from '../../utils/types.js';
import { ConnectionError, QueryError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export class MySQLAdapter implements DatabaseAdapter {
  readonly type = 'mysql';
  private pool: mysql.Pool | null = null;
  private config: ConnectionConfig | null = null;
  private readOnlyMode = false;

  async connect(config: ConnectionConfig): Promise<void> {
    try {
      logger.debug('Connecting to MySQL', { host: config.host, database: config.database });

      this.config = config;
      this.readOnlyMode = config.readOnly ?? false;

      const poolConfig: mysql.PoolOptions = {
        host: config.host,
        port: config.port || 3306,
        database: config.database,
        user: config.user,
        password: config.password,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
      };

      if (config.ssl) {
        poolConfig.ssl = typeof config.ssl === 'boolean' ? {} : config.ssl;
      }

      this.pool = mysql.createPool(poolConfig);

      const connection = await this.pool.getConnection();
      try {
        if (this.readOnlyMode) {
          await connection.query('SET SESSION TRANSACTION READ ONLY');
        }
      } finally {
        connection.release();
      }

      logger.info('MySQL connection established', { host: config.host, database: config.database });
    } catch (error) {
      const err = error as Error;
      logger.error('MySQL connection failed', { error: err.message });
      throw new ConnectionError(`Failed to connect to MySQL: ${err.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.config = null;
      logger.info('MySQL connection closed');
    }
  }

  isConnected(): boolean {
    return this.pool !== null;
  }

  async execute(sql: string, params: unknown[] = [], options: ExecuteOptions = {}): Promise<QueryResult> {
    if (!this.pool) {
      throw new ConnectionError('Not connected to MySQL');
    }

    const startTime = Date.now();
    const connection = await this.pool.getConnection();

    try {
      if (options.timeout && options.timeout > 0) {
        await connection.query(`SET SESSION max_execution_time = ${Math.floor(options.timeout)}`);
      }

      const [rows, fields] = await connection.query(sql, params);
      const executionTimeMs = Date.now() - startTime;

      const columns: ColumnInfo[] = fields ? (fields as mysql.FieldPacket[]).map(field => ({
        name: field.name,
        type: this.mapMySQLType(field.type ?? 0),
        nullable: (Number(field.flags ?? 0) & 1) === 0,
      })) : [];

      const maxRows = options.maxRows || 100000;
      const resultRows = Array.isArray(rows) ? rows : [];
      const slicedRows = resultRows.slice(0, maxRows);
      const truncated = resultRows.length > maxRows;

      logger.debug('MySQL query executed', { rowCount: slicedRows.length, executionTimeMs });

      return {
        columns,
        rows: slicedRows as Record<string, unknown>[],
        rowCount: slicedRows.length,
        truncated,
        executionTimeMs,
        statement: sql,
      };
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('timeout') || err.message.includes('max_execution_time')) {
        throw new TimeoutError(`Query timeout: ${err.message}`);
      }
      throw new QueryError(`MySQL query failed: ${err.message}`);
    } finally {
      connection.release();
    }
  }

  async getSchema(): Promise<SchemaInfo> {
    if (!this.pool || !this.config) {
      throw new ConnectionError('Not connected to MySQL');
    }

    const tablesQuery = `
      SELECT TABLE_NAME as table_name
      FROM information_schema.tables
      WHERE table_schema = ?
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const [tablesResult] = await this.pool.query(tablesQuery, [this.config.database]);
    const tables: TableInfo[] = [];

    for (const tableRow of tablesResult as any[]) {
      const tableName = tableRow.table_name;

      const columnsQuery = `
        SELECT
          COLUMN_NAME as column_name,
          DATA_TYPE as data_type,
          IS_NULLABLE as is_nullable,
          COLUMN_DEFAULT as column_default,
          CHARACTER_MAXIMUM_LENGTH as character_maximum_length,
          COLUMN_KEY as column_key
        FROM information_schema.columns
        WHERE table_schema = ? AND table_name = ?
        ORDER BY ordinal_position
      `;

      const [columnsResult] = await this.pool.query(columnsQuery, [this.config.database, tableName]);

      const columns: ColumnDetail[] = (columnsResult as any[]).map(col => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        defaultValue: col.column_default,
        isPrimaryKey: col.column_key === 'PRI',
        maxLength: col.character_maximum_length,
      }));

      const fkQuery = `
        SELECT
          COLUMN_NAME as column_name,
          REFERENCED_TABLE_NAME as referenced_table_name,
          REFERENCED_COLUMN_NAME as referenced_column_name
        FROM information_schema.key_column_usage
        WHERE table_schema = ?
          AND table_name = ?
          AND referenced_table_name IS NOT NULL
      `;

      const [fkResult] = await this.pool.query(fkQuery, [this.config.database, tableName]);

      const foreignKeys: ForeignKey[] = (fkResult as any[]).map(fk => ({
        column: fk.column_name,
        referencesTable: fk.referenced_table_name,
        referencesColumn: fk.referenced_column_name,
      }));

      const primaryKey = columns.filter(c => c.isPrimaryKey).map(c => c.name);

      let rowCount: number | undefined;
      try {
        const [countResult] = await this.pool.query(
          `SELECT COUNT(*) as count FROM \`${tableName}\``
        );
        rowCount = (countResult as any[])[0].count;
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
      databaseType: 'mysql',
    };
  }

  async setReadOnly(readOnly: boolean): Promise<void> {
    if (!this.pool) {
      throw new ConnectionError('Not connected to MySQL');
    }

    this.readOnlyMode = readOnly;
    const connection = await this.pool.getConnection();
    try {
      if (readOnly) {
        await connection.query('SET SESSION TRANSACTION READ ONLY');
      } else {
        await connection.query('SET SESSION TRANSACTION READ WRITE');
      }
    } finally {
      connection.release();
    }
  }

  private mapMySQLType(type: number): string {
    const typeMap: Record<number, string> = {
      1: 'tinyint',
      2: 'smallint',
      3: 'int',
      4: 'float',
      5: 'double',
      7: 'timestamp',
      8: 'bigint',
      10: 'date',
      12: 'datetime',
      15: 'varchar',
      252: 'text',
      253: 'varchar',
      254: 'char',
    };
    return typeMap[type] || 'unknown';
  }
}
