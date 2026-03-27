import { z } from 'zod';
import type { ToolRegistration } from '../types.js';

export const registerConnectTool: ToolRegistration = (server, { manager }) => {
  server.registerTool(
    'connect_database',
    {
      description: 'Connect to a database',
      inputSchema: z.object({
        id: z.string().describe('Connection ID'),
        type: z.enum(['postgresql', 'mysql', 'sqlite', 'mssql', 'oracle', 'mariadb']).describe('Database type'),
        name: z.string().optional().describe('Friendly name'),
        env: z.string().optional().describe('Environment label'),
        host: z.string().optional().describe('Hostname'),
        port: z.number().optional().describe('Port'),
        database: z.string().optional().describe('Database name'),
        path: z.string().optional().describe('File path (SQLite)'),
        user: z.string().optional().describe('Username'),
        password: z.string().optional().describe('Password'),
        readOnly: z.boolean().optional().describe('Read-only mode'),
        ssl: z.boolean().optional().describe('Use SSL'),
      }),
    },
    async (args) => {
      try {
        const { id, name, env, type, ...configFields } = args;

        await manager.connect(id, { type, ...configFields }, { name, env });

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
