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
  execute(sql: string, params?: unknown[], options?: ExecuteOptions): Promise<QueryResult>;
  getSchema(): Promise<SchemaInfo>;
  setReadOnly(readOnly: boolean): Promise<void>;
  isReadOnly(): boolean;
}
