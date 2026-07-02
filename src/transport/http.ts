import { createServer as createHttpServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';
import type { McpServerFactory, RunningTransport } from './types.js';

const MCP_PATH = '/mcp';
const LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', 'localhost']);

export interface HttpTransportOptions {
  port: number;
  host: string;
}

export interface RunningHttpTransport extends RunningTransport {
  port: number;
  host: string;
}

interface Session {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
}

function sendJsonRpcError(res: ServerResponse, status: number, code: number, message: string): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    jsonrpc: '2.0',
    error: { code, message },
    id: null,
  }));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', chunk => chunks.push(chunk as Buffer));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function containsInitializeRequest(body: unknown): boolean {
  return Array.isArray(body) ? body.some(isInitializeRequest) : isInitializeRequest(body);
}

function buildAllowedHosts(host: string, port: number): string[] {
  const names = host === 'localhost' ? ['localhost', '127.0.0.1'] : [host, 'localhost'];
  const allowed: string[] = [];

  for (const name of names) {
    const authority = name.includes(':') ? `[${name}]` : name;
    allowed.push(authority, `${authority}:${port}`);
  }

  return [...new Set(allowed)];
}

export async function startHttpTransport(
  createServer: McpServerFactory,
  options: HttpTransportOptions
): Promise<RunningHttpTransport> {
  const sessions = new Map<string, Session>();
  const isLoopback = LOOPBACK_HOSTS.has(options.host);

  if (!isLoopback) {
    logger.warn(
      'HTTP transport bound to a non-loopback address; DNS rebinding protection is disabled. ' +
      'Expose this server only behind a reverse proxy that provides authentication and TLS.',
      { host: options.host }
    );
  }

  const createSession = async (boundPort: number): Promise<Session> => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableDnsRebindingProtection: isLoopback,
      ...(isLoopback && { allowedHosts: buildAllowedHosts(options.host, boundPort) }),
      onsessioninitialized: sessionId => {
        sessions.set(sessionId, { transport, server });
        logger.info('HTTP session initialized', { sessionId });
      },
      onsessionclosed: sessionId => {
        sessions.delete(sessionId);
        logger.info('HTTP session closed', { sessionId });
      },
    });

    let closing = false;
    transport.onclose = () => {
      if (transport.sessionId) {
        sessions.delete(transport.sessionId);
      }
      if (!closing) {
        closing = true;
        void server.close();
      }
    };

    await server.connect(transport);

    return { transport, server };
  };

  const handleRequest = async (req: IncomingMessage, res: ServerResponse, boundPort: number) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

    if (url.pathname !== MCP_PATH) {
      sendJsonRpcError(res, 404, -32000, 'Not Found');
      return;
    }

    const sessionId = req.headers['mcp-session-id'];

    if (req.method === 'POST') {
      let body: unknown;
      try {
        body = JSON.parse(await readBody(req));
      } catch {
        sendJsonRpcError(res, 400, -32700, 'Parse error: invalid JSON');
        return;
      }

      if (typeof sessionId === 'string') {
        const session = sessions.get(sessionId);
        if (!session) {
          sendJsonRpcError(res, 404, -32001, 'Session not found');
          return;
        }
        await session.transport.handleRequest(req, res, body);
        return;
      }

      if (!containsInitializeRequest(body)) {
        sendJsonRpcError(res, 400, -32000, 'Bad Request: no valid session ID provided');
        return;
      }

      const session = await createSession(boundPort);
      await session.transport.handleRequest(req, res, body);
      return;
    }

    if (req.method === 'GET' || req.method === 'DELETE') {
      if (typeof sessionId !== 'string') {
        sendJsonRpcError(res, 400, -32000, 'Bad Request: missing session ID');
        return;
      }
      const session = sessions.get(sessionId);
      if (!session) {
        sendJsonRpcError(res, 404, -32001, 'Session not found');
        return;
      }
      await session.transport.handleRequest(req, res);
      return;
    }

    res.writeHead(405, { Allow: 'GET, POST, DELETE' });
    res.end();
  };

  const httpServer: Server = createHttpServer((req, res) => {
    const address = httpServer.address();
    const boundPort = typeof address === 'object' && address ? address.port : options.port;

    handleRequest(req, res, boundPort).catch(error => {
      const err = error as Error;
      logger.error('Error handling HTTP request', { error: err.message });
      if (!res.headersSent) {
        sendJsonRpcError(res, 500, -32603, 'Internal server error');
      }
    });
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(options.port, options.host, () => {
      httpServer.removeListener('error', reject);
      resolve();
    });
  });

  const address = httpServer.address();
  const boundPort = typeof address === 'object' && address ? address.port : options.port;

  logger.info('Server listening in HTTP mode', {
    host: options.host,
    port: boundPort,
    endpoint: MCP_PATH,
  });

  return {
    port: boundPort,
    host: options.host,
    close: async () => {
      for (const session of [...sessions.values()]) {
        await session.server.close();
      }
      sessions.clear();
      await new Promise<void>((resolve, reject) => {
        httpServer.close(err => (err ? reject(err) : resolve()));
        httpServer.closeAllConnections();
      });
    },
  };
}
