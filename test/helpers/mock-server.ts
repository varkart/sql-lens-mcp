import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ConnectionManager } from '../../dist/connections/manager.js';
import type { QueryHistoryEntry } from '../../dist/utils/types.js';

export interface MockContext {
  manager: ConnectionManager;
  queryHistory: QueryHistoryEntry[];
}

/**
 * Create a mock MCP server for testing
 */
export function createMockServer(): McpServer {
  return new McpServer({
    name: 'test-server',
    version: '0.0.0',
  }, {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  });
}

/**
 * Create a mock tool context for testing
 */
export function createMockContext(): MockContext {
  const manager = new ConnectionManager();
  const queryHistory: QueryHistoryEntry[] = [];

  return { manager, queryHistory };
}

/**
 * Wait for async operations to complete
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
