# MCP Client Setup Guides

sql-mcp works with any MCP-compatible client. Choose your preferred client below for detailed setup instructions.

## Quick Setup

All clients use a similar configuration pattern:

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

**Note**: The exact key name varies by client (`mcpServers`, `context_servers`, etc.). See client-specific guides below.

## Supported Clients

| Client | Platform | MCP Support | Setup Difficulty | Best For |
|--------|----------|-------------|------------------|----------|
| [Claude Desktop](claude-desktop.md) | macOS, Windows, Linux | ✅ Full | ⭐ Easy | General AI chat with database access |
| [Claude Code](claude-code.md) | VS Code | ✅ Full | ⭐ Easy | VS Code with Claude, MCP Apps support |
| [Cline](cline.md) | VS Code | ✅ Full | ⭐ Easy | VS Code users, coding assistance |
| [Cursor](cursor.md) | macOS, Windows, Linux | ✅ Full (Pro) | ⭐ Easy | AI-native code editor |
| [Windsurf](windsurf.md) | macOS, Windows, Linux | ✅ Full (Pro) | ⭐ Easy | Codeium users, multi-step flows |
| [Continue](continue.md) | VS Code, JetBrains | ✅ Full | ⭐⭐ Medium | Open-source, IDE integration |
| [Zed](zed.md) | macOS, Linux | ✅ Full | ⭐ Easy | High-performance editing |
| [JetBrains IDEs](jetbrains.md) | All platforms | ✅ Full (2025.1+) | ⭐⭐ Medium | IntelliJ, PyCharm, WebStorm users |
| [ChatGPT Desktop](chatgpt.md) | macOS, Windows, Linux | ✅ Beta | ⭐⭐⭐ Complex | OpenAI ecosystem, requires hosting |

## Setup by Use Case

### For General Database Management
**Recommended**: [Claude Desktop](claude-desktop.md)
- Native desktop app
- Easy configuration
- Best for non-developers or general use

### For VS Code Users
**Recommended**: [Claude Code](claude-code.md) or [Cline](cline.md)
- Native VS Code integration
- Claude Code has MCP Apps support
- Perfect for AI-assisted database development

### For JetBrains Users
**Recommended**: [JetBrains IDEs](jetbrains.md)
- Built-in MCP client (2025.1+)
- Deep IDE integration with AI Assistant
- Ideal for Java, Python, Web development

### For AI-Native Code Editors
**Recommended**: [Cursor](cursor.md) or [Windsurf](windsurf.md)
- Purpose-built for AI-assisted coding
- Schema-aware code generation
- Perfect for database-driven development

### For OpenAI Ecosystem
**Recommended**: [ChatGPT Desktop](chatgpt.md)
- Works with ChatGPT Plus/Pro
- Requires remote hosting setup
- Good for OpenAI-centric workflows

### For Open Source / Self-Hosted
**Recommended**: [Continue](continue.md)
- Open-source alternative
- Works with VS Code and JetBrains
- Full control over configuration

### For High-Performance Workflows
**Recommended**: [Zed](zed.md)
- Blazing fast Rust-based editor
- Instant settings reload
- Great for large codebases

## Installation Methods

### NPX (Recommended for All Clients)

Automatically downloads and runs the latest version:

```json
{
  "command": "npx",
  "args": ["-y", "sql-mcp", "--stdio"]
}
```

**Pros**:
- Always uses latest version
- No manual installation needed
- Works on all platforms

**Cons**:
- Requires internet connection on first run
- Slightly slower startup (first time only)

### Local Development

For contributors or development:

```json
{
  "command": "node",
  "args": ["/absolute/path/to/sql-mcp/dist/index.js", "--stdio"]
}
```

**Pros**:
- Instant startup
- Test local changes
- No internet required

**Cons**:
- Requires manual build (`npm run build`)
- Must use absolute paths
- Manual updates

## Configuration Examples

### Basic Setup
The simplest configuration:

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

### With Environment Variables
Control behavior with env vars:

```json
{
  "mcpServers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"],
      "env": {
        "SQL_MCP_LOG_LEVEL": "debug",
        "SQL_MCP_MAX_ROWS": "1000",
        "SQL_MCP_QUERY_TIMEOUT": "30000"
      }
    }
  }
}
```

### Multiple MCP Servers
Combine sql-mcp with other servers:

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
        "GITHUB_TOKEN": "your-token"
      }
    }
  }
}
```

### Environment-Specific Servers
Separate dev/staging/prod configurations:

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
    },
    "sql-prod-readonly": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"],
      "env": {
        "SQL_MCP_READ_ONLY": "true"
      }
    }
  }
}
```

## Common Configuration Patterns

### Pattern 1: Developer Workstation
Combine database, filesystem, and git access:

```json
{
  "mcpServers": {
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

### Pattern 2: Data Analyst Setup
Focus on database access with visualization:

```json
{
  "mcpServers": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"],
      "env": {
        "SQL_MCP_MAX_ROWS": "10000"
      }
    }
  }
}
```

### Pattern 3: Production Monitoring
Read-only access to production databases:

```json
{
  "mcpServers": {
    "prod-db-readonly": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"],
      "env": {
        "SQL_MCP_READ_ONLY": "true",
        "SQL_MCP_MAX_ROWS": "100"
      }
    }
  }
}
```

## Troubleshooting

### Issue: Server not appearing in client

**Quick fixes**:
1. Check Node.js version: `node --version` (must be >= 18)
2. Verify config file syntax (no trailing commas in JSON)
3. Use absolute paths for local installations
4. Restart client completely

**Detailed guide**: [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md)

### Issue: "Connection closed" error

**Solution**:
```bash
# Test server works standalone
cd /path/to/sql-mcp
node debug-server.js

