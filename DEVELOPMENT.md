# Development Guide

Local development setup and workflow for sql-lens-mcp.

- For contribution guidelines (branching, commits, pull requests), see [CONTRIBUTING.md](CONTRIBUTING.md)
- For testing, see [docs/TESTING.md](docs/TESTING.md)
- For code layout, see [ARCHITECTURE.md](ARCHITECTURE.md)

## Prerequisites

- **Node.js**: 20.x or higher
- **npm**: 8.x or higher
- **Docker**: Required for integration tests
- **Git**: For version control

## Initial Setup

1. **Clone the repository**
```bash
git clone https://github.com/varkart/sql-lens-mcp.git
cd sql-lens-mcp
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
cp examples/configs/sql-lens-mcp.config.example.json sql-lens-mcp.config.json
# Edit sql-lens-mcp.config.json with your database credentials
```

## Running a Local Build

Configure your MCP client with the absolute path to the compiled entry point:

```json
{
  "mcpServers": {
    "sql-lens-mcp-dev": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js", "--stdio"]
    }
  }
}
```

To install a local build globally instead:

```bash
npm pack
npm install -g ./sql-lens-mcp-<version>.tgz
```

## Development Workflow

```bash
# Start TypeScript compiler in watch mode
npm run dev

# In another terminal, run the server
npm start -- --config sql-lens-mcp.config.json --debug

# Format code
npm run format

# Lint code
npm run lint

# Clean build artifacts
npm run clean
```

## Available Scripts

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
npm run test:integration # Integration tests only (requires Docker)
npm run test:watch       # Watch mode
```

## Code Style

- **TypeScript**: Strict mode enabled
- **Module System**: ES modules (`type: "module"`)
- **Target**: ES2022
- **Formatting**: Prettier with 2-space indentation
- **Linting**: ESLint with TypeScript rules

Commit conventions, branch strategy, and the pull request process are documented in [CONTRIBUTING.md](CONTRIBUTING.md).

## Adding a New Database Adapter

1. **Create adapter file**: `src/connections/adapters/newdb.ts`
2. **Implement `DatabaseAdapter` interface**
3. **Add to adapter registry**: `src/connections/manager.ts`
4. **Create integration test**: `test/integration/adapters/newdb.test.ts`
5. **Update documentation**: Add to the README Database Support table
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

## Debugging

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
  "name": "Debug sql-lens-mcp",
  "program": "${workspaceFolder}/dist/index.js",
  "args": ["--stdio", "--debug"],
  "console": "integratedTerminal"
}
```
