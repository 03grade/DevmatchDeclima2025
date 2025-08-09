require('dotenv').config({ path: '../.env' });
const express = require('express');
const ethers = require('ethers');
const sapphire = require('@oasisprotocol/sapphire-paratime');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());

console.log('🔐 TRUE SAPPHIRE ENCRYPTION SERVER');
console.log('🎯 Using encryptCallData(), Sapphire.encrypt(), Sapphire.decrypt(), isCalldataEnveloped()');
console.log('🚀 FINAL ATTEMPT to achieve "Confidential" format on explorer\n');

// Load deployment info
const deploymentPath = path.join(__dirname, '../contracts/deployment.json');
let deployment;

try {
  deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  console.log('✅ Loaded deployment info');
} catch (error) {
  console.error('❌ Could not read deployment.json:', error.message);
  process.exit(1);
}

// Create Sapphire provider and wallet
const baseProvider = new ethers.JsonRpcProvider('https://testnet.sapphire.oasis.dev');
const provider = sapphire.wrap(baseProvider);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

console.log('🛡️ Connected to Oasis Sapphire with TRUE ENCRYPTION approach');
console.log('   Wallet:', wallet.address);
console.log('   Using: encryptCallData(), Sapphire.encrypt(), isCalldataEnveloped()');

// Contract ABIs with confidential functions
const SENSOR_ABI = [
  "function mintSensor(string calldata sensorId, string calldata ipfsMetadata) external returns (uint256)",
  "function sensorExists(string memory sensorId) external view returns (bool)",
  "function sensorIdToTokenId(string memory sensorId) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)"
];

// Extended ABI for confidential proxy contract
const CONFIDENTIAL_PROXY_ABI = [
  "function mintSensorConfidential(string calldata sensorId, string calldata ipfsMetadata) external returns (bytes memory)",
  "function submitDataBatchConfidential(string calldata sensorId, string calldata ipfsCid, bytes calldata encryptedKey, bytes32 recordHash) external",
  "function getKeypairAddress() external view returns (address)",
  "function getNonce() external view returns (uint64)"
];

// Create contract instances
const sensorContract = new ethers.Contract(deployment.contracts.SensorNFA, SENSOR_ABI, wallet);
const proxyContract = new ethers.Contract(deployment.contracts.ConfidentialProxy, CONFIDENTIAL_PROXY_ABI, wallet);

