#!/bin/bash
# Example requests to the Salesforce MCP Server
# Replace the placeholder values with your actual credentials

# Configuration
SERVER_URL="http://localhost:8080"
SF_USERNAME="your-username@example.com"
SF_PASSWORD="your-password"
SF_SECURITY_TOKEN="your-security-token"
SF_LOGIN_URL="https://login.salesforce.com"  # Use https://test.salesforce.com for sandbox
SECRET_KEY="your-secret-key"  # Only needed if REQUIRE_AUTH is true

echo "=========================================="
echo "Testing Salesforce MCP Server"
echo "=========================================="
echo ""

# 1. Health Check
echo "1. Health Check"
curl -s -X GET "${SERVER_URL}/health" | jq '.'
echo ""
echo ""

# 2. Server Information
echo "2. Server Information"
curl -s -X GET "${SERVER_URL}/" | jq '.'
echo ""
echo ""

# 3. List Available Tools
echo "3. List Available Tools"
curl -s -X GET "${SERVER_URL}/tools" | jq '.'
echo ""
echo ""

# 4. Initialize MCP Connection
echo "4. Initialize MCP Connection"
curl -s -X POST "${SERVER_URL}/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {}
  }' | jq '.'
echo ""
echo ""

# 5. List Tools via MCP
echo "5. List Tools via MCP"
curl -s -X POST "${SERVER_URL}/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }' | jq '.'
echo ""
echo ""

# 6. Execute SOQL Query
echo "6. Execute SOQL Query (requires Salesforce credentials)"
curl -s -X POST "${SERVER_URL}/mcp" \
  -H "Content-Type: application/json" \
  -H "x-sf-username: ${SF_USERNAME}" \
  -H "x-sf-password: ${SF_PASSWORD}" \
  -H "x-sf-security-token: ${SF_SECURITY_TOKEN}" \
  -H "x-sf-login-url: ${SF_LOGIN_URL}" \
  -H "x-secret-key: ${SECRET_KEY}" \
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
  }' | jq '.'
echo ""
echo ""

# 7. Describe Object
echo "7. Describe Object (Account)"
curl -s -X POST "${SERVER_URL}/mcp" \
  -H "Content-Type: application/json" \
  -H "x-sf-username: ${SF_USERNAME}" \
  -H "x-sf-password: ${SF_PASSWORD}" \
  -H "x-sf-security-token: ${SF_SECURITY_TOKEN}" \
  -H "x-sf-login-url: ${SF_LOGIN_URL}" \
  -H "x-secret-key: ${SECRET_KEY}" \
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
  }' | jq '.'
echo ""
echo ""

# 8. Tooling API Query
echo "8. Tooling API Query (List Apex Classes)"
curl -s -X POST "${SERVER_URL}/mcp" \
  -H "Content-Type: application/json" \
  -H "x-sf-username: ${SF_USERNAME}" \
  -H "x-sf-password: ${SF_PASSWORD}" \
  -H "x-sf-security-token: ${SF_SECURITY_TOKEN}" \
  -H "x-sf-login-url: ${SF_LOGIN_URL}" \
  -H "x-secret-key: ${SECRET_KEY}" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call",
    "params": {
      "name": "tooling-query",
      "arguments": {
        "query": "SELECT Id, Name, Status FROM ApexClass LIMIT 5"
      }
    }
  }' | jq '.'
echo ""
echo ""

echo "=========================================="
echo "Test Complete"
echo "=========================================="

