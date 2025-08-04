/**
 * NinjaONE MCP Server - Optimized version without optional features
 * Supports STDIO, HTTP, and SSE transports with fixed filtering
 * MCP SDK v1.17.1 compatible
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { NinjaOneAPI } from './ninja-api.js';
import { createHttpServer, createSseServer } from './transport/http.js';
import { config } from 'dotenv';

config();

/**
 * Fixed tool definitions - removed complex filtering, kept all functionality
 */
const TOOLS = [
  // Device Management Tools
  {
    name: 'get_devices',
    description: 'List all devices with basic filtering. Use simple filters only.',
    inputSchema: {
      type: 'object',
      properties: {
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' },
        after: { type: 'number', description: 'Pagination cursor' },
        df: { type: 'string', description: 'Simple device filter (e.g., "offline = true")' }
      }
    }
  },
  {
    name: 'get_device',
    description: 'Get detailed information about a specific device',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Device ID' }
      },
      required: ['id']
    }
  },
  {
    name: 'reboot_device',
    description: 'Reboot a device with normal or forced mode',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Device ID' },
        mode: { type: 'string', enum: ['NORMAL', 'FORCED'], description: 'Reboot mode' }
      },
      required: ['id', 'mode']
    }
  },
  {
    name: 'get_organizations',
    description: 'List all organizations with pagination',
    inputSchema: {
      type: 'object',
      properties: {
        pageSize: { type: 'number', description: 'Number of results per page' },
        after: { type: 'number', description: 'Pagination cursor' }
      }
    }
  },
  {
    name: 'get_alerts',
    description: 'Get system alerts with basic filtering',
    inputSchema: {
      type: 'object',
      properties: {
        since: { type: 'string', description: 'ISO timestamp for alerts since' }
      }
    }
  },
  {
    name: 'get_device_activities',
    description: 'Get activities for a specific device',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Device ID' },
        pageSize: { type: 'number', description: 'Number of results per page' }
      },
      required: ['id']
    }
  },
  {
    name: 'search_devices_by_name',
    description: 'Search devices by system name (client-side filtering)',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'System name to search for' },
        limit: { type: 'number', description: 'Maximum results to return (default: 10)' }
      },
      required: ['name']
    }
  },
  {
    name: 'find_windows11_devices',
    description: 'Find all Windows 11 devices (client-side filtering)',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum results to return (default: 20)' }
      }
    }
  },

  // System Information Query Tools
  {
    name: 'query_antivirus_status',
    description: 'Query antivirus status information across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_antivirus_threats',
    description: 'Query antivirus threat detections across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_computer_systems',
    description: 'Query computer system information across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_device_health',
    description: 'Query device health status information',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_operating_systems',
    description: 'Query operating system information across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_logged_on_users',
    description: 'Query currently logged on users across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },

  // Hardware Query Tools
  {
    name: 'query_processors',
    description: 'Query processor information across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_disks',
    description: 'Query disk drive information across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_volumes',
    description: 'Query disk volume information across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_network_interfaces',
    description: 'Query network interface information across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_raid_controllers',
    description: 'Query RAID controller information across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_raid_drives',
    description: 'Query RAID drive information across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },

  // Software and Patch Query Tools
  {
    name: 'query_software',
    description: 'Query installed software across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_os_patches',
    description: 'Query operating system patches across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_software_patches',
    description: 'Query software patches across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_os_patch_installs',
    description: 'Query OS patch installation history across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_software_patch_installs',
    description: 'Query software patch installation history across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_windows_services',
    description: 'Query Windows services across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },

  // Custom Fields and Policy Query Tools
  {
    name: 'query_custom_fields',
    description: 'Query custom field values across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_custom_fields_detailed',
    description: 'Query detailed custom field information across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_scoped_custom_fields',
    description: 'Query scoped custom field values across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_scoped_custom_fields_detailed',
    description: 'Query detailed scoped custom field information across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },
  {
    name: 'query_policy_overrides',
    description: 'Query policy override information across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  },

  // Backup Query Tools
  {
    name: 'query_backup_usage',
    description: 'Query backup usage statistics across devices',
    inputSchema: {
      type: 'object',
      properties: {
        df: { type: 'string', description: 'Device filter' },
        cursor: { type: 'string', description: 'Pagination cursor' },
        pageSize: { type: 'number', description: 'Number of results per page (default: 50)' }
      }
    }
  }
];

/**
 * NinjaONE MCP Server Class with multiple transports
 */
class NinjaOneMCPServer {
  private server: Server;
  private api: NinjaOneAPI;

  constructor() {
    try {
      this.api = new NinjaOneAPI();
      this.server = new Server(
        {
          name: 'ninjaone-mcp-server',
          version: '1.2.0',
        },
        {
          capabilities: {
            tools: {}
          }
        }
      );
      this.setupToolHandlers();
    } catch (error) {
      console.error('Failed to initialize NinjaONE MCP Server:', error);
      throw error;
    }
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        console.error(`Executing tool: ${name}`);
        const result = await this.routeToolCall(name, args || {});
        return result;
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError, 
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async routeToolCall(name: string, args: any) {
    try {
      const data = await this.callAPIMethod(name, args);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError, 
        `API call failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async callAPIMethod(name: string, args: any) {
    switch (name) {
      // Device Management
      case 'get_devices':
        return this.api.getDevices(args.df, args.pageSize || 50, args.after);
      case 'get_device':
        return this.api.getDevice(args.id);
      case 'reboot_device':
        return this.api.rebootDevice(args.id, args.mode);
      case 'get_organizations':
        return this.api.getOrganizations(args.pageSize, args.after);
      case 'get_alerts':
        return this.api.getAlerts(undefined, args.since);
      case 'get_device_activities':
        return this.api.getDeviceActivities(args.id, args.pageSize);
      case 'search_devices_by_name':
        return this.searchDevicesByName(args.name, args.limit || 10);
      case 'find_windows11_devices':
        return this.findWindows11Devices(args.limit || 20);
      
      // System Information Queries
      case 'query_antivirus_status':
        return this.api.queryAntivirusStatus(args.df, args.cursor, args.pageSize || 50);
      case 'query_antivirus_threats':
        return this.api.queryAntivirusThreats(args.df, args.cursor, args.pageSize || 50);
      case 'query_computer_systems':
        return this.api.queryComputerSystems(args.df, args.cursor, args.pageSize || 50);
      case 'query_device_health':
        return this.api.queryDeviceHealth(args.df, args.cursor, args.pageSize || 50);
      case 'query_operating_systems':
        return this.api.queryOperatingSystems(args.df, args.cursor, args.pageSize || 50);
      case 'query_logged_on_users':
        return this.api.queryLoggedOnUsers(args.df, args.cursor, args.pageSize || 50);
      
      // Hardware Queries
      case 'query_processors':
        return this.api.queryProcessors(args.df, args.cursor, args.pageSize || 50);
      case 'query_disks':
        return this.api.queryDisks(args.df, args.cursor, args.pageSize || 50);
      case 'query_volumes':
        return this.api.queryVolumes(args.df, args.cursor, args.pageSize || 50);
      case 'query_network_interfaces':
        return this.api.queryNetworkInterfaces(args.df, args.cursor, args.pageSize || 50);
      case 'query_raid_controllers':
        return this.api.queryRaidControllers(args.df, args.cursor, args.pageSize || 50);
      case 'query_raid_drives':
        return this.api.queryRaidDrives(args.df, args.cursor, args.pageSize || 50);
      
      // Software and Patches
      case 'query_software':
        return this.api.querySoftware(args.df, args.cursor, args.pageSize || 50);
      case 'query_os_patches':
        return this.api.queryOSPatches(args.df, args.cursor, args.pageSize || 50);
      case 'query_software_patches':
        return this.api.querySoftwarePatches(args.df, args.cursor, args.pageSize || 50);
      case 'query_os_patch_installs':
        return this.api.queryOSPatchInstalls(args.df, args.cursor, args.pageSize || 50);
      case 'query_software_patch_installs':
        return this.api.querySoftwarePatchInstalls(args.df, args.cursor, args.pageSize || 50);
      case 'query_windows_services':
        return this.api.queryWindowsServices(args.df, args.cursor, args.pageSize || 50);
      
      // Custom Fields and Policies
      case 'query_custom_fields':
        return this.api.queryCustomFields(args.df, args.cursor, args.pageSize || 50);
      case 'query_custom_fields_detailed':
        return this.api.queryCustomFieldsDetailed(args.df, args.cursor, args.pageSize || 50);
      case 'query_scoped_custom_fields':
        return this.api.queryScopedCustomFields(args.df, args.cursor, args.pageSize || 50);
      case 'query_scoped_custom_fields_detailed':
        return this.api.queryScopedCustomFieldsDetailed(args.df, args.cursor, args.pageSize || 50);
      case 'query_policy_overrides':
        return this.api.queryPolicyOverrides(args.df, args.cursor, args.pageSize || 50);
      
      // Backup
      case 'query_backup_usage':
        return this.api.queryBackupUsage(args.df, args.cursor, args.pageSize || 50);
      
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  }

  private async searchDevicesByName(searchName: string, limit: number) {
    const devices = await this.api.getDevices(undefined, 200);
    const filtered = devices
      .filter((device: any) => 
        device.systemName?.toLowerCase().includes(searchName.toLowerCase()) ||
        device.displayName?.toLowerCase().includes(searchName.toLowerCase())
      )
      .slice(0, limit);
    
    return {
      searchTerm: searchName,
      totalFound: filtered.length,
      devices: filtered
    };
  }

  private async findWindows11Devices(limit: number) {
    const devices = await this.api.getDevices(undefined, 200);
    const windowsDevices = devices.filter((device: any) => 
      device.nodeClass === 'WINDOWS_WORKSTATION' || device.nodeClass === 'WINDOWS_SERVER'
    );

    const windows11Devices = [];
    for (const device of windowsDevices.slice(0, 50)) {
      try {
        const details = await this.api.getDevice(device.id);
        if (details.os?.name?.includes('Windows 11')) {
          windows11Devices.push({
            id: device.id,
            systemName: device.systemName,
            displayName: device.displayName,
            offline: device.offline,
            osName: details.os.name,
            buildNumber: details.os.buildNumber,
            releaseId: details.os.releaseId,
            manufacturer: details.system?.manufacturer,
            model: details.system?.model
          });
          
          if (windows11Devices.length >= limit) break;
        }
      } catch (error) {
        continue;
      }
    }

    return {
      totalFound: windows11Devices.length,
      devices: windows11Devices
    };
  }

  async runStdio() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('NinjaONE MCP server running on STDIO transport');
  }

  async runHttp(port = 3000) {
    await createHttpServer(this.server, port);
    console.error(`NinjaONE MCP server running on HTTP transport at port ${port}`);
  }

  async runSse(port = 3001) {
    await createSseServer(this.server, port);
    console.error(`NinjaONE MCP server running on SSE transport at port ${port}`);
  }
}

/**
 * Main entry point with transport selection
 */
async function main() {
  const mode = process.env.MCP_MODE || 'stdio';
  const server = new NinjaOneMCPServer();

  try {
    switch (mode.toLowerCase()) {
      case 'http':
        const httpPort = parseInt(process.env.HTTP_PORT || '3000', 10);
        await server.runHttp(httpPort);
        break;
      case 'sse':
        const ssePort = parseInt(process.env.SSE_PORT || '3001', 10);
        await server.runSse(ssePort);
        break;
      case 'stdio':
      default:
        await server.runStdio();
        break;
    }
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
