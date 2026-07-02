import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { classifyStatement } from '../security/query-validator.js';

export type ConfirmationResult = 'confirmed' | 'declined' | 'cancelled';

export function requiresConfirmation(sql: string): boolean {
  const statementType = classifyStatement(sql);

  if (statementType === 'DROP' || statementType === 'ALTER') {
    return true;
  }

  if (statementType === 'DELETE') {
    const withoutStrings = sql.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g, '');
    return !/\bWHERE\b/i.test(withoutStrings);
  }

  return false;
}

export async function confirmDestructiveQuery(server: McpServer, sql: string): Promise<ConfirmationResult> {
  const result = await server.server.elicitInput({
    message: `This statement is potentially destructive:\n\n${sql}\n\nConfirm to execute it.`,
    requestedSchema: {
      type: 'object',
      properties: {
        confirm: {
          type: 'boolean',
          title: 'Execute statement',
          description: 'Set to true to execute the statement',
        },
      },
      required: ['confirm'],
    },
  });

  if (result.action === 'accept') {
    return result.content?.confirm === true ? 'confirmed' : 'declined';
  }
  return result.action === 'decline' ? 'declined' : 'cancelled';
}
