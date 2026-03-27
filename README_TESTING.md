# Quick Start: Manual Testing

This guide gets you testing sql-mcp in under 5 minutes.

## 🚀 Quick Start

```bash
# 1. Start test databases
docker compose up -d

# 2. Wait for databases to be ready (30-60 seconds)
docker compose ps
# All should show "healthy"

# 3. Build the project
npm run clean && npm run build

# 4. Get your project path
pwd
# Copy this path for the next step

# 5. Configure Claude Desktop
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

```bash
# 6. Restart Claude Desktop completely (Cmd+Q then reopen)

# 7. Start testing! In Claude Desktop, try:
```

**Test prompts**:
```
Connect to PostgreSQL with ID "test-pg", host localhost, port 5432,
database testdb, user testuser, password testpass

Create a users table in test-pg with id, name, and email columns

Insert 3 sample users into test-pg

Show me all users from test-pg

Describe the schema of test-pg
```

## 📋 Test Databases Available

| Database | Port | Username | Password | Database |
|----------|------|----------|----------|----------|
| PostgreSQL | 5432 | testuser | testpass | testdb |
| MySQL | 3306 | testuser | testpass | testdb |
| MariaDB | 3307 | testuser | testpass | testdb |
| SQL Server | 1433 | sa | TestPass123! | master |

## 🛑 Stop Databases

```bash
docker compose down
```

## 📚 Full Testing Guide

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive testing instructions.

## ✅ Testing Checklist

See [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) for the complete pre-publication checklist.
