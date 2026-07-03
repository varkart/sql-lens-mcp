import { DuckDBInstance, DuckDBConnection, ResultReturnType } from '@duckdb/node-api';
import type { DuckDBValue } from '@duckdb/node-api';
import type { DatabaseAdapter, ReadOnlyEnforcement } from './base.js';
import type { ConnectionConfig, QueryResult, SchemaInfo, ExecuteOptions, ColumnInfo, TableInfo, ColumnDetail, ForeignKey } from '../../utils/types.js';
import { ConnectionError, QueryError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

const MEMORY_PATH = ':memory:';

export class DuckDBAdapter implements DatabaseAdapter {
  readonly type = 'duckdb';
  readonly readOnlyEnforcement: ReadOnlyEnforcement = 'session';
  private instance: DuckDBInstance | null = null;
  private connection: DuckDBConnection | null = null;
  private path: string | null = null;
  private readOnlyMode = false;

  async connect(config: ConnectionConfig): Promise<void> {
    try {
      const path = config.path || config.database || MEMORY_PATH;
      logger.debug('Connecting to DuckDB', { path });

      const readOnly = config.readOnly ?? false;
      if (readOnly && path === MEMORY_PATH) {
        throw new ConnectionError('DuckDB cannot open an in-memory database in read-only mode');
      }

      await this.open(path, readOnly);
      this.path = path;
      this.readOnlyMode = readOnly;

      logger.info('DuckDB connection established', { path });
    } catch (error) {
      const err = error as Error;
      logger.error('DuckDB connection failed', { error: err.message });
      if (error instanceof ConnectionError) {
        throw error;
      }
      throw new ConnectionError(`Failed to connect to DuckDB: ${err.message}`);
    }
  }

  private async open(path: string, readOnly: boolean): Promise<void> {
    const options = readOnly ? { access_mode: 'READ_ONLY' } : undefined;
    this.instance = await DuckDBInstance.create(path, options);
    this.connection = await this.instance.connect();
  }

  private close(): void {
    if (this.connection) {
      this.connection.closeSync();
      this.connection = null;
    }
    if (this.instance) {
      this.instance.closeSync();
      this.instance = null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.instance || this.connection) {
      this.close();
      this.path = null;
      logger.info('DuckDB connection closed');
    }
  }

  isConnected(): boolean {
    return this.connection !== null;
  }

  async execute(sql: string, params: unknown[] = [], options: ExecuteOptions = {}): Promise<QueryResult> {
    if (!this.connection) {
      throw new ConnectionError('Not connected to DuckDB');
    }

    const startTime = Date.now();
    let timedOut = false;
    let timer: NodeJS.Timeout | undefined;

    if (options.timeout) {
      timer = setTimeout(() => {
        timedOut = true;
        this.connection?.interrupt();
      }, options.timeout);
    }

    try {
      const reader = await this.connection.runAndReadAll(sql, params as DuckDBValue[]);
      const executionTimeMs = Date.now() - startTime;

      if (reader.returnType === ResultReturnType.QUERY_RESULT) {
        const rows = reader.getRowObjectsJson() as Record<string, unknown>[];
        const names = reader.columnNames();
        const types = reader.columnTypes();

        const columns: ColumnInfo[] = names.map((name, i) => ({
          name,
          type: types[i]?.toString() || 'unknown',
          nullable: true,
        }));

        const maxRows = options.maxRows || 100000;
        const slicedRows = rows.slice(0, maxRows);
        const truncated = rows.length > maxRows;

        logger.debug('DuckDB query executed', { rowCount: slicedRows.length, executionTimeMs });

        return {
          columns,
          rows: slicedRows,
          rowCount: slicedRows.length,
          truncated,
          executionTimeMs,
          statement: sql,
        };
      }

      logger.debug('DuckDB statement executed', { changes: reader.rowsChanged, executionTimeMs });

      return {
        columns: [],
        rows: [],
        rowCount: reader.rowsChanged,
        truncated: false,
        executionTimeMs,
        statement: sql,
      };
    } catch (error) {
      const err = error as Error;
      if (timedOut || err.message.toLowerCase().includes('interrupt')) {
        throw new TimeoutError(`Query timeout: ${err.message}`);
      }
      throw new QueryError(`DuckDB query failed: ${err.message}`);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  async getSchema(): Promise<SchemaInfo> {
    if (!this.connection) {
      throw new ConnectionError('Not connected to DuckDB');
    }

    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'main'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const tablesReader = await this.connection.runAndReadAll(tablesQuery);
    const tablesResult = tablesReader.getRowObjectsJson() as { table_name: string }[];
    const tables: TableInfo[] = [];

    for (const tableRow of tablesResult) {
      const tableName = tableRow.table_name;

      const columnsQuery = `
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'main' AND table_name = ?
        ORDER BY ordinal_position
      `;

      const columnsReader = await this.connection.runAndReadAll(columnsQuery, [tableName]);
      const columnsResult = columnsReader.getRowObjectsJson() as Record<string, unknown>[];

      const constraintsQuery = `
        SELECT
          constraint_type,
          constraint_column_names,
          referenced_table,
          referenced_column_names
        FROM duckdb_constraints()
        WHERE schema_name = 'main' AND table_name = ?
      `;

      const constraintsReader = await this.connection.runAndReadAll(constraintsQuery, [tableName]);
      const constraintsResult = constraintsReader.getRowObjectsJson() as {
        constraint_type: string;
        constraint_column_names: string[];
        referenced_table: string | null;
        referenced_column_names: string[];
      }[];

      const primaryKeyColumns = new Set<string>();
      const foreignKeys: ForeignKey[] = [];

      for (const constraint of constraintsResult) {
        if (constraint.constraint_type === 'PRIMARY KEY') {
          for (const column of constraint.constraint_column_names) {
            primaryKeyColumns.add(column);
          }
        } else if (constraint.constraint_type === 'FOREIGN KEY' && constraint.referenced_table) {
          constraint.constraint_column_names.forEach((column, i) => {
            foreignKeys.push({
              column,
              referencesTable: constraint.referenced_table as string,
              referencesColumn: constraint.referenced_column_names[i] ?? constraint.referenced_column_names[0],
            });
          });
        }
      }

      const columns: ColumnDetail[] = columnsResult.map(col => ({
        name: col.column_name as string,
        type: col.data_type as string,
        nullable: col.is_nullable === 'YES',
        defaultValue: col.column_default as string | undefined,
        isPrimaryKey: primaryKeyColumns.has(col.column_name as string),
        maxLength: col.character_maximum_length != null ? Number(col.character_maximum_length) : undefined,
      }));

      const primaryKey = columns.filter(c => c.isPrimaryKey).map(c => c.name);

      let rowCount: number | undefined;
      try {
        const countReader = await this.connection.runAndReadAll(`SELECT COUNT(*) AS count FROM "${tableName}"`);
        const countResult = countReader.getRowObjectsJson() as { count: string | number }[];
        rowCount = Number(countResult[0].count);
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
      databaseType: 'duckdb',
    };
  }

  async setReadOnly(readOnly: boolean): Promise<void> {
    if (!this.connection || !this.path) {
      throw new ConnectionError('Not connected to DuckDB');
    }

    if (readOnly === this.readOnlyMode) {
      return;
    }

    if (this.path === MEMORY_PATH) {
      throw new ConnectionError('DuckDB cannot change read-only mode on an in-memory database');
    }

    this.close();
    await this.open(this.path, readOnly);
    this.readOnlyMode = readOnly;
    logger.info('DuckDB connection reopened', { path: this.path, readOnly });
  }

  isReadOnly(): boolean {
    return this.readOnlyMode;
  }
}
