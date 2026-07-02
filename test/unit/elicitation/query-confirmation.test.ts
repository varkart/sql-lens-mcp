import { describe, it } from 'mocha';
import { expect } from 'chai';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ElicitResult, ElicitRequestFormParams } from '@modelcontextprotocol/sdk/types.js';
import {
  requiresConfirmation,
  confirmDestructiveQuery,
} from '../../../dist/elicitation/query-confirmation.js';

function fakeServer(result: ElicitResult, requests: ElicitRequestFormParams[] = []): McpServer {
  return {
    server: {
      elicitInput: async (params: ElicitRequestFormParams) => {
        requests.push(params);
        return result;
      },
    },
  } as unknown as McpServer;
}

describe('requiresConfirmation', () => {
  it('should flag DROP statements', () => {
    expect(requiresConfirmation('DROP TABLE users')).to.equal(true);
  });

  it('should flag ALTER statements', () => {
    expect(requiresConfirmation('ALTER TABLE users ADD COLUMN age INT')).to.equal(true);
  });

  it('should flag DELETE without WHERE', () => {
    expect(requiresConfirmation('DELETE FROM users')).to.equal(true);
  });

  it('should not flag DELETE with WHERE', () => {
    expect(requiresConfirmation('DELETE FROM users WHERE id = 1')).to.equal(false);
  });

  it('should ignore WHERE inside string literals', () => {
    expect(requiresConfirmation("DELETE FROM notes RETURNING 'no where clause'")).to.equal(true);
  });

  it('should not flag SELECT statements', () => {
    expect(requiresConfirmation('SELECT * FROM users')).to.equal(false);
  });

  it('should not flag UPDATE statements', () => {
    expect(requiresConfirmation('UPDATE users SET name = NULL')).to.equal(false);
  });

  it('should not flag INSERT statements', () => {
    expect(requiresConfirmation("INSERT INTO users (name) VALUES ('a')")).to.equal(false);
  });
});

describe('confirmDestructiveQuery', () => {
  it('should return confirmed when the user accepts and confirms', async () => {
    const requests: ElicitRequestFormParams[] = [];
    const server = fakeServer({ action: 'accept', content: { confirm: true } }, requests);

    const result = await confirmDestructiveQuery(server, 'DROP TABLE users');

    expect(result).to.equal('confirmed');
    expect(requests).to.have.length(1);
    expect(requests[0].message).to.include('DROP TABLE users');
    expect(requests[0].requestedSchema.properties.confirm).to.deep.include({ type: 'boolean' });
    expect(requests[0].requestedSchema.required).to.deep.equal(['confirm']);
  });

  it('should return declined when the user accepts without confirming', async () => {
    const server = fakeServer({ action: 'accept', content: { confirm: false } });
    expect(await confirmDestructiveQuery(server, 'DROP TABLE users')).to.equal('declined');
  });

  it('should return declined when the user declines', async () => {
    const server = fakeServer({ action: 'decline' });
    expect(await confirmDestructiveQuery(server, 'DROP TABLE users')).to.equal('declined');
  });

  it('should return cancelled when the user cancels', async () => {
    const server = fakeServer({ action: 'cancel' });
    expect(await confirmDestructiveQuery(server, 'DROP TABLE users')).to.equal('cancelled');
  });
});
