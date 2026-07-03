# sql-lens-mcp

[![npm version](https://img.shields.io/npm/v/sql-lens-mcp.svg)](https://www.npmjs.com/package/sql-lens-mcp)
[![npm downloads](https://img.shields.io/npm/dm/sql-lens-mcp.svg)](https://www.npmjs.com/package/sql-lens-mcp)
[![GitHub stars](https://img.shields.io/github/stars/varkart/sql-lens-mcp?style=social)](https://github.com/varkart/sql-lens-mcp)
[![Status](https://img.shields.io/badge/status-production--ready-brightgreen)]()
[![CI](https://github.com/varkart/sql-lens-mcp/workflows/CI/badge.svg)](https://github.com/varkart/sql-lens-mcp/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-2024--11--05-blue)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)

**The AI-native database client. Query any database in plain English using Model Context Protocol.**

Built on [Model Context Protocol (MCP)](https://modelcontextprotocol.io), sql-lens-mcp brings natural language database interactions to AI assistants. No SQL knowledge needed—just ask questions naturally and get instant answers. Works with PostgreSQL, MySQL, SQLite, DuckDB, and more.

```
You: "Show me users who signed up this week"
AI: Found 47 users...
    [displays formatted results]

You: "Which products are running low on inventory?"
AI: [Shows top 10 with stock levels and reorder recommendations]

You: "Connect to my production database in read-only mode"
AI: ✅ Connected to PostgreSQL (read-only mode enabled)
```

---

## 📚 Table of Contents

- [🎯 Perfect For](#-perfect-for)
- [What You Can Do](#what-you-can-do)
- [Quick Start](#quick-start)
- [Examples](#examples)
- [Why sql-lens-mcp?](#why-sql-lens-mcp)
- [💼 Real-World Use Cases](#-real-world-use-cases)
- [Supported Clients](#supported-clients)
- [Configuration](#configuration)
- [MCP Tools](#mcp-tools)
- [MCP Resources](#mcp-resources)
- [MCP Prompts](#mcp-prompts)
- [CLI Options](#cli-options)
- [HTTP Transport](#http-transport)
- [Security](#security)
- [Database Support](#database-support)
- [Testing](#testing)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Perfect For

- **📊 Data Analysts** - Query data without waiting for SQL experts
- **💻 Developers** - Debug production databases conversationally
- **🔧 DevOps/SREs** - Investigate incidents with natural language
- **📱 Product Teams** - Self-service data access for decision-making
- **🎓 Students** - Learn databases interactively without SQL intimidation

---

## What You Can Do

### 💬 Talk to Databases in Plain English
```
"Show me the top 10 customers by revenue this quarter"
"Which products are running low on inventory?"
"Find all orders placed in the last 7 days"
```
No SQL required—just ask naturally and sql-lens-mcp handles the rest.

### 🔌 Connect to Any Database
- **PostgreSQL** - Production-grade with full feature support
- **MySQL / MariaDB** - Popular open-source databases
- **SQLite** - Perfect for local development and testing
- **DuckDB** - Analytics on Parquet, CSV, and JSON files
- **MSSQL** - Microsoft SQL Server integration
- **Oracle** - Enterprise database support

Manage multiple connections simultaneously, switch between databases seamlessly.

### 🔍 Explore Schemas Interactively
```
"What tables exist in this database?"
"Describe the structure of the orders table"
"Show me the relationships between users and orders"
```
Automatically discovers schemas, indexes, foreign keys, and constraints.

### 🛡️ Query Safely with Built-in Security
- **Read-only mode enforced by the database session** — writes fail inside the database itself, not just in a filter
- **Parser-based query validation** classifies statements from the SQL AST and fails closed on anything it cannot parse
- **Destructive-statement confirmation** — DROP, ALTER, and DELETE-without-WHERE prompt for explicit approval (on clients that support MCP elicitation)
- **Timeout protection** prevents runaway queries
- **Row limits and pagination** keep memory bounded
- **SQL injection prevention** with parameterized queries and strict identifier validation

### 📊 Visualize Results
Results displayed as formatted ASCII tables and charts directly in your AI chat interface.

### 💾 Persistent Connections
Connections automatically saved and restored between sessions. No need to re-enter credentials every time.

### 🙋 Interactive Setup
On clients that support MCP elicitation, `connect_database` asks for any missing connection details (host, database, credentials) through a form instead of failing - and potentially destructive statements ask for confirmation before running.

---

## Quick Start

Get up and running in under 2 minutes.

### Step 1: Install

**Using npx** (recommended - always runs the latest version):
```bash
# No global install required - run directly with npx:
npx -y sql-lens-mcp --stdio
```
npx downloads the package on first run and caches it for subsequent runs.

**Or install globally:**
```bash
npm install -g sql-lens-mcp

# Verify installation
sql-lens-mcp --version
```

Building from source instead? See [DEVELOPMENT.md](DEVELOPMENT.md).

### Step 2: Configure Your AI Assistant

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "sql-lens-mcp": {
      "command": "npx",
      "args": ["-y", "sql-lens-mcp", "--stdio"]
    }
  }
}
```

<details>
<summary>📋 Other clients (VS Code, Cursor, etc.)</summary>

**Claude Code (VS Code)**:
```json
{
  "claude.mcpServers": {
    "sql-lens-mcp": {
      "command": "npx",
      "args": ["-y", "sql-lens-mcp", "--stdio"]
    }
  }
}
```

**Cursor**:
```json
{
  "mcpServers": {
    "sql-lens-mcp": {
      "command": "npx",
      "args": ["-y", "sql-lens-mcp", "--stdio"]
    }
  }
}
```

See [all client configs →](docs/clients/)
</details>

### Step 3: Restart & Test

1. **Restart your AI assistant** completely (quit and reopen)
2. **Test the connection**:
   ```
   You: "Connect to an in-memory SQLite database with ID 'test'"
   AI: ✅ Connected to SQLite database 'test'

   You: "Create a users table with id, name, and email columns"
   AI: ✅ Created table 'users'

   You: "Insert 3 sample users"
   AI: ✅ Inserted 3 users

   You: "Show me all users"
   AI: [displays formatted table with your data]
   ```

**Having issues?** See [Troubleshooting Guide](TROUBLESHOOTING.md)

---

## Examples

### Example 1: Analyze User Activity

```
You: "Connect to my production PostgreSQL database"
AI: ✅ Connected

You: "Show me users who signed up last month but haven't logged in yet"
AI: SELECT u.id, u.email, u.created_at
    FROM users u
    WHERE u.created_at >= '2026-02-01'
      AND u.created_at < '2026-03-01'
      AND u.last_login_at IS NULL;

    Found 23 users:
    [formatted table]

You: "Export their emails to prepare an engagement campaign"
AI: [provides formatted email list]
```

### Example 2: Schema Exploration

```
You: "What's in my database?"
AI: Your database has 12 tables:
    - users (authentication and profiles)
    - orders (purchase history)
    - products (catalog)
    ...

You: "Show me how users connect to orders"
AI: Relationship: users.id → orders.user_id (one-to-many)
    Foreign key constraint ensures referential integrity

You: "Describe the orders table structure"
AI: Table: orders
    Columns:
    - id (integer, primary key)
    - user_id (integer, foreign key → users.id)
    - total (decimal)
    - status (varchar)
    - created_at (timestamp)
    ...
```

### Example 3: Data Validation

```
You: "Find records with invalid email formats"
AI: SELECT id, email FROM users
    WHERE email NOT LIKE '%_@__%.__%';

    Found 12 invalid emails:
    [shows results]

You: "How many orders have a negative total?"
AI: SELECT COUNT(*) FROM orders WHERE total < 0;

    Result: 0 (data integrity looks good!)
```

### Example 4: Cross-Database Queries

```
You: "Connect to both my staging and production databases"
AI: ✅ Connected to staging (PostgreSQL)
    ✅ Connected to production (PostgreSQL)

You: "Compare user counts between environments"
AI: Staging: 1,234 users
    Production: 45,678 users
    Difference: 44,444 users

You: "Show me tables that exist in production but not in staging"
AI: Missing tables in staging:
    - audit_logs
    - feature_flags
    - payment_methods
```

---

## Why sql-lens-mcp?

| Feature | sql-lens-mcp | Direct SQL | Database GUI | AI with Memory |
|---------|---------|------------|--------------|----------------|
| **Natural Language** | ✅ Built-in | ❌ No | ❌ No | ⚠️ Limited |
| **Multi-Database** | ✅ 6+ types | ⚠️ One at a time | ⚠️ One at a time | ❌ No |
| **AI Integration** | ✅ Native MCP | ❌ No | ❌ No | ⚠️ Copy-paste |
| **Safety Features** | ✅ Comprehensive | ❌ No | ⚠️ Basic | ❌ No |
| **Schema Context** | ✅ Automatic | ❌ Manual | ✅ Yes | ⚠️ Limited |
| **Version Control** | ✅ Config files | ✅ .sql files | ❌ No | ❌ No |
| **Learning Curve** | ⭐ Easy | ⭐⭐⭐ SQL expertise | ⭐⭐ Medium | ⭐⭐ Varies |

---


## 💼 Real-World Use Cases

### 📊 Use Case 1: Sales Performance Analysis

**Who:** Sarah, Business Analyst at an e-commerce company
**Challenge:** Needs to analyze Q4 sales trends for an executive presentation, but doesn't know SQL

```
Sarah: "Connect to the production database in read-only mode"
AI: ✅ Connected to PostgreSQL (read-only mode enabled for safety)

Sarah: "Show me top 10 products by revenue in Q4 2024"
AI: [formatted revenue table]

Sarah: "Which region had the highest growth compared to Q3?"
AI: West region showed strongest growth:
    Q3 2024: $2.1M → Q4 2024: $3.1M (47% increase)
    Key driver: Electronics category (+89%)
```

**Result:** Complete analysis in 15 minutes vs. 3 days waiting on the data team.

---

### 💻 Use Case 2: Production Bug Investigation

**Who:** Alex, Senior Developer
**Challenge:** API endpoint timing out in production, needs the root cause quickly

```
Alex: "Show me the slowest API requests in the last hour"
AI: /api/users/dashboard averages 4,500ms across 342 requests

Alex: "What queries are running against the users table from that endpoint?"
AI: Found the slow query. Issues detected:
    - SELECT * fetching 47 columns (only 8 used)
    - N+1 query pattern
    - Missing index on orders.user_id

Alex: "Show me index usage on the orders table"
AI: ❌ Missing: user_id index
    ✅ Recommendation: CREATE INDEX idx_user_id ON orders(user_id);
```

**Result:** Root cause identified in 10 minutes; the fix delivered a 96% improvement. No production risk from hand-typed queries.

---

### 🔧 Use Case 3: Incident Investigation

**Who:** Jordan, Site Reliability Engineer
**Challenge:** Overnight spike in error rates, investigating live during an incident call

```
Jordan: "Show me error rates by service in the last 6 hours"
AI: api-gateway: 45,231 errors (↑ 2,300%)
    99.2% are 504 Gateway Timeouts, starting at 02:14 UTC

Jordan: "What changed in the api-gateway config around 2 AM?"
AI: Deployment at 02:12 UTC (v2.4.2):
    max_connections reduced from 100 → 50

Jordan: "How many concurrent connections were we hitting at 2 AM?"
AI: Peak: 94 connections against the new limit of 50
    Diagnosis: connection pool exhausted after deploy
```

**Result:** Incident cause found in 8 minutes. Rollback initiated, postmortem data already collected.

---

### 🗄️ Use Case 4: Legacy Database Migration

**Who:** Maria, Software Engineer
**Challenge:** Migrating a 15-year-old legacy system with no documentation

```
Maria: "What tables exist in this database?"
AI: Found 47 tables. Most active:
    customers (124,891 rows), orders (1.2M rows), invoices (890,234 rows)

Maria: "What are the possible values for customers.status?"
AI: 0 (45,231 rows), 1 (78,890 rows), 2 (770 rows)
    ⚠️  No enum or lookup table found

Maria: "Are there any foreign keys not properly defined?"
AI: Found orphaned records:
    - invoices: 1,234 rows with invalid customer_id
    - orders: 89 rows with null customer_id
    Recommendation: clean up before migrating
```

**Result:** Complete database understanding in 2 hours vs. 2 weeks. Data quality issues identified before migration.

---

### 🎓 Use Case 5: Learning SQL Interactively

**Who:** Jamie, Computer Science Student
**Challenge:** Learning databases for the first time; SQL syntax feels intimidating

```
Jamie: "Show me students who are enrolled in Computer Science"
AI: I'll need to join tables for this:

    SELECT s.name, c.course_name
    FROM students s
    JOIN enrollments e ON s.id = e.student_id
    JOIN courses c ON e.course_id = c.id
    WHERE c.department = 'Computer Science';

    📚 Concept: JOINs connect related tables

Jamie: "What if I want students taking more than 3 courses?"
AI: [query using GROUP BY and HAVING]

    📚 Key difference:
       - WHERE: Filters rows BEFORE grouping
       - HAVING: Filters groups AFTER aggregation
```

**Result:** Jamie understands JOINs, aggregations, and indexes in 30 minutes — learning through real queries, not just theory.

---

## Supported Clients

sql-lens-mcp works with any MCP-compatible client. We provide detailed setup guides:

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

---

## Configuration

### Database Configuration

The server looks for configuration in this order:
1. `--config <path>` CLI argument
2. `./sql-lens-mcp.config.json` (current directory)
3. `~/.sql-lens-mcp/config.json`
4. `~/.sql-lens-mcp.config.json`

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
- `execute_query` - Execute SQL with validation, formatting, and offset pagination (`hasMore`/`nextOffset` metadata when results are truncated)
- `nl_query` - Natural language to SQL with optional auto-execute

### Schema Intelligence
- `describe_schema` - Inspect database schema
- `sample_rows` - Fetch representative rows from a table (default 10, max 100)
- `explain_query` - Show the query plan for a statement without executing it (Oracle requires access to `PLAN_TABLE`)
- `describe_relationships` - Foreign-key graph between tables for join planning

## MCP Resources

- `sql://connections` - JSON list of all connections
- `sql://history` - Last 50 query executions
- `query-result://{connectionId}/csv` - Most recent query result for a connection as CSV
- `query-result://{connectionId}/json` - Most recent query result for a connection as JSON

## MCP Prompts

- `explore-database` - Guided database exploration

## CLI Options

```bash
node dist/index.js [options]

Options:
  --stdio          Use stdio transport (default)
  --http           Use Streamable HTTP transport
  --config <path>  Path to config file
  --debug          Enable debug logging
  --port <number>  HTTP port (default: 3000)
```

## HTTP Transport

In addition to stdio (the default), the server supports the MCP Streamable HTTP transport for clients that connect over the network.

### Starting the server

```bash
# CLI flags
npx -y sql-lens-mcp --http --port 3000

# Or environment variables
SQL_LENS_MCP_HTTP=true SQL_LENS_MCP_PORT=3000 npx -y sql-lens-mcp
```

| Setting | CLI flag | Environment variable | Default |
|---------|----------|----------------------|---------|
| Enable HTTP | `--http` | `SQL_LENS_MCP_HTTP=true` | disabled (stdio) |
| Port | `--port <number>` | `SQL_LENS_MCP_PORT` | `3000` |
| Bind address | — | `SQL_LENS_MCP_HOST` | `127.0.0.1` |

The MCP endpoint is served at `http://<host>:<port>/mcp`.

### Sessions

The server runs in stateful mode: each `initialize` request creates a new session and the session ID is returned in the `mcp-session-id` response header. Clients must send this header on all subsequent requests. A `DELETE /mcp` request with the session header terminates the session. Database connections are shared across sessions within the process.

### Example: initialize with curl

```bash
curl -i -X POST http://127.0.0.1:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"1.0"}}}'
```

The response includes the `mcp-session-id` header to use on follow-up requests.

### Example: client configuration

For clients that support Streamable HTTP servers:

```json
{
  "mcpServers": {
    "sql-lens-mcp": {
      "type": "http",
      "url": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

### Security notes

- The server binds to `127.0.0.1` by default, so it is only reachable from the local machine.
- DNS rebinding protection is enabled when bound to a loopback address: requests with unexpected `Host` headers are rejected with `403`.
- The HTTP transport has **no built-in authentication or TLS**. If you need to expose it beyond localhost (via `SQL_LENS_MCP_HOST`), put it behind a reverse proxy that provides authentication and TLS; when bound to a non-loopback address, DNS rebinding protection is disabled so the proxy can forward arbitrary `Host` headers.

## Connection Persistence

Connections are persisted to `~/.sql-lens-mcp/connections.json` (mode 0600) for automatic restoration on restart. Passwords are stored in plaintext (similar to `~/.pgpass`).

## Security

Defense in depth, outermost layer first:

- **Session-level read-only enforcement** - read-only connections are enforced by the database itself: PostgreSQL/MySQL/MariaDB set read-only transactions on the session, SQLite and DuckDB open the file read-only, MSSQL and Oracle use a per-statement guard
- **AST-based query validation** - statements are classified by parsing the SQL (per dialect), so CTEs and EXPLAIN work in read-only mode while unparseable input fails closed
- **Multi-statement queries are blocked** (string-literal aware - semicolons inside strings do not false-positive)
- **Dangerous patterns blocked** (LOAD_FILE, xp_cmdshell, INTO OUTFILE, etc.) as a second layer
- **Destructive-statement confirmation** - on clients that support MCP elicitation, DROP/ALTER/DELETE-without-WHERE require explicit user approval before executing
- **Strict identifier validation** - table and schema names passed to tools are validated against a strict pattern and quoted per dialect
- Query timeout limits (max 5 minutes)
- Row limits (max 100,000 rows)

## Database Support

| Database   | Status      | Notes                          |
|------------|-------------|--------------------------------|
| PostgreSQL | ✅ Full     | Tested with v12+               |
| MySQL      | ✅ Full     | Tested with v8.0+              |
| SQLite     | ✅ Full     | Synchronous driver             |
| DuckDB     | ✅ Full     | Embedded; queries Parquet/CSV  |
| MSSQL      | ✅ Full     | Tested with SQL Server 2019+   |
| MariaDB    | ✅ Full     | Compatible with MySQL driver   |
| Oracle     | ⚠️  Optional | Requires manual oracledb install|

### Querying Files with DuckDB

DuckDB connections can query Parquet, CSV, and JSON files directly — no import step:

```
You: "Connect to an in-memory DuckDB database and show me the top 10 rows of sales.parquet"
AI: SELECT * FROM 'sales.parquet' LIMIT 10
```

Useful functions: `read_csv_auto('file.csv')`, `read_json_auto('file.json')`, glob patterns like `'data/*.parquet'`. File-backed databases work the same as SQLite (`"type": "duckdb", "path": "analytics.db"`), and `:memory:` gives a scratch analytics engine.

## Testing

The project has comprehensive unit and integration test suites:

```bash
npm run test:unit   # Fast, no Docker required
npm test            # Full suite - integration tests start Docker containers automatically
```

See [docs/TESTING.md](docs/TESTING.md) for the full guide (Testcontainers, E2E databases, manual testing with MCP clients).

## Documentation

- [DEVELOPMENT.md](DEVELOPMENT.md) — Local development setup and workflow
- [ARCHITECTURE.md](ARCHITECTURE.md) — Code layout and components
- [docs/TESTING.md](docs/TESTING.md) — Testing guide
- [docs/clients/](docs/clients/) — Client setup guides
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — Common issues and fixes
- [CONTRIBUTING.md](CONTRIBUTING.md) — Contribution guidelines
- [SECURITY.md](SECURITY.md) — Security policy

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Code of Conduct
- Development setup and workflow
- Testing requirements
- Code style guidelines
- Pull request process
- Commit message conventions

For security vulnerabilities, please see our [Security Policy](SECURITY.md).

Quick links:
- [Report a bug](https://github.com/varkart/sql-lens-mcp/issues/new?template=bug_report.md)
- [Request a feature](https://github.com/varkart/sql-lens-mcp/issues/new?template=feature_request.md)
- [Ask a question](https://github.com/varkart/sql-lens-mcp/discussions)

Thank you for contributing to sql-lens-mcp!

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2024 vk

---

**Project Status**: Active Development

**Maintained By**: [@varkart](https://github.com/varkart)

**Repository**: https://github.com/varkart/sql-lens-mcp
