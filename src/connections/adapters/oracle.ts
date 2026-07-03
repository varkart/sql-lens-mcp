import { applyRowWindow, DEFAULT_MAX_ROWS } from './base.js';
import type { DatabaseAdapter, ReadOnlyEnforcement } from './base.js';
import { clampSampleLimit, groupRelationshipRows } from './base.js';
import type { ConnectionConfig, QueryResult, SchemaInfo, ExecuteOptions, ColumnInfo, TableInfo, ColumnDetail, ForeignKey, TableRelationship } from '../../utils/types.js';
import { ConnectionError, QueryError, TimeoutError } from '../../utils/errors.js';
import { assertReadOnly } from '../../security/query-validator.js';
import { logger } from '../../utils/logger.js';

export class OracleAdapter implements DatabaseAdapter {
  readonly type = 'oracle';
  // Oracle has no session-level read-only mode. SET TRANSACTION READ ONLY is
  // applied per statement in execute() and blocks DML, but DDL performs an
  // implicit commit that escapes it, so the per-statement guard is the
  // primary control.
  readonly readOnlyEnforcement: ReadOnlyEnforcement = 'guard';
  private oracledb: any = null;
  private connection: any = null;
  private readOnlyMode = false;

  async connect(config: ConnectionConfig): Promise<void> {
    try {
      logger.debug('Connecting to Oracle', { host: config.host, database: config.database });

      if (!this.oracledb) {
        try {
          this.oracledb = await Function('return import("oracledb")')();
        } catch (error) {
          throw new ConnectionError('oracledb module not available. Install it with: npm install oracledb');
        }
      }

      this.readOnlyMode = config.readOnly ?? false;

      const connectString = `${config.host}:${config.port || 1521}/${config.database}`;

      this.connection = await this.oracledb.getConnection({
        user: config.user,
        password: config.password,
        connectString,
      });

      logger.info('Oracle connection established', { host: config.host, database: config.database });
    } catch (error) {
      const err = error as Error;
      logger.error('Oracle connection failed', { error: err.message });
      throw new ConnectionError(`Failed to connect to Oracle: ${err.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      logger.info('Oracle connection closed');
    }
  }

  isConnected(): boolean {
    return this.connection !== null;
  }

  async execute(sql: string, params: unknown[] = [], options: ExecuteOptions = {}): Promise<QueryResult> {
    if (!this.connection) {
      throw new ConnectionError('Not connected to Oracle');
    }

    const readOnly = this.readOnlyMode || options.readOnly === true;
    if (readOnly) {
      assertReadOnly(sql, 'oracle');
    }

    const startTime = Date.now();

    try {
      if (readOnly) {
        await this.connection.rollback();
        await this.connection.execute('SET TRANSACTION READ ONLY');
      }

      // Fetch one extra row beyond the window so truncation is detected
      // without buffering the full result set in the driver.
      const result = await this.connection.execute(sql, params, {
        outFormat: this.oracledb.OUT_FORMAT_OBJECT,
        maxRows: Math.max(0, options.offset ?? 0) + (options.maxRows || DEFAULT_MAX_ROWS) + 1,
      });

      const executionTimeMs = Date.now() - startTime;

      const columns: ColumnInfo[] = result.metaData
        ? result.metaData.map((col: any) => ({
            name: col.name,
            type: this.mapOracleType(col.dbType),
            nullable: true,
          }))
        : [];

      const { rows, truncated } = applyRowWindow((result.rows || []) as Record<string, unknown>[], options);

      logger.debug('Oracle query executed', { rowCount: rows.length, executionTimeMs });

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
      throw new QueryError(`Oracle query failed: ${err.message}`);
    } finally {
      if (readOnly && this.connection) {
        await this.connection.rollback().catch(() => undefined);
      }
    }
  }

  async getSchema(): Promise<SchemaInfo> {
    if (!this.connection) {
      throw new ConnectionError('Not connected to Oracle');
    }

    const tablesQuery = `
      SELECT table_name
      FROM user_tables
      ORDER BY table_name
    `;

    const tablesResult = await this.connection.execute(tablesQuery, [], {
      outFormat: this.oracledb.OUT_FORMAT_OBJECT,
    });

    const tables: TableInfo[] = [];

    for (const tableRow of tablesResult.rows) {
      const tableName = tableRow.TABLE_NAME;

      const columnsQuery = `
        SELECT
          column_name,
          data_type,
          nullable,
          data_default,
          data_length
        FROM user_tab_columns
        WHERE table_name = :tableName
        ORDER BY column_id
      `;

      const columnsResult = await this.connection.execute(columnsQuery, [tableName], {
        outFormat: this.oracledb.OUT_FORMAT_OBJECT,
      });

      const pkQuery = `
        SELECT column_name
        FROM user_cons_columns
        WHERE constraint_name = (
          SELECT constraint_name
          FROM user_constraints
          WHERE table_name = :tableName AND constraint_type = 'P'
        )
      `;

      const pkResult = await this.connection.execute(pkQuery, [tableName], {
        outFormat: this.oracledb.OUT_FORMAT_OBJECT,
      });

      const pkColumns = new Set(pkResult.rows.map((row: any) => row.COLUMN_NAME));

      const columns: ColumnDetail[] = columnsResult.rows.map((col: any) => ({
        name: col.COLUMN_NAME,
        type: col.DATA_TYPE,
        nullable: col.NULLABLE === 'Y',
        defaultValue: col.DATA_DEFAULT,
        isPrimaryKey: pkColumns.has(col.COLUMN_NAME),
        maxLength: col.DATA_LENGTH,
      }));

      const fkQuery = `
        SELECT
          a.column_name,
          c_pk.table_name as referenced_table_name,
          b.column_name as referenced_column_name
        FROM user_cons_columns a
        JOIN user_constraints c ON a.constraint_name = c.constraint_name
        JOIN user_constraints c_pk ON c.r_constraint_name = c_pk.constraint_name
        JOIN user_cons_columns b ON c_pk.constraint_name = b.constraint_name
        WHERE c.constraint_type = 'R'
          AND a.table_name = :tableName
      `;

      const fkResult = await this.connection.execute(fkQuery, [tableName], {
        outFormat: this.oracledb.OUT_FORMAT_OBJECT,
      });

      const foreignKeys: ForeignKey[] = fkResult.rows.map((fk: any) => ({
        column: fk.COLUMN_NAME,
        referencesTable: fk.REFERENCED_TABLE_NAME,
        referencesColumn: fk.REFERENCED_COLUMN_NAME,
      }));

      const primaryKey = Array.from(pkColumns) as string[];

      let rowCount: number | undefined;
      try {
        const countResult = await this.connection.execute(
          `SELECT COUNT(*) as CNT FROM ${tableName}`,
          [],
          { outFormat: this.oracledb.OUT_FORMAT_OBJECT }
        );
        rowCount = countResult.rows[0].CNT;
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
      databaseType: 'oracle',
    };
  }

  quoteIdentifier(name: string): string {
    return `"${name.replace(/"/g, '""')}"`;
  }

