# Manual Testing Guide

Quick guide for testing sql-mcp before npm publication.

## 1. Start Test Databases

We provide Docker Compose to run all test databases locally.

### Prerequisites

- Docker Desktop installed and running
- At least 4GB RAM allocated to Docker

### Start All Databases

```bash
# Start all databases in background
docker compose up -d

# Wait for databases to be healthy (30-60 seconds)
docker compose ps

# Expected output: All services "healthy"
```

### Verify Databases Are Running

```bash
# Check all containers are healthy
docker compose ps

# Should show:
# sql-mcp-postgres   healthy
# sql-mcp-mysql      healthy
# sql-mcp-mariadb    healthy
# sql-mcp-mssql      healthy
```

### Test Database Connections

```bash
# PostgreSQL
docker exec -it sql-mcp-postgres psql -U testuser -d testdb -c "SELECT version();"

# MySQL
docker exec -it sql-mcp-mysql mysql -u testuser -ptestpass testdb -e "SELECT VERSION();"

# MariaDB
docker exec -it sql-mcp-mariadb mysql -u testuser -ptestpass testdb -e "SELECT VERSION();"

# SQL Server
docker exec -it sql-mcp-mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "TestPass123!" -Q "SELECT @@VERSION;"
```

---

## 2. Build sql-mcp

```bash
# Clean and build
npm run clean
npm run build

# Verify build succeeded
ls -la dist/
# Should contain index.js and other compiled files
```

---

## 3. Test with Claude Desktop

### Step 1: Update Config

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sql-mcp-test": {
      "command": "node",
      "args": [
        "~/Documents/projects/github/mcp-demo/mcp-sql-query/dist/index.js",
        "--stdio"
      ]
    }
  }
}
```

**Replace the path** with your actual project path:
```bash
# Get absolute path
pwd
# Copy output and use in config above
```

### Step 2: Restart Claude Desktop

Quit completely (Cmd+Q) and reopen.

### Step 3: Verify Connection

In Claude Desktop, look for the 🔌 icon. Click it and verify "sql-mcp-test" appears.

### Step 4: Test Scenarios

#### Test 1: SQLite (In-Memory)
```
Connect to an in-memory SQLite database with ID "test-sqlite"
```

Expected: Connection successful

#### Test 2: PostgreSQL
```
Connect to PostgreSQL with these details:
- ID: test-pg
- Host: localhost
- Port: 5432
- Database: testdb
- User: testuser
- Password: testpass
```

Expected: Connection successful

#### Test 3: Create Schema
```
In test-pg, create a users table with columns:
- id (serial primary key)
- name (varchar 100)
- email (varchar 255)
- created_at (timestamp default now)
```

Expected: Table created successfully

#### Test 4: Insert Data
```
Insert 3 sample users into the users table in test-pg
```

Expected: 3 rows inserted

#### Test 5: Query Data
```
Show me all users from test-pg
```

Expected: ASCII table showing 3 users

#### Test 6: Schema Inspection
```
Describe the schema of test-pg database
```

Expected: Shows tables, columns, types

#### Test 7: Natural Language Query
```
In test-pg, show me users created in the last hour, sorted by name
```

Expected: SQL generated and executed

#### Test 8: Multiple Connections
```
List all my database connections
```

Expected: Shows test-sqlite and test-pg

#### Test 9: MySQL
```
Connect to MySQL:
- ID: test-mysql
- Host: localhost
- Port: 3306
- Database: testdb
- User: testuser
- Password: testpass
```

Expected: Connection successful

#### Test 10: Cross-Database Query (Optional)
```
Count tables in test-pg and test-mysql
```

Expected: Shows table counts from both databases

#### Test 11: Error Handling
```
In test-pg, execute: SELEC * FROM users
```

Expected: Clear error message about SQL syntax

#### Test 12: Disconnect
```
Disconnect from test-pg
```

Expected: Connection closed successfully

### Step 5: Document Results

Mark checkboxes in `TESTING_CHECKLIST.md` under "Test 1: Claude Desktop"

---

## 4. Test with Claude Code (VS Code)

### Step 1: Update VS Code Settings

Open VS Code settings.json (Cmd+Shift+P → "Preferences: Open User Settings (JSON)")

```json
{
  "claude.mcpServers": {
    "sql-mcp-test": {
      "command": "node",
      "args": [
        "~/Documents/projects/github/mcp-demo/mcp-sql-query/dist/index.js",
        "--stdio"
      ]
    }
  }
}
```

### Step 2: Reload VS Code

Command Palette → "Developer: Reload Window"

### Step 3: Verify Connection

In Claude Code chat panel, type: `/mcp`

Expected: sql-mcp-test appears with checkmark

### Step 4: Quick Tests

Run 3-4 quick tests from Claude Desktop scenarios:
- Connect to SQLite
- Create table
- Query data
- List connections

### Step 5: Document Results

Mark checkboxes in `TESTING_CHECKLIST.md` under "Test 2: Claude Code"

---

## 5. Test Package Installation

### Step 1: Create Package

```bash
# Create tarball
npm pack

