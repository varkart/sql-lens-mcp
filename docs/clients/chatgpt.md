# ChatGPT Desktop Setup Guide

Complete setup instructions for using sql-mcp with ChatGPT Desktop and ChatGPT web.

## Important Note: Architecture Differences

ChatGPT's MCP integration differs from Claude's approach:

- **Claude**: Reads local JSON config, runs MCP servers locally via stdio
- **ChatGPT**: Requires remote HTTPS endpoints with OAuth authentication

**sql-mcp is designed for stdio transport** (local execution), which means using it with ChatGPT requires additional infrastructure to expose it as an HTTPS endpoint.

## Prerequisites

- ChatGPT Plus or ChatGPT Pro subscription (required for Developer Mode)
- Node.js 18.0.0 or higher
- **Option 1**: Tunneling tool (ngrok, cloudflared) for local development
- **Option 2**: Cloud hosting for production use

## Setup Options

### Option 1: Local with Tunnel (Development)

Use a tunnel to expose your local sql-mcp server as HTTPS endpoint.

#### Step 1: Install sql-mcp

```bash
git clone https://github.com/varkart/sql-mcp.git
cd sql-mcp
npm install
npm run build
```

#### Step 2: Install MCP-to-HTTP Bridge

```bash
npm install -g @modelcontextprotocol/server-http-bridge
```

#### Step 3: Run sql-mcp with HTTP Bridge

```bash
# Start sql-mcp with HTTP bridge
mcp-http-bridge --stdio --port 3000 -- node /path/to/sql-mcp/dist/index.js
```

This creates an HTTP server on port 3000 that wraps your stdio MCP server.

#### Step 4: Expose with Tunnel

**Using ngrok**:
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

**Using Cloudflare Tunnel**:
```bash
# Install cloudflared
brew install cloudflared  # macOS
# or download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

cloudflared tunnel --url http://localhost:3000
```

Copy the HTTPS URL provided.

#### Step 5: Configure ChatGPT

1. **Open ChatGPT** (Desktop app or chat.openai.com)

2. **Enable Developer Mode**:
   - Settings → Developer Mode → Enable
   - (Requires ChatGPT Plus or Pro)

3. **Add MCP Server**:
   - Click "Add MCP Server"
   - Name: `sql-mcp`
   - URL: `https://your-tunnel-url.ngrok.io/sse/` (must end with `/sse/`)
   - Click "Connect"

4. **Test Connection**:
   ```
   Connect to an in-memory SQLite database
   ```

### Option 2: Cloud Hosting (Production)

For production use, host sql-mcp on a cloud platform with HTTPS.

#### Deployment Options

**A. Docker + Cloud Run (Google Cloud)**

1. **Create Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist

EXPOSE 8080
CMD ["node", "dist/http-server.js"]
```

2. **Deploy to Cloud Run**:
```bash
gcloud run deploy sql-mcp \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

3. **Get HTTPS URL** from Cloud Run dashboard

**B. AWS Lambda + API Gateway**

1. **Package as Lambda**:
```bash
npm install --only=production
zip -r sql-mcp.zip dist node_modules package.json
```

2. **Deploy to Lambda**:
   - Create Lambda function with Node.js 18 runtime
   - Upload zip file
   - Create API Gateway HTTP API
   - Enable CORS

3. **Get HTTPS endpoint** from API Gateway

**C. Railway / Render / Fly.io**

These platforms provide easy deployment with automatic HTTPS:

```bash
# Railway
railway up

# Render
render deploy

# Fly.io
fly deploy
```

#### Configure ChatGPT with Cloud URL

1. **Open ChatGPT Developer Mode**
2. **Add MCP Server**:
   - Name: `sql-mcp`
   - URL: `https://your-cloud-url.com/sse/`
   - OAuth (if configured): Add credentials
3. **Save and Test**

### Option 3: MCP Server Hosting Services

Use third-party MCP hosting platforms (emerging in 2026):

- **MCP Hub** (mcp.so)
- **Smithery Cloud** (smithery.ai)
- **Railway MCP** (railway.app)

These services handle HTTPS, OAuth, and scaling automatically.

## Configuration Details

### ChatGPT MCP Server Format

ChatGPT expects servers at `/sse/` endpoint:

```
https://your-server.com/sse/
```

This provides Server-Sent Events (SSE) streaming for tool responses.

### OAuth Configuration (Optional)

For secured endpoints:

1. **Set up OAuth provider** (Auth0, Okta, or custom)

2. **Configure in ChatGPT**:
   - Server URL: `https://your-server.com/sse/`
   - OAuth Client ID: `your-client-id`
   - OAuth Client Secret: `your-secret`
   - Token URL: `https://your-oauth-provider.com/token`

3. **Protect endpoint** with OAuth middleware

### Environment Variables

Pass to cloud deployment:

```bash
SQL_MCP_LOG_LEVEL=info
SQL_MCP_MAX_ROWS=1000
SQL_MCP_QUERY_TIMEOUT=30000
```

## Testing the Connection

1. **Verify server is accessible**:
```bash
curl https://your-server.com/sse/
```

2. **Open ChatGPT** (Desktop or Web)

3. **Check connection status**:
   - Settings → Developer Mode → MCP Servers
   - sql-mcp should show "Connected"

4. **Test with prompt**:
```
List all available database tools
```

5. **Expected tools**:
   - connect_database
   - disconnect_database
   - execute_query
   - list_connections
   - get_schema
   - try_connect

## Common Issues

### Issue: "Unable to connect to MCP server"

**Solution**:
1. Verify URL ends with `/sse/`
2. Check HTTPS is enabled (not HTTP)
3. Test endpoint with curl:
   ```bash
   curl -v https://your-server.com/sse/
   ```
