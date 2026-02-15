#!/usr/bin/env node
/**
 * Root Port Validation Script
 * Validates all project ports are within allowed range
 */

const fs = require('fs');
const path = require('path');

// Core project ports - STRICTLY ENFORCED
const CORE_PORTS = [3010, 4000, 5432, 6379];
const PROJECT_NAME = 'AI Quiz Platform';

const color = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(msg, c = 'reset') {
  console.log(`${color[c]}${msg}${color.reset}`);
}

function extractEnvPorts(content) {
  const ports = [];
  const matches = content.matchAll(/^(PORT|DB_PORT|REDIS_PORT)\s*=\s*(\d+)$/gm);
  for (const match of matches) {
    ports.push(parseInt(match[2], 10));
  }
  return ports;
}

function extractJsonPorts(content) {
  const ports = [];
  const matches = content.matchAll(/-p\s*(\d+)/g);
  for (const match of matches) {
    ports.push(parseInt(match[1], 10));
  }
  return ports;
}

function extractDockerPorts(content) {
  const ports = [];
  // Match only lines with specific service port mappings (not comments)
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.includes('#')) continue; // Skip comments
    const matches = line.matchAll(/-\s*"?(\d+)"?\s*:\s*"?\d+"?/g);
    for (const match of matches) {
      ports.push(parseInt(match[1], 10));
    }
  }
  return ports;
}

function validateAllPorts() {
  log('\n========================================', 'cyan');
  log('  PORT VALIDATION', 'cyan');
  log('========================================\n', 'cyan');
  
  const checks = [
    { 
      name: 'Frontend', 
      file: 'apps/frontend/package.json', 
      extractor: extractJsonPorts,
      required: [3010]
    },
    { 
      name: 'Backend .env', 
      file: 'apps/backend/.env', 
      extractor: extractEnvPorts,
      required: [4000, 5432, 6379]
    },
    { 
      name: 'Frontend .env', 
      file: 'apps/frontend/.env.local', 
      extractor: (c) => { 
        const m = c.match(/:(\d+)/);
        return m ? [parseInt(m[1], 10)] : [];
      },
      required: [4000]
    },
    { 
      name: 'Docker Compose', 
      file: 'infrastructure/docker/docker-compose.yml', 
      extractor: extractDockerPorts,
      required: [5432, 6379]
    }
  ];
  
  let allValid = true;
  const foundPorts = new Set();
  
  for (const check of checks) {
    const filePath = path.join(process.cwd(), check.file);
    
    if (!fs.existsSync(filePath)) {
      log(`⚠  ${check.name}: Config file not found (${check.file})`, 'yellow');
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const ports = check.extractor(content);
    const projectPorts = ports.filter(p => CORE_PORTS.includes(p));
    const invalidPorts = ports.filter(p => !CORE_PORTS.includes(p));
    
    projectPorts.forEach(p => foundPorts.add(p));
    
    // Check if required ports are present
    const missingRequired = check.required.filter(r => !ports.includes(r));
    
    if (invalidPorts.length > 0) {
      log(`❌ ${check.name}: Invalid ports - ${invalidPorts.join(', ')}`, 'red');
      allValid = false;
    } else if (missingRequired.length > 0) {
      log(`❌ ${check.name}: Missing required ports - ${missingRequired.join(', ')}`, 'red');
      allValid = false;
    } else {
      const portStr = projectPorts.length > 0 ? projectPorts.join(', ') : 'none';
      log(`✓ ${check.name}: ${portStr}`, 'green');
    }
  }
  
  log('\n----------------------------------------', 'cyan');
  log('PORT ALLOCATION MAP', 'cyan');
  log('----------------------------------------', 'cyan');
  const portMap = {
    'Frontend (Next.js)': 3010,
    'Backend (NestJS)': 4000,
    'PostgreSQL': 5432,
    'Redis': 6379
  };
  
  for (const [service, port] of Object.entries(portMap)) {
    const isUsed = foundPorts.has(port);
    const status = isUsed ? 'CONFIGURED' : 'NOT FOUND';
    const colorCode = isUsed ? 'green' : 'yellow';
    log(`${port.toString().padEnd(6)} : ${service.padEnd(20)} [${status}]`, colorCode);
  }
  
  log('----------------------------------------\n', 'cyan');
  
  if (allValid) {
    log('✅ All port configurations are VALID', 'green');
    log(`✅ Project restricted to: ${CORE_PORTS.join(', ')}\n`, 'green');
    
    const lockFile = path.join(process.cwd(), '.port-lock');
    if (fs.existsSync(lockFile)) {
      log('🔒 Port lock file is active', 'cyan');
    } else {
      log('⚠️  Port lock file not created yet', 'yellow');
      log('   To reserve ports in Windows, run as Administrator:', 'yellow');
      log('   .\setup-port-security.bat\n', 'yellow');
    }
    
    return 0;
  } else {
    log('❌ Port validation FAILED', 'red');
    log(`\nAllowed ports: ${CORE_PORTS.join(', ')}`, 'yellow');
    log('Only these ports may be used by the project.\n', 'yellow');
    return 1;
  }
}

const exitCode = validateAllPorts();
process.exit(exitCode);
