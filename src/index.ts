#!/usr/bin/env node

import { createServerContext, createMcpServer, autoConnect } from './server.js';
import { startStdioTransport, startHttpTransport } from './transport/index.js';
import { loadConfig } from './connections/config.js';
import { logger } from './utils/logger.js';

const DEFAULT_HTTP_PORT = 3000;
const DEFAULT_HTTP_HOST = '127.0.0.1';

interface CliArgs {
  http: boolean;
  config?: string;
  debug?: boolean;
  port: number;
  host: string;
}

function parseArgs(): CliArgs {
  const args: CliArgs = {
    http: process.env.SQL_LENS_MCP_HTTP === 'true',
    port: parseInt(process.env.SQL_LENS_MCP_PORT ?? '', 10) || DEFAULT_HTTP_PORT,
    host: process.env.SQL_LENS_MCP_HOST || DEFAULT_HTTP_HOST,
  };

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];

    if (arg === '--stdio') {
      args.http = false;
    } else if (arg === '--http') {
      args.http = true;
    } else if (arg === '--config' && i + 1 < process.argv.length) {
      args.config = process.argv[++i];
    } else if (arg === '--debug') {
      args.debug = true;
    } else if (arg === '--port' && i + 1 < process.argv.length) {
      args.port = parseInt(process.argv[++i], 10);
    }
  }

  return args;
}

async function main() {
  const args = parseArgs();

  if (args.debug) {
    logger.setLevel('debug');
  }

  logger.info('Starting sql-lens-mcp server');

  try {
    const config = await loadConfig(args.config);

    const context = createServerContext(config || undefined);
    const serverFactory = () => createMcpServer(context);

    const ready = autoConnect(context.manager, config);

    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully');
      await context.manager.disconnectAll();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      await context.manager.disconnectAll();
      process.exit(0);
    });

    await ready;

    if (args.http) {
      await startHttpTransport(serverFactory, { port: args.port, host: args.host });
    } else {
      await startStdioTransport(serverFactory);
    }
  } catch (error) {
    const err = error as Error;
    logger.error('Server failed to start', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

main().catch(err => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  process.exit(1);
});
