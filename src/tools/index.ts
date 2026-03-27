import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolContext } from './types.js';

// Database tools
import {
  registerConnectTool,
  registerDisconnectTool,
  registerListConnectionsTool,
  registerExecuteQueryTool,
  registerNlQueryTool,
  registerDescribeSchemaTool,
} from './database/index.js';

// Resources
import {
  registerConnectionsResource,
  registerHistoryResource,
} from './resources/index.js';

// Prompts
import {
  registerExploreDatabasePrompt,
} from './prompts/index.js';

/**
 * Register all tools, resources, and prompts with the MCP server
 */
export function registerAllTools(server: McpServer, context: ToolContext): void {
  // Register database tools
  registerConnectTool(server, context);
  registerDisconnectTool(server, context);
  registerListConnectionsTool(server, context);
  registerExecuteQueryTool(server, context);
  registerNlQueryTool(server, context);
  registerDescribeSchemaTool(server, context);

  // Register resources
  registerConnectionsResource(server, context);
  registerHistoryResource(server, context);

  // Register prompts
  registerExploreDatabasePrompt(server, context);
}

// Re-export types
export type { ToolContext, ToolRegistration, ResourceRegistration, PromptRegistration } from './types.js';
