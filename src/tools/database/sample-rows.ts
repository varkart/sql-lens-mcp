import { z } from 'zod';
import type { ToolRegistration } from '../types.js';
import { assertValidIdentifier } from '../../security/identifiers.js';
import { buildExecuteOptions } from '../../security/sandbox.js';
import { clampSampleLimit, MAX_SAMPLE_ROWS } from '../../connections/adapters/base.js';
import { renderTable } from '../../visualization/ascii-table.js';

export const registerSampleRowsTool: ToolRegistration = (server, { manager }) => {
  server.registerTool(
    'sample_rows',
    {
      description: `Fetch representative rows from a table (default 10, max ${MAX_SAMPLE_ROWS})`,
      inputSchema: z.object({
        connectionId: z.string().describe('Connection ID'),
        table: z.string().describe('Table name'),
        schema: z.string().optional().describe('Schema name'),
        limit: z.number().optional().describe(`Number of rows (default 10, max ${MAX_SAMPLE_ROWS})`),
        format: z.enum(['table', 'json']).optional().describe('Output format'),
      }),
    },
    async (args) => {
      try {
        const adapter = manager.getAdapter(args.connectionId);
        if (!adapter) {
          throw new Error(`Connection '${args.connectionId}' not found or not connected`);
        }

        assertValidIdentifier(args.table, 'table name');
        if (args.schema !== undefined) {
          assertValidIdentifier(args.schema, 'schema name');
        }

        const connection = manager.getConnection(args.connectionId);
        const readOnly = connection?.config.readOnly ?? true;

        const limit = clampSampleLimit(args.limit);
        const sql = adapter.buildSampleQuery(args.table, args.schema, limit);

        const options = buildExecuteOptions(
          { queryTimeout: 30000, maxRows: limit, readOnly },
          {}
        );

        const result = await adapter.execute(sql, [], options);

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
            text: `✗ Sampling failed: ${err.message}`,
          }],
        };
      }
    }
  );
};
