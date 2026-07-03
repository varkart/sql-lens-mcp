import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ConnectionManager } from './connections/manager.js';
import { loadConnections } from './connections/persistence.js';
import { logger } from './utils/logger.js';
import type { ServerConfig, QueryHistoryEntry, StoredQueryResult } from './utils/types.js';
import { registerAllTools } from './tools/index.js';
import type { ToolContext } from './tools/types.js';

export type ServerContext = ToolContext;

export function createServerContext(config?: ServerConfig): ServerContext {
  const queryHistory: QueryHistoryEntry[] = [];
  const lastResults = new Map<string, StoredQueryResult>();

  return {
    manager: new ConnectionManager(),
    queryHistory,
    lastResults,
    config,
  };
}

export function createMcpServer(context: ServerContext): McpServer {
  const server = new McpServer({
    name: 'sql-lens-mcp',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  });

  registerAllTools(server, context);

  return server;
}

export async function createServer(config?: ServerConfig) {
  const context = createServerContext(config);
  const server = createMcpServer(context);

  return { server, manager: context.manager };
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
