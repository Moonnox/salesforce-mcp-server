# Salesforce MCP Server

[![smithery badge](https://smithery.ai/badge/salesforce-mcp-server)](https://smithery.ai/server/salesforce-mcp-server)

A Model Context Protocol (MCP) server implementation for interacting with Salesforce through its REST API using jsforce. This is a **remote MCP server** that accepts Salesforce credentials via HTTP headers, making it fully remote-capable and suitable for deployment to cloud platforms.

## Features

- Execute SOQL queries
- Execute Tooling API queries
- Retrieve object metadata
- Retrieve Salesforce metadata components
- Remote HTTP-based transport (no stdio required)
- Secure header-based authentication
- Optional secret key protection
- Real-time data access

## Architecture

This is a **remote MCP server** that runs as an HTTP service. Unlike stdio-based MCP servers that run locally, this server:

- Runs as a standalone HTTP service
- Accepts Salesforce credentials via HTTP headers (not environment variables)
- Can be deployed to cloud platforms (Cloud Run, AWS Lambda, etc.)
- Supports multiple clients with different Salesforce credentials
- Implements MCP protocol over HTTP JSON-RPC

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build

```bash
npm run build
```

### 3. Configure Environment (Optional)

You can configure optional server settings via environment variables:

```bash
# Optional: Port (default: 8080)
export PORT=8080

# Optional: Host (default: 0.0.0.0)
export HOST=0.0.0.0

# Optional: Enable authentication (default: true)
export REQUIRE_AUTH=true

# Optional: Secret key for authentication
export SECRET_KEY=your-secret-key-here
```

### 4. Start the Server

```bash
npm start
```

The server will start on `http://0.0.0.0:8080` (or your configured host/port).

## Usage

### HTTP Headers

All requests to the `/mcp` endpoint that call tools must include the following headers:

#### Required Headers (for tool execution)

- `x-sf-username`: Your Salesforce username
- `x-sf-password`: Your Salesforce password
- `x-sf-security-token`: Your Salesforce security token

#### Optional Headers

- `x-sf-login-url`: Salesforce login URL (default: `https://login.salesforce.com`)
  - Use `https://test.salesforce.com` for sandbox environments
- `x-secret-key`: Authentication secret (required if `REQUIRE_AUTH=true` and `SECRET_KEY` is set)

### Endpoints

#### `GET /` - Server Information
Returns information about the server, available endpoints, and required headers.

#### `GET /health` - Health Check
Returns the server health status.

```json
{
  "status": "healthy",
  "service": "mcp-salesforce-server"
}
```

#### `GET /tools` - List Available Tools
Returns a list of all available tools and their schemas.

#### `POST /mcp` - MCP JSON-RPC Endpoint
Main endpoint for MCP protocol communication. Accepts JSON-RPC 2.0 formatted requests.

### Available Tools

#### 1. `query` - Execute SOQL Query

Execute SOQL queries against your Salesforce instance.

**Parameters:**
```json
{
  "query": "SELECT Id, Name FROM Account LIMIT 5"
}
```

**Example Request:**
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
        "query": "SELECT Id, Name FROM Account LIMIT 5"
      }
    }
  }'
```

#### 2. `tooling-query` - Execute Tooling API Query

Execute queries against the Salesforce Tooling API for metadata access.

**Parameters:**
```json
{
  "query": "SELECT Id, Name FROM ApexClass LIMIT 5"
}
```

#### 3. `describe-object` - Get Object Metadata

Retrieve detailed metadata about a Salesforce object.

**Parameters:**
```json
{
  "objectName": "Account",
  "detailed": false
}
```

**Options:**
- `objectName`: API name of the object (required)
- `detailed`: Set to `true` for full metadata including custom object definitions (optional)

#### 4. `metadata-retrieve` - Retrieve Metadata Components

Retrieve specific metadata components from Salesforce.

**Parameters:**
```json
{
  "type": "ApexClass",
  "fullNames": ["MyApexClass", "AnotherApexClass"]
}
```

**Supported Metadata Types:**
- `CustomObject`
- `Flow`
- `FlowDefinition`
- `CustomField`
- `ValidationRule`
- `ApexClass`
- `ApexTrigger`
- `WorkflowRule`
- `Layout`

### MCP Protocol Methods

#### `initialize`
Initialize the MCP connection.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {}
}
```

#### `tools/list`
List all available tools.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}
```

#### `tools/call`
Execute a tool (requires Salesforce headers).

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "query",
    "arguments": {
      "query": "SELECT Id, Name FROM Account LIMIT 5"
    }
  }
}
```

## Authentication

### Optional Secret Key Authentication

If you set `REQUIRE_AUTH=true` and configure a `SECRET_KEY`, the server will require the `x-secret-key` header for tool execution. This provides an additional layer of security beyond Salesforce credentials.

**Note:** The `initialize` and `tools/list` methods are always allowed without authentication to enable discovery.

## Deployment

### Docker

Build the Docker image:

```bash
docker build -t salesforce-mcp-server .
```

Run the container:

```bash
docker run -p 8080:8080 \
  -e PORT=8080 \
  -e REQUIRE_AUTH=true \
  -e SECRET_KEY=your-secret-key \
  salesforce-mcp-server
```

### Cloud Platforms

This server is designed to be deployed to cloud platforms:

- **Google Cloud Run**: Deploy using the included `Dockerfile`
- **AWS Lambda**: Use with API Gateway or Application Load Balancer
- **Azure Container Instances**: Deploy as a container
- **Heroku/Railway/Render**: Deploy using the included configuration

## Security Best Practices

1. **Never hardcode credentials**: Pass Salesforce credentials via headers, not environment variables
2. **Use HTTPS**: Always deploy with TLS/SSL in production
3. **Enable SECRET_KEY**: Set a strong secret key and require authentication
4. **IP restrictions**: Configure IP restrictions in Salesforce
5. **Rotate credentials**: Regularly rotate Salesforce security tokens
6. **Monitor access**: Log and monitor all API calls
7. **Rate limiting**: Implement rate limiting at the reverse proxy level

## Development

### Run in Development Mode

```bash
npm run dev
```

This will start the server with hot-reloading using `tsx`.

### Build for Production

```bash
npm run build
npm start
```

## Troubleshooting

### Authentication Errors

If you receive authentication errors, verify:
1. Salesforce username is correct
2. Password is correct
3. Security token is current and correctly appended
4. Login URL matches your org type (production vs. sandbox)

### Connection Errors

If you cannot connect to the server:
1. Verify the server is running (`GET /health`)
2. Check firewall rules
3. Verify the correct port is being used

## License

MIT License

Copyright (c) 2024 Kablewy, LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
