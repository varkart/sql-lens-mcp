# mcp-sql-explorer

[![npm version](https://img.shields.io/npm/v/mcp-sql-explorer.svg)](https://www.npmjs.com/package/mcp-sql-explorer)
[![npm downloads](https://img.shields.io/npm/dm/mcp-sql-explorer.svg)](https://www.npmjs.com/package/mcp-sql-explorer)
[![GitHub stars](https://img.shields.io/github/stars/varkart/sql-mcp?style=social)](https://github.com/varkart/sql-mcp)
[![Status](https://img.shields.io/badge/status-production--ready-brightgreen)]()
[![CI](https://github.com/varkart/sql-mcp/workflows/CI/badge.svg)](https://github.com/varkart/sql-mcp/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-2024--11--05-blue)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

**The AI-native database client. Query any database in plain English using Model Context Protocol.**

Built on [Model Context Protocol (MCP)](https://modelcontextprotocol.io), mcp-sql-explorer brings natural language database interactions to AI assistants. No SQL knowledge needed—just ask questions naturally and get instant answers. Works with PostgreSQL, MySQL, SQLite, and more.

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
- [Installation](#installation)
- [Why mcp-sql-explorer?](#why-mcp-sql-explorer)
- [💼 Real-World Use Cases](#-real-world-use-cases)
- [Supported Clients](#supported-clients)
- [Configuration](#configuration)
- [MCP Tools](#mcp-tools)
- [Security](#security)
- [Database Support](#database-support)
- [Local Development](#local-development-setup)
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
No SQL required—just ask naturally and mcp-sql-explorer handles the rest.

### 🔌 Connect to Any Database
- **PostgreSQL** - Production-grade with full feature support
- **MySQL / MariaDB** - Popular open-source databases
- **SQLite** - Perfect for local development and testing
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
- **Read-only mode** for production databases
- **Query validation** blocks dangerous operations
- **Timeout protection** prevents runaway queries
- **Row limits** prevent memory exhaustion
- **SQL injection prevention** with parameterized queries

### 📊 Visualize Results
Results displayed as formatted ASCII tables and charts directly in your AI chat interface.

### 💾 Persistent Connections
Connections automatically saved and restored between sessions. No need to re-enter credentials every time.

---

## Quick Start

Get up and running in under 2 minutes.

### Step 1: Install

**Using NPX** (recommended - auto-updates):
```bash
# No installation needed! Use directly:
npx -y mcp-sql-explorer --stdio
```

**Or install globally:**
```bash
npm install -g mcp-sql-explorer
```

### Step 2: Configure Your AI Client

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "mcp-sql-explorer": {
      "command": "npx",
      "args": ["-y", "mcp-sql-explorer", "--stdio"]
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
    "mcp-sql-explorer": {
      "command": "npx",
      "args": ["-y", "mcp-sql-explorer", "--stdio"]
    }
  }
}
```

**Cursor**:
```json
{
  "mcpServers": {
    "mcp-sql-explorer": {
      "command": "npx",
      "args": ["-y", "mcp-sql-explorer", "--stdio"]
    }
  }
}
```

See [all client configs →](docs/clients/)
</details>

### Step 3: Restart & Test

1. **Restart your AI client** completely (quit and reopen)
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

## Installation

## Why mcp-sql-explorer?

| Feature | mcp-sql-explorer | Direct SQL | Database GUI | AI with Memory |
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
**Challenge:** Needs to analyze Q4 sales trends for executive presentation, but doesn't know SQL
**Traditional Approach:** Submit request to data team → wait 2-3 days → get CSV → realize need different data → repeat

**With mcp-sql-explorer:**

```
Sarah: "Connect to the production database in read-only mode"
AI: ✅ Connected to PostgreSQL (read-only mode enabled for safety)

Sarah: "Show me top 10 products by revenue in Q4 2024"
AI: Analyzing sales data...

    Product Name          | Revenue    | Units Sold
    --------------------- | ---------- | ----------
    Premium Widget Pro    | $247,500   | 450
    Smart Gadget Elite    | $189,200   | 820
    ...

Sarah: "Which region had the highest growth compared to Q3?"
AI: West region showed strongest growth:
    Q3 2024: $2.1M → Q4 2024: $3.1M (47% increase)

    Key driver: Electronics category (+89%)
    Top product: Premium Widget Pro

Sarah: "Show me hourly sales pattern for Premium Widget Pro"
AI: [ASCII chart showing 24-hour sales distribution]

    Peak hours: 8-9 PM EST (32% of daily volume)
    Lowest: 3-4 AM EST (2% of daily volume)

    Recommendation: Focus ad spend on 6-10 PM window
```

**Result:** Complete analysis in 15 minutes vs. 3 days. Sarah delivers insights in real-time during meeting.

---

### 💻 Use Case 2: Production Bug Investigation

**Who:** Alex, Senior Developer
**Challenge:** API endpoint timing out in production, need to find the root cause quickly
**Traditional Approach:** SSH to production → run raw SQL → risk of typos → manual analysis → coordinate with DBA

**With mcp-sql-explorer:**

```
Alex: "Connect to prod-api database"
AI: ✅ Connected to MySQL (read-only mode)

Alex: "Show me the slowest API requests in the last hour"
AI: SELECT endpoint, AVG(response_time_ms) as avg_time,
         COUNT(*) as count
    FROM api_logs
    WHERE timestamp > NOW() - INTERVAL 1 HOUR
    GROUP BY endpoint
    ORDER BY avg_time DESC
    LIMIT 10;

    Endpoint                    | Avg Time | Count
    --------------------------- | -------- | -----
    /api/users/dashboard        | 4,500ms  | 342
    /api/products/search        | 2,100ms  | 1,891
    ...

Alex: "What queries are running against the users table from the dashboard endpoint?"
AI: Found 3 queries. The slow one is:

    SELECT u.*, p.*, o.*, ...
    FROM users u
    LEFT JOIN profiles p ON ...
    LEFT JOIN orders o ON ...
    WHERE u.id = ?

    ⚠️  Issues detected:
    - SELECT * fetching 47 columns (only 8 used)
    - N+1 query pattern (runs for each user)
    - Missing index on orders.user_id

Alex: "Show me index usage on orders table"
AI: Current indexes:
    - PRIMARY KEY (id)
    - INDEX created_at

    ❌ Missing: user_id index
    ✅ Recommendation: CREATE INDEX idx_user_id ON orders(user_id);

Alex: "How many users are affected by this slow query?"
AI: 342 unique users in the last hour.
    Average response time: 4.5 seconds
    Expected with index: ~200ms (estimated 95% improvement)
```

**Result:** Root cause identified in 10 minutes. Fix deployed, confirmed 96% improvement. No production risk from manual queries.

---

### 🔧 Use Case 3: Incident Investigation

**Who:** Jordan, Site Reliability Engineer
**Challenge:** Overnight spike in error rates, need to investigate cause during incident call
**Traditional Approach:** Write SQL from memory under pressure → potential mistakes → coordinate with on-call DBA → manual correlation

**With mcp-sql-explorer:**

```
Jordan: "Connect to prod-monitoring database"
AI: ✅ Connected to PostgreSQL

Jordan: "Show me error rates by service in the last 6 hours"
AI: [Table showing error counts]

    api-gateway: 45,231 errors (↑ 2,300%)
    auth-service: 12 errors (normal)
    data-service: 89 errors (normal)

Jordan: "What types of errors is api-gateway throwing?"
AI: Error breakdown:
    - 504 Gateway Timeout: 44,891 (99.2%)
    - 500 Internal Server Error: 340 (0.8%)

    Pattern: Started at 02:14 AM UTC

Jordan: "Show me what changed in the api-gateway config around 2 AM"
AI: Found deployment at 02:12 AM UTC:
    Version: v2.4.1 → v2.4.2
    Change: Updated connection pool settings

    New config:
    - max_connections: 100 → 50 (⚠️ reduced)
    - timeout: 30s → 10s (⚠️ reduced)

Jordan: "How many concurrent connections were we hitting at 2 AM?"
AI: Average concurrent connections at 02:14-02:20 AM: 87
    Peak: 94 connections

    ⚠️  Current limit: 50 connections

    Diagnosis: Connection pool exhausted after deploy

Jordan: "Show me when this was working previously"
AI: Last 7 days connection usage:
    - Average: 72 connections
    - Peak: 118 connections (3 AM traffic spike)

    ✅ Previous limit (100) was adequate
    ❌ New limit (50) insufficient
```

**Result:** Incident cause found in 8 minutes. Rollback initiated. Postmortem data already collected.

---

### 🗄️ Use Case 4: Legacy Database Migration

**Who:** Maria, Software Engineer
**Challenge:** Tasked with migrating 15-year-old legacy system, no documentation exists
**Traditional Approach:** Manual exploration → draw ER diagrams → guess relationships → hope nothing breaks

**With mcp-sql-explorer:**

```
Maria: "Connect to legacy-crm database"
AI: ✅ Connected to MSSQL

Maria: "What tables exist in this database?"
AI: Found 47 tables. Most active:
    - customers (124,891 rows)
    - orders (1.2M rows)
    - products (8,432 rows)
    - invoices (890,234 rows)
    ...

Maria: "Explain the customers table structure"
AI: Table: customers

    Columns:
    - id (int, PRIMARY KEY)
    - legacy_id (varchar) ⚠️ Still in use
    - name (varchar)
    - created_date (datetime)
    - status (int) ⚠️ No foreign key
    ...

    Relationships:
    → orders.customer_id
    → invoices.cust_id (⚠️ inconsistent naming)

Maria: "What are the possible values for status?"
AI: SELECT DISTINCT status, COUNT(*)
    FROM customers
    GROUP BY status;

    Status | Count    | Notes
    ------ | -------- | -----
    0      | 45,231   | Likely 'inactive'
    1      | 78,890   | Likely 'active'
    2      | 770      | Unknown

    ⚠️  No enum or lookup table found

Maria: "Show me customers with status = 2"
AI: Found 770 customers:
    - All have created_date before 2015
    - All have orders.status = 'refunded'

    Inference: status = 2 means 'refunded accounts'

Maria: "Are there any foreign keys not properly defined?"
AI: Found orphaned records:
    - invoices: 1,234 rows with invalid customer_id
    - orders: 89 rows with null customer_id

    Migration risk: High
    Recommendation: Clean up before migrating

Maria: "What's the relationship between orders and line_items?"
AI: orders.id → line_items.order_ref

    ⚠️  Issues:
    - Inconsistent naming (id vs order_ref)
    - No explicit foreign key constraint
    - 23 line_items have invalid order_ref

    Sample invalid records:
    [Shows examples]
```

**Result:** Complete database understanding in 2 hours vs. 2 weeks. Migration plan documented. Data quality issues identified before migration.

---

### 🎓 Use Case 5: Learning SQL Interactively

**Who:** Jamie, Computer Science Student
**Challenge:** Learning databases for the first time, SQL syntax intimidating
**Traditional Approach:** Read textbook → try commands → get cryptic errors → give up

**With mcp-sql-explorer:**

```
Jamie: "Connect to my SQLite practice database"
AI: ✅ Connected to SQLite

Jamie: "What's in my database?"
AI: You have 3 tables:
    - students (25 rows)
    - courses (8 rows)
    - enrollments (47 rows)

Jamie: "Show me all students"
AI: SELECT * FROM students LIMIT 10;

    [Shows results]

    💡 Tip: In production, avoid SELECT *.
       Specify columns: SELECT name, email FROM students

Jamie: "Show me students who are enrolled in Computer Science"
AI: I'll need to join tables for this:

    SELECT s.name, c.course_name
    FROM students s
    JOIN enrollments e ON s.id = e.student_id
    JOIN courses c ON e.course_id = c.id
    WHERE c.department = 'Computer Science';

    [Shows results]

    📚 Concept: JOINs connect related tables
       - students ↔ enrollments (via student_id)
       - enrollments ↔ courses (via course_id)

Jamie: "How many students are in each course?"
AI: SELECT c.course_name, COUNT(e.student_id) as student_count
    FROM courses c
    LEFT JOIN enrollments e ON c.id = e.course_id
    GROUP BY c.course_name
    ORDER BY student_count DESC;

    [Shows results]

    📚 Concepts used:
       - COUNT(): Aggregates numbers
       - GROUP BY: Groups results
       - LEFT JOIN: Includes courses with 0 students
       - ORDER BY: Sorts results

Jamie: "What if I want students taking more than 3 courses?"
AI: SELECT s.name, COUNT(e.course_id) as course_count
    FROM students s
    JOIN enrollments e ON s.id = e.student_id
    GROUP BY s.id, s.name
    HAVING COUNT(e.course_id) > 3
    ORDER BY course_count DESC;

    [Shows results]

    📚 Key difference:
       - WHERE: Filters rows BEFORE grouping
       - HAVING: Filters groups AFTER aggregation

       In this case, we need HAVING because we're
       filtering on COUNT(), which is an aggregate.

Jamie: "This is making sense! Can you explain indexes?"
AI: Great question! Indexes speed up queries.

    Think of it like a book index:
    - Without index: Read every page to find "databases"
    - With index: Look up "databases" → jump to page 47

    Your enrollments table has these indexes:
    - PRIMARY KEY on id (automatic)
    - INDEX on student_id (for fast student lookups)
    - INDEX on course_id (for fast course lookups)

    Want to see the performance difference?
```

**Result:** Jamie understands JOINs, aggregations, and indexes in 30 minutes. Learning through real queries, not just theory. SQL becomes approachable, not intimidating.

---

### For End Users (Recommended)

**Method 1: NPX** (zero installation, auto-updates):
```bash
# Use directly without installing
npx -y mcp-sql-explorer --stdio
```

**Method 2: Global Installation**:
```bash
npm install -g mcp-sql-explorer

# Verify installation
mcp-sql-explorer --version
```

### For Developers

**Local Development**:
```bash
git clone https://github.com/varkart/sql-mcp.git
cd sql-mcp
npm install
npm run build

# Test the server
npm test
```

Then configure your MCP client with the absolute path to `dist/index.js`.

**From Source**:
```bash
npm pack
npm install -g ./mcp-sql-explorer-1.0.0.tgz
```

---

## Supported Clients

mcp-sql-explorer works with any MCP-compatible client. We provide detailed setup guides:

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
2. `./mcp-sql-explorer.config.json` (current directory)
3. `~/.mcp-sql-explorer/config.json`
4. `~/.mcp-sql-explorer.config.json`

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

Connections are persisted to `~/.mcp-sql-explorer/connections.json` (mode 0600) for automatic restoration on restart. Passwords are stored in plaintext (similar to `~/.pgpass`).

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
cp examples/configs/mcp-sql-explorer.config.example.json mcp-sql-explorer.config.json
# Edit mcp-sql-explorer.config.json with your database credentials
```

### Development Workflow

```bash
# Start TypeScript compiler in watch mode
npm run dev

# In another terminal, run the server
npm start -- --config mcp-sql-explorer.config.json --debug

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

See [TESTING.md](docs/TESTING.md) for detailed testing instructions and [test/e2e/README.md](test/e2e/README.md) for E2E test setup.

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

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Code of Conduct
- Development setup and workflow
- Testing requirements
- Code style guidelines
- Pull request process
- Commit message conventions

For security vulnerabilities, please see our [Security Policy](SECURITY.md).

Quick links:
- [Report a bug](https://github.com/varkart/sql-mcp/issues/new?template=bug_report.md)
- [Request a feature](https://github.com/varkart/sql-mcp/issues/new?template=feature_request.md)
- [Ask a question](https://github.com/varkart/sql-mcp/discussions)

Thank you for contributing to mcp-sql-explorer!

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2024 vk

---

**Project Status**: Active Development

**Maintained By**: [@varkart](https://github.com/varkart)

**Repository**: https://github.com/varkart/sql-mcp
