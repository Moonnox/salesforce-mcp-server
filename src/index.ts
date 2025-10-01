#!/usr/bin/env node
/**
 * MCP Server for Salesforce
 * A remote MCP server that exposes Salesforce functionality via HTTP transport
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as jsforce from 'jsforce';
import dotenv from 'dotenv';
import { tools } from './tools.js';

dotenv.config();

// Configuration from environment variables
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';
const REQUIRE_AUTH = (process.env.REQUIRE_AUTH || 'true').toLowerCase() === 'true';
const SECRET_KEY = process.env.SECRET_KEY || '';

// Types for MCP JSON-RPC
interface JSONRPCRequest {
  jsonrpc: string;
  id?: string | number | null;
  method: string;
  params?: any;
}

interface JSONRPCResponse {
  jsonrpc: string;
  id?: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface SalesforceHeaders {
  username?: string;
  password?: string;
  securityToken?: string;
  loginUrl?: string;
}

// Extract Salesforce credentials from headers
function extractSalesforceHeaders(req: Request): SalesforceHeaders {
  return {
    username: req.headers['x-sf-username'] as string,
    password: req.headers['x-sf-password'] as string,
    securityToken: req.headers['x-sf-security-token'] as string,
    loginUrl: (req.headers['x-sf-login-url'] as string) || 'https://login.salesforce.com'
  };
}

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Authentication middleware
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip auth if not required (for local development)
  if (!REQUIRE_AUTH) {
    return next();
  }

  // Skip auth if SECRET_KEY is not configured
  if (!SECRET_KEY) {
    console.warn('SECRET_KEY not configured but REQUIRE_AUTH is true');
    return next();
  }

  // Only check auth for /mcp endpoint with POST method
  if (req.path === '/mcp' && req.method === 'POST') {
    try {
      const body = req.body as JSONRPCRequest;
      const method = body?.method;

      // Only require auth for tools/call
      if (method === 'tools/call') {
        const providedKey = req.headers['x-secret-key'] as string;

        if (!providedKey) {
          const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
          console.warn(`Missing x-secret-key header from ${clientIp} for tools/call`);
          return res.status(401).json({
            jsonrpc: '2.0',
            error: {
              code: -32001,
              message: 'Authentication required for tool execution'
            },
            id: body?.id
          });
        }

        if (providedKey !== SECRET_KEY) {
          const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
          console.warn(`Invalid x-secret-key from ${clientIp} for tools/call`);
          return res.status(401).json({
            jsonrpc: '2.0',
            error: {
              code: -32001,
              message: 'Invalid authentication for tool execution'
            },
            id: body?.id
          });
        }
      } else if (['initialize', 'tools/list'].includes(method)) {
        console.log(`Allowing unauthenticated ${method} request`);
      }
    } catch (e) {
      console.error('Error in auth middleware:', e);
    }
  }

  next();
};

app.use(authMiddleware);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'mcp-salesforce-server'
  });
});

// Root endpoint with server information
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'MCP Salesforce Server',
    version: '1.0.0',
    description: 'Model Context Protocol server for Salesforce operations',
    endpoints: {
      '/health': 'Health check endpoint',
      '/mcp': 'MCP JSON-RPC endpoint',
      '/tools': 'List available tools'
    },
    requiredHeaders: {
      'x-sf-username': 'Salesforce username',
      'x-sf-password': 'Salesforce password',
      'x-sf-security-token': 'Salesforce security token',
      'x-sf-login-url': 'Salesforce login URL (optional, defaults to https://login.salesforce.com)',
      'x-secret-key': 'Secret key for authentication (optional, only if REQUIRE_AUTH is true)'
    }
  });
});

// List available tools endpoint
app.get('/tools', (req: Request, res: Response) => {
  res.json({
    tools: tools.map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema
    }))
  });
});

// Main MCP endpoint for handling JSON-RPC requests
app.post('/mcp', async (req: Request, res: Response) => {
  const body = req.body as JSONRPCRequest;
  
  try {
    console.log(`Received MCP request: ${body.method}`);
    
    const method = body.method;
    const params = body.params || {};
    const requestId = body.id;

    let result: any;

    // Route to appropriate handler based on method
    if (method === 'initialize') {
      result = {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          prompts: undefined,
          resources: undefined
        },
        serverInfo: {
          name: 'salesforce-mcp-server',
          version: '1.0.0'
        }
      };
    } else if (method === 'tools/list') {
      result = {
        tools: tools.map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema
        }))
      };
    } else if (method === 'tools/call') {
      // Extract Salesforce credentials from headers
      const sfHeaders = extractSalesforceHeaders(req);

      if (!sfHeaders.username || !sfHeaders.password || !sfHeaders.securityToken) {
        return res.json({
          jsonrpc: '2.0',
          error: {
            code: -32602,
            message: 'Missing required Salesforce headers: x-sf-username, x-sf-password, x-sf-security-token'
          },
          id: requestId
        });
      }

      const toolName = params.name;
      const toolArguments = params.arguments || {};

      const tool = tools.find(t => t.name === toolName);

      if (!tool) {
        return res.json({
          jsonrpc: '2.0',
          error: {
            code: -32601,
            message: `Unknown tool: ${toolName}`
          },
          id: requestId
        });
      }

      try {
        // Create Salesforce connection with credentials from headers
        const conn = new jsforce.Connection({
          loginUrl: sfHeaders.loginUrl,
          version: '58.0'
        });

        // Login to Salesforce
        await conn.login(
          sfHeaders.username,
          sfHeaders.password + sfHeaders.securityToken
        );

        // Execute the tool
        const toolResult = await tool.handler(conn, toolArguments);

        result = {
          content: [
            {
              type: 'text',
              text: JSON.stringify(toolResult, null, 2)
            }
          ]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Salesforce API error: ${errorMessage}`);
        
        return res.json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: `Salesforce API error: ${errorMessage}`
          },
          id: requestId
        });
      }
    } else {
      // Method not found
      return res.json({
        jsonrpc: '2.0',
        error: {
          code: -32601,
          message: `Method not found: ${method}`
        },
        id: requestId
      });
    }

    // Return successful response
    return res.json({
      jsonrpc: '2.0',
      result,
      id: requestId
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error handling MCP request:', errorMessage);
    
    return res.json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: `Internal error: ${errorMessage}`
      },
      id: body?.id
    });
  }
});

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`Starting MCP Salesforce Server on ${HOST}:${PORT}`);
  console.log(`Authentication enabled: ${REQUIRE_AUTH}`);
  console.log(`Secret Key configured: ${SECRET_KEY ? 'Yes' : 'No'}`);
});
