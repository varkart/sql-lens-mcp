# Continue Setup Guide

Complete setup instructions for using sql-mcp with Continue, the open-source AI code assistant.

## Prerequisites

- VS Code or JetBrains IDE installed
- Continue extension installed:
  - **VS Code**: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Continue.continue)
  - **JetBrains**: [JetBrains Marketplace](https://plugins.jetbrains.com/plugin/22707-continue)
- Node.js 20.0.0 or higher (`node --version`)

## Quick Start

### Method 1: NPX (Recommended)

1. **Open Continue config**:
   - Click Continue icon in sidebar
   - Click ⚙️ (gear icon) in Continue panel
   - Or use Command Palette: `Continue: Open config.json`

2. **Add MCP server to config.json**:
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

3. **Reload Continue**:
   - VS Code: Reload window (`Cmd+Shift+P` → "Developer: Reload Window")
   - JetBrains: Restart IDE

4. **Verify connection**:
   - Open Continue chat
   - Type: "What database tools do you have?"
   - Should see sql-mcp tools

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

3. **Open Continue config.json**

4. **Add configuration**:
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

5. **Reload window/IDE**

## Configuration File Locations

### VS Code

- **macOS**: `~/.continue/config.json`
- **Windows**: `%USERPROFILE%\.continue\config.json`
- **Linux**: `~/.continue/config.json`

### JetBrains

- **macOS**: `~/Library/Application Support/JetBrains/<IDE>/continue/config.json`
- **Windows**: `%APPDATA%\JetBrains\<IDE>\continue\config.json`
- **Linux**: `~/.config/JetBrains/<IDE>/continue/config.json`

Replace `<IDE>` with: `IntelliJIdea2024.1`, `PyCharm2024.1`, etc.

## Configuration Examples

### Basic Setup
```json
{
  "models": [
    {
      "title": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "apiKey": "your-api-key"
    }
  ],
  "mcpServers": {
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

### Multiple MCP Servers
```json
{
  "mcpServers": {
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
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token"
      }
    }
  }
}
```

### Complete Example with Context Providers
```json
{
  "models": [
    {
      "title": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "apiKey": "your-api-key"
    }
  ],
  "mcpServers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"]
    }
  },
  "contextProviders": [
    {
      "name": "code",
      "params": {}
    },
    {
      "name": "docs",
      "params": {}
    }
  ]
}
```

## Testing the Connection

1. **Open Continue panel**:
   - VS Code: Click Continue icon in Activity Bar
   - JetBrains: Open Continue tool window

2. **Check tools**:
   ```
   What database tools do you have available?
   ```

3. **Expected**: List of connect_database, execute_query, get_schema, etc.

4. **Test connection**:
   ```
   Connect to an in-memory SQLite database with ID "demo"
   ```

5. **Run query**:
   ```
   Create a products table with id, name, and price columns
   ```

6. **Verify schema**:
   ```
   Show me the schema of the demo database
   ```

## Common Issues

### Issue: Config file not found

**Solution**:

1. **Create config directory**:
   ```bash
   # macOS/Linux
   mkdir -p ~/.continue

   # Windows
   mkdir %USERPROFILE%\.continue
   ```

2. **Create config.json**:
   ```bash
   # macOS/Linux
   touch ~/.continue/config.json

   # Windows
   type nul > %USERPROFILE%\.continue\config.json
   ```

3. **Add configuration** and reload

### Issue: MCP server not loading

**Solution**:
1. Check Continue output panel:
   - VS Code: View → Output → Select "Continue"
   - JetBrains: View → Tool Windows → Continue
2. Verify Node.js version >= 18
3. Check config.json syntax (no trailing commas)
4. Reload window/IDE completely

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

# Expected:
# ✅ Server initialized successfully!
```

See [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md) if fails.

### Issue: Permission denied (macOS/Linux)

**Solution**:
```bash
# Fix config permissions
chmod 600 ~/.continue/config.json

# Fix dist permissions
chmod +x /path/to/sql-mcp/dist/index.js
```

### Issue: Different Node.js versions

**Solution**:
```bash
# Find Node.js path
which node    # macOS/Linux
where node    # Windows

# Use full path in config:
```

```json
{
  "mcpServers": {
    "sql-mcp": {
      "command": "/usr/local/bin/node",
      "args": ["/path/to/sql-mcp/dist/index.js", "--stdio"]
    }
  }
}
```

## Continue-Specific Features

### Slash Commands with SQL

Use Continue's slash commands with sql-mcp:

```
/edit Connect to my PostgreSQL database and update this function to use the users table schema
```

### Context Awareness

