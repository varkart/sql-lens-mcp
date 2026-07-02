import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export type McpServerFactory = () => McpServer;

export interface RunningTransport {
  close(): Promise<void>;
}
