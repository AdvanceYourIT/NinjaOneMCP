/**
 * NinjaONE API Client
 *
 * Handles authentication and API calls to NinjaONE RMM platform
 * with proper error handling, timeout management, and security measures.
 * Uses OAuth2 client credentials flow.
 */

import { logger } from "./logger.js";

export class NinjaOneAPI {
  constructor() {
    const envBase = process.env.NINJA_BASE_URL;
    const envRegion = (process.env.NINJA_REGION || '').toLowerCase();

    if (envBase) {
      this.baseUrl = this.normalizeBaseUrl(envBase);
      this.baseUrlExplicit = true;
    } else if (envRegion && NinjaOneAPI.REGION_MAP[envRegion]) {
      this.baseUrl = NinjaOneAPI.REGION_MAP[envRegion];
      this.baseUrlExplicit = true;
    } else {
      // Will auto-detect on first token request
      this.baseUrl = null;
    }

    this.clientId = process.env.NINJA_CLIENT_ID || '';
    this.clientSecret = process.env.NINJA_CLIENT_SECRET || '';
    this.accessToken = null;
    this.tokenExpiry = null;
    this.baseUrlExplicit = false;

    this.isConfigured = !!(this.clientId && this.clientSecret);

    if (!this.isConfigured) {
      logger.error('WARNING: NINJA_CLIENT_ID and NINJA_CLIENT_SECRET not set - API calls will fail until configured');
    } else {
      logger.info('NinjaONE API initialized successfully');
    }
  }

  static REGION_MAP = {
    us: 'https://app.ninjarmm.com',
    us2: 'https://us2.ninjarmm.com',
    eu: 'https://eu.ninjarmm.com',
    ca: 'https://ca.ninjarmm.com',
    oc: 'https://oc.ninjarmm.com',
  };

  static DEFAULT_CANDIDATES = [
    'https://app.ninjarmm.com',
    'https://us2.ninjarmm.com',
    'https://eu.ninjarmm.com',
    'https://ca.ninjarmm.com',
    'https://oc.ninjarmm.com',
  ];

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
   * Get access token using client credentials flow
   */
  async getAccessToken() {
    if (!this.isConfigured) {
      throw new Error('NinjaONE API not configured - NINJA_CLIENT_ID and NINJA_CLIENT_SECRET required');
    }

    // Check if token is still valid (with 5 minute buffer)
    if (this.accessToken && this.tokenExpiry && Date.now() < (this.tokenExpiry - 300000)) {
      return this.accessToken;
    }

    // Ensure baseUrl is resolved (auto-detect if needed)
    if (!this.baseUrl || !this.baseUrlExplicit) {
      const tried = [];
      const candidates = this.getCandidateBaseUrls();
      for (const candidate of candidates) {
        tried.push(candidate);
        try {
          const token = await this.requestToken(candidate);
          this.baseUrl = candidate;
          this.baseUrlExplicit = true; // lock after success
          this.accessToken = token.access_token;
          this.tokenExpiry = Date.now() + (token.expires_in * 1000);
          logger.info(`OAuth token acquired successfully (region: ${candidate})`);
          return this.accessToken;
        } catch (e) {
          // try next
        }
      }
      throw new Error(`Failed to acquire OAuth token: no candidate base URL succeeded. Tried: ${tried.join(', ')}`);
    }

    // Get new token using resolved baseUrl
    const token = await this.requestToken(this.baseUrl);
    this.accessToken = token.access_token;
    this.tokenExpiry = Date.now() + (token.expires_in * 1000);
    logger.info('OAuth token acquired successfully');
    return this.accessToken;
  }

  /**
   * Request token using client credentials flow
   */
  async requestToken(baseUrl) {
    const tokenUrl = `${baseUrl}/ws/oauth/token`;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: 'monitoring management control'
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`OAuth token request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  normalizeBaseUrl(url) {
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  }

  getCandidateBaseUrls() {
    const fromEnv = (process.env.NINJA_BASE_URLS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(u => this.normalizeBaseUrl(u));
    return (fromEnv.length > 0 ? fromEnv : NinjaOneAPI.DEFAULT_CANDIDATES);
  }

  // Region utilities
  listRegions() {
    return Object.entries(NinjaOneAPI.REGION_MAP).map(([region, baseUrl]) => ({ region, baseUrl }));
  }

  setRegion(region) {
    const key = (region || '').toLowerCase();
    const mapped = NinjaOneAPI.REGION_MAP[key];
    if (!mapped) throw new Error(`Unknown region: ${region}`);
    this.setBaseUrl(mapped);
  }

  setBaseUrl(url) {
    this.baseUrl = this.normalizeBaseUrl(url);
    this.baseUrlExplicit = true;
    // reset token cache so it refreshes against new base
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async makeRequest(endpoint, options = {}) {
    const token = await this.getAccessToken();
    const base = this.baseUrl || NinjaOneAPI.DEFAULT_CANDIDATES[0];
    const method = (options.method || 'GET').toUpperCase();

    const headers = {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const requestOptions = {
      ...options,
      method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH'].includes(method) && this.isPlainObject(options.body)) {
      requestOptions.body = JSON.stringify(options.body);
      const hasContentType = Object.keys(headers).some(key => key.toLowerCase() === 'content-type');
      if (!hasContentType) {
        requestOptions.headers = { ...headers, 'Content-Type': 'application/json' };
      }
    }

    const response = await fetch(`${base}${endpoint}`, requestOptions);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  isPlainObject(value) {
    if (value === null || typeof value !== 'object') return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }

  buildQuery(params) {
    if (!params) return '';
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) {
        query.append(key, value.toString());
      }
    });
    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
  }

  // Legacy compatibility method
  async apiCall(endpoint, options = {}, params = {}) {
    try {
      const queryString = this.buildQuery(params);
      return await this.makeRequest(`${endpoint}${queryString}`, options);
    } catch (error) {
      logger.error('API call failed:', error.message);
      throw error;
    }
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