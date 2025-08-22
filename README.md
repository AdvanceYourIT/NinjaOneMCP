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
- `/tools` - List available tools
- `/tools/:toolName` - Execute specific tools
- `/mcp` - Full JSON-RPC endpoint

#### Server-Sent Events (SSE)
Real-time streaming for web applications:
- `/events` - SSE connection endpoint
- `/sse/command` - Command execution endpoint

## Quick Start

### Prerequisites
- Node.js 18+ 
- NinjaONE API access token
- PowerShell 7+ (for Windows development)

### Installation

```bash
# Clone and install dependencies
cd C:\path\to\NinjaOneMCP
npm install

# Configure environment
cp .env.example .env
# Edit .env with your NinjaONE credentials
```

**⚠️ Important:** See [SETUP.md](SETUP.md) for detailed configuration instructions, especially for MCP client integration.

### Configuration

Edit your `.env` file:
```env
NINJA_ACCESS_TOKEN=your_ninja_access_token_here
NINJA_BASE_URL=https://api.ninjarmm.com
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

// Get specific device
await ninjaAPI.getDevice(12345);

// Reboot device
await ninjaAPI.rebootDevice(12345, "NORMAL");

// Set maintenance mode
await ninjaAPI.setDeviceMaintenance(12345, "ON");
```

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

## MCP Integration

### Claude Desktop Configuration

**Important:** When using with Claude Desktop or other MCP clients, environment variables must be explicitly passed in the configuration. The `.env` file is NOT automatically loaded by MCP clients.

Add to your Claude Desktop config (`%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "ninjaone": {
      "command": "node",
      "args": ["C:\\Path\\to\\NinjaOneMCP\\dist\\index.js"],
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

**Note:** You MUST include all required environment variables in the `env` section. The server will not read the `.env` file when launched by an MCP client.

### Available Tools

The server provides 29+ tools covering all major NinjaONE operations:

**Device Tools**: `get_devices`, `get_device`, `reboot_device`, `get_device_activities`, `search_devices_by_name`, `find_windows11_devices`

**Organization Tools**: `get_organizations`, `get_alerts`

**System Information Query Tools**: `query_antivirus_status`, `query_antivirus_threats`, `query_computer_systems`, `query_device_health`, `query_operating_systems`, `query_logged_on_users`

**Hardware Query Tools**: `query_processors`, `query_disks`, `query_volumes`, `query_network_interfaces`, `query_raid_controllers`, `query_raid_drives`

**Software & Patch Query Tools**: `query_software`, `query_os_patches`, `query_software_patches`, `query_os_patch_installs`, `query_software_patch_installs`, `query_windows_services`

**Custom Fields & Policy Query Tools**: `query_custom_fields`, `query_custom_fields_detailed`, `query_scoped_custom_fields`, `query_scoped_custom_fields_detailed`, `query_policy_overrides`

**Backup Query Tools**: `query_backup_usage`

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
- Verify `NINJA_ACCESS_TOKEN` is correct
- Check `NINJA_BASE_URL` points to your instance
- Ensure network connectivity to NinjaONE API

**Permission Errors**
- Verify API token has required scopes
- Check organization/location access permissions

**Transport Issues**
- For STDIO: Ensure proper MCP client configuration
- For HTTP: Check port availability and CORS settings
- For SSE: Verify WebSocket support in client

### Debug Mode
Set `LOG_LEVEL=debug` in your `.env` file for detailed logging.

## License

MIT License - see LICENSE file for details.

## Support

This is a community-maintained MCP server. For NinjaONE API issues, consult the official NinjaONE documentation.