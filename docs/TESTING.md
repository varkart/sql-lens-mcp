# Testing Guide

Comprehensive testing guide for sql-mcp server.

## Table of Contents

- [Quick Start](#quick-start)
- [Automated Tests](#automated-tests)
- [End-to-End Testing](#end-to-end-testing)
- [Manual Testing](#manual-testing)
- [Pre-Publication Checklist](#pre-publication-checklist)
- [Test Database Schema](#test-database-schema)

---

## Quick Start

Get started testing in under 5 minutes:

```bash
# 1. Start test databases
cd test/e2e
docker compose up -d

# 2. Wait for databases to be healthy (30-60 seconds)
docker compose ps

# 3. Build the project
cd ../..
npm run clean && npm run build

# 4. Run tests
npm test
```

### Quick Manual Test with Claude Desktop

```bash
# Get your project path
pwd

# Configure Claude Desktop
# Open: ~/Library/Application Support/Claude/claude_desktop_config.json
```

Add this configuration (replace `/YOUR/PATH` with output from `pwd`):

```json
{
  "mcpServers": {
    "sql-mcp-test": {
      "command": "node",
      "args": ["/YOUR/PATH/dist/index.js", "--stdio"]
    }
  }
}
```

Restart Claude Desktop (Cmd+Q then reopen) and test:

```
Connect to PostgreSQL with ID "test-pg", host localhost, port 5432,
database testdb, user testuser, password testpass

Show me all users from test-pg
```

---

## Automated Tests

### Unit Tests

Test individual components in isolation:

```bash
npm run test:unit
```

Located in `test/unit/`:
- Connection managers
- Database adapters
- Query builders
- Utility functions

### Integration Tests

Test database adapters with real database engines:

```bash
# Start test databases first
cd test/e2e && docker compose up -d && cd ../..

# Run integration tests
npm run test:integration
```

Located in `test/integration/`:
- PostgreSQL adapter tests
- MySQL adapter tests
- SQLite adapter tests
- MSSQL adapter tests
- MariaDB adapter tests

### All Tests

Run the complete test suite:

```bash
npm test
```

---

## End-to-End Testing

E2E tests use Docker containers to test with real database engines.

### Prerequisites

- Docker Desktop installed and running
- 4GB+ RAM allocated to Docker
- ~2GB disk space for database images

### Start Test Databases

```bash
cd test/e2e
docker compose up -d
```

This starts 4 databases:
- **PostgreSQL**: `localhost:5432`
- **MySQL**: `localhost:3306`
- **MariaDB**: `localhost:3307`
- **MSSQL**: `localhost:1433`

### Verify Databases

```bash
# Check all containers are healthy
docker compose ps

# Expected output: All services show "healthy"
```

### Seed Test Data

```bash
cd test/e2e
./setup.sh
```

This creates and populates sample tables (users, products, orders, etc.).

### Connection Details

| Database   | Host      | Port | Database | User     | Password     |
|------------|-----------|------|----------|----------|--------------|
| PostgreSQL | localhost | 5432 | testdb   | testuser | testpass     |
| MySQL      | localhost | 3306 | testdb   | testuser | testpass     |
| MariaDB    | localhost | 3307 | testdb   | testuser | testpass     |
| MSSQL      | localhost | 1433 | master   | sa       | TestPass123! |

### Stop Databases

```bash
cd test/e2e
docker compose down

# Remove all data and start fresh
docker compose down -v
```

### E2E Test Scripts

Located in `test/e2e/`:
- `create-test-db.ts` - Create and seed in-memory SQLite
- `demo-test-db.ts` - Interactive demo with sample queries
- `test-with-db.ts` - Integration test example

Run them:

```bash
npm run build
cd test/e2e
node create-test-db.js
node demo-test-db.js
```

---

## Manual Testing

Test sql-mcp with MCP clients before releasing.

### Test with Claude Desktop

**Setup**:

1. Build project: `npm run build`
2. Get absolute path: `pwd`
3. Update Claude Desktop config:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sql-mcp-test": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js", "--stdio"]
    }
  }
}
```

4. Restart Claude Desktop completely (Cmd+Q or Ctrl+Q, then reopen)

**Test Scenarios**:

1. **SQLite Connection**
   ```
   Connect to an in-memory SQLite database with ID "test-sqlite"
   ```

2. **PostgreSQL Connection**
   ```
   Connect to PostgreSQL with ID "test-pg", host localhost, port 5432,
   database testdb, user testuser, password testpass
   ```

3. **Create Schema**
   ```
   In test-pg, create a users table with columns:
   - id (serial primary key)
   - name (varchar 100)
   - email (varchar 255)
   - created_at (timestamp default now)
   ```

4. **Insert Data**
   ```
   Insert 3 sample users into test-pg
   ```

5. **Query Data**
   ```
   Show me all users from test-pg
   ```

6. **Schema Inspection**
   ```
   Describe the schema of test-pg database
   ```

7. **Natural Language Query**
   ```
   In test-pg, show me users created in the last hour, sorted by name
   ```

8. **List Connections**
   ```
   List all my database connections
   ```

9. **Error Handling**
   ```
   In test-pg, execute: SELEC * FROM users
   ```
   Expected: Clear syntax error message

10. **Disconnect**
    ```
    Disconnect from test-pg
    ```

### Test with Claude Code (VS Code)

**Setup**:

1. Build project: `npm run build`
2. Open VS Code settings.json (Cmd/Ctrl+Shift+P → "Preferences: Open User Settings (JSON)")

```json
{
  "claude.mcpServers": {
    "sql-mcp-test": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js", "--stdio"]
    }
  }
}
```

3. Reload VS Code: Command Palette → "Developer: Reload Window"

**Quick Tests**:

```
/mcp
```
Verify sql-mcp-test appears with checkmark

```
Connect to in-memory SQLite with ID "dev"
Create a products table in dev with id, name, price
Query products sorted by price
```

### Test with Other Clients

See `docs/clients/` for setup guides:
- Cline (VS Code)
- Cursor
- Continue
- Windsurf
- JetBrains IDEs
- ChatGPT Desktop

---

## Pre-Publication Checklist

Complete this checklist before publishing to npm.

### Phase 1: Automated Tests

```bash
npm run clean && npm run build && npm test
```

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No test failures or warnings

### Phase 2: Client Testing

Test with at least 3 different MCP clients:

- [ ] Claude Desktop - All scenarios pass
- [ ] Claude Code (VS Code) - All scenarios pass
- [ ] Third client (Cline/Cursor/Continue/etc.) - Basic operations work

### Phase 3: Package Testing

```bash
# Create package
npm pack

# Verify contents
tar -tzf sql-mcp-1.0.0.tgz | head -30

# Should include: dist/, package.json, README.md, LICENSE
# Should NOT include: test/, docs/, .github/, trash/
```

- [ ] Package created successfully
- [ ] Package contents verified
- [ ] No unnecessary files included

**Test installation**:

```bash
# Global install
npm install -g ./sql-mcp-1.0.0.tgz

# Verify binary
which sql-mcp
sql-mcp --version

# Test with npx
npx ./sql-mcp-1.0.0.tgz --stdio

# Cleanup
npm uninstall -g sql-mcp
```

- [ ] Global installation works
- [ ] Binary is accessible
- [ ] npx execution works

### Phase 4: Compatibility

**Node.js versions** (use nvm):

```bash
nvm use 18 && npm run build && npm test
nvm use 20 && npm run build && npm test
nvm use 22 && npm run build && npm test
```

- [ ] Node 18 - Pass
- [ ] Node 20 - Pass
- [ ] Node 22 - Pass

**Database compatibility**:

```bash
cd test/e2e && docker compose up -d && cd ../..
npm run test:integration
```

- [ ] PostgreSQL - Pass
- [ ] MySQL - Pass
- [ ] SQLite - Pass
- [ ] MSSQL - Pass
- [ ] MariaDB - Pass

### Phase 5: Security

```bash
# Dependency audit
npm audit

# Check for secrets
grep -r "password\|secret\|api_key" src/ dist/ || echo "None found"
```

- [ ] No critical vulnerabilities
- [ ] No hardcoded secrets

### Phase 6: Documentation

- [ ] README installation instructions are correct
- [ ] All code examples work
- [ ] Client setup guides tested
- [ ] Troubleshooting steps are accurate

### Phase 7: Performance

```bash
# Startup time (should be < 2 seconds)
time node dist/index.js --stdio < /dev/null

# Memory usage (should be < 100MB initial)
node dist/index.js --stdio &
ps aux | grep $!
```

- [ ] Startup time acceptable (< 2s)
- [ ] Memory usage acceptable (< 100MB)

### Phase 8: Pre-Publication

- [ ] Version number is correct (1.0.0 for initial)
- [ ] Git working directory is clean
- [ ] All changes committed
- [ ] Git tag created (optional): `git tag v1.0.0`

### Phase 9: Publication

```bash
# Dry run
npm publish --dry-run

# Actual publish
npm login
npm publish
```

- [ ] Dry run successful
- [ ] Published to npm
- [ ] Post-publication tests pass

```bash
# Wait 2-3 minutes, then test
npm install -g sql-mcp
sql-mcp --version
npx -y sql-mcp --version
```

---

## Test Database Schema

The E2E test databases include realistic sample data across multiple tables.

### Tables

1. **users** (10 rows)
   - `id`, `username`, `email`, `full_name`, `created_at`, `is_active`, `age`, `country`

2. **products** (15 rows)
   - `id`, `name`, `description`, `price`, `stock_quantity`, `category`, `created_at`

3. **orders** (25 rows)
   - `id`, `user_id`, `order_date`, `total_amount`, `status`, `shipping_address`

4. **order_items** (~72 rows)
   - `id`, `order_id`, `product_id`, `quantity`, `unit_price`

5. **reviews** (30 rows)
   - `id`, `product_id`, `user_id`, `rating`, `comment`, `created_at`

### Relationships

- `orders.user_id` → `users.id`
- `order_items.order_id` → `orders.id`
- `order_items.product_id` → `products.id`
- `reviews.user_id` → `users.id`
- `reviews.product_id` → `products.id`

### Example Queries

**Basic**:
```sql
SELECT * FROM users;
SELECT * FROM products WHERE category = 'Electronics';
SELECT * FROM orders WHERE status = 'pending';
```

**Advanced**:
```sql
-- Top selling products
SELECT
  p.name,
  COUNT(DISTINCT o.id) as order_count,
  SUM(oi.quantity) as total_sold
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
GROUP BY p.id
ORDER BY total_sold DESC;

-- User spending summary
SELECT
  u.username,
  COUNT(o.id) as order_count,
  SUM(o.total_amount) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id
ORDER BY total_spent DESC;

-- Products with average ratings
SELECT
  p.name,
  AVG(r.rating) as avg_rating,
  COUNT(r.id) as review_count
FROM products p
LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY p.id
HAVING review_count > 0;
```

---

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :5432  # PostgreSQL
lsof -i :3306  # MySQL

# Stop conflicting service or change port in docker-compose.yml
```

### Database Not Healthy

```bash
# Check logs
cd test/e2e
docker compose logs postgres

# Restart service
docker compose restart postgres

# Rebuild
docker compose up -d --force-recreate postgres
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
cd test/e2e
docker compose ps

# All services should show "healthy"
# Check logs if not:
docker compose logs
```

---

## Quick Reference

### Essential Commands

```bash
# Full test cycle
npm run clean && npm run build && npm test

# Start/stop E2E databases
cd test/e2e
docker compose up -d
docker compose down -v

# Package testing
npm pack
npm install -g ./sql-mcp-1.0.0.tgz
npm uninstall -g sql-mcp

# Publish
npm publish --dry-run
npm publish
```

### Test Data Locations

- E2E config: `test/e2e/docker-compose.yml`
- Seed scripts: `test/e2e/seed-data/*.sql`
- Connection fixtures: `test/e2e/fixtures/*.json`
- Example configs: `examples/configs/*.json`

---

For more detailed information:
- See `CONTRIBUTING.md` for development workflow
- See `TROUBLESHOOTING.md` for common issues
- See `docs/clients/` for client-specific setup guides
