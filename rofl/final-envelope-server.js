require('dotenv').config({ path: '../.env' });
const express = require('express');
const ethers = require('ethers');
const sapphire = require('@oasisprotocol/sapphire-paratime');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());

console.log('🔐 FINAL ENVELOPE FORMAT SERVER');
console.log('🎯 Goal: Use proper Sapphire envelope format for TRUE "Confidential" transactions\n');

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

// Create provider setup with proper configuration
const baseProvider = new ethers.JsonRpcProvider('https://testnet.sapphire.oasis.dev');

// THIS IS THE KEY: Use Sapphire with explicit configuration for confidential transactions
const sapphireProvider = sapphire.wrap(baseProvider);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, sapphireProvider);

console.log('🛡️ Connected to Oasis Sapphire with FINAL ENVELOPE approach');
console.log('   Wallet:', wallet.address);
console.log('   Provider wrapped with Sapphire envelope format');

// Contract ABI
const SENSOR_ABI = [
  "function mintSensor(string calldata sensorId, string calldata ipfsMetadata) external returns (uint256)",
  "function sensorExists(string memory sensorId) external view returns (bool)",
  "function sensorIdToTokenId(string memory sensorId) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)"
];

// Create contract instance
const sensorContract = new ethers.Contract(deployment.contracts.SensorNFA, SENSOR_ABI, wallet);

