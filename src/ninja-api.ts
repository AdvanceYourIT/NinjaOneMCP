type CreateEndUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  organizationId?: number;
  fullPortalAccess?: boolean;
};

export class NinjaOneAPI {
  private baseUrl: string | null = null;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private isConfigured: boolean;
  private baseUrlExplicit: boolean = false;

  private static readonly REGION_MAP: Record<string, string> = {
    us: 'https://app.ninjarmm.com',
    us2: 'https://us2.ninjarmm.com',
    eu: 'https://eu.ninjarmm.com',
    ca: 'https://ca.ninjarmm.com',
    oc: 'https://oc.ninjarmm.com',
  };

  private static readonly DEFAULT_CANDIDATES: string[] = [
    'https://app.ninjarmm.com',
    'https://us2.ninjarmm.com',
    'https://eu.ninjarmm.com',
    'https://ca.ninjarmm.com',
    'https://oc.ninjarmm.com',
  ];

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
      this.baseUrl = null;
    }
    this.clientId = process.env.NINJA_CLIENT_ID || '';
    this.clientSecret = process.env.NINJA_CLIENT_SECRET || '';
    this.isConfigured = !!(this.clientId && this.clientSecret);
    
    if (!this.isConfigured) {
      console.error('WARNING: NINJA_CLIENT_ID and NINJA_CLIENT_SECRET not set - API calls will fail until configured');
    } else {
      console.error('NinjaONE API initialized successfully');
    }
  }

  private async getAccessToken(): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('NinjaONE API not configured - NINJA_CLIENT_ID and NINJA_CLIENT_SECRET required');
    }

    if (this.accessToken && this.tokenExpiry && Date.now() < (this.tokenExpiry - 300000)) {
      return this.accessToken;
    }

    if (!this.baseUrl || !this.baseUrlExplicit) {
      const tried: string[] = [];
      const candidates = this.getCandidateBaseUrls();
      for (const candidate of candidates) {
        tried.push(candidate);
        try {
          const token = await this.requestToken(candidate);
          this.baseUrl = candidate;
          this.baseUrlExplicit = true;
          this.accessToken = token.access_token;
          this.tokenExpiry = Date.now() + (token.expires_in * 1000);
          console.error(`OAuth token acquired successfully (region: ${candidate})`);
          return this.accessToken!;
        } catch (e) {
          // try next
        }
      }
      throw new Error(`Failed to acquire OAuth token: no candidate base URL succeeded. Tried: ${tried.join(', ')}`);
    }

    const token = await this.requestToken(this.baseUrl);
    this.accessToken = token.access_token;
    this.tokenExpiry = Date.now() + (token.expires_in * 1000);
    console.error('OAuth token acquired successfully');
    return this.accessToken!;
  }

  private async requestToken(baseUrl: string): Promise<{ access_token: string; expires_in: number }> {
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

  private normalizeBaseUrl(url: string): string {
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  }

  private getCandidateBaseUrls(): string[] {
    const fromEnv = (process.env.NINJA_BASE_URLS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(u => this.normalizeBaseUrl(u));
    return (fromEnv.length > 0 ? fromEnv : NinjaOneAPI.DEFAULT_CANDIDATES);
  }

  private async makeRequest(
    endpoint: string, 
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    const token = await this.getAccessToken();
    const base = this.baseUrl || NinjaOneAPI.DEFAULT_CANDIDATES[0];
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*'
      }
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json'
      };
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${base}${endpoint}`, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    if (method === 'DELETE' && response.status === 204) {
      return { success: true };
    }

    const text = await response.text();
    if (!text || text.trim().length === 0) {
      return { success: true };
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      return { success: true };
    }
  }

  // Region utilities
  public listRegions(): { region: string; baseUrl: string }[] {
    return Object.entries(NinjaOneAPI.REGION_MAP).map(([region, baseUrl]) => ({ region, baseUrl }));
  }

  public setRegion(region: string): void {
    const key = (region || '').toLowerCase();
    const mapped = NinjaOneAPI.REGION_MAP[key];
    if (!mapped) throw new Error(`Unknown region: ${region}`);
    this.setBaseUrl(mapped);
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = this.normalizeBaseUrl(url);
    this.baseUrlExplicit = true;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  private buildQuery(params: Record<string, any>): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && query.append(k, v.toString()));
    return query.toString() ? `?${query}` : '';
  }

  private pruneUndefined<T extends Record<string, unknown>>(payload: T): Partial<T> {
    const result: Partial<T> = {};
    (Object.keys(payload) as (keyof T)[]).forEach((key) => {
      const value = payload[key];
      if (value !== undefined) {
        result[key] = value;
      }
    });
    return result;
  }

  private buildUserCollectionPath(type: 'end-users' | 'technicians'): string {
    return `/v2/user/${type}`;
  }

  private buildUserEntityPath(type: 'end-user' | 'technician', id: number): string {
    return `/v2/user/${type}/${id}`;
  }

  // Device Management
  
  async getDevices(df?: string, pageSize?: number, after?: number): Promise<any> {
    return this.makeRequest(`/v2/devices${this.buildQuery({ df, pageSize, after })}`);
  }

  async getDevice(id: number): Promise<any> {
    // Owner information is available via the assignedOwnerUid field in this response.
    return this.makeRequest(`/v2/device/${id}`);
  }

  async getDeviceDashboardUrl(id: number): Promise<any> { 
    return this.makeRequest(`/v2/device/${id}/dashboard-url`); 
  }

  async setDeviceMaintenance(id: number, mode: string): Promise<any> {
    if (mode === 'OFF') {
    return this.makeRequest(`/v2/device/${id}/maintenance`, 'DELETE');
    }
  
    const now = Math.floor(Date.now() / 1000);  // Current Unix timestamp in seconds

    const body = {
    disabledFeatures: ['ALERTS', 'PATCHING', 'AVSCANS', 'TASKS'],
    start: now + 5,  // Start in 5 seconds (buffer for API processing)
    end: now + (24 * 60 * 60),  // End in 24 hours
    reasonMessage: 'Maintenance mode enabled via API'
    };
  
    return this.makeRequest(`/v2/device/${id}/maintenance`, 'PUT', body);
  }

  async rebootDevice(id: number, mode: string, reason?: string): Promise<any> {
    const body = {
      reason: reason || 'Reboot requested via API'
    };
    return this.makeRequest(`/v2/device/${id}/reboot/${mode}`, 'POST', body);
  }

  async approveDevices(mode: string, deviceIds: number[]): Promise<any> {
    const body = { devices: deviceIds };
    return this.makeRequest(`/v2/devices/approval/${mode}`, 'POST', body);
  }

  // Device Patches

  // Patch approval or rejection is only available via the NinjaOne dashboard or policies;
  // the public API does not provide endpoints for that workflow.
  async scanDeviceOSPatches(id: number): Promise<any> {
    return this.makeRequest(`/v2/device/${id}/patch/os/scan`, 'POST');
  }

  async applyDeviceOSPatches(id: number, patches: any[]): Promise<any> {
    return this.makeRequest(`/v2/device/${id}/patch/os/apply`, 'POST', { patches });
  }

  async scanDeviceSoftwarePatches(id: number): Promise<any> { 
    return this.makeRequest(`/v2/device/${id}/patch/software/scan`, 'POST'); 
  }

  async applyDeviceSoftwarePatches(id: number, patches: any[]): Promise<any> {
    return this.makeRequest(`/v2/device/${id}/patch/software/apply`, 'POST', { patches });
  }

  // Device Services
  
  async controlWindowsService(id: number, serviceId: string, action: string): Promise<any> {
    return this.makeRequest(`/v2/device/${id}/windows-service/${serviceId}/control`, 'POST', { action });
  }

  async configureWindowsService(id: number, serviceId: string, startupType: string): Promise<any> {
    return this.makeRequest(`/v2/device/${id}/windows-service/${serviceId}/configure`, 'POST', { startupType });
  }

  // Policy Management
  
  async getPolicies(templateOnly?: boolean): Promise<any> {
    return this.makeRequest(`/v2/policies${this.buildQuery({ templateOnly })}`);
  }

  async getDevicePolicyOverrides(id: number): Promise<any> {
    return this.makeRequest(`/v2/device/${id}/policy/overrides`);
  }

  async resetDevicePolicyOverrides(id: number): Promise<any> {
    return this.makeRequest(`/v2/device/${id}/policy/overrides`, 'DELETE');
  }

  // Organization Management
  
  async getOrganizations(pageSize?: number, after?: number): Promise<any> {
    return this.makeRequest(`/v2/organizations${this.buildQuery({ pageSize, after })}`);
  }

  async getOrganization(id: number): Promise<any> { 
    return this.makeRequest(`/v2/organization/${id}`); 
  }

  async getOrganizationLocations(id: number): Promise<any> { 
    return this.makeRequest(`/v2/organization/${id}/locations`); 
  }

  async getOrganizationPolicies(id: number): Promise<any> { 
    return this.makeRequest(`/v2/organization/${id}/policies`); 
  }

  async generateOrganizationInstaller(installerType: string, locationId?: number, organizationId?: number): Promise<any> {
    const body: any = { installerType };
    if (locationId) body.locationId = locationId;
    if (organizationId) body.organizationId = organizationId;
    return this.makeRequest('/v2/organization/generate-installer', 'POST', body);
  }

  // Organization CRUD
  // Note: DELETE operations for organizations and locations are NOT available
  // in the Public API and can only be performed via the NinjaOne dashboard.

  async createOrganization(
    name: string,
    description?: string,
    nodeApprovalMode?: string,
    tags?: string[]
  ): Promise<any> {
    const body: any = { name };
    if (description) body.description = description;
    if (nodeApprovalMode) body.nodeApprovalMode = nodeApprovalMode.toUpperCase();
    if (tags) body.tags = tags;
    return this.makeRequest('/v2/organizations', 'POST', body);
  }

  async updateOrganization(
    id: number,
    name?: string,
    description?: string,
    nodeApprovalMode?: string,  // Note: This field is read-only after creation and cannot be updated
    tags?: string[]
  ): Promise<any> {
    const body: any = {};
    if (name !== undefined) body.name = name;
    if (description !== undefined) body.description = description;
    // nodeApprovalMode is intentionally ignored because the public API treats it as read-only after creation.
    if (tags !== undefined) body.tags = tags;
    try {
      return await this.makeRequest(`/v2/organizations/${id}`, 'PATCH', body);
    } catch (error: any) {
      if (typeof error?.message === 'string' && error.message.includes('404')) {
        return this.makeRequest(`/v2/organization/${id}`, 'PATCH', body);
      }
      throw error;
    }
  }

  // Location CRUD

  async createLocation(
    organizationId: number,
    name: string,
    address?: string,
    description?: string
  ): Promise<any> {
    const body: any = { name };
    if (address) body.address = address;
    if (description) body.description = description;
    return this.makeRequest(`/v2/organization/${organizationId}/locations`, 'POST', body);
  }

  async updateLocation(
    organizationId: number,
    locationId: number,
    name?: string,
    address?: string,
    description?: string
  ): Promise<any> {
    const body: any = {};
    if (name !== undefined) body.name = name;
    if (address !== undefined) body.address = address;
    if (description !== undefined) body.description = description;
    return this.makeRequest(`/v2/organization/${organizationId}/locations/${locationId}`, 'PATCH', body);
  }

  // Contact Management

  async getContacts(): Promise<any> {
    return this.makeRequest('/v2/contacts');
  }

  async getContact(id: number): Promise<any> { 
    return this.makeRequest(`/v2/contact/${id}`); 
  }

  async createContact(
    organizationId: number, 
    firstName: string, 
    lastName: string, 
    email: string, 
    phone?: string, 
    jobTitle?: string
  ): Promise<any> {
    const body: any = { organizationId, firstName, lastName, email };
    if (phone) body.phone = phone;
    if (jobTitle) body.jobTitle = jobTitle;
    return this.makeRequest('/v2/contacts', 'POST', body);
  }

  async updateContact(
    id: number, 
    firstName?: string, 
    lastName?: string, 
    email?: string, 
    phone?: string, 
    jobTitle?: string
  ): Promise<any> {
    const body: any = {};
    if (firstName !== undefined) body.firstName = firstName;
    if (lastName !== undefined) body.lastName = lastName;
    if (email !== undefined) body.email = email;
    if (phone !== undefined) body.phone = phone;
    if (jobTitle !== undefined) body.jobTitle = jobTitle;
    return this.makeRequest(`/v2/contact/${id}`, 'PATCH', body);
  }

  async deleteContact(id: number): Promise<any> { 
    return this.makeRequest(`/v2/contact/${id}`, 'DELETE'); 
  }

  // Alert Management
  
  async getAlerts(deviceFilter?: string, since?: string): Promise<any> {
    return this.makeRequest(`/v2/alerts${this.buildQuery({ df: deviceFilter, since })}`);
  }

  async getAlert(uid: string): Promise<any> { 
    return this.makeRequest(`/v2/alert/${uid}`); 
  }

  async resetAlert(uid: string): Promise<any> { 
    return this.makeRequest(`/v2/alert/${uid}`, 'DELETE'); 
  }

  async getDeviceAlerts(id: number, lang?: string): Promise<any> {
    return this.makeRequest(`/v2/device/${id}/alerts${this.buildQuery({ lang })}`);
  }

  // User Management
  
  async getEndUsers(): Promise<any> {
    return this.makeRequest(this.buildUserCollectionPath('end-users'));
  }

  async getEndUser(id: number): Promise<any> {
    return this.makeRequest(this.buildUserEntityPath('end-user', id));
  }

  async createEndUser(payload: CreateEndUserPayload, sendInvitation?: boolean): Promise<any> {
    const body = this.pruneUndefined(payload);
    const query = this.buildQuery({ sendInvitation });
    const endpoint = this.buildUserCollectionPath('end-users');
    return this.makeRequest(`${endpoint}${query}`, 'POST', body);
  }

  async updateEndUser(
    id: number,
    firstName?: string,
    lastName?: string,
    email?: string,
    phone?: string  // Note: Phone field is read-only after creation and cannot be updated
  ): Promise<any> {
    const body: any = {};
    if (firstName !== undefined) body.firstName = firstName;
    if (lastName !== undefined) body.lastName = lastName;
    if (email !== undefined) body.email = email;
    if (phone !== undefined) body.phone = phone;  // This will be ignored by the API
    return this.makeRequest(this.buildUserEntityPath('end-user', id), 'PATCH', body);
  }

  async deleteEndUser(id: number): Promise<any> {
    return this.makeRequest(this.buildUserEntityPath('end-user', id), 'DELETE');
  }

  async getTechnicians(): Promise<any> {
    return this.makeRequest(this.buildUserCollectionPath('technicians'));
  }

  async getTechnician(id: number): Promise<any> {
    return this.makeRequest(this.buildUserEntityPath('technician', id));
  }

  async addRoleMembers(roleId: number, userIds: number[]): Promise<any> {
    return this.makeRequest(`/v2/user/role/${roleId}/add-members`, 'PATCH', userIds);
  }

  async removeRoleMembers(roleId: number, userIds: number[]): Promise<any> {
    return this.makeRequest(`/v2/user/role/${roleId}/remove-members`, 'PATCH', userIds);
  }

  // Queries - System Information
  
  async queryAntivirusStatus(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/antivirus-status${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async queryAntivirusThreats(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/antivirus-threats${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async queryComputerSystems(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/computer-systems${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async queryDeviceHealth(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/device-health${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async queryOperatingSystems(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/operating-systems${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async queryLoggedOnUsers(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/logged-on-users${this.buildQuery({ df, cursor, pageSize })}`);
  }

  // Queries - Hardware
  
  async queryProcessors(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/processors${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async queryDisks(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/disks${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async queryVolumes(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/volumes${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async queryNetworkInterfaces(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/network-interfaces${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async queryRaidControllers(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/raid-controllers${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async queryRaidDrives(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/raid-drives${this.buildQuery({ df, cursor, pageSize })}`);
  }

  // Queries - Software and Patches
  
  async querySoftware(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/software${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async queryOSPatches(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/os-patches${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async querySoftwarePatches(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/software-patches${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async queryOSPatchInstalls(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/os-patch-installs${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async querySoftwarePatchInstalls(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/software-patch-installs${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async queryWindowsServices(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/windows-services${this.buildQuery({ df, cursor, pageSize })}`);
  }

  // Queries - Custom Fields and Policies
  
  async queryCustomFields(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/custom-fields${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async queryCustomFieldsDetailed(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/custom-fields-detailed${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async queryScopedCustomFields(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/scoped-custom-fields${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async queryScopedCustomFieldsDetailed(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/scoped-custom-fields-detailed${this.buildQuery({ df, cursor, pageSize })}`);
  }

  async queryPolicyOverrides(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/policy-overrides${this.buildQuery({ df, cursor, pageSize })}`);
  }

  // Queries - Backup
  
  async queryBackupUsage(df?: string, cursor?: string, pageSize?: number): Promise<any> {
    return this.makeRequest(`/v2/queries/backup/usage${this.buildQuery({ df, cursor, pageSize })}`);
  }

  // Activities and Software
  
  async getDeviceActivities(id: number, pageSize?: number, olderThan?: string): Promise<any> {
    return this.makeRequest(`/v2/device/${id}/activities${this.buildQuery({ pageSize, olderThan })}`);
  }

  async getDeviceSoftware(id: number): Promise<any> { 
    return this.makeRequest(`/v2/device/${id}/software`); 
  }
}