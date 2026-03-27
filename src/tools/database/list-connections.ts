import type { ToolRegistration } from '../types.js';

function formatUptime(connectedAt: Date): string {
  const ms = Date.now() - connectedAt.getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export const registerListConnectionsTool: ToolRegistration = (server, { manager }) => {
  server.registerTool(
    'list_connections',
    {
      description: 'List all database connections',
      inputSchema: undefined,
    },
    async () => {
      const connections = manager.listConnections();

      if (connections.length === 0) {
        return {
          content: [{
            type: 'text' as const,
            text: 'No connections',
          }],
        };
      }

      const lines = connections.map(conn => {
        const icon = conn.status === 'connected' ? '🟢' : conn.status === 'failed' ? '🔴' : '⚪';
        const name = conn.name ? ` (${conn.name})` : '';
        const env = conn.env ? ` [${conn.env}]` : '';
        const tables = conn.schema ? ` | ${conn.schema.tables.length} tables` : '';
        const error = conn.error ? ` | Error: ${conn.error}` : '';
        const uptime = conn.connectedAt ? ` | ${formatUptime(conn.connectedAt)}` : '';

        return `${icon} ${conn.id}${name}${env} | ${conn.config.type}${tables}${uptime}${error}`;
      });

      return {
        content: [{
          type: 'text' as const,
          text: lines.join('\n'),
        }],
      };
    }
  );
};
