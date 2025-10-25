/**
 * HTTP and SSE Transport Implementation for MCP Server
 * Modern implementation with proper CORS, error handling, and security
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
/**
 * HTTP Transport Server
 * Provides REST-like interface for MCP server functionality
 */
export declare function createHttpServer(mcpServer: Server, port: number): Promise<void>;
/**
 * Server-Sent Events (SSE) Transport Server
 * Provides real-time streaming interface for MCP server
 */
export declare function createSseServer(mcpServer: Server, port: number): Promise<void>;
//# sourceMappingURL=http.d.ts.map