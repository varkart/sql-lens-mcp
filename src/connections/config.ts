import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { ServerConfig } from '../utils/types.js';
import { ConfigError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export async function loadConfig(configPath?: string): Promise<ServerConfig | null> {
  const searchPaths = configPath
    ? [configPath]
    : [
        join(process.cwd(), 'sql-lens-mcp.config.json'),
        join(homedir(), '.sql-lens-mcp', 'config.json'),
        join(homedir(), '.sql-lens-mcp.config.json'),
      ];

  for (const path of searchPaths) {
    try {
      const data = await fs.readFile(path, 'utf-8');
      const config = JSON.parse(data);

      const processed = processConfig(config);

      logger.info('Config loaded', { path });
      return processed;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        logger.error('Failed to load config', { path, error: err.message });
        throw new ConfigError(`Failed to load config from ${path}: ${err.message}`);
      }
    }
  }

  logger.debug('No config file found, using defaults');
  return null;
}

function processConfig(config: any): ServerConfig {
  const defaults = config.defaults || {
    readOnly: true,
    queryTimeout: 30000,
    maxRows: 1000,
  };

  const connections: Record<string, any> = {};

  for (const [id, conn] of Object.entries(config.connections || {})) {
    if (conn && typeof conn === 'object') {
      connections[id] = processConnection(conn as any);
    }
  }

  // MCP Apps configuration with environment variable support
  const appsEnabled = process.env.SQL_LENS_MCP_APPS_ENABLED
    ? process.env.SQL_LENS_MCP_APPS_ENABLED !== 'false'
    : config.apps?.enabled !== false; // Default: true

  const connectionManagerEnabled = process.env.SQL_LENS_MCP_APP_CONNECTION_MANAGER_ENABLED
    ? process.env.SQL_LENS_MCP_APP_CONNECTION_MANAGER_ENABLED !== 'false'
    : config.apps?.connectionManager?.enabled !== false; // Default: true

  return {
    connections,
    defaults,
    apps: {
      enabled: appsEnabled,
      connectionManager: {
        enabled: connectionManagerEnabled,
      },
    },
  };
}

function processConnection(conn: any): any {
  const processed = { ...conn };

  if (processed.config) {
    processed.config = interpolateEnvVars(processed.config);
  } else {
    const { name, env, ...configFields } = processed;
    processed.config = interpolateEnvVars(configFields);
    if (name) processed.name = name;
    if (env) processed.env = env;
  }

  return processed;
}

function interpolateEnvVars(obj: any): any {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      return process.env[varName] || match;
    });
  }

  if (Array.isArray(obj)) {
    return obj.map(interpolateEnvVars);
  }

  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = interpolateEnvVars(value);
    }
    return result;
  }

  return obj;
}
