import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ConnectionManager } from '../../dist/connections/manager.js';
/**
 * Create a mock MCP server for testing
 */
export function createMockServer() {
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
export function createMockContext() {
    const manager = new ConnectionManager();
    const queryHistory = [];
    return { manager, queryHistory };
}
/**
 * Wait for async operations to complete
 */
export function waitFor(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//# sourceMappingURL=mock-server.js.map