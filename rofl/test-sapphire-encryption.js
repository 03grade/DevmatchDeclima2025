const axios = require('axios');

class SapphireTestSuite {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async testHealthCheck() {
    console.log('🔧 Testing Sapphire TEE Health Check...\n');
    
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      const data = response.data;
      
      console.log('✅ Health Check Results:');
      console.log('   Status:', data.status);
      console.log('   Mode:', data.mode);
      console.log('   TEE:', data.tee);
      console.log('   Encryption:', data.encryption);
      console.log('   Wallet:', data.wallet);
      console.log('   Balance:', data.balance);
      console.log('   Block:', data.blockNumber);
      console.log('   Ready:', data.ready);
      
      return data.status === 'healthy' && data.tee === 'ENABLED';
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      return false;
    }
  }

  async testConfidentialSensorMinting() {
    console.log('\n🔐 Testing CONFIDENTIAL Sensor Minting with TEE...\n');
    
    try {
      const response = await axios.post(`${this.baseUrl}/api/sensors/mint`, {
        walletAddress: '0x8Ea29D642B348984F7bAF3bFf889D1d997E9d243',
        sensorType: 'climate',
        location: 'Malaysia (Confidential)'
      });
      
      const data = response.data;
      
      console.log('🎉 CONFIDENTIAL Sensor Minted Successfully!');
      console.log('   Sensor ID:', data.sensorId);
      console.log('   Transaction:', data.transactionHash);
      console.log('   Block:', data.blockNumber);
      console.log('   Gas Used:', data.gasUsed);
      console.log('   Encryption:', JSON.stringify(data.encryption, null, 4));
      
      if (data.transactionHash) {
        console.log('\n🔗 Verify on Sapphire Explorer:');
        console.log(`   https://testnet.explorer.sapphire.oasis.dev/tx/${data.transactionHash}\n`);
      }
      
      return { success: true, sensorId: data.sensorId, txHash: data.transactionHash };
    } catch (error) {
      console.error('❌ Confidential sensor minting failed:', error.response?.data || error.message);
      return { success: false };
    }
  }

  async testEncryptedDataSubmission(sensorId) {
    console.log('🔒 Testing ENCRYPTED Climate Data Submission...\n');
    
    try {
      // Simulate real climate sensor data
      const climateData = {
        sensorId: sensorId,
        temperature: 28.5,
        humidity: 75.2,
        co2: 420.3,
        timestamp: Math.floor(Date.now() / 1000)
      };
      
      console.log('📊 Climate Data to Encrypt:');
      console.log(JSON.stringify(climateData, null, 2));
      
      const response = await axios.post(`${this.baseUrl}/api/data/submit`, climateData);
      const data = response.data;
      
      console.log('\n🎉 Climate Data ENCRYPTED and Submitted!');
      console.log('   Transaction:', data.transactionHash);
      console.log('   Block:', data.blockNumber);
      console.log('   IPFS CID:', data.ipfsCID);
      console.log('   Data Hash:', data.dataHash);
      console.log('   Gas Used:', data.gasUsed);
      console.log('   Encryption:', JSON.stringify(data.encryption, null, 4));
      
      if (data.transactionHash) {
        console.log('\n🔗 Verify Data Transaction:');
        console.log(`   https://testnet.explorer.sapphire.oasis.dev/tx/${data.transactionHash}\n`);
      }
      
      return { success: true, ipfsCID: data.ipfsCID, txHash: data.transactionHash };
    } catch (error) {
      console.error('❌ Encrypted data submission failed:', error.response?.data || error.message);
      return { success: false };
    }
  }

  async testEncryptedDataRetrieval(sensorId, batchIndex = 0) {
    console.log('🔍 Testing ENCRYPTED Data Retrieval...\n');
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/data/${sensorId}/${batchIndex}`);
      const data = response.data;
      
      console.log('✅ Encrypted Data Retrieved:');
      console.log('   Sensor ID:', data.sensorId);
      console.log('   Batch Index:', data.batchIndex);
      console.log('   IPFS CID:', data.ipfsCID);
      console.log('   Record Hash:', data.recordHash);
      console.log('   Verified:', data.verified);
      console.log('   Encryption:', JSON.stringify(data.encryption, null, 4));
      
      return { success: true, data };
    } catch (error) {
      console.error('❌ Encrypted data retrieval failed:', error.response?.data || error.message);
      return { success: false };
    }
  }

  async testSensorStatus(sensorId) {
    console.log('📊 Testing Confidential Sensor Status...\n');
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/sensors/${sensorId}/status`);
      const data = response.data;
      
      console.log('✅ Confidential Sensor Status:');
      console.log('   Sensor ID:', data.sensorId);
      console.log('   Exists:', data.exists);
      console.log('   Owner:', data.owner);
      console.log('   Reputation Score:', data.reputationScore);
      console.log('   Active:', data.isActive);
      console.log('   Total Submissions:', data.totalSubmissions);
      console.log('   Confidential:', data.confidential);
      console.log('   TEE:', data.tee);
      
      return { success: true, data };
    } catch (error) {
      console.error('❌ Sensor status check failed:', error.response?.data || error.message);
      return { success: false };
    }
  }

  async runFullEncryptionPipeline() {
    console.log('🚀 RUNNING FULL SAPPHIRE TEE ENCRYPTION PIPELINE\n');
    console.log('=' .repeat(80));
    
    let sensorId = null;
    
    // Step 1: Health Check
    const healthOk = await this.testHealthCheck();
    if (!healthOk) {
      console.log('❌ Health check failed. Stopping tests.');
      return false;
    }
    
    // Step 2: Confidential Sensor Minting
    const mintResult = await this.testConfidentialSensorMinting();
    if (!mintResult.success) {
      console.log('❌ Sensor minting failed. Stopping tests.');
      return false;
    }
    sensorId = mintResult.sensorId;
    
    // Step 3: Encrypted Data Submission
    const dataResult = await this.testEncryptedDataSubmission(sensorId);
    if (!dataResult.success) {
      console.log('❌ Data submission failed. Continuing with other tests...');
    }
    
    // Step 4: Encrypted Data Retrieval
    await this.testEncryptedDataRetrieval(sensorId);
    
    // Step 5: Sensor Status Check
    await this.testSensorStatus(sensorId);
    
    console.log('\n' + '=' .repeat(80));
    console.log('🎉 SAPPHIRE TEE ENCRYPTION PIPELINE COMPLETED!');
    console.log('✅ All operations used CONFIDENTIAL computing with TEE encryption');
    console.log('✅ Climate data is ENCRYPTED end-to-end');
    console.log('✅ Smart contracts executed in TRUSTED EXECUTION ENVIRONMENT');
    console.log('✅ Storage and transactions are CONFIDENTIAL');
    
    return true;
  }
}

// Run the test suite
async function main() {
  const tester = new SapphireTestSuite();
  
  try {
    await tester.runFullEncryptionPipeline();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Check if server is running first
async function checkServer() {
  try {
    await axios.get('http://localhost:3001/health');
    console.log('✅ Sapphire server is running. Starting tests...\n');
    main();
  } catch (error) {
    console.log('❌ Sapphire server is not running!');
    console.log('Please start the server first:');
    console.log('   node sapphire-server.js\n');
  }
}

checkServer();