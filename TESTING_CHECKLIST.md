# Testing Checklist for npm Publication

This checklist must be completed before publishing sql-mcp to npm.

## Pre-Publication Testing

### ✅ Phase 1: Automated Tests (Already Passing)

Run all automated tests to ensure code quality:

```bash
# Clean build
npm run clean
npm run build

# Run all tests
npm test

# Run specific test suites
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests (requires Docker)

# Verify all tests pass
# Expected: All tests green ✅
```

**Status**: [ ] Passed

---

## 🔍 Phase 2: Manual Client Testing (CRITICAL)

Test with at least **3 different MCP clients** to ensure broad compatibility.

### Test 1: Claude Desktop (Required)

**Setup**:
1. Build project: `npm run build`
2. Update Claude Desktop config with local path:
   ```json
   {
     "mcpServers": {
       "sql-mcp-test": {
         "command": "node",
         "args": ["/absolute/path/to/sql-mcp/dist/index.js", "--stdio"]
       }
     }
   }
   ```
3. Restart Claude Desktop

**Test Cases**:
- [ ] Server appears in Claude Desktop (🔌 icon)
- [ ] Connect to SQLite in-memory: `Connect to an in-memory SQLite database with ID "test"`
- [ ] Create table: `Create a users table with id, name, and email in test database`
- [ ] Insert data: `Insert 3 sample users into test database`
- [ ] Query data: `Show me all users from test database`
- [ ] Schema inspection: `Describe the schema of test database`
- [ ] Error handling: `Execute invalid SQL: SELEC * FROM users` (should fail gracefully)
- [ ] List connections: `List all my database connections`
- [ ] Multiple connections: Connect to second database and query both
- [ ] Disconnect: `Disconnect from test database`

**Expected Behavior**:
- All queries execute successfully
- Results displayed in readable format
- Errors are clear and helpful
- No crashes or hangs

**Status**: [ ] Passed

---

### Test 2: Claude Code (VS Code) (Required)

**Setup**:
1. Build project: `npm run build`
2. Open VS Code
3. Update settings.json:
   ```json
   {
     "claude.mcpServers": {
       "sql-mcp-test": {
         "command": "node",
         "args": ["/absolute/path/to/sql-mcp/dist/index.js", "--stdio"]
       }
     }
   }
   ```
4. Reload VS Code window

**Test Cases**:
- [ ] Type `/mcp` and verify sql-mcp-test appears
- [ ] Connect to SQLite: `Connect to in-memory SQLite with ID "dev"`
- [ ] Create schema: `Create a products table with id, name, price in dev database`
- [ ] Query with natural language: `Show me all products sorted by price`
- [ ] Test in workspace: Use sql-mcp while editing code files
- [ ] Multi-turn conversation: Ask follow-up questions about data
- [ ] MCP Apps: Check if results render correctly in chat

**Expected Behavior**:
- MCP server shows as connected
- All features work in VS Code context
- No conflicts with other extensions

**Status**: [ ] Passed

---

### Test 3: Choose One More Client

Select one:
- [ ] Cline (VS Code)
- [ ] Cursor
- [ ] Continue
- [ ] Windsurf

**Setup**: Follow client-specific guide from `docs/clients/`

**Test Cases** (abbreviated):
- [ ] Server connects successfully
- [ ] Basic CRUD operations work
- [ ] Schema inspection works
- [ ] Error handling is graceful

**Status**: [ ] Passed

---

## 📦 Phase 3: Package Testing

Test the actual npm package before publishing.

### Step 1: Create Package

```bash
# Clean and build
npm run clean
npm run build

# Create tarball
npm pack

# Output: sql-mcp-1.0.0.tgz
```

**Verify tarball contents**:
```bash
tar -tzf sql-mcp-1.0.0.tgz | head -20

# Should include:
# - package/dist/
# - package/package.json
# - package/README.md
# - package/LICENSE

# Should NOT include:
# - test/ or tests/
# - docs/
# - .github/
# - SCALE_PLAN.md
```

**Status**: [ ] Verified

---

### Step 2: Test Local Installation

```bash
# Install globally from tarball
npm install -g ./sql-mcp-1.0.0.tgz

# Test binary is accessible
which sql-mcp
# Expected: /usr/local/bin/sql-mcp (or similar)

sql-mcp --version
# Expected: Version number displayed

sql-mcp --help
# Expected: Help text displayed
```

**Status**: [ ] Passed

---

### Step 3: Test npx Simulation

```bash
# Test direct execution
npx ./sql-mcp-1.0.0.tgz --stdio

# Expected: Server starts without errors
# Press Ctrl+C to stop
```

**Status**: [ ] Passed

---

### Step 4: Test with MCP Client

Update one client config to use the tarball:

```json
{
  "mcpServers": {
    "sql-mcp-tarball": {
      "command": "npx",
      "args": ["./sql-mcp-1.0.0.tgz", "--stdio"]
    }
  }
}
```

**Test Cases**:
- [ ] Client can connect
- [ ] Basic operations work
- [ ] No missing dependencies

**Status**: [ ] Passed

---

### Step 5: Uninstall Global Package

```bash
npm uninstall -g sql-mcp

# Verify removal
which sql-mcp
# Expected: not found
```

**Status**: [ ] Done

---

## 🧪 Phase 4: Compatibility Testing

### Node.js Version Compatibility

