#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer, autoConnect } from './server.js';
import { loadConfig } from './connections/config.js';
import { logger } from './utils/logger.js';

interface CliArgs {
  stdio?: boolean;
  config?: string;
  debug?: boolean;
  port?: number;
}

function parseArgs(): CliArgs {
  const args: CliArgs = {
    stdio: true,
  };

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];

    if (arg === '--stdio') {
      args.stdio = true;
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

    const { server, manager } = await createServer(config || undefined);

    const ready = autoConnect(manager, config);

    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully');
      await manager.disconnectAll();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      await manager.disconnectAll();
      process.exit(0);
    });

    await ready;

    if (args.stdio || !args.port) {
      const transport = new StdioServerTransport();
      logger.info('Server starting in stdio mode');
      await server.connect(transport);
    } else {
      logger.error('HTTP mode not yet implemented');
      process.exit(1);
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
