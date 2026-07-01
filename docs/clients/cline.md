# Cline (VS Code) Setup Guide

Complete setup instructions for using sql-mcp with Cline, the VS Code extension for Claude.

## Prerequisites

- Visual Studio Code installed
- Cline extension installed ([VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev))
- Node.js 20.0.0 or higher (`node --version`)
- Anthropic API key ([Get one here](https://console.anthropic.com/))

## Quick Start

### Method 1: NPX (Recommended)

1. **Open VS Code Settings**:
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Preferences: Open User Settings (JSON)"
   - Press Enter

2. **Add MCP server configuration**:
   ```json
   {
     "cline.mcpServers": {
       "sql-mcp": {
         "command": "npx",
         "args": ["-y", "sql-mcp", "--stdio"]
       }
     }
   }
   ```

3. **Reload VS Code**:
   - Press `Cmd+Shift+P` / `Ctrl+Shift+P`
   - Type "Developer: Reload Window"
   - Press Enter

4. **Open Cline**:
   - Click the Cline icon in the Activity Bar (left sidebar)
   - Or press `Cmd+Shift+P` and type "Cline: Open"

5. **Verify connection**:
   - In Cline chat, type: "What database tools do you have?"
   - Should see sql-mcp tools listed

### Method 2: Local Development

For developers working on sql-mcp locally:

1. **Build the project**:
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

3. **Open VS Code Settings (JSON)**

4. **Add configuration**:
   ```json
   {
     "cline.mcpServers": {
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

5. **Reload VS Code window**

## Configuration Examples

### Basic Configuration
```json
{
  "cline.mcpServers": {
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
  "cline.mcpServers": {
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
  "cline.mcpServers": {
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

### Workspace-Specific Configuration

Create `.vscode/settings.json` in your project:

```json
{
  "cline.mcpServers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"]
    }
  }
}
```

This configuration only applies to the current workspace.

## Testing the Connection

1. **Open Cline panel** in VS Code

2. **Ask about available tools**:
   ```
   What database tools do you have available?
   ```

3. **Expected response**:
   - Should list tools: connect_database, execute_query, get_schema, etc.

4. **Test connection**:
   ```
   Connect to an in-memory SQLite database with ID "test"
   ```

5. **Run a query**:
   ```
   Create a test table and insert some data in the test database
   ```

## Common Issues

### Issue: MCP server not loading

**Solution**:
1. Check Cline output panel:
   - View → Output
   - Select "Cline" from dropdown
   - Look for errors mentioning sql-mcp
2. Verify Node.js version: `node --version` (must be >= 20)
3. Check JSON syntax in settings.json
4. Reload VS Code window

### Issue: "command not found: npx"

**Solution**:
```bash
# Verify Node.js and npm are installed
node --version
npm --version

# Update npm if needed
npm install -g npm@latest

# Verify npx is available
npx --version
```

### Issue: Permission denied errors

**Solution (macOS/Linux)**:
```bash
# Fix permissions for local installation
chmod +x /path/to/sql-mcp/dist/index.js

# Or use specific Node.js path
which node
# Use output in settings.json
```

**Solution (Windows)**:
- Run VS Code as Administrator
- Or use full path to node.exe in configuration

### Issue: Server crashes on startup

**Debug steps**:

1. **Test server manually**:
   ```bash
   cd /path/to/sql-mcp
   node debug-server.js
   ```

2. **Check output** - should see:
   ```
   ✅ Server initialized successfully!
   ✅ Tools retrieved successfully!
   ```

3. **If fails**, see [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md)

### Issue: Can't find settings.json

**Location by OS**:
- **macOS**: `~/Library/Application Support/Code/User/settings.json`
- **Windows**: `%APPDATA%\Code\User\settings.json`
- **Linux**: `~/.config/Code/User/settings.json`

**Or use Command Palette**:
1. `Cmd+Shift+P` / `Ctrl+Shift+P`
2. Type "Preferences: Open User Settings (JSON)"
3. File opens automatically

## VS Code Workspace vs User Settings

### User Settings (Global)
- Applies to all VS Code workspaces
- File: `~/Library/Application Support/Code/User/settings.json`
- Use for MCP servers you always want available

### Workspace Settings (Project-Specific)
- Applies only to current project
- File: `.vscode/settings.json` in project root
- Use for project-specific database connections

**Example**: User settings for sql-mcp globally, workspace settings for project-specific filesystem access.

## Example Prompts for Cline

### Basic Database Operations
```
Connect to an in-memory SQLite database called "demo"
```

```
Create a products table with id, name, price, and stock columns
```

```
Insert 5 sample products
```

```
Show me all products
```

### Schema Exploration
```
What's the schema of the demo database?
```

```
Show me all tables in the demo database
```

### Multi-Database Workflow
```
Connect to my local PostgreSQL database:
- ID: local-pg
- Host: localhost
- Port: 5432
- Database: development
- User: devuser
```

```
List all my active database connections
```

### Integration with Code
```
Query the users table and create a TypeScript interface for the schema
```

```
Show me the schema of the orders table and generate a SQL migration to add a created_at column
```

## Advanced Configuration

### Using Specific Node Version with NVM

```json
{
  "cline.mcpServers": {
    "sql-mcp": {
      "command": "/Users/yourname/.nvm/versions/node/v20.19.0/bin/node",
      "args": [
        "/Users/yourname/projects/sql-mcp/dist/index.js",
        "--stdio"
      ]
    }
  }
}
```

### Debug Mode

```json
{
  "cline.mcpServers": {
    "sql-mcp": {
      "command": "node",
      "args": [
        "/path/to/sql-mcp/dist/index.js",
        "--stdio",
        "--debug"
      ],
      "env": {
        "SQL_MCP_LOG_LEVEL": "debug"
      }
    }
  }
}
```

### Environment-Specific Configuration

```json
{
  "cline.mcpServers": {
    "sql-mcp-dev": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"],
      "env": {
        "SQL_MCP_ENV": "development"
      }
    },
    "sql-mcp-prod": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"],
      "env": {
        "SQL_MCP_ENV": "production"
      }
    }
  }
}
```

## Tips for Using Cline with sql-mcp

1. **Use descriptive connection IDs**: "local-pg", "staging-mysql", "prod-readonly"

2. **Combine with filesystem MCP**: Access databases and read/write SQL files

3. **Create reusable queries**: Ask Cline to save common queries to files

4. **Schema-driven development**: Ask Cline to generate TypeScript types from database schemas

5. **Migration workflows**: Have Cline help write and test migrations

## Updating sql-mcp

### NPX Method
Automatically gets latest version on each use. To clear cache:
```bash
npx clear-npx-cache
```
Then reload VS Code.

### Local Development Method
```bash
cd /path/to/sql-mcp
git pull
npm install
npm run build
```
Then reload VS Code window.

## Uninstalling

1. **Remove from settings.json**:
   - Delete the "sql-mcp" entry from "cline.mcpServers"
   - Save file

2. **Reload VS Code**:
   - `Cmd+Shift+P` → "Developer: Reload Window"

3. **Clear cache** (optional):
   ```bash
   npx clear-npx-cache
   ```

## Troubleshooting Resources

- **Cline Output Panel**: View → Output → Select "Cline"
- **VS Code Developer Tools**: Help → Toggle Developer Tools
- **sql-mcp Troubleshooting**: [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md)
- **GitHub Issues**: [Report issues](https://github.com/varkart/sql-mcp/issues)

## Next Steps

- [Learn about supported databases](../../README.md#supported-databases)
- [View security features](../../README.md#security)
- [See example workflows](../../examples/)
- [Setup other MCP clients](../clients/)
