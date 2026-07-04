import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadConfig } from '../../dist/connections/config.js';

const ENV_KEYS = ['SQL_LENS_MCP_MAX_ROWS', 'SQL_LENS_MCP_QUERY_TIMEOUT'] as const;

describe('Config Unit Tests', () => {
  afterEach(() => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }
  });

  describe('loadConfig with no config file', () => {
    it('returns null when no env var overrides are set', async () => {
      const config = await loadConfig(join(tmpdir(), 'does-not-exist.json'));
      expect(config).to.be.null;
    });

    it('applies SQL_LENS_MCP_MAX_ROWS and SQL_LENS_MCP_QUERY_TIMEOUT when set', async () => {
      process.env.SQL_LENS_MCP_MAX_ROWS = '10';
      process.env.SQL_LENS_MCP_QUERY_TIMEOUT = '5000';

      const config = await loadConfig(join(tmpdir(), 'does-not-exist.json'));

      expect(config).to.not.be.null;
      expect(config!.defaults.maxRows).to.equal(10);
      expect(config!.defaults.queryTimeout).to.equal(5000);
    });
  });

  describe('loadConfig with a config file', () => {
    it('env vars take precedence over the file defaults', async () => {
      const path = join(tmpdir(), `sql-lens-mcp-config-test-${Date.now()}.json`);
      await fs.writeFile(path, JSON.stringify({
        defaults: { readOnly: true, queryTimeout: 25000, maxRows: 25 },
      }));

      try {
        process.env.SQL_LENS_MCP_MAX_ROWS = '5';
        const config = await loadConfig(path);

        expect(config!.defaults.maxRows).to.equal(5);
        expect(config!.defaults.queryTimeout).to.equal(25000);
      } finally {
        await fs.unlink(path);
      }
    });
  });
});
