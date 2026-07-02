import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function supportsElicitation(server: McpServer): boolean {
  const elicitation = server.server.getClientCapabilities()?.elicitation;
  return Boolean(elicitation?.form);
}
