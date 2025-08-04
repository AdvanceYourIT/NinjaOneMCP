@echo off
REM NinjaONE MCP Server - HTTP Mode
REM Start server with HTTP transport on port 3000

echo Starting NinjaONE MCP Server (HTTP mode on port 3000)...
set MCP_MODE=http
set HTTP_PORT=3000
node dist/index.js