# Expected output:
# ✅ Server initialized successfully!
```

If server works but client fails, it's a configuration issue. See client-specific guides above.

### Issue: NPX not found

**Solution**:
```bash
node --version   # Check Node.js installed
npm --version    # Check npm installed
npx --version    # Check npx available

# Update npm if needed
npm install -g npm@latest
```

## Testing Your Setup

Once configured, test with these prompts:

### 1. Check Tools Available
```
What database tools do you have?
```

**Expected**: List of connect_database, execute_query, get_schema, etc.

### 2. Connect to SQLite
```
Connect to an in-memory SQLite database with ID "test"
```

**Expected**: Success message

### 3. Create Table
```
Create a users table with id, name, and email columns in the test database
```

**Expected**: Table created successfully

### 4. Query Schema
```
Show me the schema of the test database
```

**Expected**: Table structure displayed

### 5. Insert and Query Data
```
Insert 3 sample users into the test database, then show me all users
```

**Expected**: Data inserted and displayed

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `SQL_MCP_LOG_LEVEL` | `info` | Logging level: `debug`, `info`, `warn`, `error` |
| `SQL_MCP_MAX_ROWS` | `1000` | Maximum rows returned per query |
| `SQL_MCP_QUERY_TIMEOUT` | `30000` | Query timeout in milliseconds |
| `SQL_MCP_ENV` | - | Environment identifier (dev, staging, prod) |
| `SQL_MCP_READ_ONLY` | `false` | Force read-only mode if `true` |

## Config File Locations by Client

| Client | macOS | Windows | Linux |
|--------|-------|---------|-------|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` | `%APPDATA%\Claude\claude_desktop_config.json` | `~/.config/Claude/claude_desktop_config.json` |
| Claude Code | `~/Library/Application Support/Code/User/settings.json` | `%APPDATA%\Code\User\settings.json` | `~/.config/Code/User/settings.json` |
| Cline | `~/.continue/config.json` | `%USERPROFILE%\.continue\config.json` | `~/.continue/config.json` |
| Cursor | `~/Library/Application Support/Cursor/User/settings.json` | `%APPDATA%\Cursor\User\settings.json` | `~/.config/Cursor/User/settings.json` |
| Windsurf | `~/Library/Application Support/Windsurf/User/settings.json` | `%APPDATA%\Windsurf\User\settings.json` | `~/.config/Windsurf/User/settings.json` |
| Continue | `~/.continue/config.json` | `%USERPROFILE%\.continue\config.json` | `~/.continue/config.json` |
| Zed | `~/.config/zed/settings.json` | N/A | `~/.config/zed/settings.json` |
| JetBrains IDEs | `~/Library/Application Support/JetBrains/<IDE>/options/mcp-client.xml` | `%APPDATA%\JetBrains\<IDE>\options\mcp-client.xml` | `~/.config/JetBrains/<IDE>/options/mcp-client.xml` |
| ChatGPT Desktop | Developer Mode UI | Developer Mode UI | Developer Mode UI |

## Client Feature Comparison

| Feature | Claude Desktop | Claude Code | Cline | Cursor | Windsurf | Continue | Zed | JetBrains | ChatGPT |
|---------|---------------|-------------|-------|--------|----------|----------|-----|-----------|---------|
| Free Tier | ✅ | ✅ | ✅ | ⚠️ Limited | ⚠️ Limited | ✅ | ✅ | 💰 Paid | 💰 Plus/Pro |
| Code Editor | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Multi-turn Conversations | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Inline Editing | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| File Access | ⚠️ Via MCP | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ Via MCP |
| Terminal Integration | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| MCP Apps Support | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ Partial | ⚠️ Beta |
| Collaboration | ❌ | ❌ | ❌ | ⚠️ Share | ⚠️ Share | ❌ | ✅ Real-time | ⚠️ Share | ⚠️ Share |
| Open Source | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Setup Complexity | ⭐ Easy | ⭐ Easy | ⭐ Easy | ⭐ Easy | ⭐ Easy | ⭐⭐ Medium | ⭐ Easy | ⭐⭐ Medium | ⭐⭐⭐ Complex |

## Getting Help

- **Client-specific issues**: See individual client guides above
- **sql-mcp issues**: [GitHub Issues](https://github.com/varkart/sql-mcp/issues)
- **General questions**: [GitHub Discussions](https://github.com/varkart/sql-mcp/discussions)
- **Troubleshooting**: [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md)

## Next Steps

1. **Choose your client** from the table above
2. **Follow the setup guide** for your client
3. **Test the connection** with sample prompts
4. **Explore features**:
   - [Supported databases](../../README.md#supported-databases)
   - [Security features](../../README.md#security)
   - [Example queries](../../examples/)
5. **Contribute**: [CONTRIBUTING.md](../../CONTRIBUTING.md)

## Additional Clients

Don't see your client? sql-mcp works with any MCP-compatible client. The general pattern:

```json
{
  "[client-specific-key]": {
    "sql-mcp": {
      "command": "npx",
      "args": ["-y", "sql-mcp", "--stdio"]
    }
  }
}
```

Check your client's MCP documentation for the specific configuration format, or [open an issue](https://github.com/varkart/sql-mcp/issues) to request a setup guide.
