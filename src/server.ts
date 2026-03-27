import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ConnectionManager } from './connections/manager.js';
import { loadConnections } from './connections/persistence.js';
import { logger } from './utils/logger.js';
import type { ServerConfig, QueryHistoryEntry } from './utils/types.js';
import { registerAllTools } from './tools/index.js';

const queryHistory: QueryHistoryEntry[] = [];

export async function createServer() {
  const manager = new ConnectionManager();
  const server = new McpServer({
    name: 'sql-mcp',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  });

  // Register all tools, resources, and prompts
  registerAllTools(server, { manager, queryHistory });

  return { server, manager };
}

export async function autoConnect(manager: ConnectionManager, config: ServerConfig | null) {
  const persisted = await loadConnections();
  const allConnections = { ...persisted };

  if (config) {
    for (const [id, entry] of Object.entries(config.connections)) {
      allConnections[id] = entry;
    }
  }

  for (const [id, entry] of Object.entries(allConnections)) {
    await manager.tryConnect(id, entry.config, {
      name: entry.name,
      env: entry.env,
    });
  }

  logger.info('Auto-connect completed', { count: Object.keys(allConnections).length });
}
