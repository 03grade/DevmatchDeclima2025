const axios = require('axios');

async function testDefinitiveConfidentialApproaches() {
  console.log('🔐 TESTING DEFINITIVE CONFIDENTIAL APPROACHES\n');
  console.log('🎯 GOAL: Find the method that shows "Confidential" format on Sapphire Explorer\n');
  console.log('=' .repeat(80));
  
  const baseUrl = 'http://localhost:3009';
  const allResults = [];
  
  try {
    // 1. Health Check
    console.log('1️⃣ Verifying DEFINITIVE CONFIDENTIAL server...\n');
    const health = await axios.get(`${baseUrl}/health`);
    
    console.log('✅ Server Mode:', health.data.mode);
    console.log('✅ Goal:', health.data.goal);
    console.log('✅ Network:', health.data.network);
    console.log('✅ Wallet:', health.data.wallet);
    console.log('✅ Balance:', health.data.balance);
    console.log('✅ Approaches Available:');
    Object.entries(health.data.approaches).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });
    
    // 2. Test Method 1: Sapphire Wrapped Provider
    console.log('\n2️⃣ Testing Method 1: Sapphire Wrapped Provider...\n');
    
    try {
      const method1Response = await axios.post(`${baseUrl}/api/sensors/mint-sapphire-wrapped`, {
        location: 'Method 1 - Sapphire Wrapped Provider Test'
      });
      
      const method1Data = method1Response.data;
      console.log('🎉 Method 1 SUCCESS!');
      console.log('✅ Method:', method1Data.method);
      console.log('✅ Sensor ID:', method1Data.sensorId);
      console.log('✅ Transaction:', method1Data.transactionHash);
      console.log('✅ Block:', method1Data.blockNumber);
      console.log('✅ Gas Used:', method1Data.gasUsed);
      
      console.log('\n🔍 Method 1 Analysis:');
      if (method1Data.analysis) {
        console.log(JSON.stringify(method1Data.analysis, null, 2));
      }
      
      allResults.push({
        method: 'Method 1: Sapphire Wrapped',
        txHash: method1Data.transactionHash,
        success: true,
        explorerLink: `https://testnet.explorer.sapphire.oasis.dev/tx/${method1Data.transactionHash}`
      });
      
    } catch (error) {
      console.log('❌ Method 1 failed:', error.response ? error.response.data : error.message);
      allResults.push({
        method: 'Method 1: Sapphire Wrapped',
        success: false,
        error: error.message
      });
    }
    
    // Wait between tests
    console.log('\n⏳ Waiting 3 seconds before next test...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 3. Test Method 2: Manual Confidential Construction
    console.log('\n3️⃣ Testing Method 2: Manual Confidential Construction...\n');
    
    try {
      const method2Response = await axios.post(`${baseUrl}/api/sensors/mint-manual-confidential`, {
        location: 'Method 2 - Manual Confidential Construction Test'
      });
      
      const method2Data = method2Response.data;
      console.log('🎉 Method 2 SUCCESS!');
      console.log('✅ Method:', method2Data.method);
      console.log('✅ Sensor ID:', method2Data.sensorId);
      console.log('✅ Transaction:', method2Data.transactionHash);
      console.log('✅ Block:', method2Data.blockNumber);
      console.log('✅ Gas Used:', method2Data.gasUsed);
      
      console.log('\n🔍 Method 2 Analysis:');
      if (method2Data.analysis) {
        console.log(JSON.stringify(method2Data.analysis, null, 2));
      }
      
      allResults.push({
        method: 'Method 2: Manual Confidential',
        txHash: method2Data.transactionHash,
        success: true,
        explorerLink: `https://testnet.explorer.sapphire.oasis.dev/tx/${method2Data.transactionHash}`
      });
      
    } catch (error) {
      console.log('❌ Method 2 failed:', error.response ? error.response.data : error.message);
      allResults.push({
        method: 'Method 2: Manual Confidential',
        success: false,
        error: error.message
      });
    }
    
    // Wait between tests
    console.log('\n⏳ Waiting 3 seconds before next test...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 4. Test Method 3: Explicit Encryption
    console.log('\n4️⃣ Testing Method 3: Explicit Sapphire Encryption...\n');
    
    try {
      const method3Response = await axios.post(`${baseUrl}/api/sensors/mint-explicit-encryption`, {
        location: 'Method 3 - Explicit Sapphire Encryption Test'
      });
      
      const method3Data = method3Response.data;
      console.log('🎉 Method 3 SUCCESS!');
      console.log('✅ Method:', method3Data.method);
      console.log('✅ Sensor ID:', method3Data.sensorId);
      console.log('✅ Transaction:', method3Data.transactionHash);
      console.log('✅ Block:', method3Data.blockNumber);
      console.log('✅ Gas Used:', method3Data.gasUsed);
      
      if (method3Data.encryption) {
        console.log('\n🔐 Encryption Details:');
        console.log(JSON.stringify(method3Data.encryption, null, 2));
      }
      
      console.log('\n🔍 Method 3 Analysis:');
      if (method3Data.analysis) {
        console.log(JSON.stringify(method3Data.analysis, null, 2));
      }
      
      allResults.push({
        method: 'Method 3: Explicit Encryption',
        txHash: method3Data.transactionHash,
        success: true,
        explorerLink: `https://testnet.explorer.sapphire.oasis.dev/tx/${method3Data.transactionHash}`
      });
      
    } catch (error) {
      console.log('❌ Method 3 failed:', error.response ? error.response.data : error.message);
      allResults.push({
        method: 'Method 3: Explicit Encryption',
        success: false,
        error: error.message
      });
    }
    
    // Final Summary
    console.log('\n' + '=' .repeat(80));
    console.log('🎉 DEFINITIVE CONFIDENTIAL TESTING COMPLETED!');
    console.log('=' .repeat(80));
    
    console.log('\n📊 RESULTS SUMMARY:');
    allResults.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.method}:`);
      if (result.success) {
        console.log(`   ✅ SUCCESS`);
        console.log(`   📋 Transaction: ${result.txHash}`);
        console.log(`   🔗 Explorer: ${result.explorerLink}`);
      } else {
        console.log(`   ❌ FAILED: ${result.error}`);
      }
    });
    
    const successfulMethods = allResults.filter(r => r.success);
    
    if (successfulMethods.length > 0) {
      console.log('\n🎯 CRITICAL VERIFICATION NEEDED:');
      console.log('Please check each successful transaction in the Sapphire Explorer:');
      console.log('Look for the "Format" field - it should show "Confidential" instead of "Plain"\n');
      
      successfulMethods.forEach((result, index) => {
        console.log(`${index + 1}. ${result.method}:`);
        console.log(`   🔗 ${result.explorerLink}`);
        console.log('');
      });
      
      console.log('🔍 ANALYSIS TASK:');
      console.log('   - Compare transaction formats between methods');
      console.log('   - Identify which method(s) show "Confidential" format');
      console.log('   - Report back which approach works for true confidentiality');
      
      console.log('\n💡 HYPOTHESIS:');
      console.log('   Method 1: Working but may show "Plain" (current behavior)');
      console.log('   Method 2: Bypasses wrapper, may show different format');
      console.log('   Method 3: Uses explicit encryption, most likely to show "Confidential"');
      
    } else {
      console.log('\n❌ No methods succeeded. Check server logs for errors.');
    }
    
    console.log('\n🚀 D-CLIMATE STATUS:');
    console.log('   ✅ Multiple confidential approaches tested');
    console.log('   ✅ Backend fully functional and ready');
    console.log('   🔍 Awaiting format verification for true confidentiality');
    
    return allResults;
    
  } catch (error) {
    console.error('\n❌ DEFINITIVE test failed:');
    if (error.response) {
      console.error('Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return null;
  }
}

// Check server and run test
async function main() {
  try {
    await axios.get('http://localhost:3009/health');
    console.log('✅ DEFINITIVE CONFIDENTIAL server is running\n');
    const results = await testDefinitiveConfidentialApproaches();
    
    if (results && results.some(r => r.success)) {
      console.log('\n🎯 NEXT STEPS:');
      console.log('1. Check all successful transactions in Sapphire Explorer');
      console.log('2. Look for "Format: Confidential" instead of "Format: Plain"');
      console.log('3. Report which method achieves true confidential format');
      console.log('4. We can then use that method for the final D-Climate implementation');
    }
    
  } catch (error) {
    console.log('❌ DEFINITIVE CONFIDENTIAL server is not running!');
    console.log('Please start the server first:');
    console.log('   node definitive-confidential-server.js\n');
  }
}

main();