Test with different Node.js versions (use nvm):

```bash
# Test with Node 18 (minimum)
nvm use 18
npm run build
npm test

# Test with Node 20
nvm use 20
npm run build
npm test

# Test with Node 22 (latest)
nvm use 22
npm run build
npm test
```

**Status**:
- [ ] Node 18 - Passed
- [ ] Node 20 - Passed
- [ ] Node 22 - Passed

---

### Database Compatibility

Verify all supported databases work:

```bash
# Start test databases
node start-dbs.js

# Run integration tests
npm run test:integration
```

**Status**:
- [ ] PostgreSQL - Passed
- [ ] MySQL - Passed
- [ ] SQLite - Passed
- [ ] MSSQL - Passed
- [ ] MariaDB - Passed
- [ ] Oracle (optional) - Skipped/Passed

---

## 🔒 Phase 5: Security Checks

### Dependency Audit

```bash
npm audit

# Expected: No high or critical vulnerabilities
# Fix any issues: npm audit fix
```

**Status**: [ ] No critical vulnerabilities

---

### Sensitive Data Check

```bash
# Check for accidentally committed secrets
grep -r "password" src/ dist/
grep -r "secret" src/ dist/
grep -r "api_key" src/ dist/

# Check package contents
tar -tzf sql-mcp-1.0.0.tgz | grep -E "\.(env|key|pem|p12)"

# Expected: No matches
```

**Status**: [ ] No secrets found

---

## 📝 Phase 6: Documentation Verification

### README Accuracy

- [ ] All installation instructions are correct
- [ ] All code examples work
- [ ] Badge links work (will activate after npm publish)
- [ ] Screenshots/GIFs are up to date (if added)

### Client Guides

- [ ] All client setup guides tested manually
- [ ] Configuration examples are accurate
- [ ] Troubleshooting steps are helpful

**Status**: [ ] Documentation verified

---

## ⚡ Phase 7: Performance Testing

### Startup Time

```bash
time node dist/index.js --stdio < /dev/null

# Expected: < 2 seconds
```

**Status**: [ ] Startup time acceptable

---

### Memory Usage

```bash
# Start server
node dist/index.js --stdio &
PID=$!

# Check memory
ps aux | grep $PID

# Expected: < 100MB initial memory
```

**Status**: [ ] Memory usage acceptable

---

## 🚀 Phase 8: Pre-Publication Checklist

Before running `npm publish`:

- [ ] All automated tests pass
- [ ] At least 3 clients tested successfully
- [ ] Package tarball tested and verified
- [ ] No security vulnerabilities
- [ ] Documentation is accurate
- [ ] Version number is correct (1.0.0 for initial release)
- [ ] Git working directory is clean
- [ ] All changes committed
- [ ] Git tag created (optional): `git tag v1.0.0`

---

## 📤 Phase 9: Publication

### Dry Run

```bash
# Simulate publish (does not actually publish)
npm publish --dry-run

# Review output for any warnings
```

**Status**: [ ] Dry run successful

---

### Actual Publication

```bash
# Login to npm (if not already)
npm login

# Publish to npm
npm publish

# Expected output:
# + sql-mcp@1.0.0
```

**Status**: [ ] Published successfully

---

### Post-Publication Verification

```bash
# Wait 2-3 minutes for npm to propagate

# Test installation from npm
npm install -g sql-mcp

# Verify version
sql-mcp --version

# Test with npx
npx -y sql-mcp --version

# Test with MCP client
# Update config to use: "command": "npx", "args": ["-y", "sql-mcp", "--stdio"]
```

**Status**: [ ] Post-publication tests passed

---

## 📊 Results Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Automated Tests | [ ] Pass / [ ] Fail | |
| Claude Desktop | [ ] Pass / [ ] Fail | |
| Claude Code | [ ] Pass / [ ] Fail | |
| Third Client | [ ] Pass / [ ] Fail | Client: ___ |
| Package Testing | [ ] Pass / [ ] Fail | |
| Compatibility | [ ] Pass / [ ] Fail | |
| Security | [ ] Pass / [ ] Fail | |
| Documentation | [ ] Pass / [ ] Fail | |
| Performance | [ ] Pass / [ ] Fail | |
| Publication | [ ] Success / [ ] Fail | |

---

## 🐛 Issues Found

List any issues discovered during testing:

1.
2.
3.

---

## ✅ Sign-Off

**Tested By**: _______________
**Date**: _______________
**Ready for Publication**: [ ] Yes / [ ] No

---

## 📚 Quick Reference

### Useful Commands

```bash
# Full test cycle
npm run clean && npm run build && npm test

# Create and test package
npm pack
npm install -g ./sql-mcp-1.0.0.tgz

# Publish
npm publish

# Unpublish (within 72 hours if needed)
npm unpublish sql-mcp@1.0.0 --force
```

### Rollback Plan

If issues are discovered after publication:

1. **Immediate**: Unpublish within 72 hours
   ```bash
   npm unpublish sql-mcp@1.0.0 --force
   ```

2. **After 72 hours**: Publish a patched version
   ```bash
   # Fix issue
   # Update version to 1.0.1
   npm version patch
   npm publish
   ```

3. **Deprecate**: Mark version as deprecated
   ```bash
   npm deprecate sql-mcp@1.0.0 "Please upgrade to 1.0.1 - fixes critical bug"
   ```
