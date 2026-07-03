import { z } from 'zod';
import type { ToolRegistration } from '../types.js';
import { validateQuery } from '../../security/query-validator.js';
import { buildExecuteOptions } from '../../security/sandbox.js';
import { renderTable } from '../../visualization/ascii-table.js';

export const registerExplainQueryTool: ToolRegistration = (server, { manager }) => {
  server.registerTool(
    'explain_query',
    {
      description: 'Show the query plan for a SQL statement without executing it',
      inputSchema: z.object({
        connectionId: z.string().describe('Connection ID'),
        sql: z.string().describe('SQL statement to plan (without EXPLAIN prefix)'),
        format: z.enum(['table', 'json']).optional().describe('Output format'),
      }),
    },
    async (args) => {
      try {
        const adapter = manager.getAdapter(args.connectionId);
        if (!adapter) {
          throw new Error(`Connection '${args.connectionId}' not found or not connected`);
        }

        const connection = manager.getConnection(args.connectionId);
        const readOnly = connection?.config.readOnly ?? true;
        const dialect = connection?.config.type;

        // Only produce plans for statements that would be allowed to run.
        validateQuery(args.sql, readOnly, dialect);

        const options = buildExecuteOptions(
          { queryTimeout: 30000, maxRows: 1000, readOnly },
          {}
        );

        const result = await adapter.explain(args.sql, options);

        const output = args.format === 'json'
          ? JSON.stringify(result, null, 2)
          : renderTable(result);

        return {
          content: [{
            type: 'text' as const,
            text: output,
          }],
        };
      } catch (error) {
        const err = error as Error;
        return {
          content: [{
            type: 'text' as const,
            text: `✗ Explain failed: ${err.message}`,
          }],
        };
      }
    }
  );
};
