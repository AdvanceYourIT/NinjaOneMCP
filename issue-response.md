# GitHub Issue Response Template

## Response to .env Example Configuration Issue

Thank you for raising this issue! You've identified an important documentation gap regarding environment variable configuration.

### The Problem
The confusion stems from the difference between:
1. **Local development** - where `.env` files work perfectly
2. **MCP client integration** - where `.env` files are NOT read

When the NinjaONE MCP server is launched by Claude Desktop or other MCP clients, it doesn't automatically load the `.env` file. This is why the server works locally but fails in Claude Desktop.

### The Solution
I've updated the repository with clearer documentation and examples:

#### Changes Made:
1. ✅ **Updated `.env.example`** - Added clear comments explaining it's for local development only
2. ✅ **Created `mcp-config.json.example`** - Complete example with ALL required environment variables
3. ✅ **Added `SETUP.md`** - Comprehensive setup guide explaining the distinction
4. ✅ **Updated `README.md`** - Better MCP client configuration examples

#### Key Takeaway:
For MCP clients, ALL environment variables must be explicitly included in the client's configuration:

```json
{
  "mcpServers": {
    "ninjaone": {
      "command": "node",
      "args": ["C:\\Path\\to\\NinjaOneMCP\\dist\\index.js"],
      "env": {
        "NINJA_ACCESS_TOKEN": "your_actual_token",
        "NINJA_BASE_URL": "https://api.ninjarmm.com",
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

The `.env` file is only used for local development with `npm start`.

### Documentation Updates
- See [SETUP.md](SETUP.md) for complete setup instructions
- See [mcp-config.json.example](mcp-config.json.example) for a full configuration template

This should resolve the confusion. Please let me know if you need any clarification or run into other issues!

---

**Note for maintainer:** This issue highlights that many users expect `.env` files to work universally, which isn't the case with MCP servers. The documentation updates should prevent this confusion for future users.
