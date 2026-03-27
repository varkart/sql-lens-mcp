# Configuration Examples

This directory contains example configurations for setting up sql-mcp with various MCP clients.

## Available Examples

### configs/sql-mcp.config.example.json

Example server configuration file showing:
- Multiple database connections
- Different database types (PostgreSQL, MySQL, SQLite)
- Connection pooling options
- Security settings

```json
{
  "connections": {
    "prod-db": {
      "type": "postgresql",
      "host": "db.example.com",
      "port": 5432,
      "database": "production",
      "user": "dbuser",
      "password": "${DB_PASSWORD}"
    },
    "local-dev": {
      "type": "sqlite",
      "database": "./dev.db"
    }
  }
}
```

### configs/mcp-client-config.json

Example MCP client configuration for testing purposes.

## Usage

### For MCP Clients

Copy and customize the example configuration for your MCP client:

#### Claude Desktop

macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
Windows: `%APPDATA%\Claude\claude_desktop_config.json`

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

#### Claude Code (VS Code)

Open VS Code settings.json:

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

#### Other Clients

See `../docs/clients/` for client-specific configuration guides:
- Cline
- Cursor
- Continue
- Windsurf
- JetBrains IDEs
- ChatGPT Desktop

### For Local Development

When testing locally, use absolute paths:

```json
{
  "mcpServers": {
    "sql-mcp-dev": {
      "command": "node",
      "args": ["/absolute/path/to/sql-mcp/dist/index.js", "--stdio"]
    }
  }
}
```

Get your absolute path:

```bash
cd /path/to/sql-mcp
pwd
```

## Common Configuration Patterns

### Basic PostgreSQL

```json
{
  "type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database": "mydb",
  "user": "myuser",
  "password": "mypassword"
}
```

### MySQL with SSL

```json
{
  "type": "mysql",
  "host": "mysql.example.com",
  "port": 3306,
  "database": "mydb",
  "user": "myuser",
  "password": "mypassword",
  "ssl": true
}
```

### SQLite In-Memory

```json
{
  "type": "sqlite",
  "database": ":memory:"
}
```

### SQLite File

```json
{
  "type": "sqlite",
  "database": "./data/myapp.db"
}
```

### SQL Server

```json
{
  "type": "mssql",
  "host": "sqlserver.example.com",
  "port": 1433,
  "database": "mydb",
  "user": "sa",
  "password": "StrongPassword123!"
}
```

### MariaDB

```json
{
  "type": "mariadb",
  "host": "localhost",
  "port": 3306,
  "database": "mydb",
  "user": "myuser",
  "password": "mypassword"
}
```

### Oracle (Optional)

```json
{
  "type": "oracle",
  "host": "oracle.example.com",
  "port": 1521,
  "database": "ORCL",
  "user": "system",
  "password": "oracle"
}
```

## Environment Variables

Use environment variables for sensitive data:

```json
{
  "type": "postgresql",
  "host": "${DB_HOST}",
  "port": 5432,
  "database": "${DB_NAME}",
  "user": "${DB_USER}",
  "password": "${DB_PASSWORD}"
}
```

Set them before starting the MCP server:

```bash
export DB_HOST=localhost
export DB_NAME=mydb
export DB_USER=myuser
export DB_PASSWORD=secret
```

## Security Best Practices

1. **Never commit credentials to version control**
   - Use environment variables
   - Use `.env` files (add to `.gitignore`)
   - Use secret management tools

2. **Use read-only connections when possible**
   - Create database users with minimal permissions
   - Use `readOnly: true` flag in configuration

3. **Use SSL/TLS for remote connections**
   - Enable `ssl: true` for production databases
   - Verify certificates when possible

4. **Limit connection access**
   - Use firewall rules
   - Whitelist specific IP addresses
   - Use VPNs for remote database access

## Testing Configurations

For testing, use the examples in `../test/e2e/fixtures/`:
- `test-connections.json` - Docker test databases
- `test-db-connections.json` - Alternative test configs

## Additional Resources

- Main documentation: `../README.md`
- Client setup guides: `../docs/clients/`
- Testing guide: `../TESTING.md`
- Troubleshooting: `../TROUBLESHOOTING.md`

## Need Help?

- Check the documentation: `../README.md`
- Review client guides: `../docs/clients/`
- See troubleshooting: `../TROUBLESHOOTING.md`
- Open an issue: https://github.com/varkart/sql-mcp/issues
