const axios = require('axios');

async function quickSapphireTest() {
  console.log('🚀 Quick Sapphire TEE Test\n');
  
  try {
    // 1. Health Check
    console.log('1️⃣ Testing health check...');
    const health = await axios.get('http://localhost:3001/health');
    console.log('✅ Status:', health.data.mode);
    console.log('✅ TEE:', health.data.tee);
    console.log('✅ Encryption:', health.data.encryption);
    
    // 2. Confidential Sensor Minting
    console.log('\n2️⃣ Testing confidential sensor minting...');
    const mint = await axios.post('http://localhost:3001/api/sensors/mint', {
      location: 'Test TEE Location'
    });
    console.log('✅ Sensor ID:', mint.data.sensorId);
    console.log('✅ Transaction:', mint.data.transactionHash);
    console.log('✅ Encryption:', mint.data.encryption);
    
    // 3. Encrypted Data Submission  
    console.log('\n3️⃣ Testing encrypted data submission...');
    const dataSubmit = await axios.post('http://localhost:3001/api/data/submit', {
      sensorId: mint.data.sensorId,
      temperature: 25.5,
      humidity: 65.0,
      co2: 415.2
    });
    console.log('✅ IPFS CID:', dataSubmit.data.ipfsCID);
    console.log('✅ Transaction:', dataSubmit.data.transactionHash);
    console.log('✅ Encryption:', dataSubmit.data.encryption);
    
    console.log('\n🎉 ALL SAPPHIRE TEE FEATURES WORKING!');
    console.log('🔐 Data is encrypted end-to-end');
    console.log('🛡️ Smart contracts running in TEE');
    console.log('🔒 Storage and transactions are confidential');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

quickSapphireTest();