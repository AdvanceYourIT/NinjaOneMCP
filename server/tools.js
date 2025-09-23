/**
 * Tool definitions for NinjaONE MCP Server
 *
 * Defines all available tools with their schemas, validation, and handlers
 * following MCP protocol specifications and defensive programming practices.
 */

import { logger } from "./logger.js";

/**
 * Validate and format API response
 */
function formatResponse(data, operation) {
  try {
    if (typeof data === 'string') {
      return data;
    }

    const response = {
      operation,
      timestamp: new Date().toISOString(),
      success: true,
      data: data
    };

    return JSON.stringify(response, null, 2);

  } catch (error) {
    logger.error(`Response formatting failed for ${operation}:`, error);
    throw new Error(`Failed to format response: ${error.message}`);
  }
}

/**
 * Handle API errors consistently
 */
function handleApiError(error, operation) {
  logger.error(`${operation} failed:`, error);

  const errorResponse = {
    operation,
    timestamp: new Date().toISOString(),
    success: false,
    error: {
      message: error.message || 'Unknown error',
      ...(error.status && { status: error.status }),
      ...(error.statusText && { statusText: error.statusText })
    }
  };

  return JSON.stringify(errorResponse, null, 2);
}

export const toolDefinitions = {
  // Device Management Tools
  get_devices: {
    name: "get_devices",
    description: "List devices with optional filtering and pagination",
    inputSchema: {
      type: "object",
      properties: {
        df: {
          type: "string",
          description: "Device filter expression (e.g., 'org = 1 AND status = \"ONLINE\"')"
        },
        pageSize: {
          type: "number",
          description: "Number of results per page (default: 50, max: 1000)",
          minimum: 1,
          maximum: 1000,
          default: 50
        },
        after: {
          type: "number",
          description: "Pagination cursor (default: 0)",
          minimum: 0,
          default: 0
        }
      },
      additionalProperties: false
    },
    handler: async (api, args) => {
      try {
        const { df = null, pageSize = 50, after = 0 } = args;
        const result = await api.getDevices(df, pageSize, after);
        return formatResponse(result, 'get_devices');
      } catch (error) {
        return handleApiError(error, 'get_devices');
      }
    }
  },

  get_device: {
    name: "get_device",
    description: "Get detailed information about a specific device",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Device ID"
        }
      },
      required: ["id"],
      additionalProperties: false
    },
    handler: async (api, args) => {
      try {
        const { id } = args;
        const result = await api.getDevice(id);
        return formatResponse(result, 'get_device');
      } catch (error) {
        return handleApiError(error, 'get_device');
      }
    }
  },

  reboot_device: {
    name: "reboot_device",
    description: "Reboot a device with normal or forced mode",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Device ID"
        },
        mode: {
          type: "string",
          description: "Reboot mode",
          enum: ["NORMAL", "FORCED"],
          default: "NORMAL"
        }
      },
      required: ["id"],
      additionalProperties: false
    },
    handler: async (api, args) => {
      try {
        const { id, mode = "NORMAL" } = args;
        const result = await api.rebootDevice(id, mode);
        return formatResponse(result, 'reboot_device');
      } catch (error) {
        return handleApiError(error, 'reboot_device');
      }
    }
  },

  set_device_maintenance: {
    name: "set_device_maintenance",
    description: "Set maintenance mode for a device",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Device ID"
        },
        mode: {
          type: "string",
          description: "Maintenance mode",
          enum: ["ON", "OFF"]
        }
      },
      required: ["id", "mode"],
      additionalProperties: false
    },
    handler: async (api, args) => {
      try {
        const { id, mode } = args;
        const result = await api.setDeviceMaintenance(id, mode);
        return formatResponse(result, 'set_device_maintenance');
      } catch (error) {
        return handleApiError(error, 'set_device_maintenance');
      }
    }
  },

  // Organization Tools
  get_organizations: {
    name: "get_organizations",
    description: "List all organizations with pagination",
    inputSchema: {
      type: "object",
      properties: {
        pageSize: {
          type: "number",
          description: "Number of results per page (default: 50)",
          minimum: 1,
          maximum: 1000,
          default: 50
        },
        after: {
          type: "number",
          description: "Pagination cursor (default: 0)",
          minimum: 0,
          default: 0
        }
      },
      additionalProperties: false
    },
    handler: async (api, args) => {
      try {
        const { pageSize = 50, after = 0 } = args;
        const result = await api.getOrganizations(pageSize, after);
        return formatResponse(result, 'get_organizations');
      } catch (error) {
        return handleApiError(error, 'get_organizations');
      }
    }
  },

  // Alert Tools
  get_alerts: {
    name: "get_alerts",
    description: "Get system alerts with optional filtering",
    inputSchema: {
      type: "object",
      properties: {
        since: {
          type: "string",
          description: "ISO timestamp for alerts since (optional)"
        }
      },
      additionalProperties: false
    },
    handler: async (api, args) => {
      try {
        const { since = null } = args;
        const result = await api.getAlerts(since);
        return formatResponse(result, 'get_alerts');
      } catch (error) {
        return handleApiError(error, 'get_alerts');
      }
    }
  },

  // Query Tools - System Information
  query_antivirus_status: {
    name: "query_antivirus_status",
    description: "Query antivirus status information across devices",
    inputSchema: {
      type: "object",
      properties: {
        df: {
          type: "string",
          description: "Device filter expression"
        },
        pageSize: {
          type: "number",
          description: "Number of results per page (default: 50)",
          minimum: 1,
          maximum: 1000,
          default: 50
        },
        cursor: {
          type: "string",
          description: "Pagination cursor"
        }
      },
      additionalProperties: false
    },
    handler: async (api, args) => {
      try {
        const { df = null, pageSize = 50, cursor = null } = args;
        const result = await api.queryAntivirusStatus(df, pageSize, cursor);
        return formatResponse(result, 'query_antivirus_status');
      } catch (error) {
        return handleApiError(error, 'query_antivirus_status');
      }
    }
  },

  query_device_health: {
    name: "query_device_health",
    description: "Query device health status information",
    inputSchema: {
      type: "object",
      properties: {
        df: {
          type: "string",
          description: "Device filter expression"
        },
        pageSize: {
          type: "number",
          description: "Number of results per page (default: 50)",
          minimum: 1,
          maximum: 1000,
          default: 50
        },
        cursor: {
          type: "string",
          description: "Pagination cursor"
        }
      },
      additionalProperties: false
    },
    handler: async (api, args) => {
      try {
        const { df = null, pageSize = 50, cursor = null } = args;
        const result = await api.queryDeviceHealth(df, pageSize, cursor);
        return formatResponse(result, 'query_device_health');
      } catch (error) {
        return handleApiError(error, 'query_device_health');
      }
    }
  },

  query_operating_systems: {
    name: "query_operating_systems",
    description: "Query operating system information across devices",
    inputSchema: {
      type: "object",
      properties: {
        df: {
          type: "string",
          description: "Device filter expression"
        },
        pageSize: {
          type: "number",
          description: "Number of results per page (default: 50)",
          minimum: 1,
          maximum: 1000,
          default: 50
        },
        cursor: {
          type: "string",
          description: "Pagination cursor"
        }
      },
      additionalProperties: false
    },
    handler: async (api, args) => {
      try {
        const { df = null, pageSize = 50, cursor = null } = args;
        const result = await api.queryOperatingSystems(df, pageSize, cursor);
        return formatResponse(result, 'query_operating_systems');
      } catch (error) {
        return handleApiError(error, 'query_operating_systems');
      }
    }
  },

  // Hardware Query Tools
  query_processors: {
    name: "query_processors",
    description: "Query processor information across devices",
    inputSchema: {
      type: "object",
      properties: {
        df: {
          type: "string",
          description: "Device filter expression"
        },
        pageSize: {
          type: "number",
          description: "Number of results per page (default: 50)",
          minimum: 1,
          maximum: 1000,
          default: 50
        },
        cursor: {
          type: "string",
          description: "Pagination cursor"
        }
      },
      additionalProperties: false
    },
    handler: async (api, args) => {
      try {
        const { df = null, pageSize = 50, cursor = null } = args;
        const result = await api.queryProcessors(df, pageSize, cursor);
        return formatResponse(result, 'query_processors');
      } catch (error) {
        return handleApiError(error, 'query_processors');
      }
    }
  },

  query_disks: {
    name: "query_disks",
    description: "Query disk drive information across devices",
    inputSchema: {
      type: "object",
      properties: {
        df: {
          type: "string",
          description: "Device filter expression"
        },
        pageSize: {
          type: "number",
          description: "Number of results per page (default: 50)",
          minimum: 1,
          maximum: 1000,
          default: 50
        },
        cursor: {
          type: "string",
          description: "Pagination cursor"
        }
      },
      additionalProperties: false
    },
    handler: async (api, args) => {
      try {
        const { df = null, pageSize = 50, cursor = null } = args;
        const result = await api.queryDisks(df, pageSize, cursor);
        return formatResponse(result, 'query_disks');
      } catch (error) {
        return handleApiError(error, 'query_disks');
      }
    }
  },

  // Software Query Tools
  query_software: {
    name: "query_software",
    description: "Query installed software across devices",
    inputSchema: {
      type: "object",
      properties: {
        df: {
          type: "string",
          description: "Device filter expression"
        },
        pageSize: {
          type: "number",
          description: "Number of results per page (default: 50)",
          minimum: 1,
          maximum: 1000,
          default: 50
        },
        cursor: {
          type: "string",
          description: "Pagination cursor"
        }
      },
      additionalProperties: false
    },
    handler: async (api, args) => {
      try {
        const { df = null, pageSize = 50, cursor = null } = args;
        const result = await api.querySoftware(df, pageSize, cursor);
        return formatResponse(result, 'query_software');
      } catch (error) {
        return handleApiError(error, 'query_software');
      }
    }
  },

  query_os_patches: {
    name: "query_os_patches",
    description: "Query operating system patches across devices",
    inputSchema: {
      type: "object",
      properties: {
        df: {
          type: "string",
          description: "Device filter expression"
        },
        pageSize: {
          type: "number",
          description: "Number of results per page (default: 50)",
          minimum: 1,
          maximum: 1000,
          default: 50
        },
        cursor: {
          type: "string",
          description: "Pagination cursor"
        }
      },
      additionalProperties: false
    },
    handler: async (api, args) => {
      try {
        const { df = null, pageSize = 50, cursor = null } = args;
        const result = await api.queryOSPatches(df, pageSize, cursor);
        return formatResponse(result, 'query_os_patches');
      } catch (error) {
        return handleApiError(error, 'query_os_patches');
      }
    }
  },

  // Patch Management Tools
  scan_device_os_patches: {
    name: "scan_device_os_patches",
    description: "Scan for OS patches on a device",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Device ID"
        }
      },
      required: ["id"],
      additionalProperties: false
    },
    handler: async (api, args) => {
      try {
        const { id } = args;
        const result = await api.scanDeviceOSPatches(id);
        return formatResponse(result, 'scan_device_os_patches');
      } catch (error) {
        return handleApiError(error, 'scan_device_os_patches');
      }
    }
  },

  apply_device_os_patches: {
    name: "apply_device_os_patches",
    description: "Apply OS patches on a device",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Device ID"
        },
        patches: {
          type: "array",
          description: "List of OS patches to apply",
          items: {
            type: "object"
          }
        }
      },
      required: ["id", "patches"],
      additionalProperties: false
    },
    handler: async (api, args) => {
      try {
        const { id, patches } = args;
        const result = await api.applyDeviceOSPatches(id, patches);
        return formatResponse(result, 'apply_device_os_patches');
      } catch (error) {
        return handleApiError(error, 'apply_device_os_patches');
      }
    }
  }
};