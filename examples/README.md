# Salesforce MCP Server - Examples

This directory contains example clients and scripts for interacting with the Salesforce MCP Server.

## Files

### `test-requests.sh`

A bash script that demonstrates various API calls to the server using `curl`. This is useful for:
- Testing the server
- Understanding the API structure
- Debugging issues
- Quick manual testing

**Usage:**
1. Edit the script and replace the placeholder credentials with your actual Salesforce credentials
2. Make sure the server is running
3. Run the script:
   ```bash
   ./test-requests.sh
   ```

**Requirements:**
- `curl` command-line tool
- `jq` for JSON formatting (optional but recommended)

### `example-client.py`

A Python client library and example demonstrating how to interact with the server programmatically.

**Usage:**
1. Install the `requests` library:
   ```bash
   pip install requests
   ```

2. Edit the `main()` function and replace the placeholder credentials

3. Run the example:
   ```bash
   python example-client.py
   # or
   ./example-client.py
   ```

**Features:**
- Easy-to-use Python class for MCP communication
- Convenience methods for common Salesforce operations
- Automatic JSON-RPC handling
- Error handling
- Example usage of all tools

## Example Requests

### Initialize Connection

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {}
  }'
```

### List Available Tools

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

### Execute SOQL Query

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "x-sf-username: your-username@example.com" \
  -H "x-sf-password: your-password" \
  -H "x-sf-security-token: your-token" \
  -H "x-sf-login-url: https://login.salesforce.com" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "query",
      "arguments": {
        "query": "SELECT Id, Name FROM Account LIMIT 5"
      }
    }
  }'
```

### Describe Salesforce Object

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "x-sf-username: your-username@example.com" \
  -H "x-sf-password: your-password" \
  -H "x-sf-security-token: your-token" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "describe-object",
      "arguments": {
        "objectName": "Account",
        "detailed": false
      }
    }
  }'
```

## Using with Different Languages

### JavaScript/Node.js

```javascript
const axios = require('axios');

async function callTool(toolName, arguments) {
  const response = await axios.post('http://localhost:8080/mcp', {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: arguments
    }
  }, {
    headers: {
      'Content-Type': 'application/json',
      'x-sf-username': 'your-username@example.com',
      'x-sf-password': 'your-password',
      'x-sf-security-token': 'your-token'
    }
  });
  
  return response.data.result;
}

// Example usage
callTool('query', { query: 'SELECT Id, Name FROM Account LIMIT 5' })
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

### Python (with requests)

```python
import requests
import json

def call_tool(tool_name, arguments):
    response = requests.post('http://localhost:8080/mcp', 
        headers={
            'Content-Type': 'application/json',
            'x-sf-username': 'your-username@example.com',
            'x-sf-password': 'your-password',
            'x-sf-security-token': 'your-token'
        },
        json={
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'tools/call',
            'params': {
                'name': tool_name,
                'arguments': arguments
            }
        }
    )
    
    return response.json()['result']

# Example usage
result = call_tool('query', {'query': 'SELECT Id, Name FROM Account LIMIT 5'})
print(json.dumps(result, indent=2))
```

## Tips

1. **Authentication**: If the server has `REQUIRE_AUTH=true` and a `SECRET_KEY` configured, add the `x-secret-key` header to your requests.

2. **Sandbox vs Production**: Use `x-sf-login-url: https://test.salesforce.com` for sandbox orgs, or `https://login.salesforce.com` for production.

3. **Security Token**: Your Salesforce security token can be reset from Setup > My Personal Information > Reset My Security Token.

4. **Error Handling**: Always check for the `error` field in the JSON-RPC response before accessing the `result` field.

5. **Timeouts**: Some operations (especially metadata retrieval) can take time. Set appropriate timeouts in your client.

