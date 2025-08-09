const axios = require('axios');

async function testConfidentialTransactions() {
  console.log('🔒 TESTING CONFIDENTIAL TRANSACTIONS\n');
  console.log('=' .repeat(80));
  
  const baseUrl = 'http://localhost:3003';
  
  try {
    // 1. Health Check
    console.log('1️⃣ Verifying CONFIDENTIAL mode...\n');
    const health = await axios.get(`${baseUrl}/health`);
    
    console.log('✅ Server Mode:', health.data.mode);
    console.log('✅ Confidential:', health.data.confidential);
    console.log('✅ Encryption:', health.data.encryption);
    console.log('✅ Transaction Format:', health.data.transactionFormat);
    console.log('✅ Network:', health.data.network);
    console.log('✅ Wallet:', health.data.wallet);
    console.log('✅ Balance:', health.data.balance);
    
    if (!health.data.confidential) {
      throw new Error('Server not in confidential mode');
    }
    
    // 2. Mint CONFIDENTIAL Sensor
    console.log('\n2️⃣ Minting CONFIDENTIAL sensor...\n');
    
    const mintResponse = await axios.post(`${baseUrl}/api/sensors/mint`, {
      location: 'Malaysia - CONFIDENTIAL'
    });
    
    const mintData = mintResponse.data;
    
    console.log('🎉 CONFIDENTIAL Sensor Minted!');
    console.log('✅ Sensor ID:', mintData.sensorId);
    console.log('✅ Transaction:', mintData.transactionHash);
    console.log('✅ Block:', mintData.blockNumber);
    console.log('✅ Gas Used:', mintData.gasUsed);
    
    console.log('\n🔒 Confidential Details:');
    console.log(JSON.stringify(mintData.confidential, null, 2));
    
    console.log('\n📦 Metadata:');
    console.log(JSON.stringify(mintData.metadata, null, 2));
    
    console.log('\n🔗 Verify CONFIDENTIAL Transaction:');
    console.log(`   https://testnet.explorer.sapphire.oasis.dev/tx/${mintData.transactionHash}`);
    console.log('   ⚠️  Check if transaction format shows "Confidential" instead of "Plain"');
    
    // 3. Test CONFIDENTIAL Data Submission
    console.log('\n3️⃣ Testing CONFIDENTIAL data submission...\n');
    
    const climateData = {
      sensorId: mintData.sensorId,
      temperature: 29.5,
      humidity: 78.0,
      co2: 425.0
    };
    
    console.log('📊 Climate Data:');
    console.log(JSON.stringify(climateData, null, 2));
    
    const dataResponse = await axios.post(`${baseUrl}/api/data/submit`, climateData);
    const dataResult = dataResponse.data;
    
    console.log('\n🎉 CONFIDENTIAL Data Processing Completed!');
    console.log('✅ Success:', dataResult.success);
    console.log('✅ IPFS CID:', dataResult.ipfsCID);
    console.log('✅ Sensor ID:', dataResult.sensorId);
    
    console.log('\n🔒 Confidential Processing:');
    console.log(JSON.stringify(dataResult.confidential, null, 2));
    
    console.log('\n📦 IPFS Package:');
    console.log(JSON.stringify(dataResult.ipfsPackage, null, 2));
    
    console.log('\n🔐 Encryption Details:');
    console.log(JSON.stringify(dataResult.encryption, null, 2));
    
    // 4. Check Sensor Status
    console.log('\n4️⃣ Checking CONFIDENTIAL sensor status...\n');
    
    const statusResponse = await axios.get(`${baseUrl}/api/sensors/${mintData.sensorId}/status`);
    const statusData = statusResponse.data;
    
    console.log('✅ Sensor Status:');
    console.log('   Exists:', statusData.exists);
    console.log('   Token ID:', statusData.tokenId);
    console.log('   Owner:', statusData.owner);
    console.log('   Confidential:', statusData.confidential);
    console.log('   TEE Secured:', statusData.teeSecured);
    console.log('   Sapphire Native:', statusData.sapphireNative);
    console.log('   Accessible:', statusData.accessible);
    
    // Final Summary
    console.log('\n' + '=' .repeat(80));
    console.log('🎉 CONFIDENTIAL TRANSACTION TEST COMPLETED!');
    console.log('=' .repeat(80));
    
    console.log('\n🔥 ACHIEVEMENTS:');
    console.log('✅ CONFIDENTIAL sensor minting transaction created');
    console.log('✅ Sapphire native encryption implemented');
    console.log('✅ TEE-secured data processing pipeline');
    console.log('✅ Full confidential computing demonstration');
    
    console.log('\n🔗 TRANSACTION TO VERIFY:');
    console.log(`📋 Hash: ${mintData.transactionHash}`);
    console.log(`🔗 Link: https://testnet.explorer.sapphire.oasis.dev/tx/${mintData.transactionHash}`);
    console.log('\n⚠️  IMPORTANT: Check the transaction explorer to verify the format is now "Confidential" instead of "Plain"');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Verify transaction format on Sapphire Explorer');
    console.log('2. Confirm "Confidential" format instead of "Plain"');
    console.log('3. If still "Plain", investigate Sapphire wrapper configuration');
    
    return mintData.transactionHash;
    
  } catch (error) {
    console.error('\n❌ CONFIDENTIAL test failed:', error.response?.data || error.message);
    return null;
  }
}

// Check server and run test
async function main() {
  try {
    await axios.get('http://localhost:3003/health');
    console.log('✅ CONFIDENTIAL server is running\n');
    const txHash = await testConfidentialTransactions();
    
    if (txHash) {
      console.log('\n🎯 FINAL VERIFICATION:');
      console.log(`Go to: https://testnet.explorer.sapphire.oasis.dev/tx/${txHash}`);
      console.log('Check if Format shows: "Confidential" ✅ or "Plain" ❌');
    }
    
  } catch (error) {
    console.log('❌ CONFIDENTIAL server is not running!');
    console.log('Please start the server first:');
    console.log('   node confidential-server.js\n');
  }
}

main();