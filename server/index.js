#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import { NinjaOneAPI } from "./ninja-api.js";
import { toolDefinitions } from "./tools.js";
import { logger } from "./logger.js";

/**
 * NinjaONE MCP Server - Production Bundle
 *
 * A comprehensive MCP server for NinjaONE RMM platform providing device management,
 * monitoring, patch management, and automation capabilities through a secure,
 * well-structured interface following MCP protocol specifications.
 */

class NinjaOneMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "ninjaone-rmm",
        version: "1.2.10",
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.ninjaAPI = null;
    this.setupErrorHandling();
    this.setupHandlers();
  }

  /**
   * Setup global error handling for the server
   */
  setupErrorHandling() {
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      process.exit(0);
    });
  }

  /**
   * Setup MCP protocol handlers
   */
  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('Received list_tools request');

      return {
        tools: Object.values(toolDefinitions).map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      logger.info(`Executing tool: ${name}`, { args: this.sanitizeArgs(args) });

      try {
        // Initialize API client if not already done
        if (!this.ninjaAPI) {
          this.ninjaAPI = new NinjaOneAPI();
        }

        // Validate tool exists
        const toolDef = toolDefinitions[name];
        if (!toolDef) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
        }

        // Validate arguments against schema
        this.validateArguments(name, args, toolDef.inputSchema);

        // Execute tool with timeout
        const result = await this.executeWithTimeout(
          toolDef.handler.bind(null, this.ninjaAPI, args),
          30000 // 30 second timeout
        );

        logger.debug(`Tool ${name} completed successfully`);

        return {
          content: [
            {
              type: "text",
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
            }
          ]
        };

      } catch (error) {
        logger.error(`Tool ${name} failed:`, error);

        // Handle different error types appropriately
        if (error instanceof McpError) {
          throw error;
        }

        // Convert API errors to appropriate MCP errors
        if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            `Authentication failed: ${error.message}`
          );
        }

        if (error.message?.includes('not found') || error.message?.includes('404')) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            `Resource not found: ${error.message}`
          );
        }

        if (error.message?.includes('timeout')) {
          throw new McpError(
            ErrorCode.InternalError,
            `Request timeout: ${error.message}`
          );
        }

        // Generic error handling
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message || 'Unknown error'}`
        );
      }
    });
  }

  /**
   * Validate arguments against JSON schema
   */
  validateArguments(toolName, args, schema) {
    if (!schema || !schema.properties) {
      return; // No validation schema defined
    }

    // Check required fields
    if (schema.required) {
      for (const required of schema.required) {
        if (args[required] === undefined || args[required] === null) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            `Missing required parameter '${required}' for tool '${toolName}'`
          );
        }
      }
    }

    // Type checking for key parameters
    for (const [key, value] of Object.entries(args)) {
      const propSchema = schema.properties[key];
      if (!propSchema) continue;

      if (propSchema.type === 'number' && typeof value !== 'number') {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Parameter '${key}' must be a number for tool '${toolName}'`
        );
      }

      if (propSchema.type === 'string' && typeof value !== 'string') {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Parameter '${key}' must be a string for tool '${toolName}'`
        );
      }

      if (propSchema.type === 'boolean' && typeof value !== 'boolean') {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Parameter '${key}' must be a boolean for tool '${toolName}'`
        );
      }
    }
  }

  /**
   * Execute a function with timeout protection
   */
  async executeWithTimeout(fn, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fn()
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Sanitize arguments for logging (remove sensitive data)
   */
  sanitizeArgs(args) {
    const sanitized = { ...args };
    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'credential'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Start the MCP server
   */
  async start() {
    try {
      logger.info('Starting NinjaONE MCP Server v1.2.9');
      logger.info('Environment:', {
        nodeVersion: process.version,
        platform: process.platform,
        logLevel: process.env.LOG_LEVEL || 'info'
      });

      // Validate required environment variables
      const requiredEnvVars = [
        'NINJAONE_BASE_URL',
        'NINJAONE_CLIENT_ID',
        'NINJAONE_CLIENT_SECRET',
        'NINJAONE_REFRESH_TOKEN'
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }

      // Initialize and test API connection
      this.ninjaAPI = new NinjaOneAPI();
      await this.ninjaAPI.testConnection();

      logger.info('NinjaONE API connection validated successfully');

      // Start MCP server with stdio transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      logger.info('NinjaONE MCP Server started successfully');

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new NinjaOneMCPServer();
server.start().catch((error) => {
  logger.error('Server startup failed:', error);
  process.exit(1);
});