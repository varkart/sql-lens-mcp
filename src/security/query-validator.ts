import nodeSqlParser from 'node-sql-parser';
import type { StatementType, DatabaseType } from '../utils/types.js';
import { SecurityError } from '../utils/errors.js';

const { Parser } = nodeSqlParser;

const parser = new Parser();

const DANGEROUS_PATTERNS = [
  /INTO\s+OUTFILE/i,
  /LOAD_FILE/i,
  /xp_cmdshell/i,
  /SHUTDOWN/i,
  /LOAD\s+DATA/i,
  /EXEC\s+xp_/i,
  /DBCC/i,
  /OPENROWSET/i,
  /OPENDATASOURCE/i,
];

const WRITE_STATEMENTS: StatementType[] = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'];

const PARSER_DIALECTS: Record<DatabaseType, string> = {
  postgresql: 'PostgresQL',
  mysql: 'MySQL',
  mariadb: 'MariaDB',
  sqlite: 'Sqlite',
  mssql: 'TransactSQL',
  oracle: 'PostgresQL',
  duckdb: 'PostgresQL',
};

const FALLBACK_DIALECTS = ['PostgresQL', 'MySQL'];

const AST_TYPE_MAP: Record<string, StatementType> = {
  select: 'SELECT',
  show: 'SELECT',
  desc: 'SELECT',
  explain: 'SELECT',
  insert: 'INSERT',
  replace: 'INSERT',
  update: 'UPDATE',
  delete: 'DELETE',
  truncate: 'DELETE',
  create: 'CREATE',
  drop: 'DROP',
  alter: 'ALTER',
  rename: 'ALTER',
};

export function classifyStatement(sql: string, dialect?: DatabaseType): StatementType {
  const stripped = stripComments(sql).trim();
  if (!stripped) return 'UNKNOWN';

  if (/^PRAGMA\b/i.test(stripped)) return 'SELECT';
  if (/^(SHOW|DESCRIBE|DESC)\b/i.test(stripped)) return 'SELECT';
  if (/^EXPLAIN\b/i.test(stripped)) return classifyExplain(stripped, dialect);

  const ast = parseSql(stripped, dialect);
  if (!ast) return 'UNKNOWN';

  const node = (Array.isArray(ast) ? ast[0] : ast) as ParsedStatement | undefined;
  return classifyAst(node);
}

interface ParsedStatement {
  type?: string;
  into?: { position?: string | null };
}

function classifyAst(node: ParsedStatement | undefined): StatementType {
  if (!node || !node.type) return 'UNKNOWN';

  if (node.type === 'select' && node.into?.position) {
    return 'UNKNOWN';
  }

  return AST_TYPE_MAP[node.type] ?? 'UNKNOWN';
}

function classifyExplain(stripped: string, dialect?: DatabaseType): StatementType {
  let rest = stripped.replace(/^EXPLAIN\s*/i, '');
  let analyze = false;

  if (rest.startsWith('(')) {
    const close = rest.indexOf(')');
    if (close === -1) return 'UNKNOWN';
    analyze = /\bANALYZE\b/i.test(rest.slice(0, close));
    rest = rest.slice(close + 1).trim();
  } else {
    const modifiers = /^(ANALYZE|VERBOSE|EXTENDED|PARTITIONS|QUERY\s+PLAN|FORMAT\s*=?\s*\w+)\s+/i;
    let match = rest.match(modifiers);
    while (match) {
      if (/^ANALYZE/i.test(match[1])) analyze = true;
      rest = rest.slice(match[0].length);
      match = rest.match(modifiers);
    }
  }

  if (!analyze) return 'SELECT';

  const inner = classifyStatement(rest, dialect);
  return inner === 'SELECT' ? 'SELECT' : inner;
}

function parseSql(sql: string, dialect?: DatabaseType): unknown | null {
  const primary = dialect ? PARSER_DIALECTS[dialect] : FALLBACK_DIALECTS[0];
  const candidates = [primary, ...FALLBACK_DIALECTS.filter(d => d !== primary)];

  for (const database of candidates) {
    try {
      return parser.astify(sql, { database });
    } catch {
      continue;
    }
  }

  return null;
}

export function isDestructive(statementType: StatementType): boolean {
  return ['DELETE', 'DROP', 'ALTER'].includes(statementType);
}

export function validateQuery(sql: string, readOnly: boolean, dialect?: DatabaseType): void {
  if (hasMultipleStatements(sql)) {
    throw new SecurityError('Multiple statements are not allowed');
  }

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sql)) {
      throw new SecurityError(`Dangerous pattern detected: ${pattern.source}`);
    }
  }

  if (readOnly) {
    enforceReadOnly(classifyStatement(sql, dialect));
  }
}

export function assertReadOnly(sql: string, dialect?: DatabaseType): void {
  enforceReadOnly(classifyStatement(sql, dialect));
}

function enforceReadOnly(statementType: StatementType): void {
  if (WRITE_STATEMENTS.includes(statementType)) {
    throw new SecurityError(`Write operations are not allowed on read-only connections: ${statementType}`);
  }

  if (statementType !== 'SELECT') {
    throw new SecurityError('Query could not be verified as read-only and was denied on a read-only connection');
  }
}

function stripComments(sql: string): string {
  let result = '';
  let i = 0;

  while (i < sql.length) {
    const char = sql[i];
    const next = sql[i + 1];

    if (char === '-' && next === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      continue;
    }

    if (char === '/' && next === '*') {
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      const end = scanString(sql, i);
      result += sql.slice(i, end);
      i = end;
      continue;
    }

    result += char;
    i++;
  }

  return result;
}

function scanString(sql: string, start: number): number {
  const quote = sql[start];
  let i = start + 1;

  while (i < sql.length) {
    if (sql[i] === '\\' && quote !== '`') {
      i += 2;
      continue;
    }
    if (sql[i] === quote) {
      if (sql[i + 1] === quote) {
        i += 2;
        continue;
      }
      return i + 1;
    }
    i++;
  }

  return i;
}

function hasMultipleStatements(sql: string): boolean {
  const stripped = stripComments(sql);
  let sawSemicolon = false;
  let i = 0;

  while (i < stripped.length) {
    const char = stripped[i];

    if (char === "'" || char === '"' || char === '`' || char === '[') {
      i = char === '[' ? scanBracket(stripped, i) : scanString(stripped, i);
      if (sawSemicolon) return true;
      continue;
    }

    if (char === ';') {
      sawSemicolon = true;
    } else if (sawSemicolon && /\S/.test(char)) {
      return true;
    }

    i++;
  }

  return false;
}

function scanBracket(sql: string, start: number): number {
  let i = start + 1;
  while (i < sql.length && sql[i] !== ']') i++;
  return i + 1;
}

export function extractSqlFromMarkdown(text: string): string {
  const codeBlockMatch = text.match(/```(?:sql)?\s*\n([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  const inlineMatch = text.match(/`([^`]+)`/);
  if (inlineMatch) {
    return inlineMatch[1].trim();
  }

  return text.trim();
}