Continue can use database schema as context:

```
@schema Show me the users table schema, then generate TypeScript types for it
```

### Code Generation

```
Based on my database schema, generate a complete CRUD API with Express.js
```

### Inline Edits

Highlight SQL code in your files, then:
```
Optimize this query for better performance
```

## Example Workflows

### Database-First Development

1. **Connect to database**:
   ```
   Connect to my local PostgreSQL database named "myapp_dev"
   ```

2. **Explore schema**:
   ```
   List all tables in myapp_dev
   ```

3. **Generate models**:
   ```
   For each table, generate a TypeScript model class with all fields
   ```

4. **Create API**:
   ```
   Now create Express.js routes for CRUD operations on the users table
   ```

### Migration Workflows

1. **Analyze current schema**:
   ```
   Show me the current schema of the products table
   ```

2. **Plan changes**:
   ```
   I want to add created_at and updated_at columns. Write the migration.
   ```

3. **Test migration**:
   ```
   Create a test database and run this migration to verify it works
   ```

### Data Analysis

```
Connect to my analytics database and query the top 10 products by revenue this month
```

```
Export the results to a CSV file in the project root
```

## Advanced Configuration

### Multiple Environments

```json
{
  "mcpServers": {
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

### Debug Mode

```json
{
  "mcpServers": {
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

### Custom Resource Limits

```json
{
  "mcpServers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"],
      "env": {
        "SQL_MCP_MAX_ROWS": "5000",
        "SQL_MCP_QUERY_TIMEOUT": "60000"
      }
    }
  }
}
```

## JetBrains-Specific Setup

### IntelliJ IDEA / PyCharm / WebStorm

1. **Install Continue plugin**:
   - Settings → Plugins → Marketplace
   - Search "Continue"
   - Install and restart

2. **Open config**:
   - Tools → Continue → Open config.json

3. **Add sql-mcp** as shown above

4. **Restart IDE**

### Config location by IDE

- **IntelliJ IDEA**: `~/.config/JetBrains/IntelliJIdea2024.1/continue/config.json`
- **PyCharm**: `~/.config/JetBrains/PyCharm2024.1/continue/config.json`
- **WebStorm**: `~/.config/JetBrains/WebStorm2024.1/continue/config.json`
- **GoLand**: `~/.config/JetBrains/GoLand2024.1/continue/config.json`

## Tips for Using Continue with sql-mcp

1. **Use @ mentions** to reference database connections in chat
2. **Combine with codebase** context for schema-aware development
3. **Leverage /edit** for inline SQL modifications
4. **Use /comment** to document complex queries
5. **Try /test** to generate test data for your database

## Keyboard Shortcuts

### VS Code
- **Toggle Continue**: `Cmd+L` (Mac) / `Ctrl+L` (Windows/Linux)
- **Edit Selection**: `Cmd+I` / `Ctrl+I`
- **Command Palette**: `Cmd+Shift+P` / `Ctrl+Shift+P`

### JetBrains
- **Open Continue**: `Cmd+J` (Mac) / `Ctrl+J` (Windows/Linux)
- **Settings**: `Cmd+,` (Mac) / `Ctrl+Alt+S` (Windows/Linux)

## Updating sql-mcp

### NPX Method
Automatically uses latest version. Clear cache:
```bash
npx clear-npx-cache
```
Then reload window/IDE.

### Local Development
```bash
cd /path/to/sql-mcp
git pull
npm install
npm run build
```
Then reload window/IDE.

## Uninstalling

1. **Open config.json** in Continue
2. **Remove sql-mcp entry** from `mcpServers`
3. **Save and reload** window/IDE
4. **Clear cache** (optional):
   ```bash
   npx clear-npx-cache
   ```

## Troubleshooting Resources

- **Continue Output**: View → Output → "Continue" (VS Code)
- **Continue Logs**: `~/.continue/logs/` directory
- **sql-mcp Docs**: [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md)
- **Continue Docs**: [continue.dev/docs](https://continue.dev/docs)
- **GitHub Issues**: [Report issues](https://github.com/varkart/sql-mcp/issues)

## Getting Help

- **Continue Discord**: [Join here](https://discord.gg/EfJEfdFnDQ)
- **sql-mcp Docs**: [README](../../README.md)
- **Examples**: [Workflow examples](../../examples/)
- **Community**: [GitHub Discussions](https://github.com/varkart/sql-mcp/discussions)

## Next Steps

- [Learn about supported databases](../../README.md#supported-databases)
- [View security features](../../README.md#security)
- [Explore other MCP clients](../clients/)
- [Contributing guide](../../CONTRIBUTING.md)