  buildSampleQuery(table: string, schema: string | undefined, limit: number): string {
    const target = schema
      ? `${this.quoteIdentifier(schema)}.${this.quoteIdentifier(table)}`
      : this.quoteIdentifier(table);
    return `SELECT * FROM ${target} FETCH FIRST ${clampSampleLimit(limit)} ROWS ONLY`;
  }

  async explain(sql: string): Promise<QueryResult> {
    if (!this.connection) {
      throw new ConnectionError('Not connected to Oracle');
    }

    // EXPLAIN PLAN FOR inserts plan rows into PLAN_TABLE without executing the
    // statement. The rows are read back via DBMS_XPLAN.DISPLAY and rolled back
    // afterwards. Requires access to PLAN_TABLE (a global temporary table
    // available by default in modern Oracle) and the privileges needed to
    // execute the statement being explained.
    const statementId = `SQLLENS_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const startTime = Date.now();

    try {
      await this.connection.execute(`EXPLAIN PLAN SET STATEMENT_ID = '${statementId}' FOR ${sql}`);

      const result = await this.connection.execute(
        `SELECT plan_table_output FROM TABLE(DBMS_XPLAN.DISPLAY('PLAN_TABLE', :stmtId, 'TYPICAL'))`,
        { stmtId: statementId },
        { outFormat: this.oracledb.OUT_FORMAT_OBJECT }
      );

      const executionTimeMs = Date.now() - startTime;
      const rows = (result.rows || []) as Record<string, unknown>[];

      return {
        columns: [{ name: 'PLAN_TABLE_OUTPUT', type: 'VARCHAR2', nullable: true }],
        rows,
        rowCount: rows.length,
        truncated: false,
        executionTimeMs,
        statement: sql,
      };
    } catch (error) {
      const err = error as Error;
      throw new QueryError(`Oracle explain failed: ${err.message}`);
    } finally {
      await this.connection.rollback().catch(() => undefined);
    }
  }

  async getRelationships(schema?: string): Promise<TableRelationship[]> {
    if (!this.connection) {
      throw new ConnectionError('Not connected to Oracle');
    }

    const query = `
      SELECT
        c.constraint_name,
        a.owner AS from_schema,
        a.table_name AS from_table,
        a.column_name AS from_column,
        c_pk.owner AS to_schema,
        c_pk.table_name AS to_table,
        b.column_name AS to_column
      FROM all_constraints c
      JOIN all_cons_columns a
        ON c.owner = a.owner AND c.constraint_name = a.constraint_name
      JOIN all_constraints c_pk
        ON c.r_owner = c_pk.owner AND c.r_constraint_name = c_pk.constraint_name
      JOIN all_cons_columns b
        ON c_pk.owner = b.owner AND c_pk.constraint_name = b.constraint_name AND b.position = a.position
      WHERE c.constraint_type = 'R'
        AND a.owner = NVL(:schemaName, USER)
      ORDER BY a.owner, a.table_name, c.constraint_name, a.position
    `;

    const result = await this.connection.execute(
      query,
      { schemaName: schema ?? null },
      { outFormat: this.oracledb.OUT_FORMAT_OBJECT }
    );

    return groupRelationshipRows(((result.rows || []) as Record<string, unknown>[]).map(row => ({
      constraintName: String(row.CONSTRAINT_NAME),
      fromSchema: row.FROM_SCHEMA as string,
      fromTable: String(row.FROM_TABLE),
      fromColumn: String(row.FROM_COLUMN),
      toSchema: row.TO_SCHEMA as string,
      toTable: String(row.TO_TABLE),
      toColumn: String(row.TO_COLUMN),
    })));
  }

  async setReadOnly(readOnly: boolean): Promise<void> {
    this.readOnlyMode = readOnly;
  }

  isReadOnly(): boolean {
    return this.readOnlyMode;
  }

  private mapOracleType(dbType: any): string {
    const typeMap: Record<number, string> = {
      1: 'VARCHAR2',
      2: 'NUMBER',
      12: 'DATE',
      180: 'TIMESTAMP',
      112: 'CLOB',
      113: 'BLOB',
    };
    return typeMap[dbType] || 'unknown';
  }
}
