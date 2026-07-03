import { z } from 'zod';
import type { ToolRegistration } from '../types.js';
import type { TableRelationship } from '../../utils/types.js';
import { assertValidIdentifier } from '../../security/identifiers.js';

function qualify(schema: string | undefined, table: string): string {
  return schema ? `${schema}.${table}` : table;
}

export function renderRelationships(relationships: TableRelationship[], schema?: string): string {
  const scope = schema ? ` in schema '${schema}'` : '';

  if (relationships.length === 0) {
    return `No foreign key relationships found${scope}`;
  }

  const lines = [`Foreign key relationships${scope} (${relationships.length}):`];

  for (const rel of relationships) {
    const from = `${qualify(rel.fromSchema, rel.fromTable)}(${rel.fromColumns.join(', ')})`;
    const to = `${qualify(rel.toSchema, rel.toTable)}(${rel.toColumns.join(', ')})`;
    lines.push(`${from} -> ${to} [${rel.constraintName}]`);
  }

  return lines.join('\n');
}

export const registerDescribeRelationshipsTool: ToolRegistration = (server, { manager }) => {
  server.registerTool(
    'describe_relationships',
    {
      description: 'Describe foreign-key relationships between tables for join planning',
      inputSchema: z.object({
        connectionId: z.string().describe('Connection ID'),
        schema: z.string().optional().describe('Schema name to filter by'),
        format: z.enum(['text', 'json']).optional().describe('Output format'),
      }),
    },
    async (args) => {
      try {
        const adapter = manager.getAdapter(args.connectionId);
        if (!adapter) {
          throw new Error(`Connection '${args.connectionId}' not found or not connected`);
        }

        if (args.schema !== undefined) {
          assertValidIdentifier(args.schema, 'schema name');
        }

        const relationships = await adapter.getRelationships(args.schema);

        const output = args.format === 'json'
          ? JSON.stringify(relationships, null, 2)
          : renderRelationships(relationships, args.schema);

        return {
          content: [{
            type: 'text' as const,
            text: output,
          }],
        };
      } catch (error) {
        const err = error as Error;
        return {
          content: [{
            type: 'text' as const,
            text: `✗ Relationship description failed: ${err.message}`,
          }],
        };
      }
    }
  );
};
