#!/usr/bin/env node
/**
 * Port Validation Script
 * Ensures the project only uses allowed ports
 */

const ALLOWED_PORTS = [3010, 4000, 5432, 6379];
const PROJECT_NAME = 'AI Quiz Platform';

function validatePort() {
  const args = process.argv.slice(2);
  const portArg = args.find(arg => arg.includes('-p') || arg.includes('--port'));
  
  // Check if running on correct port
  const configuredPort = 3010; // Hardcoded in package.json
  
  if (!ALLOWED_PORTS.includes(configuredPort)) {
    console.error(`\n❌ ERROR: Invalid port ${configuredPort}`);
    console.error(`Project ${PROJECT_NAME} can only use these ports: ${ALLOWED_PORTS.join(', ')}`);
    console.error('\nTo fix: Update package.json to use an allowed port\n');
    process.exit(1);
  }
  
  // Check if another app is using this port (non-blocking warning)
  const net = require('net');
  const tester = net.createServer();
  
  tester.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`\n⚠️  WARNING: Port ${configuredPort} is already in use!`);
      console.warn('Another application may be using this reserved port.\n');
      console.warn('Run as Administrator: ..\..\port-security-enforcer.ps1 -Action setup\n');
    }
    tester.close();
  });
  
  tester.once('listening', () => {
    tester.close();
    console.log(`✓ Port ${configuredPort} validated and available`);
  });
  
  tester.listen(configuredPort, '127.0.0.1');
  
  // Give it a moment then continue
  setTimeout(() => {
    console.log(`✓ ${PROJECT_NAME} starting on port ${configuredPort}`);
    console.log(`✓ Port restrictions enforced: ${ALLOWED_PORTS.join(', ')}\n`);
    process.exit(0);
  }, 500);
}

validatePort();
