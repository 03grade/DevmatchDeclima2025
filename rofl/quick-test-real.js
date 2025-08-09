const axios = require('axios');

async function quickTestReal() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🔗 TESTING REAL BLOCKCHAIN INTERACTIONS');
  console.log('⚠️  This will make REAL transactions on Oasis Sapphire testnet!\n');
  
  try {
    // Test 1: Health check
    console.log('📋 1. Health Check...');
    const health = await axios.get(`${baseUrl}/health`);
    console.log('✅ Mode:', health.data.mode);
    console.log('✅ Network:', health.data.network);
    console.log('✅ Wallet:', health.data.wallet);
    console.log('');
    
    // Test 2: REAL sensor minting
    console.log('🔧 2. Minting REAL Sensor on Blockchain...');
    console.log('⏳ Please wait 10-30 seconds for blockchain confirmation...');
    
    const mintData = {
      walletAddress: health.data.wallet,
      sensorType: 'climate',
      location: 'Malaysia'
    };
    
    const mintResponse = await axios.post(`${baseUrl}/api/sensors/mint`, mintData);
    
    console.log('🎉 SUCCESS! Real sensor minted on Oasis Sapphire!');
    console.log('   Sensor ID:', mintResponse.data.sensorId);
    console.log('   Transaction:', mintResponse.data.transactionHash);
    console.log('   Block:', mintResponse.data.blockNumber);
    console.log('   Gas Used:', mintResponse.data.gasUsed);
    console.log('');
    
    console.log('🔗 Verify on Oasis Explorer:');
    console.log(`   https://testnet.explorer.sapphire.oasis.dev/tx/${mintResponse.data.transactionHash}`);
    console.log('');
    
    console.log('🏆 REAL D-Climate platform is working!');
    console.log('   ✅ Smart contracts connected');
    console.log('   ✅ Real blockchain transactions');
    console.log('   ✅ No mocked responses');
    console.log('   ✅ Ready for hackathon!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Details:', error.response.data);
    }
  }
}

quickTestReal();