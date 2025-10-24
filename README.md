# NinjaONE MCP Server

A modern TypeScript MCP (Model Context Protocol) server for NinjaONE RMM platform with comprehensive API coverage and multiple transport options.

## Features

### 🚀 **Modern Architecture**
- Built with MCP SDK v1.17.1
- Full TypeScript support with strict typing
- Multiple transport protocols (STDIO, HTTP, SSE)
- Comprehensive error handling and logging
- Security-focused design

### 🔧 **Complete API Coverage**
- **Device Management**: List, control, maintain, and monitor devices
- **Patch Management**: OS and software patch scanning and deployment
- **Service Control**: Windows service management
- **Organization Management**: Multi-tenant organization handling
- **Contact Management**: Full CRUD operations for contacts
- **Alert Management**: Alert retrieval and acknowledgment
- **User Management**: End users and technicians
- **Policy Management**: Policy retrieval and overrides
- **Comprehensive Queries**: 21+ query endpoints covering:
  - System information (antivirus, health, OS, logged-on users)
  - Hardware details (processors, disks, volumes, network, RAID)
  - Software and patches (installed software, OS patches, software patches, patch installs)
  - Windows services management
  - Custom fields and policies (standard and scoped custom fields, policy overrides)
  - Backup usage statistics

### 🌐 **Transport Options**

#### STDIO Transport (Default)
Perfect for desktop MCP clients like Claude Desktop.

#### HTTP Transport
RESTful API with JSON responses:
- `/health` - Health check endpoint
- `/info` - Server information
- `/tools` - List available tools (informational)

#### Server-Sent Events (SSE)
Real-time streaming for web applications:
- `/events` - SSE connection endpoint

## Quick Start

### Prerequisites
- Node.js 18+
- NinjaONE OAuth client credentials (client ID and secret)
- PowerShell 7+ (for Windows development)

### Installation Options

#### Option 1: MCPB Bundle (Recommended)

**For Claude Desktop and MCP-compatible clients:**

Download the latest `ninjaone-rmm.mcpb` bundle file from this repository. This is a complete, production-ready MCP bundle that includes:

- Compiled server code with all dependencies
- Proper MCPB manifest for easy installation
- Security-hardened implementation
- Comprehensive error handling and logging

**📖 For detailed step-by-step installation instructions with screenshots, see [README-MCPB.md](README-MCPB.md)**

**Quick Installation:**
1. Download `ninjaone-rmm.mcpb` from this repository
2. Install through your MCP client (Claude Desktop supports MCPB installation)
3. **Click "Configure" on the installed extension** to enter your NinjaONE credentials

**Configuration required:**
- **Base URL**: Your NinjaONE regional endpoint (e.g., `https://app.ninjarmm.com`)
- **Client ID**: OAuth2 application client ID
- **Client Secret**: OAuth2 application client secret

**Note**: No refresh token required - uses OAuth2 client credentials flow for authentication.

#### Option 2: From Source (Development)

```bash
# Clone and install dependencies
cd C:\path\to\NinjaOneMCP
npm install
```

**⚠️ Important:** See [SETUP.md](SETUP.md) for detailed configuration instructions, especially for MCP client integration.

### Configuration

Edit your `.env` file (local development only; MCP clients do not load .env):
```env
NINJA_CLIENT_ID=your_client_id
NINJA_CLIENT_SECRET=your_client_secret
NINJA_BASE_URL=https://app.ninjarmm.com
# Or set a region key instead of base URL:
# NINJA_REGION=eu
# Optional: override auto-detect candidates
# NINJA_BASE_URLS=https://app.ninjarmm.com,https://eu.ninjarmm.com
MCP_MODE=stdio
HTTP_PORT=3000
SSE_PORT=3001
```

### Build and Run

```bash
# Build TypeScript
npm run build

# Run with different transports
npm run start           # STDIO (default)
npm run start:http      # HTTP on port 3000
npm run start:sse       # SSE on port 3001

# Development mode with auto-rebuild
npm run dev
```

## Usage Examples

### Device Management
```typescript
// List devices with filter
await ninjaAPI.getDevices("org = 1", 50, 0);

// Get specific device (owner UID available via assignedOwnerUid field)
await ninjaAPI.getDevice(12345);

// Reboot device
await ninjaAPI.rebootDevice(12345, "NORMAL");

// Set maintenance mode
await ninjaAPI.setDeviceMaintenance(12345, "ON");
```

> ℹ️ **Note:** The NinjaONE public API does not expose dedicated endpoints for reading or setting device owners. Owner
> information is returned as the `assignedOwnerUid` field in the `getDevice` response.

### Query Operations
```typescript
// Query antivirus status
await ninjaAPI.queryAntivirusStatus("org = 1");

// Query hardware information
await ninjaAPI.queryProcessors();
await ninjaAPI.queryDisks();
await ninjaAPI.queryNetworkInterfaces();

// Query software and patches
await ninjaAPI.querySoftware();
await ninjaAPI.queryOSPatches();
await ninjaAPI.queryWindowsServices();

// Query custom fields and policies
await ninjaAPI.queryCustomFields();
await ninjaAPI.queryPolicyOverrides();

// Query backup usage
await ninjaAPI.queryBackupUsage();
```

### Patch Management
```typescript
// Scan for OS patches
await ninjaAPI.scanDeviceOSPatches(12345);

// Apply patches
await ninjaAPI.applyDeviceOSPatches(12345, patchArray);
```

## API Limitations

The following operations are NOT supported by the NinjaOne Public API:

- **Delete Organization**: Organizations can only be deleted via the NinjaOne dashboard
- **Delete Location**: Locations can only be deleted via the NinjaOne dashboard  
- **Update nodeApprovalMode**: This setting is read-only after organization creation

All other CRUD operations for organizations and locations work as expected.

## MCP Integration

### Claude Desktop Configuration (Generic)

Important: MCP clients do not load `.env`. Provide all required environment variables in the MCP client config.

File location (Windows): `%APPDATA%\Claude\claude_desktop_config.json`

Generic example (adjust your paths and env values):

```json
{
  "mcpServers": {
    "ninjaone": {
      "command": "node",
      "args": [
        "C:\\Path\\to\\NinjaOneMCP\\dist\\index.js"
      ],
      "cwd": "C:\\Path\\to\\NinjaOneMCP",
      "env": {
        "NINJA_CLIENT_ID": "<your_client_id>",
        "NINJA_CLIENT_SECRET": "<your_client_secret>",
        "NINJA_BASE_URL": "https://api.ninjarmm.com",
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

Adjust these fields:
- Path: Set `args[0]` to your actual `dist\index.js` path and `cwd` to the repo root path on your machine.
- Region: Set `NINJA_BASE_URL` to your region, e.g. `https://eu.ninjarmm.com` for EU tenants.
- Credentials: Provide your OAuth client credentials via `NINJA_CLIENT_ID` and `NINJA_CLIENT_SECRET`.

Build first so `dist/index.js` exists: `npm install && npm run build`. Then restart Claude Desktop after editing the config.

### Available Tools

The server provides 29+ tools covering all major NinjaONE operations:

**Device Tools**: `get_devices`, `get_device`, `reboot_device`, `get_device_activities`, `search_devices_by_name`, `find_windows11_devices`

**Organization Tools**: `get_organizations`, `get_alerts`

**System Information Query Tools**: `query_antivirus_status`, `query_antivirus_threats`, `query_computer_systems`, `query_device_health`, `query_operating_systems`, `query_logged_on_users`

**Hardware Query Tools**: `query_processors`, `query_disks`, `query_volumes`, `query_network_interfaces`, `query_raid_controllers`, `query_raid_drives`

**Software & Patch Query Tools**: `query_software`, `query_os_patches`, `query_software_patches`, `query_os_patch_installs`, `query_software_patch_installs`, `query_windows_services`

**Custom Fields & Policy Query Tools**: `query_custom_fields`, `query_custom_fields_detailed`, `query_scoped_custom_fields`, `query_scoped_custom_fields_detailed`, `query_policy_overrides`

**Backup Query Tools**: `query_backup_usage`

## Region and Base URL

The server can resolve the correct regional API endpoint in three ways:

- Explicit base URL: set `NINJA_BASE_URL` (e.g., `https://eu.ninjarmm.com`). This takes precedence over all other options.
- Region key: set `NINJA_REGION` to one of `us`, `us2`, `eu`, `ca`, `oc`. The server maps it to the proper base URL.
- Auto-detect: if neither of the above is set, the server tries candidates in order until OAuth succeeds.
  - Default candidates: `https://app.ninjarmm.com`, `https://us2.ninjarmm.com`, `https://eu.ninjarmm.com`, `https://ca.ninjarmm.com`, `https://oc.ninjarmm.com`
  - Override list via `NINJA_BASE_URLS` (comma-separated) if needed.

Runtime tools:
- `list_regions` – returns supported regions and base URLs
- `set_region` – set by `{ "region": "eu" }` or `{ "baseUrl": "https://eu.ninjarmm.com" }`

## API Reference

### Tool Parameters

Most tools support these common parameters:

- `df` (string): Device filter expression (e.g., "org = 1 AND status = 'ONLINE'")
- `pageSize` (number): Results per page (default: 50)
- `cursor` (string): Pagination cursor for queries
- `id` (number): Resource identifier for specific operations

### Device Filters

Use NinjaONE's filter syntax:
```
org = 1 AND status = 'ONLINE'
name LIKE '%server%'
os.name = 'Windows 10'
lastSeen > '2024-01-01'
```

## Architecture

```
src/
├── index.ts              # Main server and transport selection
├── ninja-api.ts          # NinjaONE API client wrapper
└── transport/
    └── http.ts           # HTTP and SSE transport implementations
```

## Security Features

- **Secure Credential Management**: Environment-based token storage
- **CORS Protection**: Configurable origin restrictions
- **Request Validation**: JSON-RPC format validation
- **Error Sanitization**: Prevents sensitive data leakage
- **Rate Limiting Ready**: Structured for rate limit implementation

## Development

### Project Structure
- Modern ES modules with TypeScript
- Comprehensive error handling
- Extensive logging and debugging
- Clean separation of concerns

### Testing
```bash
# Run API connectivity test
npm test
```

### Contributing
1. Follow TypeScript strict mode requirements
2. Add proper error handling for new endpoints
3. Update tool definitions for new features
4. Test with all transport modes

## Troubleshooting

### Common Issues

**Connection Errors**
- Verify `NINJA_CLIENT_ID` and `NINJA_CLIENT_SECRET` are correct and have required scopes
- Set `NINJA_BASE_URL` or `NINJA_REGION` appropriately (or rely on auto-detect)
- Ensure network connectivity to NinjaONE API

**Permission Errors**
- Verify your OAuth client has required scopes (monitoring, management, control)
- Check organization/location access permissions

**Transport Issues**
- For STDIO: Ensure proper MCP client configuration
- For HTTP: Check port availability and CORS settings
- For SSE: Verify WebSocket support in client

### Debug Mode
Set `LOG_LEVEL=debug` in your `.env` file for detailed logging.

## License

MIT License - see LICENSE file for details.

## Distribution

### MCPB Bundle Format

This MCP server is distributed as a `.mcpb` (MCP Bundle) file following the official MCPB specification. The bundle contains:

- **Production server code**: Compiled JavaScript with all dependencies included
- **MCPB manifest**: Proper manifest.json for client compatibility
- **Security features**: Input validation, error handling, and logging
- **Documentation**: Complete setup and usage instructions

### Bundle Features

- **Self-contained**: No external dependencies required
- **Cross-platform**: Compatible with Windows, macOS, and Linux
- **MCP-compliant**: Follows official MCP protocol specifications
- **Security-hardened**: Comprehensive error handling and input validation
- **Production-ready**: Includes logging, monitoring, and debugging capabilities

### Creating a New Bundle

To rebuild the distribution bundle:

```bash
# Install the MCPB CLI tool
npm install -g @anthropic-ai/mcpb

# Validate the manifest
mcpb validate manifest.json

# Create the .mcpb bundle
mcpb pack . ninjaone-rmm.mcpb
```

The resulting `.mcpb` file can be installed directly in Claude Desktop and other MCP-compatible clients through drag-and-drop or import functionality.

## Support

This is a community-maintained MCP server. For NinjaONE API issues, consult the official NinjaONE documentation.
