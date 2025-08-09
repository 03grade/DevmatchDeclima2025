require('dotenv').config({ path: '../.env' });
const express = require('express');
const ethers = require('ethers');
const sapphire = require('@oasisprotocol/sapphire-paratime');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());

console.log('🔐 OFFICIAL OASIS CONFIDENTIAL TRANSACTION SERVER');
console.log('🎯 Using OFFICIAL Oasis Pattern: encryptCallData() + EIP155Signer.sign()');
console.log('📚 Based on: https://docs.oasis.io/build/sapphire/develop/gasless/\n');

// Load deployment info
const deploymentPath = path.join(__dirname, '../contracts/deployment.json');
let deployment;

try {
  deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  console.log('✅ Loaded deployment info');
  console.log('   New Proxy Address:', deployment.contracts.ConfidentialProxy);
  console.log('   New Proxy Signer:', deployment.contracts.ConfidentialProxySigner);
} catch (error) {
  console.error('❌ Could not read deployment.json:', error.message);
  process.exit(1);
}

// Create Sapphire provider and wallet
const baseProvider = new ethers.JsonRpcProvider('https://testnet.sapphire.oasis.dev');
const provider = sapphire.wrap(baseProvider);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

console.log('🛡️ Connected to Oasis Sapphire with OFFICIAL confidential approach');
console.log('   Wallet:', wallet.address);
console.log('   Using OFFICIAL Oasis documentation pattern');

// Contract ABIs
const PROXY_ABI = [
  "function makeConfidentialMintTx(string calldata sensorId, string calldata ipfsMetadata) external view returns (bytes memory)",
  "function makeConfidentialDataTx(string calldata sensorId, string calldata ipfsCid, bytes calldata encryptedKey, bytes32 recordHash) external view returns (bytes memory)",
  "function getKeypairAddress() external view returns (address)",
  "function getNonce() external view returns (uint64)"
];

const SENSOR_ABI = [
  "function sensorExists(string memory sensorId) external view returns (bool)",
  "function sensorIdToTokenId(string memory sensorId) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)"
];

// Create contract instances
const proxyContract = new ethers.Contract(deployment.contracts.ConfidentialProxy, PROXY_ABI, wallet);
const sensorContract = new ethers.Contract(deployment.contracts.SensorNFA, SENSOR_ABI, wallet);

