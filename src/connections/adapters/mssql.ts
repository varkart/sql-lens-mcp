import mssql from 'mssql';
import type { DatabaseAdapter } from './base.js';
import type { ConnectionConfig, QueryResult, SchemaInfo, ExecuteOptions, ColumnInfo, TableInfo, ColumnDetail, ForeignKey } from '../../utils/types.js';
import { ConnectionError, QueryError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export class MSSQLAdapter implements DatabaseAdapter {
  readonly type = 'mssql';
  private pool: mssql.ConnectionPool | null = null;
  private readOnlyMode = false;

  async connect(config: ConnectionConfig): Promise<void> {
    try {
      logger.debug('Connecting to MSSQL', { host: config.host, database: config.database });

      this.readOnlyMode = config.readOnly ?? false;

      const poolConfig: mssql.config = {
        server: config.host || 'localhost',
        port: config.port || 1433,
        database: config.database,
        user: config.user,
        password: config.password,
        options: {
          encrypt: !!config.ssl,
          trustServerCertificate: true,
        },
        pool: {
          max: 5,
          min: 0,
          idleTimeoutMillis: 30000,
        },
      };

      this.pool = new mssql.ConnectionPool(poolConfig);
      await this.pool.connect();

      if (this.readOnlyMode) {
        await this.pool.request().query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
      }

      logger.info('MSSQL connection established', { host: config.host, database: config.database });
    } catch (error) {
      const err = error as Error;
      logger.error('MSSQL connection failed', { error: err.message });
      throw new ConnectionError(`Failed to connect to MSSQL: ${err.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      logger.info('MSSQL connection closed');
    }
  }

  isConnected(): boolean {
    return this.pool !== null && this.pool.connected;
  }

  async execute(sql: string, params: unknown[] = [], options: ExecuteOptions = {}): Promise<QueryResult> {
    if (!this.pool) {
      throw new ConnectionError('Not connected to MSSQL');
    }

    const startTime = Date.now();

    try {
      const request = this.pool.request();

      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });

      const result = await request.query(sql);
      const executionTimeMs = Date.now() - startTime;

      const columns: ColumnInfo[] = result.recordset?.columns
        ? Object.entries(result.recordset.columns).map(([name, col]) => ({
            name,
            type: (col as any).type.name || 'unknown',
            nullable: (col as any).nullable,
          }))
        : [];

      const maxRows = options.maxRows || 100000;
      const rows = (result.recordset || []).slice(0, maxRows);
      const truncated = (result.recordset?.length || 0) > maxRows;

      logger.debug('MSSQL query executed', { rowCount: rows.length, executionTimeMs });

      return {
        columns,
        rows,
        rowCount: rows.length,
        truncated,
        executionTimeMs,
        statement: sql,
      };
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('timeout')) {
        throw new TimeoutError(`Query timeout: ${err.message}`);
      }
      throw new QueryError(`MSSQL query failed: ${err.message}`);
    }
  }

  async getSchema(): Promise<SchemaInfo> {
    if (!this.pool) {
      throw new ConnectionError('Not connected to MSSQL');
    }

    const tablesQuery = `
      SELECT
        s.name as schema_name,
        t.name as table_name
      FROM sys.tables t
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      ORDER BY s.name, t.name
    `;

    const tablesResult = await this.pool.request().query(tablesQuery);
    const tables: TableInfo[] = [];

    for (const tableRow of tablesResult.recordset) {
      const schema = tableRow.schema_name;
      const tableName = tableRow.table_name;

      const columnsQuery = `
        SELECT
          c.name as column_name,
          t.name as data_type,
          c.is_nullable,
          dc.definition as column_default,
          c.max_length,
          CASE WHEN pk.column_id IS NOT NULL THEN 1 ELSE 0 END as is_primary_key
        FROM sys.columns c
        INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
        LEFT JOIN sys.default_constraints dc ON c.default_object_id = dc.object_id
        LEFT JOIN (
          SELECT ic.object_id, ic.column_id
          FROM sys.index_columns ic
          INNER JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
          WHERE i.is_primary_key = 1
        ) pk ON c.object_id = pk.object_id AND c.column_id = pk.column_id
        WHERE c.object_id = OBJECT_ID(@tableName)
        ORDER BY c.column_id
      `;

      const columnsResult = await this.pool.request()
        .input('tableName', `${schema}.${tableName}`)
        .query(columnsQuery);

      const columns: ColumnDetail[] = columnsResult.recordset.map(col => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable,
        defaultValue: col.column_default,
        isPrimaryKey: col.is_primary_key === 1,
        maxLength: col.max_length,
      }));

      const fkQuery = `
        SELECT
          COL_NAME(fc.parent_object_id, fc.parent_column_id) as column_name,
          OBJECT_NAME(fc.referenced_object_id) as referenced_table_name,
          COL_NAME(fc.referenced_object_id, fc.referenced_column_id) as referenced_column_name
        FROM sys.foreign_key_columns fc
        WHERE fc.parent_object_id = OBJECT_ID(@tableName)
      `;

      const fkResult = await this.pool.request()
        .input('tableName', `${schema}.${tableName}`)
        .query(fkQuery);

      const foreignKeys: ForeignKey[] = fkResult.recordset.map(fk => ({
        column: fk.column_name,
        referencesTable: fk.referenced_table_name,
        referencesColumn: fk.referenced_column_name,
      }));

      const primaryKey = columns.filter(c => c.isPrimaryKey).map(c => c.name);

      let rowCount: number | undefined;
      try {
        const countResult = await this.pool.request()
          .query(`SELECT COUNT(*) as count FROM [${schema}].[${tableName}]`);
        rowCount = countResult.recordset[0].count;
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
      databaseType: 'mssql',
    };
  }

  async setReadOnly(readOnly: boolean): Promise<void> {
    if (!this.pool) {
      throw new ConnectionError('Not connected to MSSQL');
    }

    this.readOnlyMode = readOnly;
    if (readOnly) {
      await this.pool.request().query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    }
  }
}
