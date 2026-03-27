import type { ResourceRegistration } from '../types.js';

export const registerConnectionsResource: ResourceRegistration = (server, { manager }) => {
  server.registerResource(
    'connections-list',
    'sql://connections',
    {
      description: 'List of all database connections',
      mimeType: 'application/json',
    },
    async () => ({
      contents: [{
        uri: 'sql://connections',
        mimeType: 'application/json',
        text: JSON.stringify(manager.listConnections(), null, 2),
      }],
    })
  );
};
