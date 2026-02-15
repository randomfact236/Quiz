#!/usr/bin/env node
/**
 * Backend Port Validation Script
 * Ensures the backend only uses allowed ports
 */

const fs = require('fs');
const path = require('path');

const ALLOWED_PORTS = [3010, 4000, 5432, 6379];
const PROJECT_NAME = 'AI Quiz Platform';
const ENV_FILE = path.join(__dirname, '..', '.env');

function validatePort() {
  // Read .env file
  let envContent = '';
  try {
    envContent = fs.readFileSync(ENV_FILE, 'utf8');
  } catch (err) {
    console.error(`\n❌ ERROR: Cannot read .env file at ${ENV_FILE}`);
    process.exit(1);
  }
  
  // Parse PORT from .env
  const portMatch = envContent.match(/PORT\s*=\s*(\d+)/);
  const configuredPort = portMatch ? parseInt(portMatch[1], 10) : 4000;
  
  // Validate port
  if (!ALLOWED_PORTS.includes(configuredPort)) {
    console.error(`\n❌ ERROR: Invalid port ${configuredPort} in .env file`);
    console.error(`Project ${PROJECT_NAME} can only use these ports: ${ALLOWED_PORTS.join(', ')}`);
    console.error('\nTo fix: Update PORT in .env file to one of the allowed ports\n');
    process.exit(1);
  }
  
  // Validate database port
  const dbPortMatch = envContent.match(/DB_PORT\s*=\s*(\d+)/);
  const dbPort = dbPortMatch ? parseInt(dbPortMatch[1], 10) : 5432;
  
  if (!ALLOWED_PORTS.includes(dbPort)) {
    console.error(`\n❌ ERROR: Invalid database port ${dbPort} in .env file`);
    console.error(`Database must use one of these ports: ${ALLOWED_PORTS.join(', ')}`);
    process.exit(1);
  }
  
  // Validate redis port
  const redisPortMatch = envContent.match(/REDIS_PORT\s*=\s*(\d+)/);
  const redisPort = redisPortMatch ? parseInt(redisPortMatch[1], 10) : 6379;
  
  if (!ALLOWED_PORTS.includes(redisPort)) {
    console.error(`\n❌ ERROR: Invalid Redis port ${redisPort} in .env file`);
    console.error(`Redis must use one of these ports: ${ALLOWED_PORTS.join(', ')}`);
    process.exit(1);
  }
  
  // Check if port is available (non-blocking warning)
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
  
  // Continue after check
  setTimeout(() => {
    console.log(`✓ ${PROJECT_NAME} Backend validated`);
    console.log(`✓ API Port: ${configuredPort}`);
    console.log(`✓ Database Port: ${dbPort}`);
    console.log(`✓ Redis Port: ${redisPort}`);
    console.log(`✓ Allowed Ports: ${ALLOWED_PORTS.join(', ')}\n`);
    process.exit(0);
  }, 500);
}

validatePort();
