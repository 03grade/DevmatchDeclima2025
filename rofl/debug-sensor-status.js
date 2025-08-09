const axios = require('axios');

async function debugSensorStatus() {
  console.log('🔍 DEBUGGING SENSOR STATUS\n');
  
  const sensorId = 'SAPPHIRE-1754674947697-91329667'; // From previous test
  
  try {
    // Check sensor status
    console.log('1️⃣ Checking sensor status...');
    const status = await axios.get(`http://localhost:3001/api/sensors/${sensorId}/status`);
    
    console.log('Sensor Status:', JSON.stringify(status.data, null, 2));
    
    // Try a simple data submission to see the exact error
    console.log('\n2️⃣ Testing data submission with minimal data...');
    
    const simpleData = {
      sensorId: sensorId,
      temperature: 25.0,
      humidity: 60.0,
      co2: 400.0
    };
    
    try {
      const result = await axios.post('http://localhost:3001/api/data/submit', simpleData);
      console.log('✅ Data submission worked!', result.data);
    } catch (error) {
      console.log('❌ Data submission failed:');
      console.log('Error message:', error.response?.data?.details || error.message);
      
      // If it's a contract error, let's see the exact revert reason
      if (error.response?.data?.details && error.response.data.details.includes('transaction execution reverted')) {
        console.log('\n🔍 This is a smart contract revert.');
        console.log('Possible issues:');
        console.log('1. Sensor ownership not recognized by DataRegistry');
        console.log('2. Sensor not marked as active');
        console.log('3. DataRegistry contract not properly configured');
        console.log('4. Function signature mismatch');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugSensorStatus();