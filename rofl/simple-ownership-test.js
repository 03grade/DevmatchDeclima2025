require('dotenv').config({ path: '../.env' });
const ethers = require('ethers');
const { wrap } = require('@oasisprotocol/sapphire-paratime');

async function simpleOwnershipTest() {
  console.log('🔍 SIMPLE OWNERSHIP TEST\n');
  
  const plainProvider = new ethers.JsonRpcProvider('https://testnet.sapphire.oasis.dev');
  const provider = wrap(plainProvider);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const sensorId = 'SAPPHIRE-1754674947697-91329667';
  
  // Test with minimal ABI
  const minimalABI = [
    "function isSensorActiveAndOwned(string calldata sensorId) external view returns (bool)"
  ];
  
  const sensorContract = new ethers.Contract(process.env.SENSOR_NFA_CONTRACT, minimalABI, wallet);
  
  try {
    console.log('Testing isSensorActiveAndOwned for:', sensorId);
    console.log('From wallet:', wallet.address);
    
    const result = await sensorContract.isSensorActiveAndOwned(sensorId);
    console.log('Result:', result);
    
    if (result) {
      console.log('✅ Sensor is active and owned - the DataRegistry issue is something else');
      
      // The real issue might be that DataRegistry needs to be authorized or configured
      console.log('\n🔍 Possible DataRegistry issues:');
      console.log('1. DataRegistry not authorized to call SensorNFA functions');
      console.log('2. Submission interval checks failing');
      console.log('3. IPFS CID or encrypted key validation failing');
      console.log('4. Contract deployment issue');
      
    } else {
      console.log('❌ Sensor is NOT active and owned');
      console.log('This is why data submission fails');
    }
    
  } catch (error) {
    console.error('❌ Ownership test failed:', error.message);
    
    // Try to get more specific error info
    if (error.message.includes('call revert exception')) {
      console.log('Contract reverted - sensor might not exist or function signature wrong');
    }
  }
}

simpleOwnershipTest();