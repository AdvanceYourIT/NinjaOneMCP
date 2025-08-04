// Test script to debug server startup
console.log('Starting test...');

try {
  console.log('Setting environment...');
  process.env.NINJA_ACCESS_TOKEN = 'test-token';
  
  console.log('Importing modules...');
  const { NinjaOneMCPServer } = await import('./dist/index.js');
  
  console.log('Creating server...');
  const server = new NinjaOneMCPServer();
  
  console.log('Server created successfully!');
  
} catch (error) {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
}
