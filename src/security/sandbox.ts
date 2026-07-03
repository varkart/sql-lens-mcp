import type { ExecuteOptions } from '../utils/types.js';

export const MAX_QUERY_TIMEOUT = 300000;
export const MAX_ROW_LIMIT = 100000;

export function clampOptions(options: ExecuteOptions): ExecuteOptions {
  const clamped: ExecuteOptions = { ...options };

  if (clamped.timeout !== undefined) {
    clamped.timeout = Math.min(clamped.timeout, MAX_QUERY_TIMEOUT);
  }

  if (clamped.maxRows !== undefined) {
    clamped.maxRows = Math.min(clamped.maxRows, MAX_ROW_LIMIT);
  }

  if (clamped.offset !== undefined) {
    clamped.offset = Math.max(0, Math.floor(clamped.offset));
  }

  return clamped;
}

export function buildExecuteOptions(
  defaults: { queryTimeout: number; maxRows: number; readOnly: boolean },
  overrides: ExecuteOptions = {}
): ExecuteOptions {
  const options: ExecuteOptions = {
    timeout: overrides.timeout ?? defaults.queryTimeout,
    maxRows: overrides.maxRows ?? defaults.maxRows,
    offset: overrides.offset ?? 0,
    readOnly: overrides.readOnly ?? defaults.readOnly,
  };

  return clampOptions(options);
}
