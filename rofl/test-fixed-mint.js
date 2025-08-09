const axios = require('axios');

async function testFixedMint() {
  console.log('🔧 Testing FIXED Sensor Minting on Real Blockchain\n');
  
  try {
    const response = await axios.post('http://localhost:3001/api/sensors/mint', {
      walletAddress: '0x8Ea29D642B348984F7bAF3bFf889D1d997E9d243',
      sensorType: 'climate',
      location: 'Malaysia'
    });
    
    console.log('🎉 SUCCESS! Sensor minted on Oasis Sapphire!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.transactionHash) {
      console.log('\n🔗 VERIFY TRANSACTION:');
      console.log(`https://testnet.explorer.sapphire.oasis.dev/tx/${response.data.transactionHash}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFixedMint();