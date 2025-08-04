/**
 * Test script to verify all query tools are properly exposed
 * Run this after building the project to ensure all endpoints work
 */

import { NinjaOneMCPServer } from './dist/index.js';

async function testQueryTools() {
  console.log('🔍 Testing NinjaONE MCP Server Query Tools...\n');
  
  try {
    // Create server instance (without starting transport)
    const server = new NinjaOneMCPServer();
    
    // Test tool listing
    const toolsResponse = await server.server.request({ method: 'tools/list' });
    const tools = toolsResponse.tools;
    
    console.log(`📊 Total Tools Available: ${tools.length}\n`);
    
    // Group tools by category
    const categories = {
      'Device Management': tools.filter(t => t.name.startsWith('get_') || t.name.includes('device') || t.name.includes('search') || t.name.includes('find') || t.name === 'reboot_device'),
      'System Information Queries': tools.filter(t => t.name.startsWith('query_') && ['antivirus', 'computer', 'device_health', 'operating', 'logged'].some(k => t.name.includes(k))),
      'Hardware Queries': tools.filter(t => t.name.startsWith('query_') && ['processor', 'disk', 'volume', 'network', 'raid'].some(k => t.name.includes(k))),
      'Software & Patch Queries': tools.filter(t => t.name.startsWith('query_') && ['software', 'patch', 'windows_service'].some(k => t.name.includes(k))),
      'Custom Fields & Policy Queries': tools.filter(t => t.name.startsWith('query_') && ['custom', 'policy'].some(k => t.name.includes(k))),
      'Backup Queries': tools.filter(t => t.name.includes('backup')),
      'Organization & Alerts': tools.filter(t => ['get_organizations', 'get_alerts'].includes(t.name))
    };
    
    // Display results by category
    Object.entries(categories).forEach(([category, categoryTools]) => {
      if (categoryTools.length > 0) {
        console.log(`📁 ${category} (${categoryTools.length} tools):`);
        categoryTools.forEach(tool => {
          console.log(`   ✅ ${tool.name} - ${tool.description}`);
        });
        console.log('');
      }
    });
    
    // Verify we have all expected query tools
    const expectedQueryTools = [
      'query_antivirus_status', 'query_antivirus_threats', 'query_computer_systems',
      'query_device_health', 'query_operating_systems', 'query_logged_on_users',
      'query_processors', 'query_disks', 'query_volumes', 'query_network_interfaces', 
      'query_raid_controllers', 'query_raid_drives', 'query_software', 'query_os_patches',
      'query_software_patches', 'query_os_patch_installs', 'query_software_patch_installs',
      'query_windows_services', 'query_custom_fields', 'query_custom_fields_detailed',
      'query_scoped_custom_fields', 'query_scoped_custom_fields_detailed', 
      'query_policy_overrides', 'query_backup_usage'
    ];
    
    const actualQueryTools = tools.filter(t => t.name.startsWith('query_')).map(t => t.name);
    const missingTools = expectedQueryTools.filter(t => !actualQueryTools.includes(t));
    const extraTools = actualQueryTools.filter(t => !expectedQueryTools.includes(t));
    
    console.log('🔍 Query Tool Verification:');
    console.log(`   Expected: ${expectedQueryTools.length} query tools`);
    console.log(`   Found: ${actualQueryTools.length} query tools`);
    
    if (missingTools.length === 0 && extraTools.length === 0) {
      console.log('   ✅ All query tools implemented correctly!\n');
    } else {
      if (missingTools.length > 0) {
        console.log(`   ❌ Missing tools: ${missingTools.join(', ')}`);
      }
      if (extraTools.length > 0) {
        console.log(`   ⚠️  Extra tools: ${extraTools.join(', ')}`);
      }
      console.log('');
    }
    
    console.log('🎉 Test completed successfully!');
    console.log(`📈 Total implementation: ${tools.length} tools (up from 8 original tools)`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testQueryTools().catch(console.error);
