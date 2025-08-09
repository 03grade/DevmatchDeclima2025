const axios = require('axios');

async function testDataSubmission() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🌡️ Testing D-Climate Data Submission Pipeline...\n');
  
  try {
    // Step 1: Submit climate data
    console.log('📊 1. Testing Climate Data Submission...');
    const climateData = {
      sensorId: 'TEST-12345-abc',
      timestamp: Math.floor(Date.now() / 1000),
      temperature: 28.5,
      humidity: 75.2,
      co2: 420.8,
      location: {
        country: 'Malaysia',
        state: 'Selangor', 
        city: 'Petaling Jaya'
      }
    };
    
    const submitResponse = await axios.post(`${baseUrl}/api/data/submit`, climateData);
    console.log('✅ Climate data submitted successfully!');
    console.log('Response:', JSON.stringify(submitResponse.data, null, 2));
    console.log('');
    
    // Step 2: Test data validation
    console.log('🔍 2. Testing Data Validation...');
    const invalidData = {
      sensorId: 'INVALID',
      timestamp: Math.floor(Date.now() / 1000),
      temperature: 999, // Invalid temperature
      humidity: 150,    // Invalid humidity 
      co2: -50         // Invalid CO2
    };
    
    try {
      await axios.post(`${baseUrl}/api/data/submit`, invalidData);
    } catch (error) {
      console.log('✅ Data validation working correctly!');
      console.log('Validation errors:', error.response?.data || error.message);
    }
    console.log('');
    
    // Step 3: Test encrypted data retrieval
    console.log('🔐 3. Testing Encrypted Data Retrieval...');
    const retrieveResponse = await axios.get(`${baseUrl}/api/data/sensor/TEST-12345-abc`);
    console.log('✅ Data retrieval successful!');
    console.log('Encrypted data:', JSON.stringify(retrieveResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testDataSubmission();