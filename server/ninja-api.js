/**
 * NinjaONE API Client
 *
 * Handles authentication and API calls to NinjaONE RMM platform
 * with proper error handling, timeout management, and security measures.
 */

import { logger } from "./logger.js";

export class NinjaOneAPI {
  constructor() {
    this.baseUrl = process.env.NINJAONE_BASE_URL?.replace(/\/$/, '');
    this.clientId = process.env.NINJAONE_CLIENT_ID;
    this.clientSecret = process.env.NINJAONE_CLIENT_SECRET;
    this.refreshToken = process.env.NINJAONE_REFRESH_TOKEN;

    this.accessToken = null;
    this.tokenExpiry = null;

    // Regional endpoints for auto-detection
    this.candidateUrls = [
      'https://app.ninjarmm.com',
      'https://us2.ninjarmm.com',
      'https://eu.ninjarmm.com',
      'https://ca.ninjarmm.com',
      'https://oc.ninjarmm.com'
    ];

    this.isConfigured = !!(this.clientId && this.clientSecret && this.refreshToken);

    if (!this.isConfigured) {
      throw new Error('Missing required environment variables: NINJAONE_CLIENT_ID, NINJAONE_CLIENT_SECRET, NINJAONE_REFRESH_TOKEN');
    }

    logger.debug('NinjaONE API client initialized', {
      baseUrl: this.baseUrl,
      clientId: this.clientId ? 'configured' : 'missing'
    });
  }

  /**
   * Test API connection by attempting to get organizations
   */
  async testConnection() {
    try {
      const result = await this.apiCall('/v2/organizations', {}, { pageSize: 1 });
      logger.info('NinjaONE API connection test successful');
      return result;
    } catch (error) {
      logger.error('NinjaONE API connection test failed:', error.message);
      throw new Error(`API connection test failed: ${error.message}`);
    }
  }

  /**
   * Get access token with automatic refresh
   */
  async getAccessToken() {
    // Check if current token is still valid (with 5 minute buffer)
    if (this.accessToken && this.tokenExpiry && Date.now() < (this.tokenExpiry - 300000)) {
      return this.accessToken;
    }

    // If no base URL is set, try auto-detection
    if (!this.baseUrl) {
      logger.info('No base URL configured, attempting auto-detection...');
      return await this.detectAndAuthenticate();
    }

    // Use configured base URL
    return await this.refreshAccessToken(this.baseUrl);
  }

  /**
   * Auto-detect the correct regional endpoint
   */
  async detectAndAuthenticate() {
    const tried = [];

    for (const candidateUrl of this.candidateUrls) {
      try {
        logger.debug(`Trying regional endpoint: ${candidateUrl}`);
        tried.push(candidateUrl);

        const token = await this.refreshAccessToken(candidateUrl);

        // Success! Set this as our base URL
        this.baseUrl = candidateUrl;
        logger.info(`Auto-detected NinjaONE region: ${candidateUrl}`);

        return token;

      } catch (error) {
        logger.debug(`Failed to authenticate with ${candidateUrl}: ${error.message}`);
        continue;
      }
    }

    throw new Error(`Failed to auto-detect NinjaONE region. Tried: ${tried.join(', ')}. Please set NINJAONE_BASE_URL manually.`);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(baseUrl) {
    const tokenUrl = `${baseUrl}/ws/oauth/token`;

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'NinjaONE-MCP-Server/1.2.9'
        },
        body: body.toString(),
        timeout: 10000 // 10 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OAuth token refresh failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const tokenData = await response.json();

      this.accessToken = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);

      logger.debug('Access token refreshed successfully');

