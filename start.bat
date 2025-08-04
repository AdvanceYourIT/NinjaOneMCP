@echo off
REM NinjaONE MCP Server - Windows Batch Script
REM Start server in STDIO mode for MCP clients

echo Starting NinjaONE MCP Server (STDIO mode)...
set MCP_MODE=stdio
node dist/index.js