// Health check
app.get('/health', async (req, res) => {
  try {
    const balance = await wallet.provider.getBalance(wallet.address);
    const proxyBalance = await wallet.provider.getBalance(deployment.contracts.ConfidentialProxy);
    const proxySignerBalance = await wallet.provider.getBalance(deployment.contracts.ConfidentialProxySigner);
    const blockNumber = await wallet.provider.getBlockNumber();
    const currentNonce = await proxyContract.getNonce();
    
    res.json({
      status: 'healthy',
      mode: 'OFFICIAL_OASIS_CONFIDENTIAL_TRANSACTION_SERVER',
      documentation: 'https://docs.oasis.io/build/sapphire/develop/gasless/',
      pattern: 'encryptCallData() + EIP155Signer.sign()',
      network: 'Oasis Sapphire Testnet',
      wallet: wallet.address,
      balance: ethers.formatEther(balance) + ' ROSE',
      blockNumber,
      proxy: {
        address: deployment.contracts.ConfidentialProxy,
        balance: ethers.formatEther(proxyBalance) + ' ROSE',
        signer: deployment.contracts.ConfidentialProxySigner,
        signerBalance: ethers.formatEther(proxySignerBalance) + ' ROSE',
        currentNonce: currentNonce.toString()
      },
      contracts: {
        sensorNFA: deployment.contracts.SensorNFA,
        confidentialProxy: deployment.contracts.ConfidentialProxy
      },
      confidential: true,
      officialOasisPattern: true,
      ready: true
    });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// OFFICIAL Oasis Pattern: encryptCallData() + EIP155Signer.sign()
app.post('/api/sensors/mint-official-confidential', async (req, res) => {
  try {
    console.log('🔐 OFFICIAL Method: Using encryptCallData() + EIP155Signer.sign()...');
    
    const sensorId = `OFFICIAL-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const metadata = {
      type: 'climate-sensor',
      location: req.body.location || 'OFFICIAL Oasis Pattern Test Location',
      capabilities: ['temperature', 'humidity', 'co2'],
      confidential: true,
      method: 'official-oasis-encryptCallData-EIP155Signer',
      documentation: 'https://docs.oasis.io/build/sapphire/develop/gasless/',
      timestamp: new Date().toISOString(),
      note: 'Using OFFICIAL Oasis pattern from documentation'
    };
    
    const ipfsMetadata = JSON.stringify(metadata);
    
    console.log('📝 Using OFFICIAL Oasis pattern...');
    console.log('   Sensor ID:', sensorId);
    console.log('   Pattern: encryptCallData() + EIP155Signer.sign()');
    console.log('   Documentation: https://docs.oasis.io/build/sapphire/develop/gasless/');
    
    try {
      // Call the proxy contract which uses the OFFICIAL Oasis pattern
      console.log('🎯 Calling proxy.makeConfidentialMintTx() with OFFICIAL pattern...');
      const confidentialTxBytes = await proxyContract.makeConfidentialMintTx(sensorId, ipfsMetadata);
      
      console.log('✅ OFFICIAL confidential transaction generated!');
      console.log('   Transaction length:', confidentialTxBytes.length, 'bytes');
      console.log('   Uses encryptCallData():', true);
      console.log('   Uses EIP155Signer.sign():', true);
      console.log('   Pattern: OFFICIAL Oasis documentation');
      
      // Send the raw confidential transaction to the network
      console.log('🚀 Broadcasting OFFICIAL confidential transaction...');
      const tx = await wallet.provider.sendTransaction(confidentialTxBytes);
      console.log('⏳ OFFICIAL transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ OFFICIAL transaction confirmed in block:', receipt.blockNumber);
      
      // Analyze the transaction
      const txDetails = await provider.getTransaction(tx.hash);
      
      res.json({
        success: true,
        method: 'OFFICIAL Oasis Pattern: encryptCallData() + EIP155Signer.sign()',
        sensorId,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        message: 'Transaction created with OFFICIAL Oasis pattern!',
        officialPattern: {
          documentation: 'https://docs.oasis.io/build/sapphire/develop/gasless/',
          usesEncryptCallData: true,
          usesEIP155Signer: true,
          contractImplementation: true,
          confidentialTxLength: confidentialTxBytes.length,
          proxyAddress: deployment.contracts.ConfidentialProxy
        },
        analysis: {
          hash: tx.hash,
          type: txDetails.type,
          dataLength: txDetails.data ? txDetails.data.length : 0,
          from: txDetails.from,
          to: txDetails.to,
          gasUsed: receipt.gasUsed.toString(),
          officialOasisPattern: true,
          shouldShowConfidential: true
        },
        verification: {
          explorerNote: 'This uses the OFFICIAL Oasis pattern from documentation',
          expectedFormat: 'Confidential',
          methodology: 'encryptCallData() + EIP155Signer.sign() in smart contract'
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (proxyError) {
      console.error('❌ OFFICIAL pattern failed:', proxyError.message);
      throw proxyError;
    }
    
  } catch (error) {
    console.error('❌ OFFICIAL Oasis pattern failed:', error);
    res.status(500).json({
      success: false,
      error: 'OFFICIAL Oasis pattern failed',
      details: error.message,
      stack: error.stack
    });
  }
});

// Submit confidential climate data using OFFICIAL pattern
app.post('/api/data/submit-official-confidential', async (req, res) => {
  try {
    console.log('🔐 OFFICIAL Data Submission: Using encryptCallData() + EIP155Signer.sign()...');
    
    const { sensorId, temperature, humidity, co2 } = req.body;
    
    // Simulate IPFS upload and encryption
    const climateData = { sensorId, timestamp: Math.floor(Date.now() / 1000), temperature, humidity, co2 };
    const encryptedData = crypto.randomBytes(64).toString('hex');
    const ipfsCid = `QmOFFICIAL${crypto.createHash('sha256').update(encryptedData).digest('hex').substring(0, 40)}`;
    const encryptedKey = crypto.randomBytes(16);
    const recordHash = crypto.createHash('sha256').update(JSON.stringify(climateData)).digest();
    
    console.log('📝 Using OFFICIAL pattern for data submission...');
    console.log('   Sensor ID:', sensorId);
    console.log('   IPFS CID:', ipfsCid);
    console.log('   Record Hash:', '0x' + recordHash.toString('hex'));
    
    try {
      // Call the proxy contract for confidential data submission
      console.log('🎯 Calling proxy.makeConfidentialDataTx() with OFFICIAL pattern...');
      const confidentialTxBytes = await proxyContract.makeConfidentialDataTx(
        sensorId,
        ipfsCid,
        encryptedKey,
        '0x' + recordHash.toString('hex')
      );
      
      console.log('✅ OFFICIAL confidential data transaction generated!');
      
      // Send the raw confidential transaction
      const tx = await wallet.provider.sendTransaction(confidentialTxBytes);
      console.log('⏳ OFFICIAL data transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ OFFICIAL data transaction confirmed in block:', receipt.blockNumber);
      
      res.json({
        success: true,
        method: 'OFFICIAL Data Submission: encryptCallData() + EIP155Signer.sign()',
        sensorId,
        ipfsCID: ipfsCid,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        message: 'Data submitted with OFFICIAL Oasis pattern!',
        officialPattern: {
          documentation: 'https://docs.oasis.io/build/sapphire/develop/gasless/',
          usesEncryptCallData: true,
          usesEIP155Signer: true,
          confidentialTxLength: confidentialTxBytes.length
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ OFFICIAL data submission failed:', error.message);
      throw error;
    }
    
  } catch (error) {
    console.error('❌ OFFICIAL data submission failed:', error);
    res.status(500).json({
      success: false,
      error: 'OFFICIAL data submission failed',
      details: error.message
    });
  }
});

// Get sensor status
app.get('/api/sensors/:sensorId/status', async (req, res) => {
  try {
    const { sensorId } = req.params;
    
    const exists = await sensorContract.sensorExists(sensorId);
    if (!exists) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    
    const tokenId = await sensorContract.sensorIdToTokenId(sensorId);
    const owner = await sensorContract.ownerOf(tokenId);
    
    res.json({
      sensorId,
      exists: true,
      tokenId: tokenId.toString(),
      owner,
      accessible: owner.toLowerCase() === wallet.address.toLowerCase(),
      officialPattern: true
    });
    
  } catch (error) {
    console.error('❌ Failed to get sensor status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sensor status',
      details: error.message
    });
  }
});

// Start OFFICIAL OASIS CONFIDENTIAL server
async function startOfficialOasisConfidentialServer() {
  try {
    const balance = await wallet.provider.getBalance(wallet.address);
    const proxyBalance = await wallet.provider.getBalance(deployment.contracts.ConfidentialProxy);
    const blockNumber = await wallet.provider.getBlockNumber();
    const network = await wallet.provider.getNetwork();
    
    console.log('\n🎯 OFFICIAL OASIS CONFIDENTIAL SERVER STATUS:');
    console.log('   Balance:', ethers.formatEther(balance), 'ROSE');
    console.log('   Block:', blockNumber);
    console.log('   Chain ID:', network.chainId);
    console.log('   Sensor Contract:', deployment.contracts.SensorNFA);
    console.log('   Proxy Contract:', deployment.contracts.ConfidentialProxy);
    console.log('   Proxy Balance:', ethers.formatEther(proxyBalance), 'ROSE');
    
    console.log('\n📚 OFFICIAL OASIS PATTERN:');
    console.log('   ✅ Documentation: https://docs.oasis.io/build/sapphire/develop/gasless/');
    console.log('   ✅ Pattern: encryptCallData() + EIP155Signer.sign()');
    console.log('   ✅ Implementation: Smart contract based');
    console.log('   ✅ Expected Result: CONFIDENTIAL format on explorer');
    console.log('\n🎯 GOAL: Achieve TRUE "Confidential" format using OFFICIAL Oasis pattern\n');
    
    const PORT = 3015; // Updated port for official Oasis pattern
    app.listen(PORT, () => {
      console.log(`🚀 D-Climate OFFICIAL OASIS CONFIDENTIAL Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log('🛡️ Ready for OFFICIAL Oasis confidential transactions!\n');
      console.log('🧪 TEST ENDPOINTS:');
      console.log(`   POST /api/sensors/mint-official-confidential`);
      console.log(`   POST /api/data/submit-official-confidential`);
      console.log(`   GET  /api/sensors/:sensorId/status`);
      console.log('');
      console.log('📚 USING OFFICIAL OASIS DOCUMENTATION PATTERN:');
      console.log('   https://docs.oasis.io/build/sapphire/develop/gasless/');
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Failed to start OFFICIAL OASIS CONFIDENTIAL server:', error);
    process.exit(1);
  }
}

startOfficialOasisConfidentialServer();
 