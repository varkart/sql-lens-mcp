import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { classifyStatement } from '../security/query-validator.js';
import type { DatabaseType } from '../utils/types.js';

export type ConfirmationResult = 'confirmed' | 'declined' | 'cancelled';

export function requiresConfirmation(sql: string, dialect?: DatabaseType): boolean {
  const statementType = classifyStatement(sql, dialect);

  // Unparseable statements fail closed: confirm before executing anything
  // the classifier cannot vouch for.
  if (statementType === 'DROP' || statementType === 'ALTER' || statementType === 'UNKNOWN') {
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
