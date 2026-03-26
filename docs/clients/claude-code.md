# Claude Code (VS Code) Setup Guide

Complete setup instructions for using sql-mcp with Claude Code in Visual Studio Code.

## Prerequisites

- Visual Studio Code installed ([Download here](https://code.visualstudio.com/))
- Claude Code extension installed ([Install from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code))
- Node.js 18.0.0 or higher (`node --version`)

## Quick Start

### Method 1: NPX (Recommended)

Claude Code uses the same configuration format as Claude Desktop and supports automatic discovery.

1. **Open VS Code Settings** (Cmd/Ctrl + ,)

2. **Search for "mcp"**

3. **Edit in settings.json**:
   - Click "Edit in settings.json"
   - Or use Command Palette (Cmd/Ctrl + Shift + P) → "Preferences: Open User Settings (JSON)"

4. **Add MCP server configuration**:
   ```json
   {
     "claude.mcpServers": {
       "sql-mcp": {
         "command": "npx",
         "args": ["-y", "sql-mcp", "--stdio"]
       }
     }
   }
   ```

5. **Reload VS Code Window**:
   - Command Palette → "Developer: Reload Window"
   - Or restart VS Code

6. **Verify connection**:
   - Type `/mcp` in Claude Code chat panel
   - sql-mcp should appear in the list

### Method 2: Auto-Discovery from Claude Desktop

If you already have sql-mcp configured in Claude Desktop, Claude Code can automatically detect it:

1. **Enable MCP discovery** in VS Code settings.json:
   ```json
   {
     "chat.mcp.discovery.enabled": true
   }
   ```

2. **Reload VS Code Window**

3. **Claude Code will detect** sql-mcp from your Claude Desktop config

### Method 3: Workspace-Level Configuration

For project-specific database connections:

1. **Create `.vscode/settings.json`** in your project root

2. **Add MCP server config**:
   ```json
   {
     "claude.mcpServers": {
       "sql-mcp": {
         "command": "npx",
         "args": ["-y", "sql-mcp", "--stdio"]
       }
     }
   }
   ```

3. **Reload Window**

This configuration only applies to this workspace.

### Method 4: Local Development

If you're developing sql-mcp locally:

1. **Build the project**:
   ```bash
   cd /path/to/sql-mcp
   npm install
   npm run build
   ```

2. **Add to settings.json** with absolute path:
   ```json
   {
     "claude.mcpServers": {
       "sql-mcp": {
         "command": "node",
         "args": [
           "/absolute/path/to/sql-mcp/dist/index.js",
           "--stdio"
         ]
       }
     }
   }
   ```

3. **Reload Window**

## Managing MCP Servers

### Using /mcp Command

Claude Code provides an integrated MCP management UI:

1. **Open Claude Code chat panel**

2. **Type `/mcp`** - This opens the MCP management dialog

3. **Available actions**:
   - ✅ Enable/disable servers
   - 🔄 Reconnect to a server
   - 🔐 Manage OAuth authentication
   - 📋 View server status

### Checking Connection Status

**Via Chat**:
```
What MCP servers are connected?
```

**Via /mcp command**:
- Type `/mcp` and check the status indicators

## Configuration Examples

### User-Level (Global)

File: `~/Library/Application Support/Code/User/settings.json` (macOS)
File: `%APPDATA%\Code\User\settings.json` (Windows)
File: `~/.config/Code/User/settings.json` (Linux)

```json
{
  "claude.mcpServers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"]
    }
  }
}
```

### Workspace-Level (Project-Specific)

File: `.vscode/settings.json` in project root

```json
{
  "claude.mcpServers": {
    "sql-mcp-local": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"]
    }
  }
}
```

### Multiple MCP Servers

```json
{
  "claude.mcpServers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${workspaceFolder}"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}
```

### With Environment Variables

```json
{
  "claude.mcpServers": {
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

## Testing the Connection

1. **Open Claude Code chat** (View → Claude Code)

2. **Test MCP server list**:
   ```
   /mcp
   ```
   - sql-mcp should appear with ✅ status

3. **Test database connection**:
   ```
   Connect to an in-memory SQLite database with ID "demo"
   ```

4. **Expected response**:
   - Claude will use the `connect_database` tool
   - Success message confirming connection

5. **List available tools**:
   ```
   What database tools do you have available?
   ```

6. **Expected tools**:
   - connect_database
   - disconnect_database
   - execute_query
   - list_connections
   - get_schema
   - try_connect

## MCP Apps Support

Claude Code supports MCP Apps - interactive UI components in chat:

### What are MCP Apps?

MCP Apps allow sql-mcp to return rich UI instead of plain text:
- Interactive forms for database connections
- Data visualization widgets
- Multi-step workflows

### Example Usage

```
Show me users from my database in a table format
```

Claude Code will render:
- ASCII tables for query results
- Interactive forms for connection setup
- Visualizations for data analysis

## Common Issues

### Issue: MCP server not appearing

**Solution**:
1. Check settings.json syntax (valid JSON)
2. Verify no trailing commas
3. Use VS Code's JSON validation (check bottom-right for errors)
4. Reload window: Command Palette → "Developer: Reload Window"

### Issue: "Command not found" error

**Solution**:
```bash
# Verify Node.js installation
node --version
npm --version

# Should be >= 18.0.0
# Update if needed
```

### Issue: Permission denied

**Solution**:
```bash
# macOS/Linux - fix permissions
chmod +x /path/to/sql-mcp/dist/index.js

# Check Node.js is in PATH
which node
```

### Issue: Settings not taking effect

**Solution**:
1. **Check settings scope**:
   - User settings vs Workspace settings
   - Workspace settings override user settings
2. **Verify settings.json location**:
   - Open Command Palette
   - "Preferences: Open User Settings (JSON)"
   - Verify you're editing the correct file
3. **Reload window** after changes

### Issue: /mcp command not working

**Solution**:
1. Verify Claude Code extension is up to date
2. Check extension is enabled (Extensions view)
3. Restart VS Code completely

### Issue: Auto-discovery not finding Claude Desktop config

**Solution**:
```json
{
  "chat.mcp.discovery.enabled": true
}
```
- Ensure setting is in User settings (not Workspace)
- Restart VS Code
- Verify Claude Desktop config exists at expected location

## Advanced Configuration

### Security: Workspace Trust

VS Code requires workspace trust for MCP servers defined in `.vscode/settings.json`:

1. **Trust workspace**: File → Trust Folder
2. **Configure trust settings**:
   ```json
   {
     "security.workspace.trust.enabled": true
   }
   ```

### Custom Node.js Path

```json
{
  "claude.mcpServers": {
    "sql-mcp": {
      "command": "/usr/local/bin/node",
      "args": ["/path/to/sql-mcp/dist/index.js", "--stdio"]
    }
  }
}
```

Find Node.js path:
```bash
which node   # macOS/Linux
where node   # Windows
```

### Debug Logging

Enable debug output in VS Code:

1. **Add to settings.json**:
   ```json
   {
     "claude.mcpServers": {
       "sql-mcp": {
         "command": "npx",
         "args": ["-y", "sql-mcp", "--stdio", "--debug"]
       }
     }
   }
   ```

2. **View logs**:
   - View → Output
   - Select "Claude Code" from dropdown

## Example Prompts

### Connect to SQLite
```
Connect to an in-memory SQLite database with ID "test-db"
```

### Create Schema
```
In test-db, create a products table with:
- id (integer primary key)
- name (text)
- price (decimal)
- created_at (timestamp)
```

### Query with Natural Language
```
Show me all products in test-db sorted by price descending
```

### Schema Exploration
```
Describe the schema of test-db in detail
```

### Connect to PostgreSQL
```
Connect to PostgreSQL:
- ID: local-pg
- Host: localhost
- Port: 5432
- Database: myapp_dev
- User: postgres
- Password: [your-password]
```

### Cross-Database Query
```
Compare the user counts between test-db and local-pg
```

## Keyboard Shortcuts

- **Open Claude Code**: `Cmd/Ctrl + Shift + P` → "Claude Code: Open Chat"
- **New Chat**: `Cmd/Ctrl + Shift + N` (in Claude panel)
- **MCP Management**: Type `/mcp` in chat
- **Reload Window**: `Cmd/Ctrl + R` (when focused on window)

## Updating sql-mcp

### NPX Method (Automatic)
NPX automatically uses the latest version. To force update:
```bash
npx clear-npx-cache
# Then reload VS Code window
```

### Local Development Method
```bash
cd /path/to/sql-mcp
git pull
npm install
npm run build
# Reload VS Code window
```

## Uninstalling

### Remove from User Settings

1. Open settings.json
2. Remove the sql-mcp entry
3. Reload window

### Remove from Workspace

1. Delete `.vscode/settings.json` or remove sql-mcp entry
2. Reload window

### Clean NPX Cache
```bash
npx clear-npx-cache
```

## Comparison with Claude Desktop

| Feature | Claude Desktop | Claude Code (VS Code) |
|---------|----------------|----------------------|
| MCP Support | ✅ Full | ✅ Full |
| MCP Apps | ✅ Yes | ✅ Yes |
| Auto-Discovery | ❌ No | ✅ Yes (from Claude Desktop) |
| Workspace-Level Config | ❌ No | ✅ Yes |
| /mcp Command | ❌ No | ✅ Yes |
| Code Context | Limited | ✅ Full workspace access |

## Getting Help

- **Troubleshooting Guide**: [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md)
- **Claude Code Docs**: [code.claude.com/docs](https://code.claude.com/docs)
- **Issues**: [GitHub Issues](https://github.com/varkart/sql-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/varkart/sql-mcp/discussions)

## Next Steps

- [Connect to different databases](../../README.md#supported-databases)
- [Learn about security features](../../README.md#security)
- [Set up other MCP clients](../clients/)
- [Explore MCP Apps features](https://modelcontextprotocol.io/apps)
