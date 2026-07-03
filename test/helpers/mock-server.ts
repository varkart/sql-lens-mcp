import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ConnectionManager } from '../../dist/connections/manager.js';
import type { QueryHistoryEntry, StoredQueryResult } from '../../dist/utils/types.js';

export interface MockContext {
  manager: ConnectionManager;
  queryHistory: QueryHistoryEntry[];
  lastResults: Map<string, StoredQueryResult>;
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
  const lastResults = new Map<string, StoredQueryResult>();

  return { manager, queryHistory, lastResults };
}

/**
 * Wait for async operations to complete
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface ToolResponse {
  content: { type: string; text: string }[];
}

export interface ToolCapture {
  server: McpServer;
  call(name: string, args: Record<string, unknown>): Promise<ToolResponse>;
}

/**
 * Create a fake server that captures registered tool handlers so tests can
 * invoke them directly with arguments.
 */
export function createToolCapture(): ToolCapture {
  const handlers = new Map<string, (args: Record<string, unknown>) => Promise<ToolResponse>>();

  const server = {
    registerTool: (name: string, _config: unknown, handler: (args: Record<string, unknown>) => Promise<ToolResponse>) => {
      handlers.set(name, handler);
    },
  } as unknown as McpServer;

  return {
    server,
    call(name: string, args: Record<string, unknown>): Promise<ToolResponse> {
      const handler = handlers.get(name);
      if (!handler) {
        throw new Error(`Tool not registered: ${name}`);
      }
      return handler(args);
    },
  };
}
