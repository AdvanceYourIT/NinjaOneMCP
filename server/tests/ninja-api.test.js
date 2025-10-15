import assert from 'node:assert/strict';
import { NinjaOneAPI } from '../ninja-api.js';

const calls = [];

global.fetch = async (url, options = {}) => {
  calls.push({ url, options });
  return {
    ok: true,
    json: async () => ({ success: true }),
    status: 200,
    statusText: 'OK',
  };
};

const client = new NinjaOneAPI();
client.getAccessToken = async () => 'test-token';
client.baseUrl = 'https://api.example.com';
client.baseUrlExplicit = true;

await client.scanDeviceOSPatches(42);
await client.applyDeviceOSPatches(42, ['KB12345']);

assert.equal(calls[0].url, 'https://api.example.com/v2/device/42/patch/os/scan');
assert.equal(calls[1].url, 'https://api.example.com/v2/device/42/patch/os/apply');
assert.equal(calls[1].options.method, 'POST');
assert.equal(calls[1].options.headers['Content-Type'], 'application/json');
assert.equal(calls[1].options.body, JSON.stringify({ patches: ['KB12345'] }));

console.log('ninja-api tests passed');