      return this.accessToken;

    } catch (error) {
      logger.error('Token refresh failed:', error.message);
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  /**
   * Make authenticated API call with retry logic and proper error handling
   */
  async apiCall(endpoint, options = {}, params = {}) {
    const maxRetries = 2;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const token = await this.getAccessToken();
        const url = new URL(endpoint, this.baseUrl);

        // Add query parameters
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, value.toString());
          }
        });

        const requestOptions = {
          method: options.method || 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'NinjaONE-MCP-Server/1.2.9',
            ...options.headers
          },
          timeout: options.timeout || 30000 // 30 second timeout
        };

        if (options.body) {
          requestOptions.body = JSON.stringify(options.body);
        }

        logger.debug(`API call: ${requestOptions.method} ${url.pathname}`, {
          params: this.sanitizeLogData(params)
        });

        const response = await fetch(url.toString(), requestOptions);

        if (!response.ok) {
          const errorText = await response.text();
          const error = new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
          error.status = response.status;
          error.statusText = response.statusText;

          // Check if it's an auth error that requires token refresh
          if (response.status === 401) {
            this.accessToken = null;
            this.tokenExpiry = null;

            if (attempt < maxRetries) {
              logger.debug(`Authentication failed, retrying (attempt ${attempt}/${maxRetries})`);
              continue;
            }
          }

          throw error;
        }

        const data = await response.json();

        logger.debug(`API call successful: ${requestOptions.method} ${url.pathname}`, {
          responseSize: JSON.stringify(data).length
        });

        return data;

      } catch (error) {
        lastError = error;

        if (attempt < maxRetries && (error.message?.includes('timeout') || error.message?.includes('network'))) {
          logger.debug(`Network error, retrying (attempt ${attempt}/${maxRetries}): ${error.message}`);
          await this.delay(1000 * attempt); // Progressive delay
          continue;
        }

        break;
      }
    }

    logger.error(`API call failed after ${maxRetries} attempts:`, lastError.message);
    throw lastError;
  }

  /**
   * Sanitize data for logging (remove sensitive information)
   */
  sanitizeLogData(data) {
    const sanitized = { ...data };
    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'credential'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Device Management Methods
  async getDevices(df = null, pageSize = 50, after = 0) {
    const params = { pageSize, after };
    if (df) params.df = df;
    return await this.apiCall('/v2/devices', {}, params);
  }

  async getDevice(id) {
    return await this.apiCall(`/v2/device/${id}`);
  }

  async rebootDevice(id, mode = 'NORMAL') {
    return await this.apiCall(`/v2/device/${id}/reboot/${mode}`, { method: 'POST' });
  }

  async setDeviceMaintenance(id, mode) {
    return await this.apiCall(`/v2/device/${id}/maintenance`, {
      method: 'PUT',
      body: { mode }
    });
  }

  // Organization Methods
  async getOrganizations(pageSize = 50, after = 0) {
    return await this.apiCall('/v2/organizations', {}, { pageSize, after });
  }

  // Alert Methods
  async getAlerts(since = null) {
    const params = {};
    if (since) params.since = since;
    return await this.apiCall('/v2/alerts', {}, params);
  }

  // Query Methods - System Information
  async queryAntivirusStatus(df = null, pageSize = 50, cursor = null) {
    const params = { pageSize };
    if (df) params.df = df;
    if (cursor) params.cursor = cursor;
    return await this.apiCall('/v2/queries/antivirus-status', {}, params);
  }

  async queryDeviceHealth(df = null, pageSize = 50, cursor = null) {
    const params = { pageSize };
    if (df) params.df = df;
    if (cursor) params.cursor = cursor;
    return await this.apiCall('/v2/queries/device-health', {}, params);
  }

  async queryOperatingSystems(df = null, pageSize = 50, cursor = null) {
    const params = { pageSize };
    if (df) params.df = df;
    if (cursor) params.cursor = cursor;
    return await this.apiCall('/v2/queries/operating-systems', {}, params);
  }

  // Hardware Query Methods
  async queryProcessors(df = null, pageSize = 50, cursor = null) {
    const params = { pageSize };
    if (df) params.df = df;
    if (cursor) params.cursor = cursor;
    return await this.apiCall('/v2/queries/processors', {}, params);
  }

  async queryDisks(df = null, pageSize = 50, cursor = null) {
    const params = { pageSize };
    if (df) params.df = df;
    if (cursor) params.cursor = cursor;
    return await this.apiCall('/v2/queries/disks', {}, params);
  }

  // Software Query Methods
  async querySoftware(df = null, pageSize = 50, cursor = null) {
    const params = { pageSize };
    if (df) params.df = df;
    if (cursor) params.cursor = cursor;
    return await this.apiCall('/v2/queries/software', {}, params);
  }

  async queryOSPatches(df = null, pageSize = 50, cursor = null) {
    const params = { pageSize };
    if (df) params.df = df;
    if (cursor) params.cursor = cursor;
    return await this.apiCall('/v2/queries/os-patches', {}, params);
  }

  // Patch Management Methods
  async scanDeviceOSPatches(id) {
    return await this.apiCall(`/v2/device/${id}/os-patches/scan`, { method: 'POST' });
  }

  async applyDeviceOSPatches(id, patches) {
    return await this.apiCall(`/v2/device/${id}/os-patches`, {
      method: 'POST',
      body: { patches }
    });
  }
}