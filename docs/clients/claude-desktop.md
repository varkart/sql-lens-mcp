# Claude Desktop Setup Guide

Complete setup instructions for using sql-mcp with Claude Desktop.

## Prerequisites

- Claude Desktop installed ([Download here](https://claude.ai/download))
- Node.js 20.0.0 or higher (`node --version`)

## Quick Start

### Method 1: NPX (Recommended)

This method automatically downloads and runs the latest version:

1. **Open Claude Desktop config file**:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. **Add this configuration**:
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

3. **Restart Claude Desktop** completely (quit and reopen)

4. **Verify** - Look for the 🔌 icon in Claude Desktop showing connected servers

### Method 2: Local Development

If you're developing sql-mcp locally:

1. **Build the project**:
   ```bash
   cd /path/to/sql-mcp
   npm install
   npm run build
   ```

2. **Get absolute path**:
   ```bash
   pwd
   # Example output: /Users/yourname/projects/sql-mcp
   ```

3. **Open Claude Desktop config** (see locations above)

4. **Add configuration with absolute path**:
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

5. **Restart Claude Desktop**

## Configuration Examples

### macOS Example
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

### Windows Example
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

### Multiple Servers
If you're using other MCP servers:
```json
{
  "mcpServers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
    }
  }
}
```

## Testing the Connection

Once configured and restarted:

1. **Check connection status**:
   - Look for 🔌 icon in Claude Desktop
   - Click it to see connected servers
   - "sql-mcp" should appear in the list

2. **Test with a simple query**:
   ```
   Connect to an in-memory SQLite database
   ```

3. **Expected response**:
   - Claude should use the `connect_database` tool
   - You'll see "Connected to sqlite" message

4. **List available tools**:
   ```
   What database tools do you have available?
   ```

5. **Expected tools**:
   - connect_database
   - disconnect_database
   - execute_query
   - list_connections
   - get_schema
   - try_connect

## Common Issues

### Issue: Server not appearing in Claude Desktop

**Solution**:
1. Verify config file location is correct
2. Check JSON syntax is valid (use [JSONLint](https://jsonlint.com/))
3. Ensure no trailing commas in JSON
4. Completely quit Claude Desktop (not just close window)
5. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`
   - Linux: `~/.config/Claude/logs/`

### Issue: "Connection closed" error

**Solution**:
1. Test server works standalone:
   ```bash
   cd /path/to/sql-mcp
   node debug-server.js
   ```
2. If debug-server.js passes, issue is with config
3. Use absolute paths (not relative like `./dist/index.js`)
4. See [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md) for detailed steps

### Issue: NPX not found

**Solution**:
```bash
# Check Node.js installation
node --version
npm --version

# NPX comes with npm 5.2+
# If missing, update npm:
npm install -g npm@latest
```

### Issue: Permission denied

**Solution**:
```bash
# macOS/Linux - fix config file permissions
chmod 600 ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Make dist files executable
chmod +x /path/to/sql-mcp/dist/index.js
```

### Issue: Wrong Node.js version

**Solution**:
```bash
# Check version
node --version

# Should be >= 18.0.0
# Update using nvm (recommended):
nvm install 18
nvm use 18

# Or download from nodejs.org
```

## Advanced Configuration

### Custom Environment Variables

```json
{
  "mcpServers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"],
      "env": {
        "SQL_MCP_LOG_LEVEL": "debug",
        "SQL_MCP_MAX_ROWS": "1000"
      }
    }
  }
}
```

### Using Specific Node Version

```json
{
  "mcpServers": {
    "sql-mcp": {
      "command": "/Users/yourname/.nvm/versions/node/v18.20.0/bin/node",
      "args": [
        "/Users/yourname/projects/sql-mcp/dist/index.js",
        "--stdio"
      ]
    }
  }
}
```

Find your Node.js path:
```bash
which node   # macOS/Linux
where node   # Windows
```

## Example Prompts

Once connected, try these prompts:

### Connect to SQLite
```
Connect to an in-memory SQLite database with ID "demo"
```

### Create and Query
```
Create a users table with id, name, and email columns in the demo database
```

```
Insert 3 sample users into the demo database
```

```
Show me all users from the demo database
```

### Schema Exploration
```
Show me the schema of the demo database
```

### PostgreSQL Connection
```
Connect to PostgreSQL:
- ID: prod-db
- Host: localhost
- Port: 5432
- Database: myapp
- User: myuser
- Password: [your-password]
```

## Updating sql-mcp

### NPX Method
NPX automatically uses the latest version. To force update:
```bash
npx clear-npx-cache
# Then restart Claude Desktop
```

### Local Method
```bash
cd /path/to/sql-mcp
git pull
npm install
npm run build
# Then restart Claude Desktop
```

## Uninstalling

1. **Remove from config**:
   - Open claude_desktop_config.json
   - Remove the "sql-mcp" entry
   - Save file

2. **Restart Claude Desktop**

3. **Clean NPX cache** (optional):
   ```bash
   npx clear-npx-cache
   ```

## Getting Help

- **Troubleshooting Guide**: [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md)
- **Issues**: [GitHub Issues](https://github.com/varkart/sql-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/varkart/sql-mcp/discussions)

## Next Steps

- [Connect to different databases](../../README.md#supported-databases)
- [Learn about security features](../../README.md#security)
- [View example queries](../../examples/)
- [Set up other MCP clients](../clients/)
