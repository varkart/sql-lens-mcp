import { z } from 'zod';
import type { ToolRegistration } from '../types.js';
import { validateQuery, classifyStatement } from '../../security/query-validator.js';
import { buildExecuteOptions } from '../../security/sandbox.js';
import { renderTable } from '../../visualization/ascii-table.js';

const MAX_HISTORY = 50;

export const registerExecuteQueryTool: ToolRegistration = (server, { manager, queryHistory }) => {
  server.registerTool(
    'execute_query',
    {
      description: 'Execute a SQL query',
      inputSchema: z.object({
        connectionId: z.string().describe('Connection ID'),
        sql: z.string().describe('SQL query'),
        params: z.array(z.any()).optional().describe('Query parameters'),
        maxRows: z.number().optional().describe('Max rows to return'),
        timeout: z.number().optional().describe('Query timeout in ms'),
        format: z.enum(['table', 'json', 'raw']).optional().describe('Output format'),
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

        validateQuery(args.sql, readOnly);

        const options = buildExecuteOptions(
          { queryTimeout: 30000, maxRows: 1000, readOnly },
          { timeout: args.timeout, maxRows: args.maxRows }
        );

        const result = await adapter.execute(args.sql, args.params, options);

        const statementType = classifyStatement(args.sql);
        queryHistory.unshift({
          connectionId: args.connectionId,
          sql: args.sql,
          statementType,
          rowCount: result.rowCount,
          executionTimeMs: result.executionTimeMs,
          timestamp: new Date(),
        });
        if (queryHistory.length > MAX_HISTORY) {
          queryHistory.pop();
        }

        const format = args.format || 'table';
        let output: string;

        if (format === 'json') {
          output = JSON.stringify(result, null, 2);
        } else if (format === 'raw') {
          output = JSON.stringify(result.rows);
        } else {
          output = renderTable(result);
        }

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
            text: `✗ Query failed: ${err.message}`,
          }],
        };
      }
    }
  );
};
