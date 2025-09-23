# NinjaONE RMM MCP Server Bundle

A professional MCP (Model Context Protocol) server bundle for NinjaONE RMM platform, providing comprehensive device management, monitoring, patch management, and automation capabilities.

## Features

- **Complete Device Management**: List, reboot, and maintain devices across your RMM environment
- **Health Monitoring**: Query device health, antivirus status, and system information
- **Hardware Insights**: Access processor, disk, and system hardware details
- **Software Management**: Query installed software and OS patch information
- **Patch Management**: Scan for and apply OS patches to managed devices
- **Organization Management**: Access multi-tenant organization structures

## Installation

1. Download the latest `ninjaone-rmm.mcpb` bundle file
2. Install using your MCP-compatible client (e.g., Claude Desktop)
3. Configure your NinjaONE connection settings

## Configuration

This bundle requires the following configuration:

### Required Settings

- **NinjaONE Base URL**: Your regional API endpoint (e.g., https://app.ninjarmm.com, https://eu.ninjarmm.com)
- **OAuth Client ID**: Your NinjaONE OAuth2 application client ID
- **OAuth Client Secret**: Your NinjaONE OAuth2 application client secret
- **OAuth Refresh Token**: Your NinjaONE OAuth2 refresh token for authentication

### Optional Settings

- **Log Level**: Logging level for debugging and monitoring (error, warn, info, debug)

## Regional Endpoints

Choose the appropriate base URL for your NinjaONE tenant:

- **US (Main)**: https://app.ninjarmm.com
- **US (Secondary)**: https://us2.ninjarmm.com
- **Europe**: https://eu.ninjarmm.com
- **Canada**: https://ca.ninjarmm.com
- **Oceania**: https://oc.ninjarmm.com

## Available Tools

### Device Management
- `get_devices` - List devices with optional filtering and pagination
- `get_device` - Get detailed information about a specific device
- `reboot_device` - Reboot a device with normal or forced mode
- `set_device_maintenance` - Set maintenance mode for a device

### System Information
- `query_antivirus_status` - Query antivirus status across devices
- `query_device_health` - Query device health status information
- `query_operating_systems` - Query OS information across devices

### Hardware Information
- `query_processors` - Query processor information across devices
- `query_disks` - Query disk drive information across devices

### Software & Patches
- `query_software` - Query installed software across devices
- `query_os_patches` - Query OS patches across devices
- `scan_device_os_patches` - Scan for OS patches on a device
- `apply_device_os_patches` - Apply OS patches on a device

### Organization Management
- `get_organizations` - List all organizations with pagination
- `get_alerts` - Get system alerts with optional filtering

## Security

- All sensitive configuration data (secrets, tokens) are handled securely
- API calls are authenticated using OAuth2 with automatic token refresh
- Comprehensive error handling and input validation
- Structured logging with sensitive data redaction
- Request timeouts and retry logic for reliability

## Requirements

- Node.js 18.0.0 or higher
- Valid NinjaONE RMM account with API access
- OAuth2 application configured in NinjaONE

## Support

This is a community-maintained MCP server bundle. For NinjaONE API issues, consult the official NinjaONE documentation.

## License

MIT License - see LICENSE file for details.