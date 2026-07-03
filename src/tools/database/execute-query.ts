import { z } from 'zod';
import type { ToolRegistration } from '../types.js';
import { validateQuery, classifyStatement } from '../../security/query-validator.js';
import { buildExecuteOptions } from '../../security/sandbox.js';
import { renderTable } from '../../visualization/ascii-table.js';
import { supportsElicitation } from '../../elicitation/capabilities.js';
import { requiresConfirmation, confirmDestructiveQuery } from '../../elicitation/query-confirmation.js';

const MAX_HISTORY = 50;

export const registerExecuteQueryTool: ToolRegistration = (server, { manager, queryHistory, lastResults }) => {
  server.registerTool(
    'execute_query',
    {
      description: 'Execute a SQL query. Results are paginated: at most maxRows rows are returned per call. When the response reports hasMore, call again with offset=nextOffset to fetch the next page. Each page re-executes the query (offset pagination), so paging an expensive query repeats its cost. The most recent result per connection is also exposed as query-result://{connectionId}/csv and query-result://{connectionId}/json resources.',
      inputSchema: z.object({
        connectionId: z.string().describe('Connection ID'),
        sql: z.string().describe('SQL query'),
        maxRows: z.number().optional().describe('Max rows to return per page'),
        offset: z.number().optional().describe('Rows to skip before returning results (default 0); use nextOffset from a truncated response to fetch the next page'),
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
        const dialect = connection?.config.type;

        validateQuery(args.sql, readOnly, dialect);

        if (!readOnly && requiresConfirmation(args.sql, dialect) && supportsElicitation(server)) {
          const decision = await confirmDestructiveQuery(server, args.sql);
          if (decision !== 'confirmed') {
            return {
              content: [{
                type: 'text' as const,
                text: `✗ Query not executed: destructive statement ${decision} by user`,
              }],
            };
          }
        }

        const options = buildExecuteOptions(
          { queryTimeout: 30000, maxRows: 1000, readOnly },
          { timeout: args.timeout, maxRows: args.maxRows, offset: args.offset }
        );

        const result = await adapter.execute(args.sql, [], options);

        const statementType = classifyStatement(args.sql, dialect);
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

        const offset = options.offset ?? 0;
        const returnedRows = result.rows.length;
        const hasMore = result.truncated;
        const nextOffset = hasMore ? offset + returnedRows : undefined;

        if (result.columns.length > 0) {
          lastResults.set(args.connectionId, {
            connectionId: args.connectionId,
            sql: args.sql,
            columns: result.columns,
            rows: result.rows,
            rowCount: returnedRows,
            offset,
            hasMore,
            executedAt: new Date(),
          });
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

        let summary: string;
        if (result.columns.length === 0) {
          summary = `${result.rowCount} row(s) affected`;
        } else {
          summary = [
            hasMore
              ? `Returned ${returnedRows} rows starting at offset ${offset}. More rows available: call execute_query again with offset=${nextOffset} to fetch the next page (each page re-executes the query).`
              : `Returned ${returnedRows} rows starting at offset ${offset}. No more rows.`,
            `Export this result: query-result://${args.connectionId}/csv or query-result://${args.connectionId}/json`,
            `metadata: ${JSON.stringify({ returnedRows, offset, hasMore, ...(nextOffset !== undefined ? { nextOffset } : {}) })}`,
          ].join('\n');
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: output,
            },
            {
              type: 'text' as const,
              text: summary,
            },
          ],
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
