import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from '../utils/logger.js';
import type { McpServerFactory, RunningTransport } from './types.js';

export async function startStdioTransport(createServer: McpServerFactory): Promise<RunningTransport> {
  const server = createServer();
  const transport = new StdioServerTransport();

  logger.info('Server starting in stdio mode');
  await server.connect(transport);

  return {
    close: () => server.close(),
  };
}
