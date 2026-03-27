import { z } from 'zod';
import type { ToolRegistration } from '../types.js';
import { generateSql } from '../../sampling/nl-to-sql.js';
import { validateQuery } from '../../security/query-validator.js';
import { buildExecuteOptions } from '../../security/sandbox.js';
import { renderTable } from '../../visualization/ascii-table.js';

export const registerNlQueryTool: ToolRegistration = (server, { manager }) => {
  server.registerTool(
    'nl_query',
    {
      description: 'Natural language to SQL query',
      inputSchema: z.object({
        connectionId: z.string().describe('Connection ID'),
        question: z.string().describe('Natural language question'),
        autoExecute: z.boolean().optional().describe('Automatically execute the generated SQL'),
      }),
    },
    async (args) => {
      try {
        const schema = await manager.getSchema(args.connectionId);
        const sql = await generateSql(server as any, schema, args.question);

        if (!args.autoExecute) {
          return {
            content: [{
              type: 'text' as const,
              text: `Generated SQL:\n\`\`\`sql\n${sql}\n\`\`\``,
            }],
          };
        }

        const adapter = manager.getAdapter(args.connectionId);
        if (!adapter) {
          throw new Error(`Connection not found`);
        }

        const connection = manager.getConnection(args.connectionId);
        const readOnly = connection?.config.readOnly ?? true;

        validateQuery(sql, readOnly);

        const result = await adapter.execute(sql, [], buildExecuteOptions(
          { queryTimeout: 30000, maxRows: 1000, readOnly },
          {}
        ));

        return {
          content: [{
            type: 'text' as const,
            text: `Generated SQL:\n\`\`\`sql\n${sql}\n\`\`\`\n\n${renderTable(result)}`,
          }],
        };
      } catch (error) {
        const err = error as Error;
        return {
          content: [{
            type: 'text' as const,
            text: `✗ NL query failed: ${err.message}`,
          }],
        };
      }
    }
  );
};
