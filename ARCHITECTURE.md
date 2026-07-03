# Architecture

Code layout and main components of sql-lens-mcp.

For development setup see [DEVELOPMENT.md](DEVELOPMENT.md); for testing see [docs/TESTING.md](docs/TESTING.md).

## Repository Layout

```
sql-lens-mcp/
├── src/                   # TypeScript source code (see below)
├── test/                  # Tests (mirror src structure)
│   ├── unit/              # Unit tests (no Docker required)
│   ├── integration/       # Integration tests (Testcontainers)
│   ├── e2e/               # Docker Compose setup for manual testing
│   └── helpers/           # Test utilities and container helpers
├── docs/                  # Documentation (client guides, testing)
├── examples/              # Example configuration files
├── dist/                  # Compiled JavaScript (gitignored)
└── .github/workflows/     # CI/CD pipelines
```

## Source Layout

```
src/
├── connections/
│   ├── adapters/          # Database-specific adapters (PostgreSQL, MySQL,
│   │                      # MariaDB, SQLite, DuckDB, MSSQL, Oracle)
│   ├── manager.ts         # Connection lifecycle
│   ├── config.ts          # Config loading
│   ├── persistence.ts     # Connection storage
│   └── schema-introspector.ts
├── security/
│   ├── query-validator.ts # SQL validation and classification
│   ├── sandbox.ts         # Resource limits (rows, timeouts)
│   ├── identifiers.ts     # Identifier validation and quoting
│   └── credential-store.ts
├── tools/
│   ├── database/          # MCP tool implementations (execute_query, etc.)
│   ├── resources/         # MCP resources (connections, history, exports)
│   ├── prompts/           # MCP prompts
│   └── apps/              # MCP Apps (connection manager UI)
├── elicitation/           # Interactive forms and confirmations
├── sampling/
│   ├── nl-to-sql.ts       # Natural language processing
│   └── prompt-builder.ts
├── cross-db/
│   ├── planner.ts         # Query decomposition
│   ├── executor.ts        # Parallel execution
│   └── merger.ts          # Result merging
├── transport/             # stdio and Streamable HTTP transports
├── visualization/
│   ├── ascii-table.ts     # Table rendering
│   └── ascii-chart.ts     # Chart rendering
├── utils/                 # Shared utilities (logging, errors, CSV)
├── server.ts              # MCP server setup
└── index.ts               # CLI entry point
```

## Component Overview

- **Connections** — each database type implements the `DatabaseAdapter` interface (`src/connections/adapters/base.ts`); the `ConnectionManager` owns lifecycle, persistence, and schema caching.
- **Security** — queries pass through AST-based validation, read-only enforcement, resource clamping, and identifier validation before reaching an adapter.
- **Tools/Resources/Prompts** — the MCP surface area; each tool is a thin layer over the managers above.
- **Transport** — the server runs over stdio (default) or Streamable HTTP.
