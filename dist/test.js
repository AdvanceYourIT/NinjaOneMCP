/**
 * NinjaONE MCP Server Test Suite
 * Basic connectivity and functionality tests
 */
import { NinjaOneAPI } from './ninja-api.js';
import { config } from 'dotenv';
config();
class NinjaOneTestSuite {
    api;
    results = [];
    constructor() {
        try {
            this.api = new NinjaOneAPI();
        }
        catch (error) {
            console.error('Failed to initialize NinjaONE API:', error);
            process.exit(1);
        }
    }
    async runTests() {
        console.log('🚀 Starting NinjaONE MCP Server Test Suite\n');
        // Basic connectivity tests
        await this.testApiConnectivity();
        await this.testGetDevices();
        await this.testGetOrganizations();
        await this.testGetAlerts();
        // Query tests
        await this.testQueryOperatingSystems();
        await this.testQueryAntivirusStatus();
        // Report results
        this.reportResults();
    }
    async runTest(name, testFn) {
        const startTime = Date.now();
        console.log(`🔍 Testing: ${name}`);
        try {
            await testFn();
            const duration = Date.now() - startTime;
            this.results.push({ name, success: true, duration });
            console.log(`✅ ${name} - Passed (${duration}ms)\n`);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.results.push({ name, success: false, error: errorMessage, duration });
            console.log(`❌ ${name} - Failed (${duration}ms): ${errorMessage}\n`);
        }
    }
    async testApiConnectivity() {
        await this.runTest('API Connectivity', async () => {
            // Try to get basic endpoint that should always work
            const devices = await this.api.getDevices(undefined, 1, 0);
            if (!devices || typeof devices !== 'object') {
                throw new Error('Invalid response format from API');
            }
        });
    }
    async testGetDevices() {
        await this.runTest('Get Devices', async () => {
            const devices = await this.api.getDevices(undefined, 5, 0);
            console.log(`   📊 Retrieved ${devices?.length || 0} devices`);
        });
    }
    async testGetOrganizations() {
        await this.runTest('Get Organizations', async () => {
            const orgs = await this.api.getOrganizations(5, 0);
            console.log(`   🏢 Retrieved ${orgs?.length || 0} organizations`);
        });
    }
    async testGetAlerts() {
        await this.runTest('Get Alerts', async () => {
            const alerts = await this.api.getAlerts();
            console.log(`   ⚠️  Retrieved ${alerts?.length || 0} alerts`);
        });
    }
    async testQueryOperatingSystems() {
        await this.runTest('Query Operating Systems', async () => {
            const systems = await this.api.queryOperatingSystems(undefined, undefined, 5);
            console.log(`   💻 Retrieved ${systems?.results?.length || 0} OS records`);
        });
    }
    async testQueryAntivirusStatus() {
        await this.runTest('Query Antivirus Status', async () => {
            const antivirus = await this.api.queryAntivirusStatus(undefined, undefined, 5);
            console.log(`   🛡️  Retrieved ${antivirus?.results?.length || 0} antivirus records`);
        });
    }
    reportResults() {
        const passed = this.results.filter(r => r.success).length;
        const failed = this.results.filter(r => !r.success).length;
        const totalTime = this.results.reduce((sum, r) => sum + (r.duration || 0), 0);
        console.log('\n📋 Test Results Summary');
        console.log('========================');
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⏱️  Total Time: ${totalTime}ms`);
        console.log(`📊 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.filter(r => !r.success).forEach(result => {
                console.log(`   • ${result.name}: ${result.error}`);
            });
        }
        console.log('\n🎯 Test Suite Complete');
        // Exit with error code if any tests failed
        if (failed > 0) {
            process.exit(1);
        }
    }
}
// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const testSuite = new NinjaOneTestSuite();
    testSuite.runTests().catch((error) => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=test.js.map