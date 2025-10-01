# Migration Guide: stdio to Remote HTTP Server

This guide helps you migrate from the previous stdio-based Salesforce MCP server to the new remote HTTP-based server.

## What Changed?

### Architecture
- **Before**: stdio-based local server (runs as a subprocess)
- **After**: Remote HTTP server (runs as a standalone web service)

### Credentials
- **Before**: Credentials stored in environment variables or `.env` file
- **After**: Credentials passed as HTTP headers with each request

### Transport
- **Before**: Standard input/output (stdio)
- **After**: HTTP JSON-RPC over HTTP/HTTPS

## Key Benefits

1. **Fully Remote**: Can be deployed to cloud platforms (Cloud Run, AWS Lambda, etc.)
2. **Multi-tenant**: Support multiple clients with different Salesforce credentials
3. **Scalable**: Can handle multiple concurrent requests
4. **Stateless**: No need to maintain long-running processes
5. **Security**: Credentials are never stored on disk or in environment variables

## Migration Steps

### 1. Update Dependencies

The server now requires Express for HTTP handling:

```bash
npm install
```

### 2. Build the Server

```bash
npm run build
```

### 3. Configuration Changes

#### Old Configuration (Environment Variables)
```bash
# Old .env file
SF_USERNAME=user@example.com
SF_PASSWORD=password123
SF_SECURITY_TOKEN=abc123token
SF_LOGIN_URL=https://login.salesforce.com
```

#### New Configuration (HTTP Headers)
```bash
# New .env file (optional server settings only)
PORT=8080
HOST=0.0.0.0
REQUIRE_AUTH=true
SECRET_KEY=your-secret-key
```

Salesforce credentials are now passed as HTTP headers:
- `x-sf-username`
- `x-sf-password`
- `x-sf-security-token`
- `x-sf-login-url`

### 4. Deployment Changes

#### Old Deployment (stdio)
```json
{
  "mcpServers": {
    "salesforce": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "SF_USERNAME": "user@example.com",
        "SF_PASSWORD": "password",
        "SF_SECURITY_TOKEN": "token"
      }
    }
  }
}
```

#### New Deployment (HTTP)

1. Start the server:
```bash
npm start
```

2. Configure your MCP client to connect to the HTTP endpoint:
```json
{
  "mcpServers": {
    "salesforce": {
      "url": "http://localhost:8080/mcp",
      "headers": {
        "x-sf-username": "user@example.com",
        "x-sf-password": "password",
        "x-sf-security-token": "token",
        "x-sf-login-url": "https://login.salesforce.com"
      }
    }
  }
}
```

### 5. Client Code Changes

#### Old Client (stdio-based MCP SDK)
```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  env: {
    SF_USERNAME: "user@example.com",
    SF_PASSWORD: "password",
    SF_SECURITY_TOKEN: "token"
  }
});

const client = new Client({ name: "my-client", version: "1.0.0" }, {});
await client.connect(transport);
```

#### New Client (HTTP-based)
```typescript
import axios from 'axios';

async function callTool(toolName: string, arguments: any) {
  const response = await axios.post('http://localhost:8080/mcp', {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: toolName, arguments }
  }, {
    headers: {
      'Content-Type': 'application/json',
      'x-sf-username': 'user@example.com',
      'x-sf-password': 'password',
      'x-sf-security-token': 'token'
    }
  });
  
  return response.data.result;
}
```

See the `examples/` directory for complete client implementations.

## API Endpoints

The new server exposes several HTTP endpoints:

- `GET /` - Server information
- `GET /health` - Health check
- `GET /tools` - List available tools
- `POST /mcp` - MCP JSON-RPC endpoint (main endpoint)

## Security Considerations

### Before
- Credentials stored in environment variables or `.env` file
- Risk of credential exposure in process listings
- Credentials persist for the lifetime of the process

### After
- Credentials passed per-request via headers
- No credential storage on the server
- Each request is independently authenticated
- Optional `SECRET_KEY` for additional authentication layer
- Can be deployed behind authentication proxies/gateways

## Testing the Migration

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Test the health endpoint:**
   ```bash
   curl http://localhost:8080/health
   ```

3. **List available tools:**
   ```bash
   curl http://localhost:8080/tools
   ```

4. **Test a query:**
   ```bash
   curl -X POST http://localhost:8080/mcp \
     -H "Content-Type: application/json" \
     -H "x-sf-username: your-username@example.com" \
     -H "x-sf-password: your-password" \
     -H "x-sf-security-token: your-token" \
     -d '{
       "jsonrpc": "2.0",
       "id": 1,
       "method": "tools/call",
       "params": {
         "name": "query",
         "arguments": {
           "query": "SELECT Id, Name FROM Account LIMIT 1"
         }
       }
     }'
   ```

## Cloud Deployment

The new architecture is designed for cloud deployment:

### Google Cloud Run
```bash
gcloud run deploy salesforce-mcp-server \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars REQUIRE_AUTH=true,SECRET_KEY=your-secret
```

### Docker
```bash
docker build -t salesforce-mcp-server .
docker run -p 8080:8080 \
  -e REQUIRE_AUTH=true \
  -e SECRET_KEY=your-secret \
  salesforce-mcp-server
```

### AWS Lambda
Use the Dockerfile with AWS Lambda container support or deploy via API Gateway.

## Troubleshooting

### "Missing required Salesforce headers" Error
Make sure you're including all required headers:
- `x-sf-username`
- `x-sf-password`
- `x-sf-security-token`

### "Authentication required" Error
If `REQUIRE_AUTH=true`, include the `x-secret-key` header with your configured secret key.

### Connection Refused
Ensure the server is running and listening on the correct host/port.

### Salesforce Login Failed
- Verify your credentials are correct
- Check that your security token is current
- Ensure you're using the correct login URL (production vs sandbox)

## Rollback

If you need to rollback to the stdio-based version, you can:

1. Check out the previous commit before this migration
2. Reinstall dependencies: `npm install`
3. Build: `npm run build`
4. Use the old stdio-based configuration

## Support

For issues or questions:
1. Check the examples in the `examples/` directory
2. Review the README.md for detailed usage instructions
3. Open an issue on GitHub

