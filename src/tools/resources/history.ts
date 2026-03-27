import type { ResourceRegistration } from '../types.js';

const MAX_HISTORY = 50;

export const registerHistoryResource: ResourceRegistration = (server, { queryHistory }) => {
  server.registerResource(
    'query-history',
    'sql://history',
    {
      description: 'Recent query execution history',
      mimeType: 'application/json',
    },
    async () => ({
      contents: [{
        uri: 'sql://history',
        mimeType: 'application/json',
        text: JSON.stringify(queryHistory.slice(0, MAX_HISTORY), null, 2),
      }],
    })
  );
};
