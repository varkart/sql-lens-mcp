import type { SchemaInfo, DatabaseType } from '../utils/types.js';

const MAX_SCHEMA_CONTEXT_SIZE = 8192;

export function buildCompactSchema(schema: SchemaInfo): string {
  const lines: string[] = [];

  for (const table of schema.tables) {
    const tableName = table.schema ? `${table.schema}.${table.name}` : table.name;
    const columns = table.columns.map(col => {
      const parts = [col.name, `(${col.type})`];
      if (col.isPrimaryKey) parts.push('[PK]');
      return parts.join('');
    });

    const fks = table.foreignKeys.map(
      fk => `${fk.column}→${fk.referencesTable}.${fk.referencesColumn}`
    );

    const columnStr = columns.join(', ');
    const fkStr = fks.length > 0 ? ` [FK: ${fks.join(', ')}]` : '';

    lines.push(`${tableName}: ${columnStr}${fkStr}`);
  }

  let result = lines.join('\n');

  if (result.length > MAX_SCHEMA_CONTEXT_SIZE) {
    const ratio = MAX_SCHEMA_CONTEXT_SIZE / result.length;
    const keep = Math.floor(lines.length * ratio);
    result = lines.slice(0, keep).join('\n') + '\n... (schema truncated)';
  }

  return result;
}

export function buildTableListPrompt(schema: SchemaInfo, question: string): string {
  const tableList = schema.tables.map(t => {
    const tableName = t.schema ? `${t.schema}.${t.name}` : t.name;
    const columnCount = t.columns.length;
    return `- ${tableName} (${columnCount} columns)`;
  }).join('\n');

  return `Given this database schema with ${schema.tables.length} tables:

${tableList}

Question: ${question}

Which tables are relevant to answer this question? Respond with a JSON array of table names only, like:
["table1", "table2"]`;
}

export function buildNlToSqlPrompt(
  schema: SchemaInfo,
  question: string,
  databaseType: DatabaseType,
  relevantTables?: string[]
): string {
  let schemaContext: string;

  if (relevantTables && relevantTables.length > 0) {
    const filteredSchema = {
      ...schema,
      tables: schema.tables.filter(t => relevantTables.includes(t.name)),
    };
    schemaContext = buildCompactSchema(filteredSchema);
  } else {
    schemaContext = buildCompactSchema(schema);
  }

  const dialect = getDialectName(databaseType);

  return `You are a SQL expert. Generate a SQL query to answer the following question.

Database Type: ${dialect}

Schema:
${schemaContext}

Question: ${question}

Requirements:
- Generate valid ${dialect} SQL syntax
- Use appropriate table and column names from the schema
- Include only the SQL query in your response
- Do not include explanations or markdown formatting
- Ensure the query is safe and efficient

SQL Query:`;
}

function getDialectName(type: DatabaseType): string {
  const map: Record<DatabaseType, string> = {
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    sqlite: 'SQLite',
    mssql: 'Microsoft SQL Server',
    oracle: 'Oracle',
    mariadb: 'MariaDB',
    duckdb: 'DuckDB',
  };
  return map[type] || type;
}
