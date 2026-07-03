import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PrimitiveSchemaDefinition } from '@modelcontextprotocol/sdk/types.js';
import type { ConnectionConfig, DatabaseType } from '../utils/types.js';

export type ConnectionParams = Partial<
  Pick<ConnectionConfig, 'host' | 'port' | 'database' | 'path' | 'user' | 'password'>
>;

export type ConnectionSetupResult =
  | { status: 'completed'; values: ConnectionParams }
  | { status: 'declined' }
  | { status: 'cancelled' };

const DEFAULT_PORTS: Partial<Record<DatabaseType, number>> = {
  postgresql: 5432,
  mysql: 3306,
  mariadb: 3306,
  mssql: 1433,
  oracle: 1521,
};

const FILE_BASED_TYPES: DatabaseType[] = ['sqlite', 'duckdb'];

export function getMissingConnectionParams(type: DatabaseType, provided: ConnectionParams): string[] {
  if (FILE_BASED_TYPES.includes(type)) {
    return provided.path === undefined ? ['path'] : [];
  }

  const required = ['host', 'database', 'user'] as const;
  return required.filter((field) => provided[field] === undefined);
}

function buildRequestedSchema(
  type: DatabaseType,
  provided: ConnectionParams
): { properties: Record<string, PrimitiveSchemaDefinition>; required: string[] } {
  if (FILE_BASED_TYPES.includes(type)) {
    return {
      properties: {
        path: {
          type: 'string',
          title: 'Database file path',
          description: `Path to the ${type === 'duckdb' ? 'DuckDB' : 'SQLite'} database file (use :memory: for an in-memory database)`,
        },
      },
      required: ['path'],
    };
  }

  const fields: Record<string, PrimitiveSchemaDefinition> = {
    host: {
      type: 'string',
      title: 'Host',
      description: 'Database server hostname or IP address',
    },
    port: {
      type: 'integer',
      title: 'Port',
      description: 'Database server port',
      minimum: 1,
      maximum: 65535,
      default: DEFAULT_PORTS[type],
    },
    database: {
      type: 'string',
      title: 'Database name',
      description: 'Name of the database to connect to',
    },
    user: {
      type: 'string',
      title: 'Username',
      description: 'Database username',
    },
    password: {
      type: 'string',
      title: 'Password',
      description:
        'Database password. Leave blank if not required. Note: MCP elicitation has no hidden input mode, so the value may be displayed in plain text.',
    },
  };

  const properties: Record<string, PrimitiveSchemaDefinition> = {};
  for (const [name, schema] of Object.entries(fields)) {
    if (provided[name as keyof ConnectionParams] === undefined) {
      properties[name] = schema;
    }
  }

  return {
    properties,
    required: getMissingConnectionParams(type, provided).filter((field) => field in properties),
  };
}

export async function elicitConnectionParams(
  server: McpServer,
  type: DatabaseType,
  provided: ConnectionParams
): Promise<ConnectionSetupResult> {
  const missing = getMissingConnectionParams(type, provided);
  const { properties, required } = buildRequestedSchema(type, provided);

  const result = await server.server.elicitInput({
    message: `Missing required parameters for ${type} connection: ${missing.join(', ')}. Please provide the connection details.`,
    requestedSchema: {
      type: 'object',
      properties,
      required,
    },
  });

  if (result.action === 'decline') {
    return { status: 'declined' };
  }
  if (result.action !== 'accept' || !result.content) {
    return { status: 'cancelled' };
  }

  const values: ConnectionParams = {};
  const content = result.content;

  for (const field of ['host', 'database', 'path', 'user', 'password'] as const) {
    const value = content[field];
    if (typeof value === 'string' && value !== '') {
      values[field] = value;
    }
  }
  if (typeof content.port === 'number') {
    values.port = content.port;
  }

  return { status: 'completed', values };
}
