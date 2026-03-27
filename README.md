# sql-mcp

[![npm version](https://img.shields.io/npm/v/sql-mcp.svg)](https://www.npmjs.com/package/sql-mcp)
[![npm downloads](https://img.shields.io/npm/dm/sql-mcp.svg)](https://www.npmjs.com/package/sql-mcp)
[![GitHub stars](https://img.shields.io/github/stars/varkart/sql-mcp?style=social)](https://github.com/varkart/sql-mcp)
[![CI](https://github.com/varkart/sql-mcp/workflows/CI/badge.svg)](https://github.com/varkart/sql-mcp/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-2024--11--05-blue)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

Production-grade MCP (Model Context Protocol) server for managing multiple database connections, translating natural language to SQL, and executing queries across databases with rich visualizations.

## Features

- **Multi-Database Support**: PostgreSQL, MySQL, SQLite, MSSQL, MariaDB, and Oracle
- **Natural Language Queries**: Convert natural language questions to SQL using LLM
- **Cross-Database Queries**: Execute queries across multiple databases with automatic merging
- **Schema Introspection**: Automatic schema discovery with caching
- **Security**: Query validation, sandboxing, and read-only mode
- **Visualization**: ASCII tables and charts for query results
- **Connection Persistence**: Save and restore connections across sessions
- **MCP Tools**: 6+ tools for database management and querying
- **MCP Resources**: Real-time access to connections and query history

## Supported MCP Clients

sql-mcp works with any MCP-compatible client. We provide detailed setup guides for popular clients:

| Client | Platform | Best For | Setup Difficulty |
|--------|----------|----------|------------------|
| [Claude Desktop](docs/clients/claude-desktop.md) | macOS, Windows, Linux | General AI chat with database access | ⭐ Easy |
| [Claude Code](docs/clients/claude-code.md) | VS Code | VS Code with Claude, MCP Apps support | ⭐ Easy |
| [Cline](docs/clients/cline.md) | VS Code | VS Code users, coding assistance | ⭐ Easy |
| [Cursor](docs/clients/cursor.md) | macOS, Windows, Linux | AI-native code editor | ⭐ Easy |
| [Windsurf](docs/clients/windsurf.md) | macOS, Windows, Linux | Multi-step flows, Codeium users | ⭐ Easy |
| [Continue](docs/clients/continue.md) | VS Code, JetBrains | Open-source, IDE integration | ⭐⭐ Medium |
| [Zed](docs/clients/zed.md) | macOS, Linux | High-performance editing | ⭐ Easy |
| [JetBrains IDEs](docs/clients/jetbrains.md) | All platforms | IntelliJ, PyCharm, WebStorm users | ⭐⭐ Medium |
| [ChatGPT Desktop](docs/clients/chatgpt.md) | macOS, Windows, Linux | OpenAI ecosystem (requires hosting) | ⭐⭐⭐ Complex |

**[See all client setup guides →](docs/clients/)**

### Installation Methods

#### Method 1: NPX (Recommended)
Auto-updates to latest version. Works with all clients:
```json
{
  "mcpServers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"]
    }
  }
}
```

#### Method 2: Local Development
For contributors or custom modifications:
```bash
git clone https://github.com/varkart/sql-mcp.git
cd sql-mcp
npm install
npm run build
```

Then configure your client with the absolute path to `dist/index.js`.

**Note**: Package name varies by client (`mcpServers`, `context_servers`, etc.). See [client-specific guides](docs/clients/) for exact configuration.

## Installation

```bash
npm install
npm run build
```

## Quick Start

### 1. Build the Project

```bash
npm install
npm run build
```

### 2. Test the Server

```bash
node debug-server.js
```

Expected output:
```
✅ Server initialized successfully!
✅ Tools retrieved successfully!
✅ All tests passed!
```

### 3. Configure Your MCP Client

sql-mcp works with any MCP-compatible client. Choose your client below for detailed setup instructions:

#### Supported Clients

| Client | Platform | Setup Guide |
|--------|----------|-------------|
| **Claude Desktop** | macOS, Windows, Linux | [Setup Guide →](docs/clients/claude-desktop.md) |
| **Claude Code** | VS Code Extension | [Setup Guide →](docs/clients/claude-code.md) |
| **Cline** (VS Code) | VS Code Extension | [Setup Guide →](docs/clients/cline.md) |
| **Cursor** | macOS, Windows, Linux | [Setup Guide →](docs/clients/cursor.md) |
| **Windsurf** | macOS, Windows, Linux | [Setup Guide →](docs/clients/windsurf.md) |
| **Continue** | VS Code, JetBrains | [Setup Guide →](docs/clients/continue.md) |
| **Zed** | macOS, Linux | [Setup Guide →](docs/clients/zed.md) |
| **JetBrains IDEs** | All platforms | [Setup Guide →](docs/clients/jetbrains.md) |
| **ChatGPT Desktop** | macOS, Windows, Linux | [Setup Guide →](docs/clients/chatgpt.md) |

**See all clients**: [docs/clients/](docs/clients/) for complete setup guides and configuration examples.

#### Quick Setup Example (Claude Desktop)

For Claude Desktop users, here's a quick example:

- **Config file location**:
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
  - Linux: `~/.config/Claude/claude_desktop_config.json`

- **Configuration** (replace with your actual path):
  ```json
  {
    "mcpServers": {
      "sql-mcp": {
        "command": "node",
        "args": [
          "/ABSOLUTE/PATH/TO/sql-mcp/dist/index.js",
          "--stdio"
        ],
        "env": {}
      }
    }
  }
  ```

**Important**: Use the **absolute path** to your project directory!

For detailed instructions and NPX setup, see the [Claude Desktop Setup Guide](docs/clients/claude-desktop.md).

### 4. Restart Your MCP Client

Quit and restart Claude Desktop/Code for the changes to take effect.

### 5. Verify Connection

In your MCP client, try using the `list_connections` tool. You should see an empty list.

**Having connection issues?** See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed debugging steps.

## Configuration

### Database Configuration

The server looks for configuration in this order:
1. `--config <path>` CLI argument
2. `./sql-mcp.config.json` (current directory)
3. `~/.sql-mcp/config.json`
4. `~/.sql-mcp.config.json`

**Note**: Database configuration is optional. You can connect to databases dynamically using the `connect_database` tool without a config file.

### Config Format

```json
{
  "defaults": {
    "readOnly": true,
    "queryTimeout": 30000,
    "maxRows": 1000
  },
  "connections": {
    "db-id": {
      "name": "Friendly Name",
      "env": "production",
      "config": {
        "type": "postgresql",
        "host": "localhost",
        "port": 5432,
        "database": "mydb",
        "user": "user",
        "password": "${DB_PASSWORD}",
        "readOnly": true,
        "ssl": false
      }
    }
  }
}
```

Environment variables in passwords are supported using `${VAR_NAME}` syntax.

## MCP Tools

### Connection Management
- `connect_database` - Connect to a database
- `disconnect_database` - Disconnect from a database
- `list_connections` - List all connections with status

### Query Execution
- `execute_query` - Execute SQL with validation and formatting
- `nl_query` - Natural language to SQL with optional auto-execute
- `describe_schema` - Inspect database schema

## MCP Resources

- `sql://connections` - JSON list of all connections
- `sql://history` - Last 50 query executions

## MCP Prompts

- `explore-database` - Guided database exploration

## CLI Options

```bash
node dist/index.js [options]

Options:
  --stdio          Use stdio transport (default)
  --config <path>  Path to config file
  --debug          Enable debug logging
  --port <number>  HTTP port (not yet implemented)
```

## Connection Persistence

Connections are persisted to `~/.sql-mcp/connections.json` (mode 0600) for automatic restoration on restart. Passwords are stored in plaintext (similar to `~/.pgpass`).

## Security

- Multi-statement queries are blocked
- Dangerous patterns (LOAD_FILE, xp_cmdshell, etc.) are blocked
- Read-only mode prevents write operations
- Query timeout limits (max 5 minutes)
- Row limits (max 100,000 rows)

## Local Development Setup

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **Docker**: Required for integration tests
- **Git**: For version control

### Initial Setup

1. **Clone the repository**
```bash
git clone https://github.com/varkart/sql-mcp.git
cd sql-mcp
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the project**
```bash
npm run build
```

4. **Create a test configuration** (optional)
```bash
cp examples/configs/sql-mcp.config.example.json sql-mcp.config.json
# Edit sql-mcp.config.json with your database credentials
```

### Development Workflow

```bash
# Start TypeScript compiler in watch mode
npm run dev

# In another terminal, run the server
npm start -- --config sql-mcp.config.json --debug

# Format code
npm run format

# Lint code
npm run lint

# Clean build artifacts
npm run clean
```

## Testing

### Quick Start Testing

**Without Docker (Unit Tests Only)**:
```bash
npm run test:unit
```

**With Docker (Full Test Suite)**:
```bash
# 1. Start Docker Desktop
# 2. Run all tests
npm test
```

### Manual Testing

For manual testing and experimentation, you can use pre-configured test databases:

**Option 1: In-Memory SQLite (Fast, No Docker)**
```bash
# Build and run the demo
npm run build
npx tsc create-test-db.ts demo-test-db.ts --module nodenext --moduleResolution nodenext --target es2022 --lib es2022 --esModuleInterop
node demo-test-db.js
```

**Option 2: Docker Compose (Real Databases)**
```bash
# Start all databases (PostgreSQL, MySQL, MariaDB, MSSQL)
cd test/e2e
docker compose up -d

# Seed with test data
./setup.sh

# Stop when done
docker compose down
cd ../..
```

See [TESTING.md](TESTING.md) for detailed testing instructions and [test/e2e/README.md](test/e2e/README.md) for E2E test setup.

### Test Structure

The project includes comprehensive unit and integration tests using Testcontainers.

#### Prerequisites
- **Docker Desktop**: Must be running for integration tests
- **4GB+ RAM**: Recommended for running multiple containers
- **Disk Space**: ~2GB for container images (downloaded once)

#### Test Commands

```bash
# Run all tests (unit + integration)
npm test

# Unit tests only (fast, no Docker required)
npm run test:unit

# Integration tests only (requires Docker)
npm run test:integration

# Watch mode (auto-rerun on file changes)
npm run test:watch
```

#### What Gets Tested

**Unit Tests** (~1-2 seconds):
- Query validation and classification
- Security checks (multi-statement, dangerous patterns)
- Read-only mode enforcement
- Statement type detection

**Integration Tests** (~30-60 seconds):
- Real database connections (PostgreSQL, MySQL, MariaDB, MSSQL)
- Query execution with parameters
- Schema introspection
- Row limiting and pagination
- Connection lifecycle management
- Multi-database operations
- Schema caching

#### Test Containers

Integration tests automatically spin up Docker containers:

| Database   | Image                              | Version | Startup Time |
|------------|------------------------------------|---------|--------------|
| PostgreSQL | `postgres:16-alpine`               | 16      | ~5-10s       |
| MySQL      | `mysql:8.4`                        | 8.4     | ~10-15s      |
| MariaDB    | `mariadb:11.4`                     | 11.4    | ~10-15s      |
| MSSQL      | `mcr.microsoft.com/mssql/server:2022` | 2022 | ~15-20s      |

**Container Features**:
- ✅ Automatic startup and cleanup
- ✅ Parallel initialization for speed
- ✅ Isolated per test run
- ✅ No data persistence between runs
- ✅ Random port assignment (no conflicts)

#### First-Time Test Run

The first run will:
1. Download Docker images (~2GB total)
2. Take 2-3 minutes to pull images
3. Subsequent runs are much faster (~30-60s)

```bash
# First run (downloads images)
npm test
# Output: Pulling images... (this happens once)

# Subsequent runs (uses cached images)
npm test
# Output: Starting containers... (fast)
```

#### Troubleshooting Tests

**Docker not running**:
```
Error: Cannot connect to Docker daemon
Solution: Start Docker Desktop
```

**Port conflicts**:
```
Error: Port already in use
Solution: Testcontainers uses random ports automatically
```

**Out of memory**:
```
Error: Container killed (OOM)
Solution: Increase Docker memory to 4GB+ in Docker Desktop settings
```

**Slow tests**:
```
First run: Normal (downloading images)
Subsequent runs: Check Docker Desktop resources
```

See [test/README.md](test/README.md) for detailed testing documentation.

## Development Standards

### Code Style

- **TypeScript**: Strict mode enabled
- **Module System**: ES modules (`type: "module"`)
- **Target**: ES2022
- **Formatting**: Prettier with 2-space indentation
- **Linting**: ESLint with TypeScript rules

### Commit Standards

**Format**:
```
<type>: <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions or changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Build/tooling changes

**Examples**:
```bash
git commit -m "feat: Add MariaDB adapter with connection pooling"

git commit -m "fix: Prevent SQL injection in parameterized queries

- Updated query validator to escape parameters
- Added tests for malicious input
- Closes #123"

git commit -m "test: Add integration tests for MSSQL adapter"
```

### Branch Strategy

- **`main`**: Production-ready code
- **`dev`**: Development branch for integration
- **`feature/*`**: Feature branches (branch from `dev`)
- **`fix/*`**: Bug fix branches (branch from `dev`)

**Workflow**:
```bash
# Create feature branch
git checkout dev
git pull origin dev
git checkout -b feature/add-oracle-support

# Make changes and commit
git add .
git commit -m "feat: Add Oracle database adapter"

# Push and create PR
git push -u origin feature/add-oracle-support
# Create PR: feature/add-oracle-support → dev
```

### Pull Request Guidelines

**Before Submitting**:
- ✅ All tests pass (`npm test`)
- ✅ Code is formatted (`npm run format`)
- ✅ No lint errors (`npm run lint`)
- ✅ TypeScript compiles (`npm run build`)
- ✅ Added tests for new features
- ✅ Updated documentation

**PR Title Format**:
```
feat: Add support for Oracle database connections
fix: Resolve memory leak in connection pooling
docs: Update testing documentation with troubleshooting
```

**PR Description Template**:
```markdown
## Summary
Brief description of changes

## Changes
- Added Oracle adapter
- Implemented connection pooling
- Added integration tests

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Tested with Oracle 19c
- [ ] Manual testing completed

## Breaking Changes
None / List any breaking changes

## Related Issues
Closes #123
```

### Code Review Checklist

**Reviewers should verify**:
- [ ] Code follows TypeScript best practices
- [ ] All tests pass in CI/CD
- [ ] No security vulnerabilities introduced
- [ ] Documentation is updated
- [ ] Changes are backward compatible (or breaking changes documented)
- [ ] Error handling is comprehensive
- [ ] Logging is appropriate (debug/info/warn/error)
- [ ] No sensitive data in logs or commits

## Development

### Project Structure

```
sql-mcp/
├── src/                    # TypeScript source code
│   ├── connections/        # Database connection management
│   ├── security/          # Security and validation
│   ├── sampling/          # NL-to-SQL conversion
│   ├── cross-db/          # Cross-database queries
│   ├── visualization/     # ASCII rendering
│   ├── elicitation/       # Interactive forms
│   ├── utils/             # Shared utilities
│   ├── server.ts          # MCP server
│   └── index.ts           # CLI entry point
├── test/                  # Test files (mirrors src structure)
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── helpers/          # Test utilities
├── dist/                 # Compiled JavaScript (gitignored)
└── .github/workflows/    # CI/CD pipelines
```

### Available Scripts

```bash
# Development
npm run dev              # TypeScript watch mode
npm start                # Run the server
npm run build            # Compile TypeScript
npm run clean            # Remove build artifacts

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier

# Testing
npm test                 # All tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:watch       # Watch mode
```

### Adding a New Database Adapter

1. **Create adapter file**: `src/connections/adapters/newdb.ts`
2. **Implement `DatabaseAdapter` interface**
3. **Add to adapter registry**: `src/connections/manager.ts`
4. **Create integration test**: `test/integration/adapters/newdb.test.ts`
5. **Update documentation**: Add to README Database Support table
6. **Add to testcontainers**: `test/helpers/containers.ts`

Example:
```typescript
// src/connections/adapters/newdb.ts
import type { DatabaseAdapter } from './base.js';

export class NewDBAdapter implements DatabaseAdapter {
  readonly type = 'newdb';

  async connect(config: ConnectionConfig): Promise<void> {
    // Implementation
  }

  // ... other methods
}

// Register in manager.ts
this.registerAdapterFactory('newdb', () => new NewDBAdapter());
```

### Debugging

**Enable debug logging**:
```bash
node dist/index.js --debug --stdio
```

**Debug output location**:
- Logs: `stderr` (structured JSON)
- MCP protocol: `stdout`

**Debug in VS Code**:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug sql-mcp",
  "program": "${workspaceFolder}/dist/index.js",
  "args": ["--stdio", "--debug"],
  "console": "integratedTerminal"
}
```

## Database Support

| Database   | Status      | Notes                          |
|------------|-------------|--------------------------------|
| PostgreSQL | ✅ Full     | Tested with v12+               |
| MySQL      | ✅ Full     | Tested with v8.0+              |
| SQLite     | ✅ Full     | Synchronous driver             |
| MSSQL      | ✅ Full     | Tested with SQL Server 2019+   |
| MariaDB    | ✅ Full     | Compatible with MySQL driver   |
| Oracle     | ⚠️  Optional | Requires manual oracledb install|

## Architecture

```
src/
├── connections/
│   ├── adapters/          # Database-specific adapters
│   ├── manager.ts         # Connection lifecycle
│   ├── config.ts          # Config loading
│   ├── persistence.ts     # Connection storage
│   └── schema-introspector.ts
├── security/
│   ├── query-validator.ts # SQL validation
│   ├── sandbox.ts         # Resource limits
│   └── credential-store.ts
├── sampling/
│   ├── nl-to-sql.ts       # Natural language processing
│   └── prompt-builder.ts
├── cross-db/
│   ├── planner.ts         # Query decomposition
│   ├── executor.ts        # Parallel execution
│   └── merger.ts          # Result merging
├── visualization/
│   ├── ascii-table.ts     # Table rendering
│   └── ascii-chart.ts     # Chart rendering
├── server.ts              # MCP server setup
└── index.ts               # CLI entry point
```

## Contributing

We welcome contributions! This section provides guidelines for contributing to sql-mcp.

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sql-mcp.git
   cd sql-mcp
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/varkart/sql-mcp.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Process

#### 1. Make Your Changes

- Write clean, maintainable TypeScript code
- Follow existing code style and patterns
- Add JSDoc comments for public APIs
- Keep functions focused and small

#### 2. Add Tests

**Required for all changes**:
- Add unit tests for new utilities/validators
- Add integration tests for new adapters/features
- Ensure all tests pass: `npm test`

**Test Coverage Goals**:
- Critical paths: 100%
- Database adapters: 90%+
- Utilities: 80%+

#### 3. Update Documentation

- Update README.md for new features
- Add JSDoc comments for new functions
- Update test/README.md if test setup changes
- Add examples for new MCP tools

#### 4. Run Quality Checks

```bash
# Compile TypeScript
npm run build

# Run all tests
npm test

# Format code
npm run format

# Lint code
npm run lint
```

All checks must pass before submitting a PR.

### Types of Contributions

#### 🐛 Bug Fixes

1. **Create an issue** describing the bug
2. **Write a failing test** that reproduces the bug
3. **Fix the bug** and ensure test passes
4. **Submit PR** with "fix:" prefix

Example:
```bash
git checkout -b fix/connection-pool-leak
# Make changes
git commit -m "fix: Resolve connection pool leak in PostgreSQL adapter

- Added proper connection cleanup in disconnect()
- Added test to verify pool is empty after disconnect
- Fixes #456"
```

#### ✨ New Features

1. **Open an issue** to discuss the feature first
2. **Wait for approval** from maintainers
3. **Implement the feature** with tests
4. **Submit PR** with "feat:" prefix

Example:
```bash
git checkout -b feature/add-redis-cache
# Make changes
git commit -m "feat: Add Redis caching layer for schema introspection

- Implemented Redis adapter for schema caching
- Added configuration options for Redis connection
- Added integration tests with testcontainers
- Updated documentation with Redis setup instructions

Closes #123"
```

#### 📚 Documentation

1. **Identify documentation gaps** or errors
2. **Make improvements**
3. **Submit PR** with "docs:" prefix

Example:
```bash
git commit -m "docs: Add examples for cross-database queries

- Added 3 real-world examples
- Included error handling patterns
- Added troubleshooting section"
```

#### 🧪 Tests

1. **Improve test coverage**
2. **Add integration tests** for untested scenarios
3. **Submit PR** with "test:" prefix

### Pull Request Process

#### 1. Update Your Branch

```bash
# Sync with upstream
git fetch upstream
git rebase upstream/dev
```

#### 2. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

#### 3. Create Pull Request

- **Base**: `dev` (not `main`)
- **Title**: Follow commit message format
- **Description**: Use the PR template

#### 4. Code Review

- Respond to reviewer comments
- Make requested changes
- Push updates to the same branch

#### 5. Merge

- Maintainers will merge after approval
- PRs merged to `dev` first
- `dev` → `main` after testing

### Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

**Format**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Build/tooling changes
- `ci`: CI/CD changes

**Scope** (optional):
- `adapter`: Database adapter changes
- `security`: Security-related changes
- `core`: Core functionality
- `tests`: Test-related changes

**Examples**:
```bash
# Simple commit
git commit -m "feat(adapter): Add SQLite WAL mode support"

# Detailed commit
git commit -m "fix(security): Prevent SQL injection in query validator

- Updated regex to handle edge cases
- Added test cases for malicious inputs
- Improved error messages

Fixes #789"

# Breaking change
git commit -m "feat(api)!: Change connection config format

BREAKING CHANGE: Connection configs now require explicit 'config' wrapper.
See migration guide in docs/MIGRATION.md"
```

### Code Style Guidelines

#### TypeScript

```typescript
// ✅ Good
export async function validateQuery(
  sql: string,
  readOnly: boolean
): Promise<ValidationResult> {
  if (!sql || sql.trim().length === 0) {
    throw new ValidationError('Query cannot be empty');
  }

  const statement = classifyStatement(sql);
  return { statement, isValid: true };
}

// ❌ Bad
export async function validateQuery(sql: string, readOnly: boolean) {
  if (!sql || sql.trim().length === 0) {
    throw new ValidationError('Query cannot be empty');
  }
  const statement = classifyStatement(sql);
  return { statement, isValid: true };
}
```

#### Error Handling

```typescript
// ✅ Good
try {
  await adapter.connect(config);
  logger.info('Connection established', { id: connectionId });
} catch (error) {
  const err = error as Error;
  logger.error('Connection failed', { id: connectionId, error: err.message });
  throw new ConnectionError(`Failed to connect: ${err.message}`);
}

// ❌ Bad
try {
  await adapter.connect(config);
} catch (error) {
  console.log('Error:', error);
  throw error;
}
```

#### Logging

```typescript
// ✅ Good
logger.debug('Executing query', { connectionId, sql: sql.substring(0, 100) });
logger.info('Query completed', { connectionId, rowCount, executionTimeMs });
logger.warn('Query timeout approaching', { connectionId, elapsedMs });
logger.error('Query failed', { connectionId, error: err.message });

// ❌ Bad
console.log('Query:', sql);
console.error(error);
```

### Testing Guidelines

#### Unit Tests

```typescript
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { validateQuery } from '../../dist/security/query-validator.js';

describe('Query Validator', () => {
  describe('validateQuery', () => {
    it('should reject multi-statement queries', () => {
      expect(() => {
        validateQuery('SELECT * FROM users; DROP TABLE users;', false);
      }).to.throw('Multiple statements are not allowed');
    });

    it('should allow valid SELECT queries', () => {
      expect(() => {
        validateQuery('SELECT * FROM users WHERE id = 1', true);
      }).to.not.throw();
    });
  });
});
```

#### Integration Tests

```typescript
import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { PostgreSQLAdapter } from '../../../dist/connections/adapters/postgresql.js';
import { getTestContainers } from '../../helpers/containers.js';

describe('PostgreSQL Adapter', function() {
  this.timeout(60000);

  let adapter: PostgreSQLAdapter;
  let config: ConnectionConfig;

  before(async () => {
    const containers = await getTestContainers();
    config = containers.getConfig('postgresql')!;
    adapter = new PostgreSQLAdapter();
    await adapter.connect(config);
  });

  after(async () => {
    await adapter.disconnect();
  });

  it('should execute queries', async () => {
    const result = await adapter.execute('SELECT 1 as value');
    expect(result.rows).to.have.lengthOf(1);
    expect(result.rows[0].value).to.equal(1);
  });
});
```

### Security

#### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead:
1. Email security concerns to: [your-email@example.com]
2. Include detailed description and steps to reproduce
3. Wait for response before public disclosure

#### Security Checklist for PRs

- [ ] No hardcoded credentials
- [ ] No SQL injection vulnerabilities
- [ ] Proper input validation
- [ ] No sensitive data in logs
- [ ] Dependencies are up to date
- [ ] No exposure of internal paths

### Getting Help

- **Questions**: Open a [Discussion](https://github.com/varkart/sql-mcp/discussions)
- **Bugs**: Open an [Issue](https://github.com/varkart/sql-mcp/issues)
- **Chat**: Join our Discord (link TBD)

### Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in PR merge commits

Thank you for contributing to sql-mcp! 🎉

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2024 vk

---

**Project Status**: Active Development

**Maintained By**: [@varkart](https://github.com/varkart)

**Repository**: https://github.com/varkart/sql-mcp
