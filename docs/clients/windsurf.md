# Windsurf Setup Guide

Complete setup instructions for using sql-mcp with Windsurf, Codeium's AI-native IDE.

## Prerequisites

- Windsurf installed ([Download here](https://codeium.com/windsurf))
- Node.js 20.0.0 or higher (`node --version`)
- Windsurf Pro (for MCP support)

## Quick Start

### Method 1: NPX (Recommended)

1. **Open Windsurf Settings**:
   - macOS: `Cmd+,`
   - Windows/Linux: `Ctrl+,`
   - Or: Menu → Code → Settings → Settings

2. **Search for "MCP" in settings search bar**

3. **Edit MCP Servers configuration**:
   - Click "Edit in settings.json"

4. **Add sql-mcp configuration**:
   ```json
   {
     "windsurf.mcpServers": {
       "sql-mcp": {
         "command": "npx",
         "args": ["-y", "sql-mcp", "--stdio"]
       }
     }
   }
   ```

5. **Restart Windsurf**: Quit and reopen

6. **Verify connection**:
   - Open Cascade panel (AI assistant)
   - Ask: "What database tools do you have?"

### Method 2: Local Development

1. **Build sql-mcp**:
   ```bash
   cd /path/to/sql-mcp
   npm install
   npm run build
   ```

2. **Get absolute path**:
   ```bash
   pwd
   # Example: /Users/yourname/projects/sql-mcp
   ```

3. **Open Windsurf settings.json**

4. **Add configuration**:
   ```json
   {
     "windsurf.mcpServers": {
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

5. **Restart Windsurf**

## Configuration File Locations

### macOS
```
~/Library/Application Support/Windsurf/User/settings.json
```

### Windows
```
%APPDATA%\Windsurf\User\settings.json
```

### Linux
```
~/.config/Windsurf/User/settings.json
```

## Configuration Examples

### Basic Configuration
```json
{
  "windsurf.mcpServers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"]
    }
  }
}
```

### With Environment Variables
```json
{
  "windsurf.mcpServers": {
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

### Multiple MCP Servers
```json
{
  "windsurf.mcpServers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/yourname/projects"
      ]
    }
  }
}
```

### Workspace-Specific Configuration

Create `.windsurf/settings.json` in project root:

```json
{
  "windsurf.mcpServers": {
    "project-db": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"]
    }
  }
}
```

## Testing the Connection

1. **Open Cascade** (Windsurf's AI assistant):
   - Click Cascade icon in sidebar
   - Or press `Cmd+Shift+C` (Mac) / `Ctrl+Shift+C` (Windows/Linux)

2. **Check tools**:
   ```
   What database tools do you have available?
   ```

3. **Expected response**: List of sql-mcp tools

4. **Test connection**:
   ```
   Connect to an in-memory SQLite database with ID "test"
   ```

5. **Run query**:
   ```
   Create a sample users table and insert 3 test records
   ```

6. **Verify**:
   ```
   Show me the schema of the test database
   ```

## Common Issues

### Issue: MCP server not loading

**Solution**:
1. Verify Windsurf Pro subscription (MCP requires Pro)
2. Check settings.json syntax (no trailing commas)
3. Confirm Node.js version >= 18: `node --version`
4. Completely restart Windsurf
5. Check Windsurf logs:
   - View → Output
   - Select "Windsurf MCP" from dropdown

### Issue: "command not found: npx"

**Solution**:
```bash
# Verify installations
node --version
npm --version
npx --version

# Update if needed
npm install -g npm@latest
```

### Issue: Server crashes on startup

**Debug**:
```bash
# Test standalone
cd /path/to/sql-mcp
node debug-server.js

# Should output:
# ✅ Server initialized successfully!
```

If fails, see [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md)

### Issue: Permission denied (macOS/Linux)

**Solution**:
```bash
# Fix config permissions
chmod 600 ~/Library/Application\ Support/Windsurf/User/settings.json

# Fix dist permissions
chmod +x /path/to/sql-mcp/dist/index.js
```

### Issue: Different Node.js versions

Find your Node.js path and use it explicitly:

```bash
# Find path
which node
# Output: /usr/local/bin/node

# Use in settings.json:
```

```json
{
  "windsurf.mcpServers": {
    "sql-mcp": {
      "command": "/usr/local/bin/node",
      "args": ["/path/to/sql-mcp/dist/index.js", "--stdio"]
    }
  }
}
```

## Windsurf-Specific Features

### Cascade Flows with SQL

Windsurf's Cascade can create multi-step flows with sql-mcp:

**Example Flow**:
```
1. Connect to my development PostgreSQL database
2. Query all users created in the last week
3. Export the results to a CSV file in the project
4. Generate a summary report
```

Cascade will automatically chain these operations.

### Supercomplete with Database Context

Use sql-mcp to provide database schema context for Windsurf's autocomplete:

```
Get the schema of the users table, then help me write a TypeScript function to query it
```

Windsurf will use the schema for better code suggestions.

### Terminal Integration

Run database operations from Windsurf's integrated terminal:

```
Connect to my local MySQL database and show me all tables
```

## Example Workflows

### Database-Driven Development

1. **Connect to database**:
   ```
   Connect to PostgreSQL:
   - ID: dev
   - Host: localhost
   - Database: myapp_development
   ```

2. **Explore schema**:
   ```
   Show me all tables in the dev database
   ```

3. **Generate code from schema**:
   ```
   Based on the products table, create a TypeScript interface and CRUD functions
   ```

4. **Write migrations**:
   ```
   I need to add a "status" column to products. Write the migration SQL.
   ```

### Multi-Database Analysis

```
Connect to both my staging and production databases, then compare the row counts for all tables
```

### SQL File Management

Combine with filesystem MCP:

```
Read schema.sql from the migrations folder, then apply it to my test database
```

## Advanced Configuration

### Environment-Based Servers

```json
{
  "windsurf.mcpServers": {
    "sql-dev": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"],
      "env": {
        "SQL_MCP_ENV": "development"
      }
    },
    "sql-prod-readonly": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"],
      "env": {
        "SQL_MCP_ENV": "production",
        "SQL_MCP_READ_ONLY": "true"
      }
    }
  }
}
```

### Debug Mode

```json
{
  "windsurf.mcpServers": {
    "sql-mcp": {
      "command": "node",
      "args": [
        "/path/to/sql-mcp/dist/index.js",
        "--stdio",
        "--debug"
      ],
      "env": {
        "SQL_MCP_LOG_LEVEL": "debug",
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Integration with Other MCP Servers

```json
{
  "windsurf.mcpServers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "${workspaceFolder}"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    }
  }
}
```

## Windsurf Tips

1. **Use Cascade's multi-turn conversations** for complex database operations
2. **Leverage Flow mode** to create reusable database workflows
3. **Combine with Supercomplete** for schema-aware code completion
4. **Use inline edits** to modify SQL queries in your code
5. **Terminal integration** for quick database checks

## Keyboard Shortcuts

- **Open Cascade**: `Cmd+Shift+C` (Mac) / `Ctrl+Shift+C` (Windows/Linux)
- **Settings**: `Cmd+,` / `Ctrl+,`
- **Command Palette**: `Cmd+Shift+P` / `Ctrl+Shift+P`
- **Terminal**: `Ctrl+\``

## Updating sql-mcp

### NPX Method
Automatically uses latest version. Clear cache:
```bash
npx clear-npx-cache
```
Then restart Windsurf.

### Local Development
```bash
cd /path/to/sql-mcp
git pull
npm install
npm run build
```
Then restart Windsurf.

## Uninstalling

1. **Open settings.json** in Windsurf
2. **Remove sql-mcp entry** from `windsurf.mcpServers`
3. **Save and restart Windsurf**
4. **Clear cache** (optional):
   ```bash
   npx clear-npx-cache
   ```

## Troubleshooting Resources

- **Windsurf Output Panel**: View → Output → "Windsurf MCP"
- **Developer Tools**: Help → Toggle Developer Tools
- **sql-mcp Docs**: [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md)
- **Windsurf Docs**: [codeium.com/windsurf/docs](https://codeium.com/windsurf/docs)
- **GitHub Issues**: [Report issues](https://github.com/varkart/sql-mcp/issues)

## Getting Help

- **Documentation**: [sql-mcp README](../../README.md)
- **Examples**: [Workflow examples](../../examples/)
- **Community**: [GitHub Discussions](https://github.com/varkart/sql-mcp/discussions)
- **Windsurf Discord**: [Join here](https://discord.gg/codeium)

## Next Steps

- [Learn about supported databases](../../README.md#supported-databases)
- [View security features](../../README.md#security)
- [Explore other MCP clients](../clients/)
- [Contributing guide](../../CONTRIBUTING.md)
