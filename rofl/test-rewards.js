const axios = require('axios');

async function testRewards() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('💰 Testing D-Climate Reward System...\n');
  
  try {
    // Step 1: Test reward calculation
    console.log('🧮 1. Testing Reward Calculation...');
    const sensorId = 'TEST-12345-abc';
    const calcResponse = await axios.get(`${baseUrl}/api/rewards/calculate/${sensorId}`);
    console.log('✅ Reward calculation successful!');
    console.log('Reward details:', JSON.stringify(calcResponse.data, null, 2));
    console.log('');
    
    // Step 2: Test reward history
    console.log('📈 2. Testing Reward History...');
    const historyResponse = await axios.get(`${baseUrl}/api/rewards/history/${sensorId}`);
    console.log('✅ Reward history retrieved!');
    console.log('History:', JSON.stringify(historyResponse.data, null, 2));
    console.log('');
    
    // Step 3: Test daily reward distribution
    console.log('⏰ 3. Testing Daily Reward Distribution...');
    const distributeResponse = await axios.post(`${baseUrl}/api/rewards/distribute`, {
      sensorId: sensorId,
      qualityScore: 95,
      submissionCount: 144 // 24 hours * 6 submissions per hour
    });
    console.log('✅ Daily reward distribution successful!');
    console.log('Distribution result:', JSON.stringify(distributeResponse.data, null, 2));
    console.log('');
    
    // Step 4: Test reward claiming
    console.log('🎯 4. Testing Reward Claiming...');
    const claimData = {
      walletAddress: '0x8Ea29D642B348984F7bAF3bFf889D1d997E9d243',
      sensorId: sensorId,
      rewardIds: ['reward-123', 'reward-124']
    };
    
    const claimResponse = await axios.post(`${baseUrl}/api/rewards/claim`, claimData);
    console.log('✅ Reward claiming successful!');
    console.log('Claim result:', JSON.stringify(claimResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testRewards();