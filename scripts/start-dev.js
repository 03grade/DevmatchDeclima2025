#!/usr/bin/env node

/**
 * Development startup script for D-Climate backend
 * Starts ROFL runtime and API services
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting D-Climate Backend Development Environment...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found. Please copy config.env.example to .env and configure it.\n');
  console.log('cp config.env.example .env\n');
  process.exit(1);
}

// Check if node_modules exist
const nodeModulesPath = path.join(__dirname, '..', 'rofl', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing ROFL dependencies...\n');
  const installProcess = spawn('npm', ['install'], {
    cwd: path.join(__dirname, '..', 'rofl'),
    stdio: 'inherit',
    shell: true
  });
  
  installProcess.on('close', (code) => {
    if (code === 0) {
      startServices();
    } else {
      console.error('❌ Failed to install dependencies');
      process.exit(1);
    }
  });
} else {
  startServices();
}

function startServices() {
  console.log('🔧 Building TypeScript...\n');
  
  // Build ROFL TypeScript
  const buildProcess = spawn('npm', ['run', 'build'], {
    cwd: path.join(__dirname, '..', 'rofl'),
    stdio: 'inherit',
    shell: true
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Build successful! Starting ROFL runtime...\n');
      
      // Start ROFL runtime
      const roflProcess = spawn('npm', ['start'], {
        cwd: path.join(__dirname, '..', 'rofl'),
        stdio: 'inherit',
        shell: true
      });
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down D-Climate backend...');
        roflProcess.kill('SIGINT');
        process.exit(0);
      });
      
      roflProcess.on('close', (code) => {
        console.log(`\n🔌 ROFL runtime exited with code ${code}`);
        process.exit(code);
      });
      
    } else {
      console.error('❌ Build failed');
      process.exit(1);
    }
  });
}

// Display help information
console.log('📋 D-Climate Backend Services:');
console.log('   • ROFL Runtime: http://localhost:3001');
console.log('   • Health Check: http://localhost:3001/health');
console.log('   • API Base URL: http://localhost:3001/api');
console.log('');
console.log('🔑 Available API Endpoints:');
console.log('   • POST /api/sensors/generate-id - Generate sensor ID');
console.log('   • POST /api/sensors/mint - Mint sensor NFA');
console.log('   • POST /api/data/submit - Submit climate data');
console.log('   • POST /api/ai/summary/daily-overview - Generate AI insights');
console.log('   • GET /api/rewards/stats/global - Get reward statistics');
console.log('');
console.log('📖 Documentation: See README.md for full API documentation');
console.log('🛠️  Need help? Check the logs for detailed information');
console.log('');