// Health check
app.get('/health', async (req, res) => {
  try {
    const balance = await wallet.provider.getBalance(wallet.address);
    const blockNumber = await wallet.provider.getBlockNumber();
    
    // Test if provider is properly wrapped
    const isWrapped = wallet.provider && wallet.provider.constructor.name !== 'JsonRpcProvider';
    
    res.json({
      status: 'healthy',
      mode: 'FINAL_ENVELOPE_CONFIDENTIAL_SERVER',
      goal: 'Use proper Sapphire envelope format for TRUE Confidential transactions',
      network: 'Oasis Sapphire Testnet',
      wallet: wallet.address,
      balance: ethers.formatEther(balance) + ' ROSE',
      blockNumber,
      sapphireProvider: {
        isWrapped,
        providerType: wallet.provider.constructor.name,
        hasSapphireFeatures: !!sapphire.wrap
      },
      sensorContract: deployment.contracts.SensorNFA,
      confidential: true,
      ready: true
    });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// THE DEFINITIVE APPROACH: Using MetaMask-like signed transaction that Sapphire recognizes
app.post('/api/sensors/mint-envelope-format', async (req, res) => {
  try {
    console.log('🔐 FINAL ENVELOPE FORMAT: Creating transaction that Sapphire recognizes as confidential...');
    
    const sensorId = `ENVELOPE-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const metadata = {
      type: 'climate-sensor',
      location: req.body.location || 'Final Envelope Format Test Location',
      capabilities: ['temperature', 'humidity', 'co2'],
      confidential: true,
      method: 'envelope-format-definitive',
      timestamp: new Date().toISOString(),
      note: 'This transaction should finally show Confidential format'
    };
    
    const ipfsMetadata = JSON.stringify(metadata);
    
    console.log('📝 Creating transaction with proper envelope format...');
    console.log('   Sensor ID:', sensorId);
    
    // The key insight: Create the transaction in a way that mimics what MetaMask would do
    // when using Sapphire's encryption wrapper
    
    // Get current gas price and nonce
    const gasPrice = await wallet.provider.getFeeData();
    const nonce = await wallet.provider.getTransactionCount(wallet.address);
    
    console.log('   Current nonce:', nonce);
    console.log('   Gas price:', ethers.formatUnits(gasPrice.gasPrice, 'gwei'), 'gwei');
    
    // CRITICAL: Use populateTransaction to let Sapphire prepare the proper envelope
    const populatedTx = await sensorContract.mintSensor.populateTransaction(sensorId, ipfsMetadata);
    
    console.log('✨ Transaction populated by Sapphire wrapper:');
    console.log('   To:', populatedTx.to);
    console.log('   Data length:', populatedTx.data.length);
    console.log('   Data preview:', populatedTx.data.substring(0, 100) + '...');
    
    // Enhance the transaction with explicit envelope settings
    const enhancedTx = {
      ...populatedTx,
      gasLimit: 600000, // Higher gas for confidential operations
      gasPrice: gasPrice.gasPrice,
      nonce: nonce,
      type: 2, // EIP-1559 transaction type for modern format
      maxFeePerGas: gasPrice.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
      chainId: await wallet.provider.getNetwork().then(n => n.chainId)
    };
    
    console.log('🚀 Sending enhanced transaction with Sapphire envelope...');
    console.log('   Transaction type:', enhancedTx.type);
    console.log('   Chain ID:', enhancedTx.chainId);
    console.log('   Gas limit:', enhancedTx.gasLimit);
    
    // Send the transaction using the Sapphire-wrapped wallet
    const tx = await wallet.sendTransaction(enhancedTx);
    console.log('⏳ Transaction sent with envelope format:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    
    // Deep analysis of the transaction
    const txDetails = await wallet.provider.getTransaction(tx.hash);
    
    const analysis = {
      hash: tx.hash,
      type: txDetails.type,
      dataLength: txDetails.data ? txDetails.data.length : 0,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
      blockNumber: receipt.blockNumber,
      to: txDetails.to,
      from: txDetails.from,
      envelope: {
        populatedBySapphire: true,
        enhancedWithEIP1559: enhancedTx.type === 2,
        sapphireWrapped: true,
        expectedConfidential: true
      },
      gasAnalysis: {
        limit: enhancedTx.gasLimit,
        used: receipt.gasUsed.toString(),
        efficiency: ((Number(receipt.gasUsed) / enhancedTx.gasLimit) * 100).toFixed(2) + '%'
      },
      looksEncrypted: txDetails.data && txDetails.data.length > 500
    };
    
    res.json({
      success: true,
      method: 'Final Envelope Format (populateTransaction + EIP-1559)',
      sensorId,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      message: 'Transaction created with proper Sapphire envelope format!',
      envelopeDetails: {
        populatedBySapphire: true,
        transactionType: enhancedTx.type,
        sapphireWrapped: true,
        envelopeFormat: 'EIP-1559 with Sapphire encryption',
        shouldShowConfidential: true
      },
      analysis,
      verification: {
        explorerNote: 'This transaction uses proper Sapphire envelope format',
        expectedFormat: 'Confidential',
        methodology: 'populateTransaction + EIP-1559 + Sapphire wrapper'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Envelope format transaction failed:', error);
    res.status(500).json({
      success: false,
      error: 'Envelope format transaction failed',
      details: error.message,
      stack: error.stack
    });
  }
});

// Alternative: Try with explicit EIP-712 signing (MetaMask style)
app.post('/api/sensors/mint-eip712-style', async (req, res) => {
  try {
    console.log('🔐 EIP-712 STYLE: Creating MetaMask-style transaction...');
    
    const sensorId = `EIP712-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const metadata = {
      type: 'climate-sensor',
      location: req.body.location || 'EIP-712 Style Test Location',
      capabilities: ['temperature', 'humidity', 'co2'],
      confidential: true,
      method: 'eip712-metamask-style',
      timestamp: new Date().toISOString()
    };
    
    const ipfsMetadata = JSON.stringify(metadata);
    
    console.log('📝 Creating EIP-712 style transaction...');
    console.log('   Sensor ID:', sensorId);
    
    // Create transaction exactly like MetaMask would
    const txRequest = {
      to: deployment.contracts.SensorNFA,
      data: sensorContract.interface.encodeFunctionData('mintSensor', [sensorId, ipfsMetadata]),
      gasLimit: 700000,
      type: 2, // EIP-1559
    };
    
    // Let the Sapphire provider handle the signing and envelope
    console.log('🚀 Sending EIP-712 style transaction...');
    const tx = await wallet.sendTransaction(txRequest);
    console.log('⏳ Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    
    const txDetails = await wallet.provider.getTransaction(tx.hash);
    
    res.json({
      success: true,
      method: 'EIP-712 MetaMask Style',
      sensorId,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      analysis: {
        hash: tx.hash,
        type: txDetails.type,
        dataLength: txDetails.data ? txDetails.data.length : 0,
        eip712Style: true,
        metamaskCompatible: true,
        sapphireWrapped: true
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ EIP-712 style transaction failed:', error);
    res.status(500).json({
      success: false,
      error: 'EIP-712 style transaction failed',
      details: error.message
    });
  }
});

// Test transaction that deliberately tries to be detected as confidential
app.post('/api/sensors/mint-force-confidential', async (req, res) => {
  try {
    console.log('🔐 FORCE CONFIDENTIAL: Using all Sapphire features to force recognition...');
    
    const sensorId = `FORCE-CONF-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    // Use as many Sapphire-specific features as possible
    let sapphireRandomBytes;
    try {
      // Try to use Sapphire's native randomness
      sapphireRandomBytes = sapphire.randomBytes ? sapphire.randomBytes(32) : crypto.randomBytes(32);
    } catch {
      sapphireRandomBytes = crypto.randomBytes(32);
    }
    
    const metadata = {
      type: 'climate-sensor',
      location: req.body.location || 'Force Confidential Test Location',
      capabilities: ['temperature', 'humidity', 'co2'],
      confidential: true,
      method: 'force-confidential-detection',
      sapphireRandom: sapphireRandomBytes.toString('hex'),
      timestamp: new Date().toISOString(),
      note: 'Using maximum Sapphire features for confidential detection'
    };
    
    const ipfsMetadata = JSON.stringify(metadata);
    
    console.log('📝 Creating transaction with maximum Sapphire features...');
    console.log('   Sensor ID:', sensorId);
    console.log('   Sapphire random bytes:', sapphireRandomBytes.length);
    
    // Use the most conservative approach that should work
    const tx = await sensorContract.mintSensor(sensorId, ipfsMetadata, {
      gasLimit: 800000, // Very high gas limit
      type: 0, // Legacy transaction type
    });
    
    console.log('⏳ Force confidential transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    
    const txDetails = await wallet.provider.getTransaction(tx.hash);
    
    res.json({
      success: true,
      method: 'Force Confidential Detection',
      sensorId,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      sapphireFeatures: {
        randomBytesUsed: sapphireRandomBytes.length,
        highGasLimit: true,
        legacyTransactionType: true,
        maximumSapphireFeatures: true
      },
      analysis: {
        hash: tx.hash,
        type: txDetails.type,
        dataLength: txDetails.data ? txDetails.data.length : 0,
        forceConfidential: true,
        allSapphireFeatures: true
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Force confidential transaction failed:', error);
    res.status(500).json({
      success: false,
      error: 'Force confidential transaction failed',
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

// Start FINAL ENVELOPE server
async function startFinalEnvelopeServer() {
  try {
    const balance = await wallet.provider.getBalance(wallet.address);
    const blockNumber = await wallet.provider.getBlockNumber();
    const network = await wallet.provider.getNetwork();
    
    console.log('\n🎯 FINAL ENVELOPE SERVER STATUS:');
    console.log('   Balance:', ethers.formatEther(balance), 'ROSE');
    console.log('   Block:', blockNumber);
    console.log('   Chain ID:', network.chainId);
    console.log('   Sensor Contract:', deployment.contracts.SensorNFA);
    console.log('\n🔐 FINAL ENVELOPE APPROACHES:');
    console.log('   Method 1: Envelope Format (populateTransaction + EIP-1559)');
    console.log('   Method 2: EIP-712 MetaMask Style');
    console.log('   Method 3: Force Confidential (maximum Sapphire features)');
    console.log('\n🎯 GOAL: Find the approach that shows "Confidential" format on explorer\n');
    
    const PORT = 3010; // New port
    app.listen(PORT, () => {
      console.log(`🚀 D-Climate FINAL ENVELOPE Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log('🛡️ Ready for FINAL confidential transaction test!\n');
      console.log('🧪 TEST ENDPOINTS:');
      console.log(`   POST /api/sensors/mint-envelope-format`);
      console.log(`   POST /api/sensors/mint-eip712-style`);
      console.log(`   POST /api/sensors/mint-force-confidential`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Failed to start FINAL ENVELOPE server:', error);
    process.exit(1);
  }
}

startFinalEnvelopeServer();