import { z } from 'zod';
import type { ToolRegistration } from '../types.js';

export const registerDisconnectTool: ToolRegistration = (server, { manager }) => {
  server.registerTool(
    'disconnect_database',
    {
      description: 'Disconnect from a database',
      inputSchema: z.object({
        id: z.string().describe('Connection ID'),
      }),
    },
    async (args) => {
      try {
        await manager.disconnect(args.id, { removePersisted: true });
        return {
          content: [{
            type: 'text' as const,
            text: `✓ Disconnected from '${args.id}'`,
          }],
        };
      } catch (error) {
        const err = error as Error;
        return {
          content: [{
            type: 'text' as const,
            text: `✗ Disconnect failed: ${err.message}`,
          }],
        };
      }
    }
  );
};
