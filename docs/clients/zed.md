# Zed Setup Guide

Complete setup instructions for using sql-mcp with Zed, the high-performance code editor.

## Prerequisites

- Zed installed ([Download here](https://zed.dev/))
- Node.js 20.0.0 or higher (`node --version`)
- Zed version with MCP support (v0.120.0+)

## Quick Start

### Method 1: NPX (Recommended)

1. **Open Zed settings**:
   - macOS: `Cmd+,`
   - Linux: `Ctrl+,`
   - Or: Menu → Zed → Settings

2. **Click "Open settings.json"** in the top right

3. **Add MCP server configuration**:
   ```json
   {
     "language_models": {
       "anthropic": {
         "version": "1",
         "api_key": "your-api-key-here"
       }
     },
     "context_servers": {
       "sql-mcp": {
         "command": "npx",
         "args": ["-y", "sql-mcp", "--stdio"]
       }
     }
   }
   ```

4. **Save and reload**: Changes apply automatically in Zed

5. **Verify connection**:
   - Open Assistant panel (`Cmd+?` or click 🤖 icon)
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

3. **Open Zed settings.json**

4. **Add configuration**:
   ```json
   {
     "context_servers": {
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

5. **Save** (auto-reloads)

## Configuration File Location

### macOS
```
~/.config/zed/settings.json
```

### Linux
```
~/.config/zed/settings.json
```

**Note**: Zed is not officially available on Windows yet.

## Configuration Examples

### Basic Setup
```json
{
  "context_servers": {
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
  "context_servers": {
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

### Multiple Context Servers
```json
{
  "context_servers": {
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

### Complete Configuration with Language Model
```json
{
  "language_models": {
    "anthropic": {
      "version": "1",
      "api_key": "sk-ant-api03-...",
      "default_model": {
        "name": "claude-3-5-sonnet-20241022",
        "max_tokens": 4096
      }
    }
  },
  "context_servers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"]
    }
  },
  "assistant": {
    "enabled": true,
    "default_width": 640
  }
}
```

## Testing the Connection

1. **Open Assistant panel**:
   - Click 🤖 icon in top right
   - Or press `Cmd+?` (Mac) / `Ctrl+?` (Linux)

2. **Check tools**:
   ```
   What database tools do you have available?
   ```

3. **Expected**: List of sql-mcp tools

4. **Test connection**:
   ```
   Connect to an in-memory SQLite database with ID "test"
   ```

5. **Run query**:
   ```
   Create a users table with id, name, email columns
   ```

6. **Verify**:
   ```
   Show me the schema of the test database
   ```

## Common Issues

### Issue: Context server not loading

**Solution**:
1. Verify Zed version >= 0.120.0: Menu → Zed → About Zed
2. Check settings.json syntax (no trailing commas)
3. Confirm Node.js >= 20: `node --version`
4. Check Zed logs:
   ```bash
   # View logs
   tail -f ~/.local/share/zed/logs/Zed.log
   ```
5. Settings auto-reload, but restart Zed if needed

### Issue: "npx not found"

**Solution**:
```bash
# Verify installations
node --version
npm --version
npx --version

# Update npm
npm install -g npm@latest
```

### Issue: Server crashes on startup

**Debug**:
```bash
# Test standalone
cd /path/to/sql-mcp
node debug-server.js

# Expected output:
# ✅ Server initialized successfully!
```

If fails, see [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md)

### Issue: Permission denied

**Solution**:
```bash
# Fix config permissions
chmod 600 ~/.config/zed/settings.json

# Fix dist permissions
chmod +x /path/to/sql-mcp/dist/index.js
```

### Issue: Zed not finding Node.js

Zed may use different PATH than terminal.

**Solution**:
```bash
# Find Node.js path
which node
# Output: /usr/local/bin/node

# Use full path in settings:
```

```json
{
  "context_servers": {
    "sql-mcp": {
      "command": "/usr/local/bin/node",
      "args": ["/path/to/sql-mcp/dist/index.js", "--stdio"]
    }
  }
}
```

## Zed-Specific Features

### Inline Assistance

Highlight SQL code and ask Zed to optimize or explain it:

1. Select SQL query in editor
2. Press `Cmd+?` to open Assistant
3. Ask: "Optimize this query for performance"

### Multi-Buffer Context

Zed can use context from multiple open files:

```
Look at the database schema in schema.sql and the query in query.sql, then optimize the query
```

### Fast Performance

Zed is written in Rust and optimized for speed:
- Instant settings reload
- Fast MCP server communication
- Efficient buffer management

### Collaborative Editing

Use sql-mcp in Zed's collaborative mode:

1. Start collaboration: `Cmd+Shift+P` → "Collaboration: Share Project"
2. All participants can use sql-mcp together
3. Database queries visible to all collaborators

## Example Workflows

### Database Schema Exploration

```
Connect to my PostgreSQL database at localhost, database "myapp_dev"
```

```
Show me all tables in myapp_dev
```

```
For each table, show me the column count and row count
```

### Code Generation

```
Get the schema of the users table, then generate a Rust struct with serde annotations
```

### Query Optimization

1. Write a SQL query in your editor
2. Highlight the query
3. Ask: "Is there a more efficient way to write this?"
4. Zed will suggest optimizations

### Migration Development

```
I need to add an index on the email column of users table. Write the migration SQL.
```

## Advanced Configuration

### Environment-Based Servers

```json
{
  "context_servers": {
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
  "context_servers": {
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

### Custom Resource Limits

```json
{
  "context_servers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"],
      "env": {
        "SQL_MCP_MAX_ROWS": "10000",
        "SQL_MCP_QUERY_TIMEOUT": "60000"
      }
    }
  }
}
```

### Workspace-Specific Settings

Create `.zed/settings.json` in your project:

```json
{
  "context_servers": {
    "project-db": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"]
    }
  }
}
```

This only applies to the current workspace.

## Zed Tips

1. **Use keyboard-first workflow**: Zed is optimized for keyboard navigation
2. **Leverage multi-cursor**: Edit multiple SQL queries simultaneously
3. **Collaborate in real-time**: Share projects and use sql-mcp together
4. **Fast file switching**: `Cmd+P` to quickly navigate between SQL files
5. **Integrated terminal**: `Ctrl+\`` for quick database checks

## Keyboard Shortcuts

- **Assistant Panel**: `Cmd+?` (Mac) / `Ctrl+?` (Linux)
- **Settings**: `Cmd+,` (Mac) / `Ctrl+,` (Linux)
- **Command Palette**: `Cmd+Shift+P` / `Ctrl+Shift+P`
- **Project Search**: `Cmd+Shift+F` / `Ctrl+Shift+F`
- **Terminal**: `Ctrl+\``

## Updating sql-mcp

### NPX Method
Automatically uses latest. Clear cache:
```bash
npx clear-npx-cache
```
Settings auto-reload in Zed.

### Local Development
```bash
cd /path/to/sql-mcp
git pull
npm install
npm run build
```
Zed auto-detects changes.

## Uninstalling

1. **Open settings.json** in Zed (`Cmd+,`)
2. **Remove sql-mcp entry** from `context_servers`
3. **Save** (auto-reloads)
4. **Clear cache** (optional):
   ```bash
   npx clear-npx-cache
   ```

## Troubleshooting Resources

- **Zed Logs**: `~/.local/share/zed/logs/Zed.log`
- **View logs in real-time**:
  ```bash
  tail -f ~/.local/share/zed/logs/Zed.log
  ```
- **sql-mcp Docs**: [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md)
- **Zed Docs**: [zed.dev/docs](https://zed.dev/docs)
- **GitHub Issues**: [Report issues](https://github.com/varkart/mcp-sql-explorer/issues)

## Getting Help

- **Zed Community**: [zed.dev/community](https://zed.dev/community)
- **sql-mcp Docs**: [README](../../README.md)
- **Examples**: [Workflow examples](../../examples/)
- **GitHub Discussions**: [Discussions](https://github.com/varkart/mcp-sql-explorer/discussions)

## Next Steps

- [Learn about supported databases](../../README.md#supported-databases)
- [View security features](../../README.md#security)
- [Explore other MCP clients](../clients/)
- [Contributing guide](../../CONTRIBUTING.md)
