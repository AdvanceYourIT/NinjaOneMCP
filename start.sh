#!/bin/bash
# NinjaONE MCP Server - Unix/Linux Shell Script
# Start server in STDIO mode for MCP clients

echo "Starting NinjaONE MCP Server (STDIO mode)..."
export MCP_MODE=stdio
node dist/index.js