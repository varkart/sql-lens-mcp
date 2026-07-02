import { describe, it } from 'mocha';
import { expect } from 'chai';
import {
  classifyStatement,
  isDestructive,
  validateQuery,
  assertReadOnly,
} from '../../dist/security/query-validator.js';
import type { DatabaseType, StatementType } from '../../dist/utils/types.js';

interface ClassifyCase {
  name: string;
  sql: string;
  dialect?: DatabaseType;
  expected: StatementType;
}

describe('Query Validator Unit Tests', () => {
  describe('classifyStatement', () => {
    const cases: ClassifyCase[] = [
      { name: 'SELECT', sql: 'SELECT * FROM users', expected: 'SELECT' },
      { name: 'lowercase select with whitespace', sql: '  select id from products  ', expected: 'SELECT' },
      { name: 'INSERT', sql: "INSERT INTO users (name) VALUES ('John')", expected: 'INSERT' },
      { name: 'UPDATE', sql: "UPDATE users SET name = 'Jane'", expected: 'UPDATE' },
      { name: 'DELETE', sql: 'DELETE FROM users WHERE id = 1', expected: 'DELETE' },
      { name: 'CREATE', sql: 'CREATE TABLE test (id INT)', expected: 'CREATE' },
      { name: 'DROP', sql: 'DROP TABLE test', expected: 'DROP' },
      { name: 'ALTER', sql: 'ALTER TABLE test ADD COLUMN name VARCHAR(100)', expected: 'ALTER' },
      { name: 'TRUNCATE as DELETE', sql: 'TRUNCATE TABLE test', dialect: 'mysql', expected: 'DELETE' },
      { name: 'REPLACE as INSERT', sql: 'REPLACE INTO t VALUES (1)', dialect: 'mysql', expected: 'INSERT' },

      { name: 'WITH ... SELECT CTE', sql: 'WITH t AS (SELECT 1) SELECT * FROM t', dialect: 'postgresql', expected: 'SELECT' },
      { name: 'nested CTE', sql: 'WITH a AS (SELECT 1), b AS (SELECT * FROM a) SELECT * FROM b', dialect: 'postgresql', expected: 'SELECT' },

      { name: 'EXPLAIN SELECT', sql: 'EXPLAIN SELECT * FROM users', dialect: 'postgresql', expected: 'SELECT' },
      { name: 'EXPLAIN in mysql', sql: 'EXPLAIN SELECT * FROM users', dialect: 'mysql', expected: 'SELECT' },
      { name: 'EXPLAIN QUERY PLAN', sql: 'EXPLAIN QUERY PLAN SELECT 1', dialect: 'sqlite', expected: 'SELECT' },
      { name: 'EXPLAIN ANALYZE DELETE executes', sql: 'EXPLAIN ANALYZE DELETE FROM t', dialect: 'postgresql', expected: 'DELETE' },
      { name: 'EXPLAIN (ANALYZE) UPDATE executes', sql: 'EXPLAIN (ANALYZE, BUFFERS) UPDATE t SET a = 1', dialect: 'postgresql', expected: 'UPDATE' },
      { name: 'EXPLAIN ANALYZE SELECT', sql: 'EXPLAIN ANALYZE SELECT * FROM t', dialect: 'postgresql', expected: 'SELECT' },

      { name: 'SHOW', sql: 'SHOW TABLES', dialect: 'mysql', expected: 'SELECT' },
      { name: 'DESCRIBE', sql: 'DESCRIBE users', dialect: 'mysql', expected: 'SELECT' },
      { name: 'DESC', sql: 'DESC users', dialect: 'mysql', expected: 'SELECT' },
      { name: 'PRAGMA', sql: 'PRAGMA table_info(users)', dialect: 'sqlite', expected: 'SELECT' },

      { name: 'leading line comment', sql: '-- fetch users\nSELECT * FROM users', expected: 'SELECT' },
      { name: 'leading block comment', sql: '/* fetch */ SELECT * FROM users', expected: 'SELECT' },
      { name: 'comment hiding a write', sql: '/* just reading */ DROP TABLE users', expected: 'DROP' },
      { name: 'comment-only input', sql: '-- nothing here', expected: 'UNKNOWN' },

      { name: 'postgres cast', sql: 'SELECT id::text FROM users', dialect: 'postgresql', expected: 'SELECT' },
      { name: 'mysql backticks', sql: 'SELECT `id` FROM `users`', dialect: 'mysql', expected: 'SELECT' },
      { name: 'mssql brackets and TOP', sql: 'SELECT TOP 5 * FROM [dbo].[Users]', dialect: 'mssql', expected: 'SELECT' },
      { name: 'mariadb select', sql: 'SELECT id FROM users LIMIT 10', dialect: 'mariadb', expected: 'SELECT' },
      { name: 'sqlite select', sql: 'SELECT id FROM users LIMIT 10', dialect: 'sqlite', expected: 'SELECT' },
      { name: 'oracle select', sql: 'SELECT id FROM users', dialect: 'oracle', expected: 'SELECT' },

      { name: 'SELECT INTO is not a plain read', sql: 'SELECT * INTO t2 FROM t1', dialect: 'mssql', expected: 'UNKNOWN' },
      { name: 'unparseable input', sql: 'this is not sql', expected: 'UNKNOWN' },
      { name: 'empty input', sql: '   ', expected: 'UNKNOWN' },
    ];

    for (const c of cases) {
      it(`should classify ${c.name}`, () => {
        expect(classifyStatement(c.sql, c.dialect)).to.equal(c.expected);
      });
    }
  });

  describe('isDestructive', () => {
    it('should identify destructive statements', () => {
      expect(isDestructive('DELETE')).to.be.true;
      expect(isDestructive('DROP')).to.be.true;
      expect(isDestructive('ALTER')).to.be.true;
    });

    it('should not mark safe statements as destructive', () => {
      expect(isDestructive('SELECT')).to.be.false;
      expect(isDestructive('INSERT')).to.be.false;
      expect(isDestructive('UPDATE')).to.be.false;
    });
  });

  describe('validateQuery', () => {
    describe('Multiple Statements', () => {
      it('should reject queries with multiple statements', () => {
        expect(() => {
          validateQuery('SELECT * FROM users; DROP TABLE users;', false);
        }).to.throw('Multiple statements are not allowed');
      });

      it('should allow semicolon in string literals', () => {
        expect(() => {
          validateQuery("SELECT * FROM users WHERE name = 'Bob;Alice'", false);
        }).to.not.throw();
      });

      it('should allow semicolon in double-quoted identifiers', () => {
        expect(() => {
          validateQuery('SELECT "a;b" FROM users', false);
        }).to.not.throw();
      });

      it('should allow trailing semicolon', () => {
        expect(() => {
          validateQuery('SELECT * FROM users;', false);
        }).to.not.throw();
      });

      it('should allow trailing semicolon followed by a comment', () => {
        expect(() => {
          validateQuery('SELECT * FROM users; -- done', false);
        }).to.not.throw();
      });

      it('should not treat semicolons inside comments as separators', () => {
        expect(() => {
          validateQuery('SELECT * FROM users /* a;b */ WHERE id = 1', false);
        }).to.not.throw();
      });

      it('should reject a second statement after a comment', () => {
        expect(() => {
          validateQuery('SELECT 1; /* hi */ DROP TABLE users', false);
        }).to.throw('Multiple statements are not allowed');
      });
    });

    describe('Dangerous Patterns', () => {
      it('should reject INTO OUTFILE', () => {
        expect(() => {
          validateQuery("SELECT * FROM users INTO OUTFILE '/tmp/users.txt'", false);
        }).to.throw(/Dangerous pattern/);
      });

      it('should reject LOAD_FILE', () => {
        expect(() => {
          validateQuery("SELECT LOAD_FILE('/etc/passwd')", false);
        }).to.throw(/Dangerous pattern/);
      });

      it('should reject xp_cmdshell', () => {
        expect(() => {
          validateQuery("EXEC xp_cmdshell 'dir'", false);
        }).to.throw(/Dangerous pattern/);
      });

      it('should reject SHUTDOWN', () => {
        expect(() => {
          validateQuery('SHUTDOWN', false);
        }).to.throw(/Dangerous pattern/);
      });
    });

    describe('Read-Only Mode', () => {
      const writes = [
        "INSERT INTO users (name) VALUES ('John')",
        "UPDATE users SET name = 'Jane'",
        'DELETE FROM users',
        'CREATE TABLE test (id INT)',
        'DROP TABLE users',
        'ALTER TABLE users ADD COLUMN email VARCHAR(255)',
      ];

      for (const sql of writes) {
        it(`should reject "${sql.slice(0, 30)}" in read-only mode`, () => {
          expect(() => validateQuery(sql, true)).to.throw(/Write operations are not allowed/);
        });
      }

      it('should allow SELECT in read-only mode', () => {
        expect(() => {
          validateQuery('SELECT * FROM users', true);
        }).to.not.throw();
      });

      it('should allow CTE SELECT in read-only mode', () => {
        expect(() => {
          validateQuery('WITH t AS (SELECT 1) SELECT * FROM t', true, 'postgresql');
        }).to.not.throw();
      });

      it('should fail closed on unparseable SQL in read-only mode', () => {
        expect(() => {
          validateQuery('this is not sql', true);
        }).to.throw(/could not be verified as read-only/);
      });

      it('should fail closed on data-modifying CTEs in read-only mode', () => {
        expect(() => {
          validateQuery('WITH d AS (DELETE FROM t RETURNING id) SELECT * FROM d', true, 'postgresql');
        }).to.throw(/could not be verified as read-only/);
      });

      it('should allow unparseable SQL when not read-only', () => {
        expect(() => {
          validateQuery('this is not sql', false);
        }).to.not.throw();
      });
    });
  });

  describe('assertReadOnly', () => {
    it('should allow read statements', () => {
      expect(() => assertReadOnly('SELECT * FROM users', 'mssql')).to.not.throw();
      expect(() => assertReadOnly('EXPLAIN SELECT 1', 'oracle')).to.not.throw();
    });

    it('should reject write statements', () => {
      expect(() => assertReadOnly('INSERT INTO t VALUES (1)', 'mssql')).to.throw(/Write operations are not allowed/);
      expect(() => assertReadOnly('DROP TABLE t', 'oracle')).to.throw(/Write operations are not allowed/);
    });

    it('should reject SELECT INTO', () => {
      expect(() => assertReadOnly('SELECT * INTO t2 FROM t1', 'mssql')).to.throw(/could not be verified as read-only/);
    });

    it('should fail closed on unverifiable statements', () => {
      expect(() => assertReadOnly('this is not sql', 'mssql')).to.throw(/could not be verified as read-only/);
    });
  });
});
