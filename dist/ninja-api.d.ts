type CreateEndUserPayload = {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    organizationId?: number;
    fullPortalAccess?: boolean;
};
export declare class NinjaOneAPI {
    private baseUrl;
    private clientId;
    private clientSecret;
    private accessToken;
    private tokenExpiry;
    private isConfigured;
    private baseUrlExplicit;
    private static readonly REGION_MAP;
    private static readonly DEFAULT_CANDIDATES;
    constructor();
    private getAccessToken;
    private requestToken;
    private normalizeBaseUrl;
    private getCandidateBaseUrls;
    private makeRequest;
    listRegions(): {
        region: string;
        baseUrl: string;
    }[];
    setRegion(region: string): void;
    setBaseUrl(url: string): void;
    private buildQuery;
    private pruneUndefined;
    private buildUserCollectionPath;
    private buildUserEntityPath;
    getDevices(df?: string, pageSize?: number, after?: number): Promise<any>;
    getDevice(id: number): Promise<any>;
    getDeviceDashboardUrl(id: number): Promise<any>;
    setDeviceMaintenance(id: number, mode: string): Promise<any>;
    rebootDevice(id: number, mode: string, reason?: string): Promise<any>;
    approveDevices(mode: string, deviceIds: number[]): Promise<any>;
    scanDeviceOSPatches(id: number): Promise<any>;
    applyDeviceOSPatches(id: number, patches: any[]): Promise<any>;
    scanDeviceSoftwarePatches(id: number): Promise<any>;
    applyDeviceSoftwarePatches(id: number, patches: any[]): Promise<any>;
    controlWindowsService(id: number, serviceId: string, action: string): Promise<any>;
    configureWindowsService(id: number, serviceId: string, startupType: string): Promise<any>;
    getPolicies(templateOnly?: boolean): Promise<any>;
    getDevicePolicyOverrides(id: number): Promise<any>;
    resetDevicePolicyOverrides(id: number): Promise<any>;
    getOrganizations(pageSize?: number, after?: number): Promise<any>;
    getOrganization(id: number): Promise<any>;
    getOrganizationLocations(id: number): Promise<any>;
    getOrganizationPolicies(id: number): Promise<any>;
    generateOrganizationInstaller(installerType: string, locationId?: number, organizationId?: number): Promise<any>;
    createOrganization(name: string, description?: string, nodeApprovalMode?: string, tags?: string[]): Promise<any>;
    updateOrganization(id: number, name?: string, description?: string, nodeApprovalMode?: string, // Note: This field is read-only after creation and cannot be updated
    tags?: string[]): Promise<any>;
    createLocation(organizationId: number, name: string, address?: string, description?: string): Promise<any>;
    updateLocation(organizationId: number, locationId: number, name?: string, address?: string, description?: string): Promise<any>;
    getContacts(): Promise<any>;
    getContact(id: number): Promise<any>;
    createContact(organizationId: number, firstName: string, lastName: string, email: string, phone?: string, jobTitle?: string): Promise<any>;
    updateContact(id: number, firstName?: string, lastName?: string, email?: string, phone?: string, jobTitle?: string): Promise<any>;
    deleteContact(id: number): Promise<any>;
    getAlerts(deviceFilter?: string, since?: string): Promise<any>;
    getAlert(uid: string): Promise<any>;
    resetAlert(uid: string): Promise<any>;
    getDeviceAlerts(id: number, lang?: string): Promise<any>;
    getEndUsers(): Promise<any>;
    getEndUser(id: number): Promise<any>;
    createEndUser(payload: CreateEndUserPayload, sendInvitation?: boolean): Promise<any>;
    updateEndUser(id: number, firstName?: string, lastName?: string, email?: string, phone?: string): Promise<any>;
    deleteEndUser(id: number): Promise<any>;
    getTechnicians(): Promise<any>;
    getTechnician(id: number): Promise<any>;
    addRoleMembers(roleId: number, userIds: number[]): Promise<any>;
    removeRoleMembers(roleId: number, userIds: number[]): Promise<any>;
    queryAntivirusStatus(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryAntivirusThreats(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryComputerSystems(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryDeviceHealth(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryOperatingSystems(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryLoggedOnUsers(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryProcessors(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryDisks(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryVolumes(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryNetworkInterfaces(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryRaidControllers(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryRaidDrives(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    querySoftware(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryOSPatches(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    querySoftwarePatches(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryOSPatchInstalls(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    querySoftwarePatchInstalls(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryWindowsServices(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryCustomFields(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryCustomFieldsDetailed(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryScopedCustomFields(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryScopedCustomFieldsDetailed(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryPolicyOverrides(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    queryBackupUsage(df?: string, cursor?: string, pageSize?: number): Promise<any>;
    getDeviceActivities(id: number, pageSize?: number, olderThan?: string): Promise<any>;
    /**
     * Get installed software for a device.
     * @param id - Unique device identifier whose software inventory should be returned.
     * @returns Promise resolving to an array of software objects including name, version, publisher, installDate, and location.
     * @throws Error if the device cannot be found or if the caller is unauthorized to view the inventory.
     */
    getDeviceSoftware(id: number): Promise<any>;
}
export {};
//# sourceMappingURL=ninja-api.d.ts.map