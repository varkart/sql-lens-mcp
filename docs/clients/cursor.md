# Cursor Setup Guide

Complete setup instructions for using sql-mcp with Cursor, the AI-powered code editor.

## Prerequisites

- Cursor installed ([Download here](https://cursor.sh/))
- Node.js 20.0.0 or higher (`node --version`)
- Cursor Pro subscription (for MCP support)

## Quick Start

### Method 1: NPX (Recommended)

1. **Open Cursor Settings**:
   - Click Cursor menu → Settings (or `Cmd+,` on Mac / `Ctrl+,` on Windows/Linux)
   - Or use Command Palette: `Cmd+Shift+P` → "Preferences: Open User Settings (JSON)"

2. **Add MCP server configuration**:
   ```json
   {
     "cursor.mcpServers": {
       "sql-mcp": {
         "command": "npx",
         "args": ["-y", "sql-mcp", "--stdio"]
       }
     }
   }
   ```

3. **Restart Cursor**: Quit and reopen the application

4. **Verify connection**:
   - Open Cursor AI chat (`Cmd+L` or `Ctrl+L`)
   - Type: "What database tools do you have?"
   - Should see sql-mcp tools listed

### Method 2: Local Development

For developers working on sql-mcp:

1. **Build the project**:
   ```bash
   cd /path/to/sql-mcp
   npm install
   npm run build
   ```

2. **Get absolute path**:
   ```bash
   pwd
   # Output: /Users/yourname/projects/sql-mcp
   ```

3. **Open Cursor Settings (JSON)**

4. **Add configuration**:
   ```json
   {
     "cursor.mcpServers": {
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

5. **Restart Cursor**

## Configuration File Locations

### macOS
```
~/Library/Application Support/Cursor/User/settings.json
```

### Windows
```
%APPDATA%\Cursor\User\settings.json
```

### Linux
```
~/.config/Cursor/User/settings.json
```

## Configuration Examples

### Basic Setup
```json
{
  "cursor.mcpServers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"]
    }
  }
}
```

### With Debug Logging
```json
{
  "cursor.mcpServers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"],
      "env": {
        "SQL_MCP_LOG_LEVEL": "debug"
      }
    }
  }
}
```

### Multiple MCP Servers
```json
{
  "cursor.mcpServers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/yourname/projects"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-token-here"
      }
    }
  }
}
```

### Workspace-Specific Settings

Create `.cursor/settings.json` in your project root:

```json
{
  "cursor.mcpServers": {
    "project-db": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"]
    }
  }
}
```

## Testing the Connection

1. **Open Cursor AI Chat**: `Cmd+L` (Mac) or `Ctrl+L` (Windows/Linux)

2. **Check available tools**:
   ```
   What database tools do you have available?
   ```

3. **Expected response**:
   - List of tools: connect_database, execute_query, get_schema, list_connections, etc.

4. **Test database connection**:
   ```
   Connect to an in-memory SQLite database with ID "demo"
   ```

5. **Run a query**:
   ```
   Create a users table with id, name, and email columns in the demo database
   ```

6. **Verify with schema**:
   ```
   Show me the schema of the demo database
   ```

## Common Issues

### Issue: MCP server not appearing in Cursor

**Solution**:
1. Verify you have Cursor Pro subscription (MCP requires Pro)
2. Check settings.json syntax is valid
3. Ensure Node.js >= 20.0.0: `node --version`
4. Completely restart Cursor (quit and reopen)
5. Check Cursor logs:
   - macOS: `~/Library/Logs/Cursor/`
   - Windows: `%APPDATA%\Cursor\logs\`
   - Linux: `~/.config/Cursor/logs/`

### Issue: "npx not found"

**Solution**:
```bash
# Verify Node.js and npm installation
node --version
npm --version

# Update npm if needed
npm install -g npm@latest

# Test npx
npx --version
```

### Issue: Server crashes on connection

**Debug**:
```bash
# Test server standalone
cd /path/to/sql-mcp
node debug-server.js

# Expected output:
# ✅ Server initialized successfully!
# ✅ Tools retrieved successfully!
```

If this fails, see [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md)

### Issue: Permission errors (macOS/Linux)

**Solution**:
```bash
# Fix settings file permissions
chmod 600 ~/Library/Application\ Support/Cursor/User/settings.json

# For local installation
chmod +x /path/to/sql-mcp/dist/index.js
```

### Issue: Different Node.js versions

If Cursor uses a different Node.js than your terminal:

**Solution**:
```bash
# Find Node.js path
which node
# Example: /Users/yourname/.nvm/versions/node/v20.19.0/bin/node

# Use in settings.json
```

```json
{
  "cursor.mcpServers": {
    "sql-mcp": {
      "command": "/Users/yourname/.nvm/versions/node/v20.19.0/bin/node",
      "args": ["/path/to/sql-mcp/dist/index.js", "--stdio"]
    }
  }
}
```

## Example Workflows in Cursor

### Database-Driven Development

1. **Connect to your database**:
   ```
   Connect to my PostgreSQL database:
   - ID: dev-db
   - Host: localhost
   - Database: myapp_dev
   ```

2. **Explore schema**:
   ```
   Show me all tables in dev-db
   ```

3. **Generate types from schema**:
   ```
   Based on the users table schema, generate a TypeScript interface
   ```

4. **Build queries**:
   ```
   Write a query to get all active users created in the last 7 days
   ```

### Migration Creation

1. **Check current schema**:
   ```
   What's the current schema of the products table?
   ```

2. **Plan migration**:
   ```
   I want to add a "category_id" foreign key to products. Show me the migration SQL.
   ```

3. **Test migration**:
   ```
   Create a test database and run this migration to verify it works
   ```

### SQL File Generation

1. **Generate seed data**:
   ```
   Create a SQL file with 20 sample products for testing
   ```

2. **Create schema dumps**:
   ```
   Export the schema of dev-db to a schema.sql file
   ```

### Multi-Database Comparison

```
Connect to both my staging and production databases, then compare the schema of the users table between them
```

## Advanced Configuration

### Environment-Specific Servers

```json
{
  "cursor.mcpServers": {
    "sql-dev": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"],
      "env": {
        "SQL_MCP_ENV": "development"
      }
    },
    "sql-staging": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"],
      "env": {
        "SQL_MCP_ENV": "staging"
      }
    }
  }
}
```

### Custom Resource Limits

```json
{
  "cursor.mcpServers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"],
      "env": {
        "SQL_MCP_MAX_ROWS": "5000",
        "SQL_MCP_QUERY_TIMEOUT": "30000"
      }
    }
  }
}
```

### Integration with Other MCP Servers

Combine sql-mcp with filesystem for complete workflow:

```json
{
  "cursor.mcpServers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${workspaceFolder}"]
    }
  }
}
```

**Workflow example**:
```
Query the users table, then save the results to data/users.json
```

## Cursor-Specific Tips

1. **Use Cursor's composer mode** (`Cmd+K`) with sql-mcp for multi-file operations
2. **Combine with codebase search** to find where queries are used
3. **Use inline chat** to quickly modify SQL in code files
4. **Leverage Cursor's git integration** to review schema changes

## Keyboard Shortcuts

- **Open AI Chat**: `Cmd+L` (Mac) / `Ctrl+L` (Windows/Linux)
- **Composer Mode**: `Cmd+K` / `Ctrl+K`
- **Command Palette**: `Cmd+Shift+P` / `Ctrl+Shift+P`
- **Settings**: `Cmd+,` / `Ctrl+,`

## Updating sql-mcp

### NPX Method (Auto-updates)
NPX automatically uses the latest version. To force cache clear:
```bash
npx clear-npx-cache
```
Then restart Cursor.

### Local Development
```bash
cd /path/to/sql-mcp
git pull
npm install
npm run build
```
Then restart Cursor.

## Uninstalling

1. **Open settings.json** in Cursor

2. **Remove sql-mcp entry**:
   ```json
   {
     "cursor.mcpServers": {
       // Remove "sql-mcp" block
     }
   }
   ```

3. **Save and restart Cursor**

4. **Clear NPX cache** (optional):
   ```bash
   npx clear-npx-cache
   ```

## Troubleshooting Resources

- **Cursor Output Panel**: View → Output → Select "MCP"
- **Developer Console**: Help → Toggle Developer Tools
- **sql-mcp Troubleshooting**: [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md)
- **Cursor Docs**: [cursor.sh/docs](https://cursor.sh/docs)
- **GitHub Issues**: [Report issues](https://github.com/varkart/sql-mcp/issues)

## Getting Help

- **Documentation**: [sql-mcp README](../../README.md)
- **Examples**: [Example workflows](../../examples/)
- **Community**: [GitHub Discussions](https://github.com/varkart/sql-mcp/discussions)
- **Cursor Community**: [Cursor Forum](https://forum.cursor.sh/)

## Next Steps

- [Learn about supported databases](../../README.md#supported-databases)
- [View security features](../../README.md#security)
- [Explore other MCP clients](../clients/)
- [Contribute to sql-mcp](../../CONTRIBUTING.md)
