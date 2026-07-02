import { describe, it } from 'mocha';
import { expect } from 'chai';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ElicitResult, ElicitRequestFormParams } from '@modelcontextprotocol/sdk/types.js';
import {
  getMissingConnectionParams,
  elicitConnectionParams,
} from '../../../dist/elicitation/connection-setup.js';

function fakeServer(result: ElicitResult, requests: ElicitRequestFormParams[] = []): McpServer {
  return {
    server: {
      getClientCapabilities: () => ({ elicitation: { form: {} } }),
      elicitInput: async (params: ElicitRequestFormParams) => {
        requests.push(params);
        return result;
      },
    },
  } as unknown as McpServer;
}

describe('getMissingConnectionParams', () => {
  it('should require path for sqlite', () => {
    expect(getMissingConnectionParams('sqlite', {})).to.deep.equal(['path']);
  });

  it('should return no missing params for sqlite with path', () => {
    expect(getMissingConnectionParams('sqlite', { path: ':memory:' })).to.deep.equal([]);
  });

  it('should require host, database, and user for network databases', () => {
    expect(getMissingConnectionParams('postgresql', {})).to.deep.equal(['host', 'database', 'user']);
  });

  it('should only report missing fields', () => {
    expect(getMissingConnectionParams('mysql', { host: 'localhost', user: 'root' })).to.deep.equal(['database']);
  });

  it('should not require port or password', () => {
    const missing = getMissingConnectionParams('mssql', { host: 'h', database: 'd', user: 'u' });
    expect(missing).to.deep.equal([]);
  });
});

describe('elicitConnectionParams', () => {
  it('should assemble config values from an accepted elicitation', async () => {
    const requests: ElicitRequestFormParams[] = [];
    const server = fakeServer(
      {
        action: 'accept',
        content: {
          host: 'db.example.com',
          port: 5433,
          database: 'app',
          user: 'admin',
          password: 'secret',
        },
      },
      requests
    );

    const result = await elicitConnectionParams(server, 'postgresql', {});

    expect(result.status).to.equal('completed');
    if (result.status === 'completed') {
      expect(result.values).to.deep.equal({
        host: 'db.example.com',
        port: 5433,
        database: 'app',
        user: 'admin',
        password: 'secret',
      });
    }

    expect(requests).to.have.length(1);
    const schema = requests[0].requestedSchema;
    expect(schema.type).to.equal('object');
    expect(Object.keys(schema.properties)).to.deep.equal(['host', 'port', 'database', 'user', 'password']);
    expect(schema.required).to.deep.equal(['host', 'database', 'user']);
    for (const property of Object.values(schema.properties)) {
      expect(property).to.have.property('type').that.is.oneOf(['string', 'integer']);
    }
  });

  it('should only request fields that were not provided', async () => {
    const requests: ElicitRequestFormParams[] = [];
    const server = fakeServer(
      { action: 'accept', content: { database: 'app', user: 'admin' } },
      requests
    );

    await elicitConnectionParams(server, 'mysql', { host: 'localhost', port: 3306, password: 'pw' });

    expect(Object.keys(requests[0].requestedSchema.properties)).to.deep.equal(['database', 'user']);
    expect(requests[0].requestedSchema.required).to.deep.equal(['database', 'user']);
  });

  it('should request only the path for sqlite', async () => {
    const requests: ElicitRequestFormParams[] = [];
    const server = fakeServer({ action: 'accept', content: { path: '/tmp/db.sqlite' } }, requests);

    const result = await elicitConnectionParams(server, 'sqlite', {});

    expect(result).to.deep.equal({ status: 'completed', values: { path: '/tmp/db.sqlite' } });
    expect(Object.keys(requests[0].requestedSchema.properties)).to.deep.equal(['path']);
    expect(requests[0].requestedSchema.required).to.deep.equal(['path']);
  });

  it('should skip empty optional values', async () => {
    const server = fakeServer({
      action: 'accept',
      content: { host: 'h', database: 'd', user: 'u', password: '' },
    });

    const result = await elicitConnectionParams(server, 'postgresql', {});

    expect(result.status).to.equal('completed');
    if (result.status === 'completed') {
      expect(result.values).to.deep.equal({ host: 'h', database: 'd', user: 'u' });
    }
  });

  it('should report a declined elicitation', async () => {
    const server = fakeServer({ action: 'decline' });
    const result = await elicitConnectionParams(server, 'postgresql', {});
    expect(result).to.deep.equal({ status: 'declined' });
  });

  it('should report a cancelled elicitation', async () => {
    const server = fakeServer({ action: 'cancel' });
    const result = await elicitConnectionParams(server, 'postgresql', {});
    expect(result).to.deep.equal({ status: 'cancelled' });
  });
});
