import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DuckDBAdapter } from '../../dist/connections/adapters/duckdb.js';

describe('DuckDB Adapter Unit Tests', () => {
  let dir: string;

  before(() => {
    dir = mkdtempSync(join(tmpdir(), 'sql-lens-duckdb-'));
  });

  after(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  describe('connect', () => {
    it('should connect to an in-memory database', async () => {
      const adapter = new DuckDBAdapter();
      await adapter.connect({ type: 'duckdb', path: ':memory:' });

      try {
        expect(adapter.isConnected()).to.be.true;
        const result = await adapter.execute('SELECT 1 AS value');
        expect(result.rows[0].value).to.equal(1);
      } finally {
        await adapter.disconnect();
      }

      expect(adapter.isConnected()).to.be.false;
    });

    it('should default to an in-memory database when no path is given', async () => {
      const adapter = new DuckDBAdapter();
      await adapter.connect({ type: 'duckdb' });

      try {
        expect(adapter.isConnected()).to.be.true;
      } finally {
        await adapter.disconnect();
      }
    });

    it('should connect to a file-backed database and persist data', async () => {
      const dbPath = join(dir, 'persist.duckdb');

      const writer = new DuckDBAdapter();
      await writer.connect({ type: 'duckdb', path: dbPath });
      await writer.execute('CREATE TABLE items (id INTEGER, label VARCHAR)');
      await writer.execute("INSERT INTO items VALUES (1, 'first')");
      await writer.disconnect();

      const reader = new DuckDBAdapter();
      await reader.connect({ type: 'duckdb', path: dbPath });

      try {
        const result = await reader.execute('SELECT * FROM items');
        expect(result.rowCount).to.equal(1);
        expect(result.rows[0].label).to.equal('first');
      } finally {
        await reader.disconnect();
      }
    });

    it('should reject read-only mode for in-memory databases', async () => {
      const adapter = new DuckDBAdapter();

      let failed = false;
      try {
        await adapter.connect({ type: 'duckdb', path: ':memory:', readOnly: true });
      } catch {
        failed = true;
      }
      expect(failed).to.be.true;
      expect(adapter.isConnected()).to.be.false;
    });
  });

  describe('execute', () => {
    it('should return columns and rows for SELECT queries', async () => {
      const adapter = new DuckDBAdapter();
      await adapter.connect({ type: 'duckdb' });

      try {
        const result = await adapter.execute("SELECT 42 AS answer, 'hello' AS greeting");

        expect(result.columns.map(c => c.name)).to.deep.equal(['answer', 'greeting']);
        expect(result.columns[0].type).to.equal('INTEGER');
        expect(result.columns[1].type).to.equal('VARCHAR');
        expect(result.rows).to.deep.equal([{ answer: 42, greeting: 'hello' }]);
        expect(result.rowCount).to.equal(1);
        expect(result.truncated).to.be.false;
      } finally {
        await adapter.disconnect();
      }
    });

    it('should support positional parameters', async () => {
      const adapter = new DuckDBAdapter();
      await adapter.connect({ type: 'duckdb' });

      try {
        await adapter.execute('CREATE TABLE users (id INTEGER, name VARCHAR)');
        await adapter.execute("INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob')");

        const result = await adapter.execute('SELECT name FROM users WHERE id = ?', [2]);
        expect(result.rows).to.deep.equal([{ name: 'Bob' }]);
      } finally {
        await adapter.disconnect();
      }
    });

    it('should report affected rows for write statements', async () => {
      const adapter = new DuckDBAdapter();
      await adapter.connect({ type: 'duckdb' });

      try {
        await adapter.execute('CREATE TABLE t (id INTEGER)');
        const result = await adapter.execute('INSERT INTO t VALUES (1), (2), (3)');

        expect(result.rowCount).to.equal(3);
        expect(result.rows).to.deep.equal([]);
        expect(result.columns).to.deep.equal([]);
      } finally {
        await adapter.disconnect();
      }
    });

    it('should truncate results beyond maxRows', async () => {
      const adapter = new DuckDBAdapter();
      await adapter.connect({ type: 'duckdb' });

      try {
        const result = await adapter.execute('SELECT * FROM range(10)', [], { maxRows: 5 });
        expect(result.rowCount).to.equal(5);
        expect(result.truncated).to.be.true;
      } finally {
        await adapter.disconnect();
      }
    });

    it('should fail when not connected', async () => {
      const adapter = new DuckDBAdapter();

      let failed = false;
      try {
        await adapter.execute('SELECT 1');
      } catch {
        failed = true;
      }
      expect(failed).to.be.true;
    });
  });

  describe('read-only enforcement', () => {
    let dbPath: string;

    before(async () => {
      dbPath = join(dir, 'readonly.duckdb');

      const writer = new DuckDBAdapter();
      await writer.connect({ type: 'duckdb', path: dbPath });
      await writer.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name VARCHAR)');
      await writer.execute("INSERT INTO users VALUES (1, 'Alice')");
      await writer.disconnect();
    });

    it('should open the database read-only when configured', async () => {
      const adapter = new DuckDBAdapter();
      await adapter.connect({ type: 'duckdb', path: dbPath, readOnly: true });

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
      const adapter = new DuckDBAdapter();
      await adapter.connect({ type: 'duckdb', path: dbPath, readOnly: true });

      try {
        const attempts = [
          "INSERT INTO users VALUES (2, 'Mallory')",
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

        const result = await adapter.execute('SELECT COUNT(*) AS count FROM users');
        expect(Number(result.rows[0].count)).to.equal(1);
      } finally {
        await adapter.disconnect();
      }
    });

    it('should allow writes when not read-only', async () => {
      const adapter = new DuckDBAdapter();
      await adapter.connect({ type: 'duckdb', path: dbPath });

      try {
        expect(adapter.isReadOnly()).to.be.false;
        await adapter.execute("INSERT INTO users VALUES (2, 'Bob')");
        await adapter.execute('DELETE FROM users WHERE id = 2');
      } finally {
        await adapter.disconnect();
      }
    });

    it('should enforce read-only after setReadOnly(true)', async () => {
      const adapter = new DuckDBAdapter();
      await adapter.connect({ type: 'duckdb', path: dbPath });

      try {
        await adapter.setReadOnly(true);
        expect(adapter.isReadOnly()).to.be.true;

        let failed = false;
        try {
          await adapter.execute("INSERT INTO users VALUES (3, 'Mallory')");
        } catch {
          failed = true;
        }
        expect(failed).to.be.true;

        const result = await adapter.execute('SELECT COUNT(*) AS count FROM users');
        expect(Number(result.rows[0].count)).to.equal(1);
      } finally {
        await adapter.disconnect();
      }
    });

    it('should reject setReadOnly on an in-memory database', async () => {
      const adapter = new DuckDBAdapter();
      await adapter.connect({ type: 'duckdb' });

      try {
        let failed = false;
        try {
          await adapter.setReadOnly(true);
        } catch {
          failed = true;
        }
        expect(failed).to.be.true;
        expect(adapter.isReadOnly()).to.be.false;
      } finally {
        await adapter.disconnect();
      }
    });
  });

  describe('schema introspection', () => {
    it('should describe tables, columns, primary keys, and foreign keys', async () => {
      const adapter = new DuckDBAdapter();
      await adapter.connect({ type: 'duckdb' });

      try {
        await adapter.execute(
          'CREATE TABLE users (id INTEGER PRIMARY KEY, name VARCHAR NOT NULL, age INTEGER DEFAULT 18)'
        );
        await adapter.execute(
          'CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id))'
        );
        await adapter.execute("INSERT INTO users VALUES (1, 'Alice', 30), (2, 'Bob', 25)");

        const schema = await adapter.getSchema();

        expect(schema.databaseType).to.equal('duckdb');
        expect(schema.tables.map(t => t.name)).to.deep.equal(['orders', 'users']);

        const users = schema.tables.find(t => t.name === 'users');
        expect(users).to.exist;
        expect(users!.columns.map(c => c.name)).to.deep.equal(['id', 'name', 'age']);
        expect(users!.primaryKey).to.deep.equal(['id']);
        expect(users!.rowCount).to.equal(2);

        const idColumn = users!.columns.find(c => c.name === 'id');
        expect(idColumn!.type).to.equal('INTEGER');
        expect(idColumn!.isPrimaryKey).to.be.true;
        expect(idColumn!.nullable).to.be.false;

        const ageColumn = users!.columns.find(c => c.name === 'age');
        expect(ageColumn!.nullable).to.be.true;
        expect(ageColumn!.defaultValue).to.equal('18');

        const orders = schema.tables.find(t => t.name === 'orders');
        expect(orders!.foreignKeys).to.deep.equal([
          { column: 'user_id', referencesTable: 'users', referencesColumn: 'id' },
        ]);
      } finally {
        await adapter.disconnect();
      }
    });
  });

  describe('file querying', () => {
    it('should query a CSV file via read_csv_auto', async () => {
      const csvPath = join(dir, 'people.csv');
      writeFileSync(csvPath, 'name,age\nAlice,30\nBob,25\n');

      const adapter = new DuckDBAdapter();
      await adapter.connect({ type: 'duckdb' });

      try {
        const result = await adapter.execute(
          'SELECT name, age FROM read_csv_auto(?) ORDER BY age DESC',
          [csvPath]
        );

        expect(result.rowCount).to.equal(2);
        expect(result.rows[0].name).to.equal('Alice');
        expect(Number(result.rows[0].age)).to.equal(30);
        expect(result.rows[1].name).to.equal('Bob');
      } finally {
        await adapter.disconnect();
      }
    });
  });
});
