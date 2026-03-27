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
export declare function createMockServer(): McpServer;
/**
 * Create a mock tool context for testing
 */
export declare function createMockContext(): MockContext;
/**
 * Wait for async operations to complete
 */
export declare function waitFor(ms: number): Promise<void>;
//# sourceMappingURL=mock-server.d.ts.map