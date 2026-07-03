import type { ConnectionConfig, QueryResult, SchemaInfo, ExecuteOptions } from '../../utils/types.js';

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
