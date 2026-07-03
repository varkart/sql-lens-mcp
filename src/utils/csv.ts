import type { ColumnInfo } from './types.js';

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function escapeField(field: string): string {
  if (/[",\n\r]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function toCsv(columns: ColumnInfo[], rows: Record<string, unknown>[]): string {
  const header = columns.map(col => escapeField(col.name)).join(',');
  const lines = rows.map(row =>
    columns.map(col => escapeField(formatValue(row[col.name]))).join(',')
  );
  return [header, ...lines].join('\n') + '\n';
}
