# NinjaONE MCP Server - Tools Reference

This document provides detailed information about all available tools in the NinjaONE MCP server.

## Core Tools Available

### Device Management Tools

#### `get_devices`
**Description**: List all devices or filter by criteria  
**Parameters**:
- `df` (string, optional): Device filter expression (e.g., "org = 1")
- `pageSize` (number, optional): Number of results per page
- `after` (number, optional): Pagination cursor

**Example Usage**:
```json
{
  "df": "org = 1 AND status = 'ONLINE'",
  "pageSize": 50
}
```

#### `get_device`
**Description**: Get detailed information about a specific device  
**Parameters**:
- `id` (number, required): Device ID

**Example Usage**:
```json
{ "id": 12345 }
```

#### `reboot_device`
**Description**: Reboot a device with normal or forced mode  
**Parameters**:
- `id` (number, required): Device ID
- `mode` (string, required): Reboot mode ("NORMAL" or "FORCED")

**Example Usage**:
```json
{
  "id": 12345,
  "mode": "NORMAL"
}
```

### Query Tools

#### `query_antivirus_status`
**Description**: Query antivirus status across devices  
**Parameters**:
- `df` (string, optional): Device filter expression
- `cursor` (string, optional): Pagination cursor
- `pageSize` (number, optional): Number of results per page

**Example Usage**:
```json
{
  "df": "org = 1",
  "pageSize": 100
}
```

#### `query_device_health`
**Description**: Query device health status and metrics  
**Parameters**:
- `df` (string, optional): Device filter expression
- `cursor` (string, optional): Pagination cursor
- `pageSize` (number, optional): Number of results per page

**Example Usage**:
```json
{
  "df": "status = 'ONLINE'",
  "pageSize": 50
}
```

### Organization Management Tools

#### `get_organizations`
**Description**: List all organizations with pagination  
**Parameters**:
- `pageSize` (number, optional): Number of results per page
- `after` (number, optional): Pagination cursor

**Example Usage**:
```json
{
  "pageSize": 25,
  "after": 0
}
```

### Alert Management Tools

#### `get_alerts`
**Description**: Get system alerts with optional filtering  
**Parameters**:
- `deviceFilter` (string, optional): Device filter expression
- `since` (string, optional): ISO timestamp for alerts since this time

**Example Usage**:
```json
{
  "deviceFilter": "org = 1",
  "since": "2024-01-01T00:00:00Z"
}
```

## Device Filter Syntax

The NinjaONE API uses a specific filter syntax for the `df` parameter:

### Basic Operators
- `=` : Equals
- `!=` : Not equals
- `>` : Greater than
- `<` : Less than
- `>=` : Greater than or equal
- `<=` : Less than or equal
- `LIKE` : Pattern matching (use % for wildcards)
- `IN` : Value in list

### Logical Operators
- `AND` : Logical AND
- `OR` : Logical OR
- `NOT` : Logical NOT

### Common Filter Examples

```
org = 1                           # Devices in organization 1
status = 'ONLINE'                 # Online devices only
name LIKE '%server%'              # Devices with 'server' in name
org = 1 AND status = 'ONLINE'     # Online devices in org 1
lastSeen > '2024-01-01'          # Devices seen after Jan 1, 2024
os.name = 'Windows 10'           # Windows 10 devices
```

### Available Fields for Filtering

- `id` : Device ID
- `name` : Device name
- `status` : Device status (ONLINE, OFFLINE, etc.)
- `org` : Organization ID
- `lastSeen` : Last seen timestamp
- `os.name` : Operating system name
- `os.version` : Operating system version
- `type` : Device type
- `location` : Location ID

## Response Format

All tools return responses in the following format:

```json
{
  "content": [
    {
      "type": "text",
      "text": "JSON formatted response data"
    }
  ]
}
```

The actual data varies by tool but typically includes:
- Array of objects for list operations
- Single object for detail operations
- Status information for action operations

## Error Handling

The server provides comprehensive error handling:

- **Invalid Tool**: Returns MethodNotFound error
- **API Errors**: Returns InternalError with details
- **Authentication**: Returns error if NINJA_ACCESS_TOKEN is invalid
- **Network Issues**: Returns connection error details

## Rate Limiting

Be aware of NinjaONE API rate limits:
- Standard limits apply per access token
- Large queries may need pagination
- Use appropriate `pageSize` values to avoid timeouts

## Security Considerations

- Never expose API tokens in client-side code
- Use environment variables for credentials
- Implement proper CORS settings for HTTP mode
- Monitor API usage and access patterns

## Extended Tools (Available in Full Implementation)

The current implementation includes core tools. A full implementation would include:

### Device Operations
- `set_device_maintenance`
- `run_device_script`
- `get_device_scripting_options`
- `approve_devices`

### Patch Management
- `scan_device_os_patches`
- `apply_device_os_patches`
- `scan_device_software_patches`
- `apply_device_software_patches`

### Service Management
- `control_windows_service`
- `configure_windows_service`

### Additional Queries
- `query_computer_systems`
- `query_operating_systems`
- `query_processors`
- `query_disks`
- `query_volumes`
- `query_network_interfaces`
- `query_software`
- `query_os_patches`
- `query_software_patches`

And many more covering all aspects of the NinjaONE platform.

## Support and Documentation

For detailed API documentation, refer to:
- NinjaONE Official API Documentation
- Device Filter Syntax Guide
- MCP Protocol Specification

For issues with this MCP server, check the server logs and ensure proper configuration of environment variables.