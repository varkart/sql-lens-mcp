import { describe, it } from 'mocha';
import { expect } from 'chai';
import { classifyStatement, isDestructive, validateQuery, } from '../../dist/security/query-validator.js';
describe('Query Validator Unit Tests', () => {
    describe('classifyStatement', () => {
        it('should classify SELECT queries', () => {
            expect(classifyStatement('SELECT * FROM users')).to.equal('SELECT');
            expect(classifyStatement('  select id from products  ')).to.equal('SELECT');
        });
        it('should classify INSERT queries', () => {
            expect(classifyStatement('INSERT INTO users (name) VALUES (\'John\')')).to.equal('INSERT');
        });
        it('should classify UPDATE queries', () => {
            expect(classifyStatement('UPDATE users SET name = \'Jane\'')).to.equal('UPDATE');
        });
        it('should classify DELETE queries', () => {
            expect(classifyStatement('DELETE FROM users WHERE id = 1')).to.equal('DELETE');
        });
        it('should classify DDL queries', () => {
            expect(classifyStatement('CREATE TABLE test (id INT)')).to.equal('CREATE');
            expect(classifyStatement('DROP TABLE test')).to.equal('DROP');
            expect(classifyStatement('ALTER TABLE test ADD COLUMN name VARCHAR(100)')).to.equal('ALTER');
        });
        it('should return UNKNOWN for unrecognized queries', () => {
            expect(classifyStatement('EXPLAIN SELECT * FROM users')).to.equal('UNKNOWN');
        });
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
                    validateQuery('SELECT * FROM users WHERE name = \'Bob;Alice\'', false);
                }).to.not.throw();
            });
            it('should allow trailing semicolon', () => {
                expect(() => {
                    validateQuery('SELECT * FROM users;', false);
                }).to.not.throw();
            });
        });
        describe('Dangerous Patterns', () => {
            it('should reject INTO OUTFILE', () => {
                expect(() => {
                    validateQuery('SELECT * FROM users INTO OUTFILE \'/tmp/users.txt\'', false);
                }).to.throw(/Dangerous pattern/);
            });
            it('should reject LOAD_FILE', () => {
                expect(() => {
                    validateQuery('SELECT LOAD_FILE(\'/etc/passwd\')', false);
                }).to.throw(/Dangerous pattern/);
            });
            it('should reject xp_cmdshell', () => {
                expect(() => {
                    validateQuery('EXEC xp_cmdshell \'dir\'', false);
                }).to.throw(/Dangerous pattern/);
            });
            it('should reject SHUTDOWN', () => {
                expect(() => {
                    validateQuery('SHUTDOWN', false);
                }).to.throw(/Dangerous pattern/);
            });
        });
        describe('Read-Only Mode', () => {
            it('should reject write operations in read-only mode', () => {
                expect(() => {
                    validateQuery('INSERT INTO users (name) VALUES (\'John\')', true);
                }).to.throw(/Write operations are not allowed/);
                expect(() => {
                    validateQuery('UPDATE users SET name = \'Jane\'', true);
                }).to.throw(/Write operations are not allowed/);
                expect(() => {
                    validateQuery('DELETE FROM users', true);
                }).to.throw(/Write operations are not allowed/);
                expect(() => {
                    validateQuery('CREATE TABLE test (id INT)', true);
                }).to.throw(/Write operations are not allowed/);
                expect(() => {
                    validateQuery('DROP TABLE users', true);
                }).to.throw(/Write operations are not allowed/);
                expect(() => {
                    validateQuery('ALTER TABLE users ADD COLUMN email VARCHAR(255)', true);
                }).to.throw(/Write operations are not allowed/);
            });
            it('should allow SELECT in read-only mode', () => {
                expect(() => {
                    validateQuery('SELECT * FROM users', true);
                }).to.not.throw();
            });
        });
    });
});
//# sourceMappingURL=query-validator.test.js.map