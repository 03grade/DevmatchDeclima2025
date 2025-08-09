const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging .env file loading...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '../.env');
console.log('Looking for .env at:', envPath);
console.log('File exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  // Read raw file content
  const content = fs.readFileSync(envPath, 'utf8');
  console.log('\n📄 Raw file content (first 500 chars):');
  console.log(content.substring(0, 500));
  
  // Look for contract lines specifically
  console.log('\n🔍 Lines containing "CONTRACT":');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('CONTRACT')) {
      console.log(`Line ${index + 1}: "${line}"`);
      console.log(`  Length: ${line.length}`);
      console.log(`  Bytes: [${Buffer.from(line).join(', ')}]`);
    }
  });
}

// Try loading with dotenv
console.log('\n⚙️ Loading with dotenv...');
require('dotenv').config({ path: envPath });

console.log('\n📋 Environment variables:');
console.log('SENSOR_NFA_CONTRACT:', `"${process.env.SENSOR_NFA_CONTRACT}"`);
console.log('DATA_REGISTRY_CONTRACT:', `"${process.env.DATA_REGISTRY_CONTRACT}"`);
console.log('REWARD_DISTRIBUTOR_CONTRACT:', `"${process.env.REWARD_DISTRIBUTOR_CONTRACT}"`);
console.log('DAO_GOVERNANCE_CONTRACT:', `"${process.env.DAO_GOVERNANCE_CONTRACT}"`);

console.log('\n🔍 All env keys containing CONTRACT:');
Object.keys(process.env).filter(k => k.includes('CONTRACT')).forEach(key => {
  console.log(`${key}: "${process.env[key]}"`);
});