4. Check server logs for errors

### Issue: Tunnel disconnects

**Solution** (for ngrok/cloudflared):
1. **ngrok**: Use paid plan for stable URLs
2. **cloudflared**: Set up persistent tunnel:
   ```bash
   cloudflared tunnel create sql-mcp
   cloudflared tunnel route dns sql-mcp sql-mcp.yourdomain.com
   cloudflared tunnel run sql-mcp
   ```

### Issue: Developer Mode not available

**Solution**:
1. Verify ChatGPT Plus or Pro subscription
2. Check Settings → Developer Mode toggle
3. Try ChatGPT Desktop app (may have earlier access)
4. Contact OpenAI support if unavailable

### Issue: CORS errors

**Solution**:
Add CORS headers to HTTP bridge:
```javascript
{
  'Access-Control-Allow-Origin': 'https://chat.openai.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

### Issue: "Authentication failed"

**Solution**:
1. Verify OAuth credentials are correct
2. Check token URL is accessible
3. Ensure OAuth provider allows ChatGPT's redirect URI
4. Test OAuth flow independently

## Security Considerations

### Best Practices

1. **Use OAuth** for production deployments
2. **Enable read-only mode** for sensitive databases:
   ```bash
   SQL_MCP_READ_ONLY=true
   ```
3. **Set query limits**:
   ```bash
   SQL_MCP_MAX_ROWS=100
   SQL_MCP_QUERY_TIMEOUT=10000
   ```
4. **Monitor logs** for suspicious queries
5. **Use environment variables** for credentials (never hardcode)

### Tunneling Security

For development with tunnels:
- **ngrok**: Use password protection or OAuth
  ```bash
  ngrok http 3000 --basic-auth "user:password"
  ```
- **cloudflared**: Use Cloudflare Access for authentication
- **Never expose** production databases through public tunnels

## Example Prompts

### Connect to SQLite
```
Connect to an in-memory SQLite database called "demo"
```

### Create and Query
```
In the demo database, create a products table with id, name, and price columns, then insert 5 sample products
```

### Schema Exploration
```
Show me the complete schema of the demo database
```

### PostgreSQL Connection
```
Connect to PostgreSQL:
- ID: prod-db
- Host: [your-host]
- Port: 5432
- Database: myapp
- User: readonly
- Password: [your-password]
```

## Comparison with Claude Desktop

| Feature | Claude Desktop | ChatGPT Desktop |
|---------|----------------|-----------------|
| MCP Transport | stdio (local) | HTTPS (remote) |
| Setup Complexity | ⭐ Easy | ⭐⭐⭐ Complex |
| Configuration | JSON file | Developer Mode UI |
| Requires Hosting | ❌ No | ✅ Yes |
| OAuth Support | ❌ No | ✅ Yes |
| Subscription Required | ❌ No | ✅ Yes (Plus/Pro) |

## Cost Considerations

### Development (Free)
- **ngrok free tier**: 1 tunnel, rotating URLs
- **cloudflared**: Free, but rotating URLs
- **Localhost**: Free but not accessible from ChatGPT

### Production
- **Cloud Run**: ~$5-20/month (depending on usage)
- **Railway**: $5-10/month
- **Render**: $7-25/month
- **ngrok Pro**: $10/month (stable URLs)
- **Fly.io**: ~$5-15/month

## Updating sql-mcp

### Tunnel Method
```bash
# Update local installation
cd /path/to/sql-mcp
git pull
npm install
npm run build

# Restart bridge and tunnel
mcp-http-bridge --stdio --port 3000 -- node dist/index.js
ngrok http 3000
```

### Cloud Hosting
```bash
# Redeploy to cloud platform
git pull
npm install
npm run build

# Specific to platform:
gcloud run deploy sql-mcp --source .  # Cloud Run
railway up                              # Railway
render deploy                           # Render
```

## Alternative: ChatGPT MCP Proxy

Some community projects provide MCP-to-ChatGPT proxies:

- [chatgpt-mcp](https://github.com/xncbf/chatgpt-mcp) - Proxy for macOS ChatGPT app
- [mcp-bridge](https://github.com/modelcontextprotocol/bridge) - Universal MCP bridge

Check GitHub for latest options.

## Limitations

Current limitations of ChatGPT MCP integration:

1. **Developer Mode only** (beta feature)
2. **Requires subscription** (Plus or Pro)
3. **Remote endpoints only** (no local stdio)
4. **Limited tooling** compared to Claude Desktop
5. **Beta stability** - may have breaking changes

## Getting Help

- **Troubleshooting**: [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md)
- **ChatGPT Developer Docs**: [developers.openai.com/api/docs/mcp](https://developers.openai.com/api/docs/mcp)
- **Issues**: [GitHub Issues](https://github.com/varkart/sql-mcp/issues)
- **OpenAI Community**: [community.openai.com](https://community.openai.com)

## Resources

- [Building MCP servers for ChatGPT](https://developers.openai.com/api/docs/mcp)
- [MCP Server Tools in ChatGPT](https://community.openai.com/t/mcp-server-tools-now-in-chatgpt-developer-mode/1357233)
- [How to Add MCP Servers to ChatGPT](https://www.docker.com/blog/add-mcp-server-to-chatgpt/)
- [ChatGPT App SDK & MCP Tutorial](https://gist.github.com/ruvnet/7b6843c457822cbcf42fc4aa635eadbb)

## Next Steps

- [Set up with Claude Desktop](claude-desktop.md) (easier alternative)
- [Configure with Claude Code](claude-code.md) (VS Code integration)
- [Learn about security features](../../README.md#security)
- [Explore other MCP clients](../clients/)
