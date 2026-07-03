# Contributing to sql-lens-mcp

Thank you for your interest in contributing to sql-lens-mcp! This document provides guidelines and instructions for contributing.

## Quick Links

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Style Guidelines](#style-guidelines)
- [Development Guide](DEVELOPMENT.md) — local setup, workflow, debugging
- [Testing Guide](docs/TESTING.md) — test suites, Testcontainers, manual testing

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md) that all contributors are expected to follow. Please read it before contributing.

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- Docker Desktop (for integration tests)
- Git
- A GitHub account

### Initial Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sql-lens-mcp.git
   cd sql-lens-mcp
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/varkart/sql-lens-mcp.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Build the project**:
   ```bash
   npm run build
   ```

6. **Run tests**:
   ```bash
   npm test
   ```

## Development Setup

Local environment setup, the day-to-day workflow (watch mode, linting, formatting), debugging, and how to add a new database adapter are covered in the [Development Guide](DEVELOPMENT.md). For an overview of the code layout, see [ARCHITECTURE.md](ARCHITECTURE.md).

### Running Tests

```bash
# Unit tests only (fast, no Docker)
npm run test:unit

# Integration tests (requires Docker)
npm run test:integration

# All tests
npm test
```

See the [Testing Guide](docs/TESTING.md) for Testcontainers details, E2E databases, and manual testing with MCP clients.

## Making Changes

### 1. Create a Branch

```bash
git checkout dev
git pull upstream dev
git checkout -b feature/your-feature-name
```

**Branch naming conventions**:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `test/description` - Test additions
- `refactor/description` - Code refactoring

### 2. Make Your Changes

- Write clean, maintainable code
- Follow existing code style
- Add comments for complex logic
- Keep functions focused and small

### 3. Write Tests

**All code changes must include tests**:

- Add unit tests for utilities and validators
- Add integration tests for database adapters
- Ensure all tests pass: `npm test`

### 4. Update Documentation

- Update README.md for new features
- Add JSDoc comments for public APIs
- Update test documentation if needed

### 5. Commit Your Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: Add support for Redis caching

- Implemented Redis adapter
- Added configuration options
- Added integration tests with testcontainers

Closes #123"
```

**Commit types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `chore`: Build/tooling

## Submitting Changes

### 1. Update Your Branch

```bash
git fetch upstream
git rebase upstream/dev
```

### 2. Run Final Checks

```bash
# Build
npm run build

# Tests
npm test

# Linting
npm run lint

# Formatting
npm run format
```

### 3. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 4. Create Pull Request

1. Go to your fork on GitHub
2. Click "Pull Request"
3. **Base**: `dev` (not `main`)
4. **Compare**: `your-branch`
5. Fill out the PR template
6. Submit!

### Pull Request Checklist

Before submitting, ensure:

- [ ] All tests pass (`npm test`)
- [ ] Code is formatted (`npm run format`)
- [ ] No lint errors (`npm run lint`)
- [ ] TypeScript compiles (`npm run build`)
- [ ] Tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] PR targets `dev` branch
- [ ] PR description is complete

### What Happens Next

1. **Automated checks run** (GitHub Actions)
2. **Maintainers review** your PR
3. **You address feedback** if any
4. **PR is merged** to `dev`
5. **Changes are tested** in `dev`
6. **Released** in next version

## Style Guidelines

### TypeScript

```typescript
// ✅ Good: Explicit types, proper error handling
export async function executeQuery(
  adapter: DatabaseAdapter,
  sql: string,
  options: ExecuteOptions = {}
): Promise<QueryResult> {
  try {
    const result = await adapter.execute(sql, [], options);
    logger.info('Query executed', { rowCount: result.rowCount });
    return result;
  } catch (error) {
    const err = error as Error;
    logger.error('Query failed', { error: err.message });
    throw new QueryError(`Failed to execute query: ${err.message}`);
  }
}

// ❌ Bad: Implicit any, no error handling
export async function executeQuery(adapter, sql, options) {
  const result = await adapter.execute(sql, [], options);
  return result;
}
```

### Error Handling

Always use custom error types:

```typescript
import { QueryError, ConnectionError } from './utils/errors.js';

// ✅ Good
throw new QueryError('Invalid SQL syntax');
throw new ConnectionError('Failed to connect to database');

// ❌ Bad
throw new Error('Something went wrong');
```

### Logging

Use structured logging:

```typescript
// ✅ Good
logger.debug('Connecting to database', { host, port, database });
logger.info('Connection established', { connectionId });
logger.warn('Connection pool exhausted', { activeConnections });
logger.error('Query timeout', { query: sql.substring(0, 100), timeout });

// ❌ Bad
console.log('Connecting...');
console.error(error);
```

### Tests

```typescript
// ✅ Good: Descriptive, focused, isolated
describe('PostgreSQL Adapter', () => {
  describe('connect', () => {
    it('should connect with valid credentials', async () => {
      await adapter.connect(validConfig);
      expect(adapter.isConnected()).to.be.true;
    });

    it('should throw ConnectionError with invalid credentials', async () => {
      await expect(adapter.connect(invalidConfig))
        .to.be.rejectedWith(ConnectionError);
    });
  });
});

// ❌ Bad: Vague, testing multiple things
it('should work', async () => {
  await adapter.connect(config);
  const result = await adapter.execute('SELECT 1');
  expect(result).to.exist;
});
```

## Types of Contributions

### Bug Reports

When reporting bugs, include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Exact steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, Node version, database type
6. **Logs**: Relevant error messages
7. **Screenshots**: If applicable

### Feature Requests

When requesting features:

1. **Use Case**: Why is this needed?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: Other approaches considered?
4. **Additional Context**: Examples, mockups, etc.

### Code Contributions

We welcome:

- 🐛 **Bug fixes**
- ✨ **New features** (discuss first in an issue)
- 📚 **Documentation improvements**
- 🧪 **Test additions**
- ♻️ **Refactoring**
- ⚡ **Performance improvements**

## Development Tips

Debugging setup and the steps for adding a new database adapter are documented in the [Development Guide](DEVELOPMENT.md).

### Running Individual Tests

```bash
# Run specific test file
npx mocha test/unit/query-validator.test.js

# Run specific test suite
npx mocha test/integration/adapters/postgresql.test.js
```

### Pre-commit Checklist

Before committing:

```bash
npm run build     # ✓ Compiles
npm test          # ✓ All tests pass
npm run lint      # ✓ No lint errors
npm run format    # ✓ Code formatted
```

## Getting Help

- 💬 **Discussions**: Ask questions in GitHub Discussions
- 🐛 **Issues**: Report bugs or request features
- 📧 **Email**: [your-email] for private concerns
- 📚 **Docs**: Check the [README](README.md), [Development Guide](DEVELOPMENT.md), and [Testing Guide](docs/TESTING.md)

## Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- GitHub contributors page

## Questions?

If you have any questions about contributing, feel free to:
- Open a [Discussion](https://github.com/varkart/sql-lens-mcp/discussions)
- Ask in an existing issue
- Reach out to maintainers

Thank you for contributing to sql-lens-mcp! 🚀
