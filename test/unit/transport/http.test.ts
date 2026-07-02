import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { request as httpRequest } from 'node:http';
import { createServerContext, createMcpServer } from '../../../dist/server.js';
import { startHttpTransport } from '../../../dist/transport/index.js';
import type { RunningHttpTransport } from '../../../dist/transport/index.js';

const PROTOCOL_VERSION = '2025-03-26';

interface JsonRpcMessage {
  jsonrpc: string;
  id?: number | string | null;
  method?: string;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
}

function initializeRequestBody(id = 1) {
  return {
    jsonrpc: '2.0',
    id,
    method: 'initialize',
    params: {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' },
    },
  };
}

async function parseMessages(response: Response): Promise<JsonRpcMessage[]> {
  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();

  if (contentType.includes('text/event-stream')) {
    return text
      .split('\n')
      .filter(line => line.startsWith('data: '))
      .map(line => JSON.parse(line.slice(6)) as JsonRpcMessage);
  }

  return [JSON.parse(text) as JsonRpcMessage];
}

function mcpPost(url: string, body: unknown, headers: Record<string, string> = {}): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function initializeSession(url: string): Promise<string> {
  const response = await mcpPost(url, initializeRequestBody());
  const sessionId = response.headers.get('mcp-session-id');
  await response.text();

  if (!sessionId) {
    throw new Error('No session ID returned from initialize');
  }

  await mcpPost(url, { jsonrpc: '2.0', method: 'notifications/initialized' }, {
    'mcp-session-id': sessionId,
    'mcp-protocol-version': PROTOCOL_VERSION,
  });

  return sessionId;
}

describe('HTTP Transport', () => {
  let running: RunningHttpTransport;
  let url: string;

  before(async () => {
    const context = createServerContext();
    running = await startHttpTransport(() => createMcpServer(context), {
      port: 0,
      host: '127.0.0.1',
    });
    url = `http://127.0.0.1:${running.port}/mcp`;
  });

  after(async () => {
    await running.close();
  });

  it('should create a session on initialize and return the session ID header', async () => {
    const response = await mcpPost(url, initializeRequestBody());

    expect(response.status).to.equal(200);
    expect(response.headers.get('mcp-session-id')).to.be.a('string').and.not.be.empty;

    const messages = await parseMessages(response);
    const result = messages.find(m => m.id === 1)?.result as
      | { serverInfo?: { name?: string } }
      | undefined;
    expect(result?.serverInfo?.name).to.equal('sql-lens-mcp');
  });

  it('should route requests with a session ID to the right session', async () => {
    const sessionId = await initializeSession(url);

    const response = await mcpPost(url, { jsonrpc: '2.0', id: 2, method: 'tools/list' }, {
      'mcp-session-id': sessionId,
      'mcp-protocol-version': PROTOCOL_VERSION,
    });

    expect(response.status).to.equal(200);

    const messages = await parseMessages(response);
    const result = messages.find(m => m.id === 2)?.result as
      | { tools?: { name: string }[] }
      | undefined;
    expect(result?.tools).to.be.an('array').and.not.be.empty;
  });

  it('should keep sessions independent', async () => {
    const first = await initializeSession(url);
    const second = await initializeSession(url);

    expect(first).to.not.equal(second);

    const response = await mcpPost(url, { jsonrpc: '2.0', id: 3, method: 'tools/list' }, {
      'mcp-session-id': second,
      'mcp-protocol-version': PROTOCOL_VERSION,
    });

    expect(response.status).to.equal(200);
  });

  it('should reject non-initialize requests without a session ID', async () => {
    const response = await mcpPost(url, { jsonrpc: '2.0', id: 4, method: 'tools/list' });

    expect(response.status).to.equal(400);

    const body = (await response.json()) as JsonRpcMessage;
    expect(body.error?.message).to.include('session ID');
  });

  it('should reject requests with an unknown session ID', async () => {
    const response = await mcpPost(url, { jsonrpc: '2.0', id: 5, method: 'tools/list' }, {
      'mcp-session-id': 'unknown-session-id',
      'mcp-protocol-version': PROTOCOL_VERSION,
    });

    expect(response.status).to.equal(404);

    const body = (await response.json()) as JsonRpcMessage;
    expect(body.error?.message).to.include('Session not found');
  });

  it('should reject GET requests without a session ID', async () => {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'text/event-stream' },
    });

    expect(response.status).to.equal(400);
  });

  it('should reject invalid JSON bodies', async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: '{not json',
    });

    expect(response.status).to.equal(400);

    const body = (await response.json()) as JsonRpcMessage;
    expect(body.error?.code).to.equal(-32700);
  });

  it('should return 404 for unknown paths', async () => {
    const response = await fetch(`http://127.0.0.1:${running.port}/other`, { method: 'POST' });

    expect(response.status).to.equal(404);
  });

  it('should terminate a session on DELETE and reject subsequent requests', async () => {
    const sessionId = await initializeSession(url);

    const deleteResponse = await fetch(url, {
      method: 'DELETE',
      headers: {
        'mcp-session-id': sessionId,
        'mcp-protocol-version': PROTOCOL_VERSION,
      },
    });
    expect(deleteResponse.status).to.equal(200);

    const response = await mcpPost(url, { jsonrpc: '2.0', id: 6, method: 'tools/list' }, {
      'mcp-session-id': sessionId,
      'mcp-protocol-version': PROTOCOL_VERSION,
    });
    expect(response.status).to.equal(404);
  });

  it('should reject requests with a spoofed Host header (DNS rebinding protection)', async () => {
    const status = await new Promise<number>((resolve, reject) => {
      const req = httpRequest(
        {
          host: '127.0.0.1',
          port: running.port,
          path: '/mcp',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
            Host: 'evil.example.com',
          },
        },
        res => {
          res.resume();
          res.on('end', () => resolve(res.statusCode ?? 0));
        }
      );
      req.on('error', reject);
      req.end(JSON.stringify(initializeRequestBody()));
    });

    expect(status).to.equal(403);
  });
});
