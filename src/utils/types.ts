export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite' | 'mssql' | 'oracle' | 'mariadb' | 'duckdb';
export type ConnectionStatus = 'connected' | 'disconnected' | 'failed';
export type StatementType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP' | 'ALTER' | 'UNKNOWN';

export interface ConnectionConfig {
  type: DatabaseType;
  host?: string;
  port?: number;
  database?: string;
  path?: string;
  user?: string;
  password?: string;
  readOnly?: boolean;
  queryTimeout?: number;
  maxRows?: number;
  ssl?: boolean | Record<string, unknown>;
}

export interface ActiveConnection {
  id: string;
  name?: string;
  env?: string;
  config: ConnectionConfig;
  status: ConnectionStatus;
  error?: string;
  schema?: SchemaInfo;
  connectedAt?: Date;
}

export interface ConnectionEntry {
  config: ConnectionConfig;
  name?: string;
  env?: string;
}

export interface ServerConfig {
  connections: Record<string, ConnectionEntry>;
  defaults: {
    readOnly: boolean;
    queryTimeout: number;
    maxRows: number;
  };
  apps?: {
    enabled?: boolean;
    connectionManager?: {
      enabled?: boolean;
    };
  };
}

export interface QueryResult {
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
  executionTimeMs: number;
  statement: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable?: boolean;
}

export interface SchemaInfo {
  tables: TableInfo[];
  connectionId: string;
  databaseType: DatabaseType;
}

export interface TableInfo {
  name: string;
  schema?: string;
  columns: ColumnDetail[];
  primaryKey?: string[];
  foreignKeys: ForeignKey[];
  rowCount?: number;
}

export interface ColumnDetail {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  maxLength?: number;
}

export interface ForeignKey {
  column: string;
  referencesTable: string;
  referencesColumn: string;
}

export interface QueryHistoryEntry {
  connectionId: string;
  sql: string;
  statementType: StatementType;
  rowCount: number;
  executionTimeMs: number;
  timestamp: Date;
  error?: string;
}

export interface ExecuteOptions {
  timeout?: number;
  maxRows?: number;
  offset?: number;
  readOnly?: boolean;
}

export interface StoredQueryResult {
  connectionId: string;
  sql: string;
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  rowCount: number;
  offset: number;
  hasMore: boolean;
  executedAt: Date;
}

export interface CrossDbPlan {
  subQueries: SubQuery[];
  mergeStrategy: MergeStrategy;
}

export interface SubQuery {
  connectionId: string;
  sql: string;
}

export interface MergeStrategy {
  type: 'union' | 'append' | 'join';
  joinColumns?: string[];
}

export interface VisualizationData {
  labels: string[];
  values: number[];
  title?: string;
}
