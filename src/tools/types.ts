import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ConnectionManager } from '../connections/manager.js';
import type { QueryHistoryEntry } from '../utils/types.js';

/**
 * Context passed to all tools, resources, and prompts
 */
export interface ToolContext {
  manager: ConnectionManager;
  queryHistory: QueryHistoryEntry[];
}

/**
 * Tool registration function type
 */
export type ToolRegistration = (server: McpServer, context: ToolContext) => void;

/**
 * Resource registration function type
 */
export type ResourceRegistration = (server: McpServer, context: ToolContext) => void;

/**
 * Prompt registration function type
 */
export type PromptRegistration = (server: McpServer, context: ToolContext) => void;
