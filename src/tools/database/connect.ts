import { z } from 'zod';
import type { ToolRegistration } from '../types.js';
import { supportsElicitation } from '../../elicitation/capabilities.js';
import { getMissingConnectionParams, elicitConnectionParams } from '../../elicitation/connection-setup.js';

export const registerConnectTool: ToolRegistration = (server, { manager }) => {
  server.registerTool(
    'connect_database',
    {
      description: 'Connect to a database',
      inputSchema: z.object({
        id: z.string().describe('Connection ID'),
        type: z.enum(['postgresql', 'mysql', 'sqlite', 'mssql', 'oracle', 'mariadb', 'duckdb']).describe('Database type'),
        name: z.string().optional().describe('Friendly name'),
        env: z.string().optional().describe('Environment label'),
        host: z.string().optional().describe('Hostname'),
        port: z.number().optional().describe('Port'),
        database: z.string().optional().describe('Database name'),
        path: z.string().optional().describe('File path (SQLite, DuckDB)'),
        user: z.string().optional().describe('Username'),
        password: z.string().optional().describe('Password'),
        readOnly: z.boolean().optional().describe('Read-only mode'),
        ssl: z.boolean().optional().describe('Use SSL'),
      }),
    },
    async (args) => {
      try {
        const { id, name, env, type, ...configFields } = args;
        let config = { type, ...configFields };

        const missing = getMissingConnectionParams(type, config);
        if (missing.length > 0) {
          if (!supportsElicitation(server)) {
            return {
              content: [{
                type: 'text' as const,
                text: `✗ Missing required parameters for ${type} connection: ${missing.join(', ')}`,
              }],
            };
          }

          const setup = await elicitConnectionParams(server, type, config);
          if (setup.status !== 'completed') {
            return {
              content: [{
                type: 'text' as const,
                text: `✗ Connection setup ${setup.status} by user`,
              }],
            };
          }

          config = { ...config, ...setup.values };
          const stillMissing = getMissingConnectionParams(type, config);
          if (stillMissing.length > 0) {
            return {
              content: [{
                type: 'text' as const,
                text: `✗ Missing required parameters for ${type} connection: ${stillMissing.join(', ')}`,
              }],
            };
          }
        }

        await manager.connect(id, config, { name, env });

        const connection = manager.getConnection(id);
        const tableCount = connection?.schema?.tables.length || 0;

        return {
          content: [{
            type: 'text' as const,
            text: `✓ Connected to ${type} database '${id}'\nTables: ${tableCount}\nRead-only: ${configFields.readOnly ?? false}`,
          }],
        };
      } catch (error) {
        const err = error as Error;
        return {
          content: [{
            type: 'text' as const,
            text: `✗ Connection failed: ${err.message}`,
          }],
        };
      }
    }
  );
};
