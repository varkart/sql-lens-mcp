import { describe, it } from 'mocha';
import { expect } from 'chai';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { supportsElicitation } from '../../../dist/elicitation/capabilities.js';

function serverWithCapabilities(capabilities: unknown): McpServer {
  return {
    server: {
      getClientCapabilities: () => capabilities,
    },
  } as unknown as McpServer;
}

describe('supportsElicitation', () => {
  it('should return false when client capabilities are unknown', () => {
    expect(supportsElicitation(serverWithCapabilities(undefined))).to.equal(false);
  });

  it('should return false when elicitation capability is absent', () => {
    expect(supportsElicitation(serverWithCapabilities({ sampling: {} }))).to.equal(false);
  });

  it('should return true when form elicitation is declared', () => {
    expect(supportsElicitation(serverWithCapabilities({ elicitation: { form: {} } }))).to.equal(true);
  });

  it('should return false when only url elicitation is declared', () => {
    expect(supportsElicitation(serverWithCapabilities({ elicitation: { url: {} } }))).to.equal(false);
  });
});
