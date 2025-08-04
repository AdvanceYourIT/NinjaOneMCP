#!/usr/bin/env node

import { NinjaOneAPI } from './src/ninja-api.js';
import { config } from 'dotenv';

config();

async function testAPI() {
  try {
    console.log('Testing NinjaONE API connection...');
    
    const api = new NinjaOneAPI();
    
    // Test basic connectivity with organizations
    console.log('Fetching organizations...');
    const orgs = await api.getOrganizations(5);
    console.log(`Found ${orgs.length || 0} organizations`);
    
    // Test devices
    console.log('Fetching devices...');
    const devices = await api.getDevices(undefined, 5);
    console.log(`Found ${devices.length || 0} devices`);
    
    console.log('✅ API connection successful!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    process.exit(1);
  }
}

testAPI();
