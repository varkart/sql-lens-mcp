import type { PromptRegistration } from '../types.js';

export const registerExploreDatabasePrompt: PromptRegistration = (server, { manager }) => {
  server.registerPrompt(
    'explore-database',
    {
      description: 'Explore a database schema',
    },
    async (_extra) => {
      const connections = manager.listConnections();
      const firstConnected = connections.find(c => c.status === 'connected');

      if (!firstConnected) {
        return {
          messages: [{
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: 'No connected databases found. Please connect to a database first.',
            },
          }],
        };
      }

      const schema = await manager.getSchema(firstConnected.id);

      return {
        messages: [{
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Explore the ${schema.databaseType} database '${firstConnected.id}' with ${schema.tables.length} tables. Describe the structure, show row counts, sample data, and suggest useful queries.`,
          },
        }],
      };
    }
  );
};
