const axios = require('axios');

async function testAPIs() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🧪 Testing D-Climate APIs...\n');
  
  try {
    // Test 1: Health check
    console.log('📋 1. Testing Health Check...');
    const healthResponse = await axios.get(`${baseUrl}/health`);
    console.log('✅ Health check successful!');
    console.log('Response:', JSON.stringify(healthResponse.data, null, 2));
    console.log('');
    
    // Test 2: Sensor minting
    console.log('🔧 2. Testing Sensor Minting...');
    const mintResponse = await axios.post(`${baseUrl}/api/sensors/mint`, {
      walletAddress: '0x8Ea29D642B348984F7bAF3bFf889D1d997E9d243',
      sensorType: 'climate',
      location: 'Malaysia'
    });
    console.log('✅ Sensor minting successful!');
    console.log('Response:', JSON.stringify(mintResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server is not running! Please start the server first:');
      console.error('   node simple-server.js');
    } else {
      console.error('Full error:', error);
    }
  }
}

testAPIs();