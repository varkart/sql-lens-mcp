import type { ConnectionConfig, QueryResult, SchemaInfo, ExecuteOptions, TableRelationship } from '../../utils/types.js';

/**
 * How an adapter enforces read-only mode:
 *
 * - 'session': enforced by the database itself at the session/connection level
 *   (e.g. PostgreSQL default_transaction_read_only, MySQL/MariaDB
 *   SET SESSION TRANSACTION READ ONLY, SQLite read-only file open). The engine
 *   rejects writes regardless of how the statement is phrased.
 * - 'guard': the database has no reliable session-level read-only mode
 *   (MSSQL, Oracle DDL), so the adapter classifies each statement before
 *   execution and rejects anything that is not provably a read. Weaker than
 *   'session' because it depends on statement classification.
 *
 * In both modes the query validator in src/security/query-validator.ts runs
 * first as defense-in-depth.
 */
export type ReadOnlyEnforcement = 'session' | 'guard';

export const DEFAULT_SAMPLE_ROWS = 10;
export const MAX_SAMPLE_ROWS = 100;

/**
 * Clamp a sample-rows limit to a safe integer literal (1..MAX_SAMPLE_ROWS).
 * Guarantees the value interpolated into a sample query is a plain integer.
 */
export function clampSampleLimit(limit?: number): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return DEFAULT_SAMPLE_ROWS;
  }
  return Math.max(1, Math.min(Math.floor(limit), MAX_SAMPLE_ROWS));
}

export interface RelationshipRow {
  constraintName: string;
  fromSchema?: string;
  fromTable: string;
  fromColumn: string;
  toSchema?: string;
  toTable: string;
  toColumn: string;
}

/**
 * Group per-column FK rows (ordered by constraint + column position) into one
 * TableRelationship per constraint, so composite keys yield a single entry.
 */
export function groupRelationshipRows(rows: RelationshipRow[]): TableRelationship[] {
  const grouped = new Map<string, TableRelationship>();

  for (const row of rows) {
    const key = [row.fromSchema ?? '', row.fromTable, row.constraintName].join('.');
    const existing = grouped.get(key);

    if (existing) {
      existing.fromColumns.push(row.fromColumn);
      existing.toColumns.push(row.toColumn);
    } else {
      grouped.set(key, {
        constraintName: row.constraintName,
        fromSchema: row.fromSchema,
        fromTable: row.fromTable,
        fromColumns: [row.fromColumn],
        toSchema: row.toSchema,
        toTable: row.toTable,
        toColumns: [row.toColumn],
      });
    }
  }

  return Array.from(grouped.values());
}

export interface DatabaseAdapter {
  readonly type: string;
  readonly readOnlyEnforcement: ReadOnlyEnforcement;
  connect(config: ConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  /**
   * Execute a statement and return at most `options.maxRows` rows starting at
   * `options.offset` (default 0). `QueryResult.truncated` must be true when
   * more rows exist beyond the returned window. Adapters that can skip rows
   * cheaply (e.g. SQLite's row iterator) apply the window natively; the rest
   * fall back to `applyRowWindow` on the driver's buffered result. Offset
   * pagination re-executes the query on every page.
   */
  execute(sql: string, params?: unknown[], options?: ExecuteOptions): Promise<QueryResult>;
  getSchema(): Promise<SchemaInfo>;
  setReadOnly(readOnly: boolean): Promise<void>;
  isReadOnly(): boolean;
  /**
   * Quote an already-validated identifier for this dialect. Callers must
   * validate names with assertValidIdentifier() first; quoting is a second
   * layer of defense, not a substitute for validation.
   */
  quoteIdentifier(name: string): string;
  /**
   * Build a dialect-appropriate `SELECT * ... <limit>` statement for the
   * given (validated) table. Does not execute anything.
   */
  buildSampleQuery(table: string, schema: string | undefined, limit: number): string;
  /**
   * Produce the query plan for a statement without executing it
   * (EXPLAIN / EXPLAIN QUERY PLAN / SHOWPLAN / EXPLAIN PLAN FOR).
   */
  explain(sql: string, options?: ExecuteOptions): Promise<QueryResult>;
  /**
   * Foreign-key relationships, grouped per constraint (composite keys yield
   * one entry with multiple columns). `schema` filters to one schema where
   * the dialect supports it.
   */
  getRelationships(schema?: string): Promise<TableRelationship[]>;
}

export const DEFAULT_MAX_ROWS = 100000;

/**
 * Shared fallback for applying the offset/maxRows window to a buffered row
 * array. Returns at most maxRows rows starting at offset, and reports
 * truncated when rows exist beyond the window.
 */
export function applyRowWindow<T>(rows: readonly T[], options: ExecuteOptions = {}): { rows: T[]; truncated: boolean } {
  const offset = Math.max(0, options.offset ?? 0);
  const maxRows = options.maxRows || DEFAULT_MAX_ROWS;
  return {
    rows: rows.slice(offset, offset + maxRows),
    truncated: rows.length > offset + maxRows,
  };
}
