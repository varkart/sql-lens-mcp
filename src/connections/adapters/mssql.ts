import mssql from 'mssql';
import { applyRowWindow } from './base.js';
import type { DatabaseAdapter, ReadOnlyEnforcement } from './base.js';
import { clampSampleLimit, groupRelationshipRows } from './base.js';
import type { ConnectionConfig, QueryResult, SchemaInfo, ExecuteOptions, ColumnInfo, TableInfo, ColumnDetail, ForeignKey, TableRelationship } from '../../utils/types.js';
import { ConnectionError, QueryError, TimeoutError } from '../../utils/errors.js';
import { assertReadOnly } from '../../security/query-validator.js';
import { logger } from '../../utils/logger.js';

export class MSSQLAdapter implements DatabaseAdapter {
  readonly type = 'mssql';
  // SQL Server has no session-level read-only mode: SET TRANSACTION ISOLATION
  // LEVEL does not prevent writes and ApplicationIntent=ReadOnly is only
  // honored by Availability Group read replicas. Read-only is therefore
  // enforced by a per-statement guard in execute().
  readonly readOnlyEnforcement: ReadOnlyEnforcement = 'guard';
  private pool: mssql.ConnectionPool | null = null;
  private poolConfig: mssql.config | null = null;
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
      this.poolConfig = poolConfig;
      await this.pool.connect();

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
      this.poolConfig = null;
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

    const readOnly = this.readOnlyMode || options.readOnly === true;
    if (readOnly) {
      assertReadOnly(sql, 'mssql');
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

      const { rows, truncated } = applyRowWindow(result.recordset || [], options);

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

  quoteIdentifier(name: string): string {
    return `[${name.replace(/]/g, ']]')}]`;
  }

  buildSampleQuery(table: string, schema: string | undefined, limit: number): string {
    const target = schema
      ? `${this.quoteIdentifier(schema)}.${this.quoteIdentifier(table)}`
      : this.quoteIdentifier(table);
    return `SELECT TOP (${clampSampleLimit(limit)}) * FROM ${target}`;
  }

  async explain(sql: string): Promise<QueryResult> {
    if (!this.pool || !this.poolConfig) {
      throw new ConnectionError('Not connected to MSSQL');
    }

    // SET SHOWPLAN_ALL applies per session and must be the only statement in
    // its batch, so a dedicated single-connection pool guarantees all three
    // batches run on the same session. With SHOWPLAN_ALL ON the statement is
    // compiled and its plan returned without being executed.
    const planPool = new mssql.ConnectionPool({
      ...this.poolConfig,
      pool: { max: 1, min: 0, idleTimeoutMillis: 5000 },
    });

    const startTime = Date.now();

    try {
      await planPool.connect();
      await planPool.request().batch('SET SHOWPLAN_ALL ON');

      const result = await planPool.request().batch(sql);
      const executionTimeMs = Date.now() - startTime;

      const columns: ColumnInfo[] = result.recordset?.columns
        ? Object.entries(result.recordset.columns).map(([name, col]) => ({
            name,
            type: (col as any).type?.name || 'unknown',
            nullable: (col as any).nullable,
          }))
        : [];

      const rows = (result.recordset || []) as Record<string, unknown>[];

      return {
        columns,
        rows,
        rowCount: rows.length,
        truncated: false,
        executionTimeMs,
        statement: sql,
      };
    } catch (error) {
      const err = error as Error;
      throw new QueryError(`MSSQL explain failed: ${err.message}`);
    } finally {
      await planPool.close().catch(() => undefined);
    }
  }

  async getRelationships(schema?: string): Promise<TableRelationship[]> {
    if (!this.pool) {
      throw new ConnectionError('Not connected to MSSQL');
    }

    const query = `
      SELECT
        fk.name AS constraint_name,
        ps.name AS from_schema,
        pt.name AS from_table,
        pc.name AS from_column,
        rs.name AS to_schema,
        rt.name AS to_table,
        rc.name AS to_column
      FROM sys.foreign_keys fk
      JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      JOIN sys.tables pt ON fkc.parent_object_id = pt.object_id
      JOIN sys.schemas ps ON pt.schema_id = ps.schema_id
      JOIN sys.columns pc ON fkc.parent_object_id = pc.object_id AND fkc.parent_column_id = pc.column_id
      JOIN sys.tables rt ON fkc.referenced_object_id = rt.object_id
      JOIN sys.schemas rs ON rt.schema_id = rs.schema_id
      JOIN sys.columns rc ON fkc.referenced_object_id = rc.object_id AND fkc.referenced_column_id = rc.column_id
      WHERE @schemaName IS NULL OR ps.name = @schemaName
      ORDER BY ps.name, pt.name, fk.name, fkc.constraint_column_id
    `;

    const result = await this.pool.request()
      .input('schemaName', schema ?? null)
      .query(query);

    return groupRelationshipRows(result.recordset.map(row => ({
      constraintName: row.constraint_name,
      fromSchema: row.from_schema,
      fromTable: row.from_table,
      fromColumn: row.from_column,
      toSchema: row.to_schema,
      toTable: row.to_table,
      toColumn: row.to_column,
    })));
  }

  async setReadOnly(readOnly: boolean): Promise<void> {
    if (!this.pool) {
      throw new ConnectionError('Not connected to MSSQL');
    }

    this.readOnlyMode = readOnly;
  }

  isReadOnly(): boolean {
    return this.readOnlyMode;
  }
}
