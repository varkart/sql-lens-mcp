import Database from 'better-sqlite3';
import type { DatabaseAdapter } from './base.js';
import type { ConnectionConfig, QueryResult, SchemaInfo, ExecuteOptions, ColumnInfo, TableInfo, ColumnDetail, ForeignKey } from '../../utils/types.js';
import { ConnectionError, QueryError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export class SQLiteAdapter implements DatabaseAdapter {
  readonly type = 'sqlite';
  private db: Database.Database | null = null;
  private readOnlyMode = false;

  async connect(config: ConnectionConfig): Promise<void> {
    try {
      const path = config.path || config.database;
      logger.debug('Connecting to SQLite', { path });

      if (!path) {
        throw new ConnectionError('SQLite path is required');
      }

      this.readOnlyMode = config.readOnly ?? false;

      this.db = new Database(path, {
        readonly: this.readOnlyMode,
        fileMustExist: false,
      });

      if (!this.readOnlyMode) {
        this.db.pragma('journal_mode = WAL');
      }

      if (this.readOnlyMode) {
        this.db.pragma('query_only = ON');
      }

      logger.info('SQLite connection established', { path });
    } catch (error) {
      const err = error as Error;
      logger.error('SQLite connection failed', { error: err.message });
      throw new ConnectionError(`Failed to connect to SQLite: ${err.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      logger.info('SQLite connection closed');
    }
  }

  isConnected(): boolean {
    return this.db !== null && this.db.open;
  }

  async execute(sql: string, params: unknown[] = [], options: ExecuteOptions = {}): Promise<QueryResult> {
    if (!this.db) {
      throw new ConnectionError('Not connected to SQLite');
    }

    const startTime = Date.now();

    try {
      if (options.timeout) {
        this.db.pragma(`busy_timeout = ${options.timeout}`);
      }

      const stmt = this.db.prepare(sql);
      const executionTimeMs = Date.now() - startTime;

      // Use run() for DDL/DML statements, all() for SELECT
      if (stmt.reader) {
        const rows = stmt.all(...params) as Record<string, unknown>[];

        const columns: ColumnInfo[] = stmt.columns().map(col => ({
          name: col.name,
          type: col.type || 'unknown',
          nullable: true,
        }));

        const maxRows = options.maxRows || 100000;
        const slicedRows = rows.slice(0, maxRows);
        const truncated = rows.length > maxRows;

        logger.debug('SQLite query executed', { rowCount: slicedRows.length, executionTimeMs });

        return {
          columns,
          rows: slicedRows,
          rowCount: slicedRows.length,
          truncated,
          executionTimeMs,
          statement: sql,
        };
      } else {
        const result = stmt.run(...params);

        logger.debug('SQLite statement executed', { changes: result.changes, executionTimeMs });

        return {
          columns: [],
          rows: [],
          rowCount: result.changes,
          truncated: false,
          executionTimeMs,
          statement: sql,
        };
      }
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('timeout')) {
        throw new TimeoutError(`Query timeout: ${err.message}`);
      }
      throw new QueryError(`SQLite query failed: ${err.message}`);
    }
  }

  async getSchema(): Promise<SchemaInfo> {
    if (!this.db) {
      throw new ConnectionError('Not connected to SQLite');
    }

    const tablesQuery = `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `;

    const tablesResult = this.db.prepare(tablesQuery).all() as { name: string }[];
    const tables: TableInfo[] = [];

    for (const tableRow of tablesResult) {
      const tableName = tableRow.name;

      const columnsQuery = `PRAGMA table_info(${tableName})`;
      const columnsResult = this.db.prepare(columnsQuery).all() as any[];

      const columns: ColumnDetail[] = columnsResult.map(col => ({
        name: col.name,
        type: col.type,
        nullable: col.notnull === 0,
        defaultValue: col.dflt_value,
        isPrimaryKey: col.pk === 1,
      }));

      const fkQuery = `PRAGMA foreign_key_list(${tableName})`;
      const fkResult = this.db.prepare(fkQuery).all() as any[];

      const foreignKeys: ForeignKey[] = fkResult.map(fk => ({
        column: fk.from,
        referencesTable: fk.table,
        referencesColumn: fk.to,
      }));

      const primaryKey = columns.filter(c => c.isPrimaryKey).map(c => c.name);

      let rowCount: number | undefined;
      try {
        const countResult = this.db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get() as { count: number };
        rowCount = countResult.count;
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
      databaseType: 'sqlite',
    };
  }

  async setReadOnly(readOnly: boolean): Promise<void> {
    if (!this.db) {
      throw new ConnectionError('Not connected to SQLite');
    }

    this.readOnlyMode = readOnly;
    this.db.pragma(`query_only = ${readOnly ? 'ON' : 'OFF'}`);
  }
}
