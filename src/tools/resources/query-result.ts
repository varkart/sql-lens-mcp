import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ResourceRegistration } from '../types.js';
import type { StoredQueryResult } from '../../utils/types.js';
import { toCsv } from '../../utils/csv.js';

function getStoredResult(
  lastResults: Map<string, StoredQueryResult>,
  connectionId: string
): StoredQueryResult {
  const stored = lastResults.get(connectionId);
  if (!stored) {
    throw new Error(`No query result available for connection '${connectionId}'. Run execute_query first.`);
  }
  return stored;
}

export const registerQueryResultResources: ResourceRegistration = (server, { lastResults }) => {
  server.registerResource(
    'query-result-csv',
    new ResourceTemplate('query-result://{connectionId}/csv', {
      list: () => ({
        resources: [...lastResults.keys()].map(connectionId => ({
          uri: `query-result://${connectionId}/csv`,
          name: `Last query result for '${connectionId}' (CSV)`,
          mimeType: 'text/csv',
        })),
      }),
    }),
    {
      description: 'Most recent query result for a connection, rendered as CSV',
      mimeType: 'text/csv',
    },
    async (uri, variables) => {
      const stored = getStoredResult(lastResults, String(variables.connectionId));
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'text/csv',
          text: toCsv(stored.columns, stored.rows),
        }],
      };
    }
  );

  server.registerResource(
    'query-result-json',
    new ResourceTemplate('query-result://{connectionId}/json', {
      list: () => ({
        resources: [...lastResults.keys()].map(connectionId => ({
          uri: `query-result://${connectionId}/json`,
          name: `Last query result for '${connectionId}' (JSON)`,
          mimeType: 'application/json',
        })),
      }),
    }),
    {
      description: 'Most recent query result for a connection, rendered as a JSON array of row objects',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      const stored = getStoredResult(lastResults, String(variables.connectionId));
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(stored.rows, null, 2),
        }],
      };
    }
  );
};
