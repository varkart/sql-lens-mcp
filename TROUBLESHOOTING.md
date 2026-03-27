# Troubleshooting Guide

## MCP Connection Error -32000: Connection Closed

This error means the MCP client cannot establish or maintain a connection with the server. Follow these steps to resolve it.

### Quick Fix Checklist

- [ ] Server is built (`npm run build`)
- [ ] Node.js version >= 18.0.0 (`node --version`)
- [ ] MCP client config points to correct path
- [ ] Using absolute paths (not relative)
- [ ] Server process doesn't crash on startup

---

## Step 1: Verify Server Works

Run the debug script to test if the server works standalone:

```bash
node debug-server.js
```

**Expected output**:
```
✅ Server initialized successfully!
✅ Tools retrieved successfully!
✅ All tests passed! Server is working correctly.
```

**If this fails**: See [Server Startup Issues](#server-startup-issues) below.

**If this succeeds**: The problem is with your MCP client configuration. Continue to Step 2.

---

## Step 2: Configure Your MCP Client

### For Claude Desktop

**Location**:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**Configuration**:
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

### For Claude Code CLI

**Location**: `~/.claude.json`

**Configuration**:
```json
{
  "mcpServers": {
    "sql-mcp": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/sql-mcp/dist/index.js"
      ],
      "env": {}
    }
  }
}
```

⚠️ **Important differences from Claude Desktop**:
- Includes `"type": "stdio"` field
- **No** `--stdio` flag in args array (this is critical!)
- Path must be absolute, not `packages/server/dist/index.js` if you're using a monorepo structure

**Common mistake**: Using the wrong path. The project structure is:
```
sql-mcp/
  dist/
    index.js  ← Correct path
  NOT packages/server/dist/index.js
```

⚠️ **Important**:
- Replace `/ABSOLUTE/PATH/TO/sql-mcp/` with the **full absolute path** to your project
- Use forward slashes even on Windows
- No trailing slashes

**Example (macOS/Linux)**:
```json
{
  "mcpServers": {
    "sql-mcp": {
      "command": "node",
      "args": [
        "/Users/yourname/projects/sql-mcp/dist/index.js",
        "--stdio"
      ],
      "env": {}
    }
  }
}
```

**Example (Windows)**:
```json
{
  "mcpServers": {
    "sql-mcp": {
      "command": "node",
      "args": [
        "C:/Users/yourname/projects/sql-mcp/dist/index.js",
        "--stdio"
      ],
      "env": {}
    }
  }
}
```

### For Other MCP Clients

Check your client's documentation for the configuration format. Generally you need:

- **Command**: `node`
- **Arguments**: `["/absolute/path/to/dist/index.js", "--stdio"]`
- **Working Directory**: Project root (optional)
- **Environment**: Empty object or default

---

## Step 3: Restart Your MCP Client

After updating the configuration:

1. **Save the config file**
2. **Completely quit** your MCP client (not just close the window)
3. **Restart** the client
4. **Wait 5-10 seconds** for the server to initialize

---

## Step 4: Check Logs

### Server Logs

If the server is crashing, check stderr output:

```bash
# Run server manually to see logs
node dist/index.js --stdio --debug 2> server.log

# In another terminal, check the log
tail -f server.log
```

### Client Logs

**Claude Desktop**:
- macOS: `~/Library/Logs/Claude/`
- Windows: `%APPDATA%\Claude\logs\`
- Linux: `~/.config/Claude/logs/`

Look for errors mentioning "sql-mcp" or connection failures.

---

## Common Issues & Solutions

### Issue: "Cannot find module"

**Error**: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module`

**Solution**:
```bash
# Rebuild the project
npm run clean
npm install
npm run build
```

### Issue: "ENOENT: no such file or directory"

**Error**: `spawn ENOENT` or `File not found`

**Cause**: Path in config is incorrect

**Solution**:
1. Get the absolute path:
   ```bash
   pwd
   # Output: /Users/yourname/projects/sql-mcp
   ```

2. Use this in your config:
   ```json
   "args": ["/Users/yourname/projects/sql-mcp/dist/index.js", "--stdio"]
   ```

### Issue: "Permission denied"

**Error**: `EACCES: permission denied`

**Solution**:
```bash
# Make the file executable
chmod +x dist/index.js
```

### Issue: Server crashes immediately

**Symptoms**: Connection closes right after opening

**Debug**:
```bash
# Run with debugging
node --inspect dist/index.js --stdio --debug

# Or check for TypeScript errors
npm run build
```

### Issue: "Module not found: @modelcontextprotocol/sdk"

**Error**: Missing dependency

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Node.js version too old

**Error**: `SyntaxError: Unexpected token` or ESM errors

**Check version**:
```bash
node --version
# Should be >= 18.0.0
```

**Solution**: Update Node.js to v18 or higher

### Issue: Multiple Node.js versions

**Symptom**: Works in terminal but not in MCP client

**Solution**: Specify full path to Node.js in config
```json
{
  "mcpServers": {
    "sql-mcp": {
      "command": "/usr/local/bin/node",  // or "C:/Program Files/nodejs/node.exe"
      "args": ["/absolute/path/to/dist/index.js", "--stdio"]
    }
  }
}
```

Find your Node.js path:
```bash
which node   # macOS/Linux
where node   # Windows
```

---

## Advanced Debugging

### Test with Raw MCP Protocol

```bash
# Start the server
node dist/index.js --stdio --debug &

# Send an initialize request
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/index.js --stdio
```

### Enable Maximum Logging

**In server code** (temporary):
```typescript
// src/utils/logger.ts
logger.setLevel('debug');
```

**Rebuild**:
```bash
npm run build
```

### Check for Port Conflicts

Although sql-mcp uses stdio (not ports), if you're testing HTTP mode:

```bash
# Check if port 3000 is in use
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

---

## Still Having Issues?

### Collect Diagnostic Information

```bash
# 1. Node version
node --version

# 2. npm version
npm --version

# 3. Build status
npm run build

# 4. Server test
node debug-server.js > debug-output.txt 2>&1

# 5. List installed packages
npm list --depth=0
```

### Get Help

1. **Check existing issues**: https://github.com/varkart/sql-mcp/issues
2. **Open a new issue** with:
   - Output from debug-server.js
   - Your MCP client config (remove sensitive data)
   - Node.js and npm versions
   - Operating system
   - Full error message

3. **Include logs**:
   - Server logs (from stderr)
   - Client logs (if available)
   - Any error screenshots

---

## Verification Steps

After fixing, verify the connection works:

1. **Start your MCP client**
2. **Check server appears** in the client's server list
3. **Test a simple tool**:
   ```
   Use the list_connections tool
   Expected: Empty list (no connections yet)
   ```

4. **Connect to a database**:
   ```
   Use connect_database tool with SQLite:
   {
     "id": "test",
     "type": "sqlite",
     "path": ":memory:"
   }
   Expected: Success message
   ```

5. **List connections again**:
   ```
   Expected: Shows "test" connection
   ```

---

## Quick Reference

**Minimum Requirements**:
- Node.js >= 18.0.0
- Built project (`dist/` directory exists)
- Absolute path in MCP client config
- MCP client supports stdio transport

**Config Template**:
```json
{
  "mcpServers": {
    "sql-mcp": {
      "command": "node",
      "args": ["ABSOLUTE_PATH/dist/index.js", "--stdio"],
      "env": {}
    }
  }
}
```

**Debug Command**:
```bash
node debug-server.js
```

**Build Commands**:
```bash
npm run clean
npm install
npm run build
```

---

## Success Indicators

✅ debug-server.js completes without errors
✅ Server appears in MCP client's server list
✅ Can execute `list_connections` tool
✅ Server logs show "Server starting in stdio mode"
✅ No "Connection closed" errors in client

If all above pass, your server is working correctly! 🎉
