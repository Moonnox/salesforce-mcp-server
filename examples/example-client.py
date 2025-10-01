#!/usr/bin/env python3
"""
Example Python client for the Salesforce MCP Server
Demonstrates how to interact with the remote MCP server
"""

import json
import requests
from typing import Any, Dict, Optional

class SalesforceMCPClient:
    """Client for interacting with the Salesforce MCP Server"""
    
    def __init__(
        self,
        server_url: str,
        sf_username: str,
        sf_password: str,
        sf_security_token: str,
        sf_login_url: str = "https://login.salesforce.com",
        secret_key: Optional[str] = None
    ):
        """
        Initialize the MCP client
        
        Args:
            server_url: Base URL of the MCP server (e.g., http://localhost:8080)
            sf_username: Salesforce username
            sf_password: Salesforce password
            sf_security_token: Salesforce security token
            sf_login_url: Salesforce login URL (default: https://login.salesforce.com)
            secret_key: Optional secret key for authentication
        """
        self.server_url = server_url.rstrip('/')
        self.mcp_endpoint = f"{self.server_url}/mcp"
        self.headers = {
            "Content-Type": "application/json",
            "x-sf-username": sf_username,
            "x-sf-password": sf_password,
            "x-sf-security-token": sf_security_token,
            "x-sf-login-url": sf_login_url
        }
        
        if secret_key:
            self.headers["x-secret-key"] = secret_key
        
        self.request_id = 0
    
    def _next_id(self) -> int:
        """Get the next request ID"""
        self.request_id += 1
        return self.request_id
    
    def _call_jsonrpc(self, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Make a JSON-RPC call to the MCP server
        
        Args:
            method: The JSON-RPC method to call
            params: Optional parameters for the method
            
        Returns:
            The result from the server
            
        Raises:
            Exception: If the server returns an error
        """
        payload = {
            "jsonrpc": "2.0",
            "id": self._next_id(),
            "method": method,
            "params": params or {}
        }
        
        response = requests.post(
            self.mcp_endpoint,
            headers=self.headers,
            json=payload,
            timeout=60
        )
        response.raise_for_status()
        
        result = response.json()
        
        if "error" in result:
            raise Exception(f"MCP Error: {result['error']}")
        
        return result.get("result", {})
    
    def initialize(self) -> Dict[str, Any]:
        """Initialize the MCP connection"""
        return self._call_jsonrpc("initialize")
    
    def list_tools(self) -> Dict[str, Any]:
        """List available tools"""
        return self._call_jsonrpc("tools/list")
    
    def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call a tool on the MCP server
        
        Args:
            tool_name: Name of the tool to call
            arguments: Arguments to pass to the tool
            
        Returns:
            The tool's result
        """
        return self._call_jsonrpc("tools/call", {
            "name": tool_name,
            "arguments": arguments
        })
    
    # Convenience methods for Salesforce operations
    
    def query(self, soql: str) -> Dict[str, Any]:
        """
        Execute a SOQL query
        
        Args:
            soql: The SOQL query string
            
        Returns:
            Query results
        """
        result = self.call_tool("query", {"query": soql})
        # Extract the text content and parse it
        if "content" in result and len(result["content"]) > 0:
            return json.loads(result["content"][0]["text"])
        return result
    
    def tooling_query(self, query: str) -> Dict[str, Any]:
        """
        Execute a Tooling API query
        
        Args:
            query: The Tooling API query string
            
        Returns:
            Query results
        """
        result = self.call_tool("tooling-query", {"query": query})
        if "content" in result and len(result["content"]) > 0:
            return json.loads(result["content"][0]["text"])
        return result
    
    def describe_object(self, object_name: str, detailed: bool = False) -> Dict[str, Any]:
        """
        Get metadata about a Salesforce object
        
        Args:
            object_name: API name of the object
            detailed: Whether to return detailed metadata
            
        Returns:
            Object metadata
        """
        result = self.call_tool("describe-object", {
            "objectName": object_name,
            "detailed": detailed
        })
        if "content" in result and len(result["content"]) > 0:
            return json.loads(result["content"][0]["text"])
        return result
    
    def retrieve_metadata(self, metadata_type: str, full_names: list) -> Dict[str, Any]:
        """
        Retrieve metadata components
        
        Args:
            metadata_type: Type of metadata (e.g., 'ApexClass', 'Flow')
            full_names: List of component names to retrieve
            
        Returns:
            Metadata components
        """
        result = self.call_tool("metadata-retrieve", {
            "type": metadata_type,
            "fullNames": full_names
        })
        if "content" in result and len(result["content"]) > 0:
            return json.loads(result["content"][0]["text"])
        return result


def main():
    """Example usage of the Salesforce MCP Client"""
    
    # Configuration - replace with your actual values
    SERVER_URL = "http://localhost:8080"
    SF_USERNAME = "your-username@example.com"
    SF_PASSWORD = "your-password"
    SF_SECURITY_TOKEN = "your-security-token"
    SF_LOGIN_URL = "https://login.salesforce.com"  # or https://test.salesforce.com for sandbox
    SECRET_KEY = None  # Set if your server requires authentication
    
    # Create the client
    client = SalesforceMCPClient(
        server_url=SERVER_URL,
        sf_username=SF_USERNAME,
        sf_password=SF_PASSWORD,
        sf_security_token=SF_SECURITY_TOKEN,
        sf_login_url=SF_LOGIN_URL,
        secret_key=SECRET_KEY
    )
    
    print("Initializing MCP connection...")
    init_result = client.initialize()
    print(f"Server Info: {init_result.get('serverInfo')}")
    print()
    
    print("Listing available tools...")
    tools_result = client.list_tools()
    tools = tools_result.get('tools', [])
    print(f"Available tools: {[tool['name'] for tool in tools]}")
    print()
    
    print("Querying Accounts...")
    accounts = client.query("SELECT Id, Name FROM Account LIMIT 5")
    print(f"Found {accounts.get('totalSize', 0)} accounts")
    for record in accounts.get('records', []):
        print(f"  - {record.get('Name')} ({record.get('Id')})")
    print()
    
    print("Describing Account object...")
    account_meta = client.describe_object("Account")
    print(f"Account label: {account_meta.get('label')}")
    print(f"Number of fields: {len(account_meta.get('fields', []))}")
    print()
    
    print("Listing Apex Classes...")
    apex_classes = client.tooling_query("SELECT Id, Name FROM ApexClass LIMIT 5")
    print(f"Found {apex_classes.get('totalSize', 0)} Apex classes")
    for record in apex_classes.get('records', []):
        print(f"  - {record.get('Name')} ({record.get('Id')})")
    print()
    
    print("Done!")


if __name__ == "__main__":
    main()

