import { z } from 'zod';
import type { ToolRegistration } from '../types.js';

export const registerDescribeSchemaTool: ToolRegistration = (server, { manager }) => {
  server.registerTool(
    'describe_schema',
    {
      description: 'Describe database schema',
      inputSchema: z.object({
        connectionId: z.string().describe('Connection ID'),
        table: z.string().optional().describe('Specific table name'),
        format: z.enum(['summary', 'detailed', 'json']).optional().describe('Output format'),
      }),
    },
    async (args) => {
      try {
        const schema = await manager.getSchema(args.connectionId);
        const format = args.format || 'summary';

        if (format === 'json') {
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(schema, null, 2),
            }],
          };
        }

        const tables = args.table
          ? schema.tables.filter(t => t.name === args.table)
          : schema.tables;

        if (tables.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: args.table ? `Table '${args.table}' not found` : 'No tables found',
            }],
          };
        }

        const lines: string[] = [];

        for (const table of tables) {
          const tableName = table.schema ? `${table.schema}.${table.name}` : table.name;
          lines.push(`\n📊 ${tableName}`);
          lines.push(`   Columns: ${table.columns.length}${table.rowCount !== undefined ? ` | Rows: ${table.rowCount}` : ''}`);

          if (format === 'detailed') {
            for (const col of table.columns) {
              const pk = col.isPrimaryKey ? ' [PK]' : '';
              const nullable = col.nullable ? ' NULL' : ' NOT NULL';
              lines.push(`   - ${col.name}: ${col.type}${nullable}${pk}`);
            }

            if (table.foreignKeys.length > 0) {
              lines.push(`   Foreign Keys:`);
              for (const fk of table.foreignKeys) {
                lines.push(`   - ${fk.column} → ${fk.referencesTable}.${fk.referencesColumn}`);
              }
            }
          }
        }

        return {
          content: [{
            type: 'text' as const,
            text: lines.join('\n'),
          }],
        };
      } catch (error) {
        const err = error as Error;
        return {
          content: [{
            type: 'text' as const,
            text: `✗ Schema description failed: ${err.message}`,
          }],
        };
      }
    }
  );
};
