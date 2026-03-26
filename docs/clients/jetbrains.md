# JetBrains IDEs Setup Guide

Complete setup instructions for using sql-mcp with JetBrains IDEs (IntelliJ IDEA, PyCharm, WebStorm, GoLand, PhpStorm, Android Studio, etc.).

## Prerequisites

- JetBrains IDE version **2025.1 or higher** (native MCP support)
- AI Assistant plugin enabled (bundled with paid IDEs or via subscription)
- Node.js 18.0.0 or higher (`node --version`)

## Supported JetBrains IDEs

All IntelliJ Platform-based IDEs support MCP as of version 2025.1:

- IntelliJ IDEA (Ultimate, Community)
- PyCharm (Professional, Community)
- WebStorm
- PhpStorm
- GoLand
- RubyMine
- CLion
- Rider
- DataGrip
- Android Studio

## How MCP Works in JetBrains

JetBrains IDEs support MCP in two modes:

1. **MCP Client** (this guide): Connect to external MCP servers like sql-mcp
2. **MCP Server**: Expose IDE features to external clients like Claude Desktop

We'll focus on using JetBrains as an **MCP Client** to connect to sql-mcp.

## Quick Start

### Method 1: NPX (Recommended)

1. **Open your JetBrains IDE**

2. **Go to Settings/Preferences**:
   - **macOS**: `Cmd + ,` → Tools → MCP Client
   - **Windows/Linux**: `Ctrl + Alt + S` → Tools → MCP Client

3. **Add MCP Server**:
   - Click "+ Add Server"
   - Name: `sql-mcp`
   - Transport: `STDIO`
   - Command: `npx`
   - Arguments: `-y sql-mcp --stdio`

4. **Save and Apply**

5. **Enable AI Assistant** (if not already):
   - Settings → Tools → AI Assistant → Enable

6. **Restart IDE** (may be required)

7. **Verify Connection**:
   - Open AI Assistant panel (View → Tool Windows → AI Assistant)
   - Type: "List available database tools"
   - AI Assistant should use sql-mcp tools

### Method 2: Auto-Configuration (2025.2+)

Starting with version 2025.2, JetBrains IDEs support auto-configuration:

1. **Go to Settings → Tools → MCP Client**

2. **Click "Enable MCP Client"**

3. **Click "Auto-Configure"**

4. **Select MCP servers from list**:
   - If sql-mcp is installed via npx, it may appear automatically
   - Otherwise, use Manual Configuration (Method 1)

### Method 3: Local Development

For testing local sql-mcp builds:

1. **Build sql-mcp**:
   ```bash
   cd /path/to/sql-mcp
   npm install
   npm run build
   ```

2. **Add to JetBrains**:
   - Settings → Tools → MCP Client → Add Server
   - Name: `sql-mcp-local`
   - Transport: `STDIO`
   - Command: `node`
   - Arguments: `/absolute/path/to/sql-mcp/dist/index.js --stdio`

3. **Apply and Restart**

### Method 4: HTTP Transport (Remote)

For remote sql-mcp servers:

1. **Set up HTTP MCP server** (see [ChatGPT guide](chatgpt.md) for HTTP bridge setup)

2. **Add to JetBrains**:
   - Settings → Tools → MCP Client → Add Server
   - Name: `sql-mcp-remote`
   - Transport: `HTTP (Streamable)`
   - URL: `https://your-server.com/mcp`

3. **Apply and Restart**

## Configuration Details

### Settings Location

**macOS**:
```
~/Library/Application Support/JetBrains/<IDE><VERSION>/options/mcp-client.xml
```

**Windows**:
```
%APPDATA%\JetBrains\<IDE><VERSION>\options\mcp-client.xml
```

**Linux**:
```
~/.config/JetBrains/<IDE><VERSION>/options/mcp-client.xml
```

Examples:
- `IntelliJIdea2025.1`
- `PyCharm2025.2`
- `WebStorm2025.1`

### Configuration Format

The settings UI generates XML configuration:

```xml
<application>
  <component name="MCPClientSettings">
    <mcpServers>
      <server>
        <name>sql-mcp</name>
        <transport>STDIO</transport>
        <command>npx</command>
        <args>-y sql-mcp --stdio</args>
        <enabled>true</enabled>
      </server>
    </mcpServers>
  </component>
</application>
```

### Multiple MCP Servers

You can configure multiple servers simultaneously:

1. **Add each server** via Settings → Tools → MCP Client
2. **Enable/disable** individually
3. **AI Assistant** will have access to all enabled servers

