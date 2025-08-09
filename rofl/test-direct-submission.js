require('dotenv').config({ path: '../.env' });
const ethers = require('ethers');
const { wrap } = require('@oasisprotocol/sapphire-paratime');
const crypto = require('crypto');

async function testDirectSubmission() {
  console.log('🔍 TESTING DIRECT DATAREGISTRY SUBMISSION\n');
  
  const plainProvider = new ethers.JsonRpcProvider('https://testnet.sapphire.oasis.dev');
  const provider = wrap(plainProvider);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('Wallet:', wallet.address);
  console.log('Balance:', ethers.formatEther(await wallet.provider.getBalance(wallet.address)), 'ROSE');
  
  // First, let's mint a NEW sensor and immediately try to use it
  console.log('\n1️⃣ Minting a fresh sensor...');
  
  const sensorABI = [
    "function mintSensor(string calldata sensorId, string calldata ipfsMetadata) external returns (uint256)"
  ];
  
  const sensorContract = new ethers.Contract(process.env.SENSOR_NFA_CONTRACT, sensorABI, wallet);
  
  // Generate new sensor ID
  const newSensorId = `DIRECT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const metadata = JSON.stringify({ type: 'test-sensor', direct: true });
  
  try {
    const mintTx = await sensorContract.mintSensor(newSensorId, metadata);
    console.log('Mint transaction:', mintTx.hash);
    
    const mintReceipt = await mintTx.wait();
    console.log('✅ Sensor minted in block:', mintReceipt.blockNumber);
    console.log('New sensor ID:', newSensorId);
    
    // Wait a moment for the transaction to be fully processed
    console.log('\n⏳ Waiting for transaction to be fully processed...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    
    // Now test ownership
    console.log('\n2️⃣ Testing ownership of new sensor...');
    const ownershipABI = [
      "function isSensorActiveAndOwned(string calldata sensorId) external view returns (bool)"
    ];
    const ownershipContract = new ethers.Contract(process.env.SENSOR_NFA_CONTRACT, ownershipABI, wallet);
    
    const isOwned = await ownershipContract.isSensorActiveAndOwned(newSensorId);
    console.log('Is active and owned:', isOwned);
    
    if (!isOwned) {
      console.log('❌ Even freshly minted sensor is not recognized as owned!');
      console.log('This suggests a fundamental issue with the contract or our call method');
      return;
    }
    
    // Now try direct DataRegistry submission
    console.log('\n3️⃣ Attempting direct DataRegistry submission...');
    
    const dataABI = [
      "function submitDataBatch(string calldata sensorId, string calldata ipfsCid, bytes calldata encryptedKey, bytes32 recordHash) external"
    ];
    
    const dataContract = new ethers.Contract(process.env.DATA_REGISTRY_CONTRACT, dataABI, wallet);
    
    // Create test data
    const testData = {
      sensorId: newSensorId,
      temperature: 25.0,
      humidity: 60.0,
      co2: 400.0,
      timestamp: Math.floor(Date.now() / 1000)
    };
    
    const canonicalData = `${testData.sensorId}|${testData.timestamp}|${testData.temperature}|${testData.humidity}|${testData.co2}`;
    const recordHash = crypto.createHash('sha256').update(canonicalData).digest();
    
    const testCID = `QmTestDirect${crypto.randomBytes(20).toString('hex')}`;
    const testKey = crypto.randomBytes(32);
    
    console.log('Submitting data:');
    console.log('- Sensor ID:', newSensorId);
    console.log('- IPFS CID:', testCID);
    console.log('- Record hash:', '0x' + recordHash.toString('hex'));
    
    const submitTx = await dataContract.submitDataBatch(
      newSensorId,
      testCID,
      testKey,
      '0x' + recordHash.toString('hex')
    );
    
    console.log('Submit transaction:', submitTx.hash);
    
    const submitReceipt = await submitTx.wait();
    console.log('✅ Data submitted in block:', submitReceipt.blockNumber);
    
    console.log('\n🎉 SUCCESS! Direct submission worked!');
    console.log('The issue is likely in our server-side ownership validation');
    
  } catch (error) {
    console.error('❌ Direct submission failed:', error.message);
    
    if (error.message.includes('Sensor not active or not owned by caller')) {
      console.log('🔍 Contract is rejecting our ownership claim');
    } else if (error.message.includes('CID already used')) {
      console.log('🔍 CID reuse protection working');
    } else if (error.message.includes('Submission too frequent')) {
      console.log('🔍 Rate limiting working');
    }
  }
}

testDirectSubmission();