const axios = require('axios');

async function testRealBlockchain() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🔗 TESTING REAL BLOCKCHAIN INTERACTIONS\n');
  console.log('⚠️  WARNING: This will make REAL transactions on Oasis Sapphire testnet!');
  console.log('💰 This will use REAL test ROSE tokens from your wallet.\n');
  
  try {
    // Test 1: Health check
    console.log('📋 1. Checking Real Blockchain Connection...');
    const healthResponse = await axios.get(`${baseUrl}/health`);
    console.log('✅ Connected to:', healthResponse.data.network);
    console.log('   Wallet:', healthResponse.data.wallet);
    console.log('   Mode:', healthResponse.data.mode);
    console.log('');
    
    // Test 2: REAL sensor minting
    console.log('🔧 2. Minting REAL Sensor on Blockchain...');
    console.log('⏳ This will take 10-30 seconds for blockchain confirmation...');
    
    const mintResponse = await axios.post(`${baseUrl}/api/sensors/mint`, {
      walletAddress: healthResponse.data.wallet,
      sensorType: 'climate',
      location: 'Malaysia'
    });
    
    console.log('✅ REAL sensor minted successfully!');
    console.log('   Sensor ID:', mintResponse.data.sensorId);
    console.log('   Transaction Hash:', mintResponse.data.transactionHash);
    console.log('   Block Number:', mintResponse.data.blockNumber);
    console.log('   Gas Used:', mintResponse.data.gasUsed);
    console.log('');
    
    const sensorId = mintResponse.data.sensorId;
    
    // Test 3: Check sensor ownership
    console.log('🔍 3. Verifying Sensor Ownership on Blockchain...');
    const ownerResponse = await axios.get(`${baseUrl}/api/sensors/${sensorId}/owner`);
    console.log('✅ Sensor verified on blockchain!');
    console.log('   Owner:', ownerResponse.data.owner);
    console.log('   Created At:', new Date(parseInt(ownerResponse.data.createdAt) * 1000).toISOString());
    console.log('   Reputation Score:', ownerResponse.data.reputationScore);
    console.log('');
    
    // Test 4: REAL data submission
    console.log('🌡️ 4. Submitting REAL Climate Data to Blockchain...');
    console.log('⏳ This will also take 10-30 seconds...');
    
    const climateData = {
      sensorId: sensorId,
      timestamp: Math.floor(Date.now() / 1000),
      temperature: 28.5,
      humidity: 75.2,
      co2: 420.8
    };
    
    const dataResponse = await axios.post(`${baseUrl}/api/data/submit`, climateData);
    console.log('✅ REAL climate data submitted to blockchain!');
    console.log('   Transaction Hash:', dataResponse.data.transactionHash);
    console.log('   Block Number:', dataResponse.data.blockNumber);
    console.log('   Record Hash:', dataResponse.data.recordHash);
    console.log('');
    
    // Test 5: Check data batch count
    console.log('📊 5. Checking Data Batch Count on Blockchain...');
    const countResponse = await axios.get(`${baseUrl}/api/data/${sensorId}/count`);
    console.log('✅ Data verified on blockchain!');
    console.log('   Batch Count:', countResponse.data.batchCount);
    console.log('');
    
    // Test 6: REAL reward calculation
    console.log('💰 6. Calculating REAL Rewards from Blockchain...');
    const rewardResponse = await axios.get(`${baseUrl}/api/rewards/calculate/${sensorId}`);
    console.log('✅ Reward calculated from blockchain!');
    console.log('   Reward Amount:', rewardResponse.data.rewardAmount, 'ROSE');
    console.log('');
    
    // Test 7: REAL reward distribution
    console.log('🎯 7. Distributing REAL ROSE Tokens...');
    console.log('⏳ Final blockchain transaction...');
    
    const distributeResponse = await axios.post(`${baseUrl}/api/rewards/distribute/${sensorId}`);
    console.log('✅ REAL ROSE tokens distributed!');
    console.log('   Transaction Hash:', distributeResponse.data.transactionHash);
    console.log('   Block Number:', distributeResponse.data.blockNumber);
    console.log('');
    
    console.log('🎉 ======= ALL REAL BLOCKCHAIN TESTS PASSED! =======');
    console.log('🏆 D-Climate Platform Status:');
    console.log('   ✅ REAL sensor minted on Oasis Sapphire');
    console.log('   ✅ REAL climate data stored on blockchain');
    console.log('   ✅ REAL ROSE tokens distributed');
    console.log('   ✅ ALL transactions confirmed on testnet');
    console.log('');
    console.log('🔗 Verify transactions on Oasis Explorer:');
    console.log(`   https://testnet.explorer.sapphire.oasis.dev/tx/${mintResponse.data.transactionHash}`);
    console.log(`   https://testnet.explorer.sapphire.oasis.dev/tx/${dataResponse.data.transactionHash}`);
    console.log(`   https://testnet.explorer.sapphire.oasis.dev/tx/${distributeResponse.data.transactionHash}`);
    
  } catch (error) {
    console.error('❌ Real blockchain test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Details:', error.response.data);
    }
    
    if (error.message.includes('insufficient funds')) {
      console.error('\n💡 Solution: Request more test ROSE tokens from faucet:');
      console.error('   https://faucet.testnet.oasis.dev/');
    }
  }
}

testRealBlockchain();