Example configuration:
- sql-mcp (database access)
- filesystem (file operations)
- github (repository access)

## Testing the Connection

### 1. Check MCP Server Status

- **Settings → Tools → MCP Client**
- Green checkmark indicates connected
- Red X indicates error (check logs)

### 2. Test with AI Assistant

Open AI Assistant panel (View → Tool Windows → AI Assistant) and try:

```
Connect to an in-memory SQLite database with ID "demo"
```

Expected response:
- AI Assistant uses `connect_database` tool
- Success message confirming connection

### 3. List Available Tools

```
What database management tools do you have?
```

Expected tools:
- connect_database
- disconnect_database
- execute_query
- list_connections
- get_schema
- try_connect

### 4. Execute Query

```
In the demo database, create a users table and insert 3 sample users
```

AI Assistant should:
1. Use `execute_query` tool
2. Create table
3. Insert data
4. Show results

## AI Assistant Integration

### Using sql-mcp with AI Assistant

Once configured, AI Assistant can:

1. **Connect to databases** automatically when you ask
2. **Execute queries** based on natural language
3. **Explore schemas** to understand database structure
4. **Generate SQL** from your descriptions
5. **Debug queries** by running and analyzing results

### Example Workflows

#### Database Schema Exploration
```
Show me the schema of my local PostgreSQL database
```

#### Code Generation with Database Context
```
Generate a Python SQLAlchemy model for the users table in my database
```

#### Query Debugging
```
Help me debug this SQL query: [paste query]
Test it against my database
```

#### Cross-Database Migration
```
Compare the schema of my development and production databases
```

## Common Issues

### Issue: AI Assistant not using sql-mcp

**Solution**:
1. **Verify MCP Client is enabled**:
   - Settings → Tools → MCP Client
   - Check server is enabled (green checkmark)
2. **Restart IDE** completely
3. **Check AI Assistant is enabled**:
   - Settings → Tools → AI Assistant
4. **Try explicit prompt**:
   ```
   Use the sql-mcp tool to connect to a SQLite database
   ```

### Issue: "MCP Client settings not found"

**Solution** (IDE version issue):
1. **Check IDE version**:
   - Help → About
   - Must be 2025.1 or higher
2. **Update IDE**:
   - Help → Check for Updates
3. **Install AI Assistant plugin**:
   - Settings → Plugins
   - Search "AI Assistant"
   - Install and restart

### Issue: "Command not found: npx"

**Solution**:
```bash
# Verify Node.js installation
node --version
npm --version

# Update npm (includes npx)
npm install -g npm@latest

# Find npm path
which npm  # macOS/Linux
where npm  # Windows
```

Use full path in command:
- Command: `/usr/local/bin/npx`
- Arguments: `-y sql-mcp --stdio`

### Issue: Connection timeout

**Solution**:
1. **Test sql-mcp standalone**:
   ```bash
   cd /path/to/sql-mcp
   node debug-server.js
   ```
2. **Check IDE logs**:
   - Help → Show Log in Finder/Explorer
   - Look for MCP-related errors
3. **Increase timeout** (if available in future versions)

### Issue: "Permission denied"

**Solution**:
```bash
# macOS/Linux - fix script permissions
chmod +x /path/to/sql-mcp/dist/index.js

# Verify Node.js is executable
ls -la $(which node)
```

### Issue: AI Assistant not installed

**Solution**:
1. **Check if bundled** (paid IDEs):
   - Settings → Plugins
   - Search "AI Assistant"
   - Should be installed by default
2. **For Community editions**:
   - May require separate subscription
   - Check JetBrains account for AI Assistant access
3. **Alternative**: Use with external clients (Claude Desktop, etc.)

## Advanced Configuration

### Environment Variables

Add environment variables to MCP server:

Settings → Tools → MCP Client → [Your Server] → Environment Variables

```
SQL_MCP_LOG_LEVEL=debug
SQL_MCP_MAX_ROWS=1000
SQL_MCP_QUERY_TIMEOUT=30000
```

### Project-Specific Configuration

Configure MCP servers per project:

1. **Open Project Structure** (Cmd/Ctrl + ;)
2. **Project Settings → MCP Client** (if available)
3. **Add project-specific servers**

Note: Project-level MCP settings may be added in future versions.

### Custom Node Version

Use specific Node.js version:

- Command: `/Users/yourname/.nvm/versions/node/v18.20.0/bin/node`
- Arguments: `/path/to/sql-mcp/dist/index.js --stdio`

Find Node.js path:
```bash
which node   # macOS/Linux
where node   # Windows
```

## JetBrains as MCP Server (Bonus)

Starting with 2025.2, JetBrains IDEs can also act as MCP servers, exposing IDE features to external clients.

### Enable MCP Server

1. **Settings → Tools → MCP Server**
2. **Click "Enable MCP Server"**
3. **Auto-Configure for clients**:
   - Claude Desktop
   - Cursor
   - VS Code
   - Windsurf

This allows external AI tools to:
- Read/write files in your project
- Run IDE commands
- Access project structure
- Use refactoring tools

See [JetBrains MCP Server docs](https://www.jetbrains.com/help/idea/mcp-server.html) for details.

## Example Prompts

### Connect to SQLite
```
Connect to an in-memory SQLite database called "test"
```

### Create Schema
```
In the test database, create tables for a blog:
- posts (id, title, content, author_id, created_at)
- authors (id, name, email)
- comments (id, post_id, author_id, content, created_at)
```

### Generate Code from Schema
```
Generate Java JPA entities for the blog schema in my test database
```

### Query with Natural Language
```
Show me all posts from the test database, ordered by date, with author names
```

### Database Migration
```
Generate a SQL migration script to add a "published" boolean column to the posts table
```

## Keyboard Shortcuts

- **Open AI Assistant**: `Ctrl + Shift + A` (Windows/Linux), `Cmd + Shift + A` (macOS)
- **Settings**: `Ctrl + Alt + S` (Windows/Linux), `Cmd + ,` (macOS)
- **Find Action**: `Ctrl + Shift + A` → "MCP Client"

## Updating sql-mcp

### NPX Method (Automatic)
NPX automatically uses the latest version. To force update:
```bash
npx clear-npx-cache
# Restart IDE
```

### Local Development Method
```bash
cd /path/to/sql-mcp
git pull
npm install
npm run build
# Restart IDE
```

## Uninstalling

1. **Open Settings → Tools → MCP Client**
2. **Select sql-mcp server**
3. **Click "Remove" (- button)**
4. **Apply changes**
5. **Restart IDE**

Clean NPX cache (optional):
```bash
npx clear-npx-cache
```

## IDE-Specific Notes

### IntelliJ IDEA
- Works with both Community and Ultimate editions
- Best for Java/Kotlin database projects

### PyCharm
- Excellent for Python + database workflows
- Can generate SQLAlchemy models from database schema

### DataGrip
- Already has powerful database tools built-in
- sql-mcp adds AI-powered query generation

### WebStorm
- Great for Node.js + database projects
- Can generate Sequelize/TypeORM models

## Comparison with Other Clients

| Feature | JetBrains IDEs | Claude Desktop | VS Code (Claude Code) |
|---------|----------------|----------------|----------------------|
| MCP Client Support | ✅ Built-in (2025.1+) | ✅ Built-in | ✅ Extension |
| Setup Complexity | ⭐⭐ Medium | ⭐ Easy | ⭐ Easy |
| AI Assistant | ✅ Native | ✅ Native | ✅ Extension |
| Code Generation | ✅ Strong | ❌ Limited | ✅ Strong |
| IDE Integration | ✅ Deep | ❌ None | ✅ Medium |
| Cost | 💰 Paid (most) | Free | Free |

## Getting Help

- **JetBrains MCP Documentation**: [jetbrains.com/help/ai-assistant/mcp.html](https://www.jetbrains.com/help/ai-assistant/mcp.html)
- **IntelliJ MCP Blog**: [IntelliJ IDEA 2025.1 ❤️ MCP](https://blog.jetbrains.com/idea/2025/05/intellij-idea-2025-1-model-context-protocol/)
- **sql-mcp Issues**: [GitHub Issues](https://github.com/varkart/sql-mcp/issues)
- **JetBrains Support**: [jetbrains.com/support](https://www.jetbrains.com/support/)

## Resources

- [JetBrains MCP Server (GitHub)](https://github.com/JetBrains/mcp-jetbrains)
- [Model Context Protocol Documentation](https://www.jetbrains.com/help/ai-assistant/mcp.html)
- [MCP Server Documentation](https://www.jetbrains.com/help/idea/mcp-server.html)
- [IntelliJ IDEA MCP Blog Post](https://blog.jetbrains.com/idea/2025/05/intellij-idea-2025-1-model-context-protocol/)

## Next Steps

- [Learn about security features](../../README.md#security)
- [Connect to different databases](../../README.md#supported-databases)
- [Set up other MCP clients](../clients/)
- [Configure JetBrains as MCP Server](https://www.jetbrains.com/help/idea/mcp-server.html)