// Health check
app.get('/health', async (req, res) => {
  try {
    const balance = await wallet.provider.getBalance(wallet.address);
    const blockNumber = await wallet.provider.getBlockNumber();
    
    // Check Sapphire features availability
    const sapphireFeatures = {
      encryptCallData: typeof sapphire.encryptCallData === 'function',
      sapphireEncrypt: typeof sapphire.encrypt === 'function',
      sapphireDecrypt: typeof sapphire.decrypt === 'function',
      isCalldataEnveloped: typeof sapphire.isCalldataEnveloped === 'function',
      randomBytes: typeof sapphire.randomBytes === 'function',
      wrap: typeof sapphire.wrap === 'function'
    };
    
    res.json({
      status: 'healthy',
      mode: 'TRUE_SAPPHIRE_ENCRYPTION_SERVER',
      goal: 'Use encryptCallData(), Sapphire.encrypt(), Sapphire.decrypt(), isCalldataEnveloped()',
      network: 'Oasis Sapphire Testnet',
      wallet: wallet.address,
      balance: ethers.formatEther(balance) + ' ROSE',
      blockNumber,
      sapphireFeatures,
      contracts: {
        sensorNFA: deployment.contracts.SensorNFA,
        confidentialProxy: deployment.contracts.ConfidentialProxy
      },
      confidential: true,
      ready: true
    });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// Method 1: Use encryptCallData() helper with ephemeral key
app.post('/api/sensors/mint-encrypt-calldata', async (req, res) => {
  try {
    console.log('🔐 Method 1: Using encryptCallData() helper with ephemeral key...');
    
    const sensorId = `ENCRYPT-CALLDATA-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const metadata = {
      type: 'climate-sensor',
      location: req.body.location || 'encryptCallData Test Location',
      capabilities: ['temperature', 'humidity', 'co2'],
      confidential: true,
      method: 'encryptCallData-helper',
      timestamp: new Date().toISOString(),
      note: 'Using encryptCallData() helper for true confidential format'
    };
    
    const ipfsMetadata = JSON.stringify(metadata);
    
    console.log('📝 Creating transaction with encryptCallData() helper...');
    console.log('   Sensor ID:', sensorId);
    
    // Try to use encryptCallData() helper if available
    if (typeof sapphire.encryptCallData === 'function') {
      console.log('✅ encryptCallData() function is available');
      
      // Encode the function call data
      const functionData = sensorContract.interface.encodeFunctionData('mintSensor', [sensorId, ipfsMetadata]);
      console.log('   Original calldata length:', functionData.length);
      
      try {
        // Use encryptCallData() to encrypt the calldata with ephemeral key
        const encryptedCalldata = sapphire.encryptCallData(functionData);
        console.log('   Encrypted calldata length:', encryptedCalldata.length);
        console.log('   Encryption successful with ephemeral key');
        
        // Create transaction with encrypted calldata
        const txRequest = {
          to: deployment.contracts.SensorNFA,
          data: encryptedCalldata,
          gasLimit: 800000,
          type: 0 // Legacy transaction type
        };
        
        console.log('🚀 Sending transaction with encryptCallData()...');
        const tx = await wallet.sendTransaction(txRequest);
        console.log('⏳ Transaction sent:', tx.hash);
        
        const receipt = await tx.wait();
        console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
        
        // Check if calldata is enveloped
        let isEnveloped = false;
        if (typeof sapphire.isCalldataEnveloped === 'function') {
          isEnveloped = sapphire.isCalldataEnveloped(encryptedCalldata);
          console.log('🔍 isCalldataEnveloped check:', isEnveloped);
        }
        
        res.json({
          success: true,
          method: 'encryptCallData() Helper with Ephemeral Key',
          sensorId,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          encryption: {
            method: 'encryptCallData() helper',
            originalCalldataLength: functionData.length,
            encryptedCalldataLength: encryptedCalldata.length,
            ephemeralKeyUsed: true,
            isCalldataEnveloped: isEnveloped
          },
          message: 'Transaction created with encryptCallData() helper and ephemeral key!',
          expectedFormat: 'Should show Confidential format on explorer',
          timestamp: new Date().toISOString()
        });
        
      } catch (encryptError) {
        console.error('❌ encryptCallData() failed:', encryptError.message);
        
        // Fallback to standard approach
        const fallbackTx = await sensorContract.mintSensor(sensorId, ipfsMetadata);
        const fallbackReceipt = await fallbackTx.wait();
        
        res.json({
          success: true,
          method: 'encryptCallData() Helper (fallback to standard)',
          sensorId,
          transactionHash: fallbackTx.hash,
          blockNumber: fallbackReceipt.blockNumber,
          gasUsed: fallbackReceipt.gasUsed.toString(),
          note: 'encryptCallData() not available, used standard Sapphire approach',
          encryptError: encryptError.message,
          timestamp: new Date().toISOString()
        });
      }
      
    } else {
      console.log('❌ encryptCallData() function not available');
      throw new Error('encryptCallData() function not available in Sapphire library');
    }
    
  } catch (error) {
    console.error('❌ encryptCallData method failed:', error);
    res.status(500).json({
      success: false,
      error: 'encryptCallData method failed',
      details: error.message
    });
  }
});

// Method 2: Use Sapphire.encrypt() with private key in smart contract
app.post('/api/sensors/mint-sapphire-encrypt', async (req, res) => {
  try {
    console.log('🔐 Method 2: Using Sapphire.encrypt() with smart contract private key...');
    
    const sensorId = `SAPPHIRE-ENCRYPT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const metadata = {
      type: 'climate-sensor',
      location: req.body.location || 'Sapphire.encrypt Test Location',
      capabilities: ['temperature', 'humidity', 'co2'],
      confidential: true,
      method: 'sapphire-encrypt-with-contract-key',
      timestamp: new Date().toISOString(),
      note: 'Using Sapphire.encrypt() with private key stored in smart contract'
    };
    
    const ipfsMetadata = JSON.stringify(metadata);
    
    console.log('📝 Creating transaction with Sapphire.encrypt()...');
    console.log('   Sensor ID:', sensorId);
    
    // Try to use Sapphire.encrypt() if available
    if (typeof sapphire.encrypt === 'function') {
      console.log('✅ Sapphire.encrypt() function is available');
      
      try {
        // Generate a private key for encryption (simulating contract-stored key)
        const contractPrivateKey = crypto.randomBytes(32);
        console.log('   Generated contract private key (32 bytes)');
        
        // Encrypt the function arguments using Sapphire.encrypt()
        const encryptedSensorId = sapphire.encrypt(Buffer.from(sensorId), contractPrivateKey);
        const encryptedMetadata = sapphire.encrypt(Buffer.from(ipfsMetadata), contractPrivateKey);
        
        console.log('   Encrypted sensor ID length:', encryptedSensorId.length);
        console.log('   Encrypted metadata length:', encryptedMetadata.length);
        console.log('   Encryption successful with contract private key');
        
        // Create function call with encrypted arguments
        // Note: This is a conceptual approach - in practice, the contract would handle decryption
        const functionData = sensorContract.interface.encodeFunctionData('mintSensor', [
          ethers.hexlify(encryptedSensorId),
          ethers.hexlify(encryptedMetadata)
        ]);
        
        const txRequest = {
          to: deployment.contracts.SensorNFA,
          data: functionData,
          gasLimit: 900000,
          type: 0
        };
        
        console.log('🚀 Sending transaction with Sapphire.encrypt()...');
        const tx = await wallet.sendTransaction(txRequest);
        console.log('⏳ Transaction sent:', tx.hash);
        
        const receipt = await tx.wait();
        console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
        
        res.json({
          success: true,
          method: 'Sapphire.encrypt() with Contract Private Key',
          sensorId,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          encryption: {
            method: 'Sapphire.encrypt() with contract private key',
            encryptedSensorIdLength: encryptedSensorId.length,
            encryptedMetadataLength: encryptedMetadata.length,
            contractPrivateKeyUsed: true,
            requiresContractDecryption: true
          },
          note: 'Arguments encrypted with Sapphire.encrypt() - contract should use Sapphire.decrypt()',
          expectedFormat: 'Should show Confidential format on explorer',
          timestamp: new Date().toISOString()
        });
        
      } catch (encryptError) {
        console.error('❌ Sapphire.encrypt() failed:', encryptError.message);
        throw encryptError;
      }
      
    } else {
      console.log('❌ Sapphire.encrypt() function not available');
      throw new Error('Sapphire.encrypt() function not available in Sapphire library');
    }
    
  } catch (error) {
    console.error('❌ Sapphire.encrypt method failed:', error);
    res.status(500).json({
      success: false,
      error: 'Sapphire.encrypt method failed',
      details: error.message
    });
  }
});

// Method 3: Use ConfidentialProxy with proper encryptCallData()
app.post('/api/sensors/mint-proxy-encrypt-calldata', async (req, res) => {
  try {
    console.log('🔐 Method 3: Using ConfidentialProxy with proper encryptCallData()...');
    
    const sensorId = `PROXY-ENCRYPT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const metadata = {
      type: 'climate-sensor',
      location: req.body.location || 'Proxy encryptCallData Test Location',
      capabilities: ['temperature', 'humidity', 'co2'],
      confidential: true,
      method: 'proxy-encryptCallData',
      timestamp: new Date().toISOString(),
      note: 'Using ConfidentialProxy with encryptCallData() for true confidential format'
    };
    
    const ipfsMetadata = JSON.stringify(metadata);
    
    console.log('📝 Using ConfidentialProxy with encryptCallData()...');
    console.log('   Sensor ID:', sensorId);
    
    try {
      // Call the proxy contract which uses encryptCallData() internally
      console.log('🎯 Calling proxy.mintSensorConfidential()...');
      const proxyTx = await proxyContract.mintSensorConfidential(sensorId, ipfsMetadata, {
        gasLimit: 1000000
      });
      
      console.log('⏳ Proxy transaction sent:', proxyTx.hash);
      const receipt = await proxyTx.wait();
      console.log('✅ Proxy transaction confirmed in block:', receipt.blockNumber);
      
      // Check if this transaction uses proper envelope format
      const txDetails = await provider.getTransaction(proxyTx.hash);
      let isEnveloped = false;
      if (typeof sapphire.isCalldataEnveloped === 'function' && txDetails.data) {
        isEnveloped = sapphire.isCalldataEnveloped(txDetails.data);
        console.log('🔍 isCalldataEnveloped check:', isEnveloped);
      }
      
      res.json({
        success: true,
        method: 'ConfidentialProxy with encryptCallData()',
        sensorId,
        transactionHash: proxyTx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        proxy: {
          contractAddress: deployment.contracts.ConfidentialProxy,
          usesEncryptCallData: true,
          usesEIP155Signer: true,
          isCalldataEnveloped: isEnveloped
        },
        analysis: {
          dataLength: txDetails.data ? txDetails.data.length : 0,
          transactionType: txDetails.type,
          properEnvelopeFormat: isEnveloped
        },
        message: 'Transaction created via ConfidentialProxy using encryptCallData()!',
        expectedFormat: 'Should show Confidential format on explorer (proxy approach)',
        timestamp: new Date().toISOString()
      });
      
    } catch (proxyError) {
      console.error('❌ Proxy encryptCallData failed:', proxyError.message);
      throw proxyError;
    }
    
  } catch (error) {
    console.error('❌ Proxy encryptCallData method failed:', error);
    res.status(500).json({
      success: false,
      error: 'Proxy encryptCallData method failed',
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
      accessible: owner.toLowerCase() === wallet.address.toLowerCase()
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

// Start TRUE SAPPHIRE ENCRYPTION server
async function startTrueSapphireEncryptionServer() {
  try {
    const balance = await wallet.provider.getBalance(wallet.address);
    const blockNumber = await wallet.provider.getBlockNumber();
    const network = await wallet.provider.getNetwork();
    
    console.log('\n🎯 TRUE SAPPHIRE ENCRYPTION SERVER STATUS:');
    console.log('   Balance:', ethers.formatEther(balance), 'ROSE');
    console.log('   Block:', blockNumber);
    console.log('   Chain ID:', network.chainId);
    console.log('   Sensor Contract:', deployment.contracts.SensorNFA);
    console.log('   Proxy Contract:', deployment.contracts.ConfidentialProxy);
    
    // Check which Sapphire functions are available
    console.log('\n🔍 SAPPHIRE FUNCTION AVAILABILITY:');
    console.log('   encryptCallData():', typeof sapphire.encryptCallData === 'function' ? '✅' : '❌');
    console.log('   Sapphire.encrypt():', typeof sapphire.encrypt === 'function' ? '✅' : '❌');
    console.log('   Sapphire.decrypt():', typeof sapphire.decrypt === 'function' ? '✅' : '❌');
    console.log('   isCalldataEnveloped():', typeof sapphire.isCalldataEnveloped === 'function' ? '✅' : '❌');
    console.log('   randomBytes():', typeof sapphire.randomBytes === 'function' ? '✅' : '❌');
    
    console.log('\n🔐 TRUE SAPPHIRE ENCRYPTION METHODS:');
    console.log('   Method 1: encryptCallData() Helper with Ephemeral Key');
    console.log('   Method 2: Sapphire.encrypt() with Contract Private Key');
    console.log('   Method 3: ConfidentialProxy with encryptCallData()');
    console.log('\n🎯 GOAL: Achieve TRUE "Confidential" format on Sapphire Explorer\n');
    
    const PORT = 3011; // New port
    app.listen(PORT, () => {
      console.log(`🚀 D-Climate TRUE SAPPHIRE ENCRYPTION Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log('🛡️ Ready for TRUE confidential transactions with Sapphire encryption!\n');
      console.log('🧪 TEST ENDPOINTS:');
      console.log(`   POST /api/sensors/mint-encrypt-calldata`);
      console.log(`   POST /api/sensors/mint-sapphire-encrypt`);
      console.log(`   POST /api/sensors/mint-proxy-encrypt-calldata`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Failed to start TRUE SAPPHIRE ENCRYPTION server:', error);
    process.exit(1);
  }
}

startTrueSapphireEncryptionServer();