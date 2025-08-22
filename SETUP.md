# NinjaONE MCP Server Setup Guide

## Environment Variables Configuration

This guide clarifies how to configure environment variables for different use cases.

## ⚠️ CRITICAL DISTINCTION

There are TWO different ways to run this MCP server, and they handle environment variables differently:

### 1. Local Development (`.env` file works)
When running directly with `npm start` or `node dist/index.js`:
- The server reads from `.env` file automatically
- Uses the `dotenv` package to load environment variables
- Perfect for testing and development

### 2. MCP Client Integration (`.env` file does NOT work)
When running through Claude Desktop or other MCP clients:
- The `.env` file is IGNORED
- Environment variables MUST be in the MCP client configuration
- The MCP client spawns the process with only the env vars you specify

## Setup Instructions

### For Local Development

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your credentials:
   ```env
   NINJA_ACCESS_TOKEN=your_actual_token_here
   NINJA_BASE_URL=https://api.ninjarmm.com
   MCP_MODE=stdio
   ```

3. Build and run:
   ```bash
   npm run build
   npm start
   ```

### For Claude Desktop (Windows)

1. Locate your Claude Desktop config:
   ```
   %APPDATA%\Claude\claude_desktop_config.json
   ```

2. Add the NinjaONE server configuration:
   ```json
   {
     "mcpServers": {
       "ninjaone": {
         "command": "node",
         "args": ["C:\\full\\path\\to\\NinjaOneMCP\\dist\\index.js"],
         "env": {
           "NINJA_ACCESS_TOKEN": "your_actual_token_here",
           "NINJA_BASE_URL": "https://api.ninjarmm.com",
           "MCP_MODE": "stdio",
           "LOG_LEVEL": "info"
         }
       }
     }
   }
   ```

3. Restart Claude Desktop

### For Claude Desktop (macOS/Linux)

1. Locate your Claude Desktop config:
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json  # macOS
   ~/.config/Claude/claude_desktop_config.json                      # Linux
   ```

2. Add the configuration (adjust paths for your OS):
   ```json
   {
     "mcpServers": {
       "ninjaone": {
         "command": "node",
         "args": ["/path/to/NinjaOneMCP/dist/index.js"],
         "env": {
           "NINJA_ACCESS_TOKEN": "your_actual_token_here",
           "NINJA_BASE_URL": "https://api.ninjarmm.com",
           "MCP_MODE": "stdio",
           "LOG_LEVEL": "info"
         }
       }
     }
   }
   ```

## Troubleshooting

### "NINJA_ACCESS_TOKEN not found" Error

**Symptom:** Server fails with missing token error when used in Claude Desktop

**Cause:** Environment variables not properly configured in MCP client config

**Solution:** 
- Ensure ALL required env vars are in the `env` section of your MCP config
- Do NOT rely on the `.env` file for MCP client usage
- Verify your token is correct and has proper permissions

### Server Works Locally but Not in Claude

**Cause:** You're testing with `.env` locally but haven't added env vars to Claude config

**Solution:** Copy all environment variables from your `.env` file to the `env` section in Claude's config

### Common Mistakes to Avoid

1. ❌ Assuming `.env` file will be read by MCP clients
2. ❌ Only including some env vars in MCP config
3. ❌ Using relative paths in MCP config
4. ❌ Forgetting to restart Claude after config changes
5. ❌ Missing quotes around string values in JSON config

## Testing Your Setup

### Test Local Setup
```bash
# Should connect successfully
npm test
```

### Test MCP Client Setup
1. Open Claude Desktop
2. Type: "Can you list my NinjaONE devices?"
3. If configured correctly, Claude will use the NinjaONE tools

## Need Help?

If you're still having issues:
1. Check the logs (set `LOG_LEVEL=debug`)
2. Verify your API token has proper permissions
3. Ensure network connectivity to NinjaONE API
4. Open an issue with:
   - Your configuration (redact sensitive data)
   - Error messages
   - Steps to reproduce
