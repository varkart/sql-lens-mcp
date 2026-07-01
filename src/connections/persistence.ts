import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { ConnectionEntry } from '../utils/types.js';
import { logger } from '../utils/logger.js';

const SQL_LENS_MCP_DIR = join(homedir(), '.sql-lens-mcp');
const CONNECTIONS_FILE = join(SQL_LENS_MCP_DIR, 'connections.json');

export async function ensureDirectory(): Promise<void> {
  try {
    await fs.mkdir(SQL_LENS_MCP_DIR, { mode: 0o700, recursive: true });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'EEXIST') {
      throw error;
    }
  }
}

export async function loadConnections(): Promise<Record<string, ConnectionEntry>> {
  try {
    await ensureDirectory();
    const data = await fs.readFile(CONNECTIONS_FILE, 'utf-8');
    const parsed = JSON.parse(data);

    const migrated = migrateFormat(parsed);

    return migrated;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return {};
    }
    logger.error('Failed to load connections', { error: err.message });
    return {};
  }
}

function migrateFormat(data: any): Record<string, ConnectionEntry> {
  const result: Record<string, ConnectionEntry> = {};

  for (const [id, value] of Object.entries(data)) {
    if (value && typeof value === 'object') {
      if ('config' in value) {
        result[id] = value as ConnectionEntry;
      } else {
        result[id] = {
          config: value as any,
        };
      }
    }
  }

  return result;
}

export async function saveConnections(connections: Record<string, ConnectionEntry>): Promise<void> {
  try {
    await ensureDirectory();

    const tmpFile = `${CONNECTIONS_FILE}.tmp`;
    const data = JSON.stringify(connections, null, 2);

    await fs.writeFile(tmpFile, data, { mode: 0o600 });
    await fs.rename(tmpFile, CONNECTIONS_FILE);

    logger.debug('Connections saved', { count: Object.keys(connections).length });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to save connections', { error: err.message });
    throw error;
  }
}

export async function addConnection(id: string, entry: ConnectionEntry): Promise<void> {
  const connections = await loadConnections();
  connections[id] = entry;
  await saveConnections(connections);
}

export async function removeConnection(id: string): Promise<void> {
  const connections = await loadConnections();
  delete connections[id];
  await saveConnections(connections);
}

export async function updateConnection(id: string, entry: Partial<ConnectionEntry>): Promise<void> {
  const connections = await loadConnections();
  if (connections[id]) {
    connections[id] = {
      ...connections[id],
      ...entry,
      config: {
        ...connections[id].config,
        ...(entry.config || {}),
      },
    };
    await saveConnections(connections);
  }
}
