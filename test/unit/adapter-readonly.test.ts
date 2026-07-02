import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SQLiteAdapter } from '../../dist/connections/adapters/sqlite.js';
import { PostgreSQLAdapter } from '../../dist/connections/adapters/postgresql.js';
import { MySQLAdapter } from '../../dist/connections/adapters/mysql.js';
import { MariaDBAdapter } from '../../dist/connections/adapters/mariadb.js';
import { MSSQLAdapter } from '../../dist/connections/adapters/mssql.js';
import { OracleAdapter } from '../../dist/connections/adapters/oracle.js';

describe('Adapter Read-Only Unit Tests', () => {
  describe('read-only enforcement contract', () => {
    const sessionAdapters = [
      new PostgreSQLAdapter(),
      new MySQLAdapter(),
      new MariaDBAdapter(),
      new SQLiteAdapter(),
    ];

    const guardAdapters = [new MSSQLAdapter(), new OracleAdapter()];

    for (const adapter of sessionAdapters) {
      it(`${adapter.type} should declare session-level enforcement`, () => {
        expect(adapter.readOnlyEnforcement).to.equal('session');
      });
    }

    for (const adapter of guardAdapters) {
      it(`${adapter.type} should declare guard enforcement`, () => {
        expect(adapter.readOnlyEnforcement).to.equal('guard');
      });
    }

    for (const adapter of [...sessionAdapters, ...guardAdapters]) {
      it(`${adapter.type} should default to read-write`, () => {
        expect(adapter.isReadOnly()).to.be.false;
      });
    }
  });

  describe('SQLite session read-only', () => {
    let dir: string;
    let dbPath: string;

    before(async () => {
      dir = mkdtempSync(join(tmpdir(), 'sql-lens-readonly-'));
      dbPath = join(dir, 'test.db');

      const writer = new SQLiteAdapter();
      await writer.connect({ type: 'sqlite', path: dbPath });
      await writer.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
      await writer.execute("INSERT INTO users (name) VALUES ('Alice')");
      await writer.disconnect();
    });

    after(() => {
      rmSync(dir, { recursive: true, force: true });
    });

    it('should open the database read-only when configured', async () => {
      const adapter = new SQLiteAdapter();
      await adapter.connect({ type: 'sqlite', path: dbPath, readOnly: true });

      try {
        expect(adapter.isReadOnly()).to.be.true;

        const result = await adapter.execute('SELECT * FROM users');
        expect(result.rowCount).to.equal(1);
        expect(result.rows[0].name).to.equal('Alice');
      } finally {
        await adapter.disconnect();
      }
    });

    it('should reject writes on a read-only connection at the engine level', async () => {
      const adapter = new SQLiteAdapter();
      await adapter.connect({ type: 'sqlite', path: dbPath, readOnly: true });

      try {
        const attempts = [
          "INSERT INTO users (name) VALUES ('Mallory')",
          "UPDATE users SET name = 'Mallory'",
          'DELETE FROM users',
          'DROP TABLE users',
          'CREATE TABLE evil (id INTEGER)',
        ];

        for (const sql of attempts) {
          let failed = false;
          try {
            await adapter.execute(sql);
          } catch {
            failed = true;
          }
          expect(failed, `expected engine to reject: ${sql}`).to.be.true;
        }

        const result = await adapter.execute('SELECT COUNT(*) as count FROM users');
        expect(result.rows[0].count).to.equal(1);
      } finally {
        await adapter.disconnect();
      }
    });

    it('should allow writes when not read-only', async () => {
      const adapter = new SQLiteAdapter();
      await adapter.connect({ type: 'sqlite', path: dbPath });

      try {
        expect(adapter.isReadOnly()).to.be.false;
        await adapter.execute("INSERT INTO users (name) VALUES ('Bob')");
        await adapter.execute("DELETE FROM users WHERE name = 'Bob'");
      } finally {
        await adapter.disconnect();
      }
    });

    it('should enforce read-only after setReadOnly(true)', async () => {
      const adapter = new SQLiteAdapter();
      await adapter.connect({ type: 'sqlite', path: dbPath });

      try {
        await adapter.setReadOnly(true);
        expect(adapter.isReadOnly()).to.be.true;

        let failed = false;
        try {
          await adapter.execute("INSERT INTO users (name) VALUES ('Mallory')");
        } catch {
          failed = true;
        }
        expect(failed).to.be.true;
      } finally {
        await adapter.disconnect();
      }
    });
  });
});