# Should create: sql-mcp-1.0.0.tgz
ls -la *.tgz
```

### Step 2: Inspect Package Contents

```bash
# List contents
tar -tzf sql-mcp-1.0.0.tgz | head -30

# Verify includes:
# ✅ package/dist/
# ✅ package/package.json
# ✅ package/README.md
# ✅ package/LICENSE

# Verify excludes:
# ❌ package/test/
# ❌ package/docs/
# ❌ package/.github/
# ❌ package/SCALE_PLAN.md
```

### Step 3: Test Global Installation

```bash
# Install globally
npm install -g ./sql-mcp-1.0.0.tgz

# Verify binary
which sql-mcp
# Expected: /usr/local/bin/sql-mcp or similar

# Test version
sql-mcp --version
# Expected: 1.0.0 or version info

# Test help
sql-mcp --help
```

### Step 4: Test with npx

Update Claude Desktop config:

```json
{
  "mcpServers": {
    "sql-mcp-npx": {
      "command": "npx",
      "args": ["./sql-mcp-1.0.0.tgz", "--stdio"]
    }
  }
}
```

Restart Claude Desktop and verify connection works.

### Step 5: Cleanup

```bash
# Uninstall global package
npm uninstall -g sql-mcp

# Verify removal
which sql-mcp
# Expected: not found
```

---

## 6. Stop Test Databases

When testing is complete:

```bash
# Stop all databases
docker compose down

# Or stop and remove volumes (clean slate)
docker compose down -v
```

---

## Quick Reference

### Start Testing Session
```bash
# 1. Start databases
docker compose up -d

# 2. Build project
npm run clean && npm run build

# 3. Update Claude Desktop config with absolute path
# 4. Restart Claude Desktop
# 5. Test!
```

### Connection Details

| Database | Host | Port | Database | User | Password |
|----------|------|------|----------|------|----------|
| PostgreSQL | localhost | 5432 | testdb | testuser | testpass |
| MySQL | localhost | 3306 | testdb | testuser | testpass |
| MariaDB | localhost | 3307 | testdb | testuser | testpass |
| MSSQL | localhost | 1433 | master | sa | TestPass123! |
| SQLite | - | - | :memory: | - | - |

### Useful Commands

```bash
# View database logs
docker compose logs postgres
docker compose logs mysql
docker compose logs mariadb
docker compose logs mssql

# Restart a specific database
docker compose restart postgres

# Stop all databases
docker compose down

# Remove all data and start fresh
docker compose down -v
docker compose up -d
```

---

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :5432  # PostgreSQL
lsof -i :3306  # MySQL
lsof -i :1433  # MSSQL

# Stop conflicting service or change port in docker-compose.yml
```

### Database Not Healthy

```bash
# Check logs
docker compose logs [service-name]

# Restart service
docker compose restart [service-name]

# Rebuild if needed
docker compose up -d --force-recreate [service-name]
```

### Out of Memory

```bash
# Check Docker resources
docker stats

# Increase memory in Docker Desktop:
# Settings → Resources → Memory → Set to 4GB+
```

### Connection Refused

```bash
# Wait for healthcheck to pass
docker compose ps

# All services should show "healthy"
# If not, check logs:
docker compose logs
```

---

## Next Steps After Testing

1. ✅ Mark all items in `TESTING_CHECKLIST.md`
2. ✅ Fix any issues found
3. ✅ Run automated tests: `npm test`
4. ✅ Create package: `npm pack`
5. ✅ Publish to npm: `npm publish`

---

## Test Results Template

Copy this to document your testing:

```
## Manual Testing Results

Date: _____________
Tester: _____________

### Environment
- OS: macOS / Windows / Linux
- Node.js: ___________
- Docker: ___________

### Phase 1: Automated Tests
- [ ] npm test - Passed / Failed
- Notes: _____________

### Phase 2: Claude Desktop
- [ ] Connection - Pass / Fail
- [ ] SQLite - Pass / Fail
- [ ] PostgreSQL - Pass / Fail
- [ ] MySQL - Pass / Fail
- [ ] Create/Insert/Query - Pass / Fail
- [ ] Error Handling - Pass / Fail
- Notes: _____________

### Phase 3: Claude Code
- [ ] Connection - Pass / Fail
- [ ] Basic Operations - Pass / Fail
- Notes: _____________

### Phase 4: Package Testing
- [ ] npm pack - Pass / Fail
- [ ] Global install - Pass / Fail
- [ ] npx execution - Pass / Fail
- Notes: _____________

### Issues Found
1. _____________
2. _____________

### Ready for Publication?
[ ] Yes - All tests passed
[ ] No - Issues need fixing
```
