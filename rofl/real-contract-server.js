const express = require('express');
const { ethers } = require('ethers');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = 3001;

app.use(express.json());

// Real Oasis Sapphire connection
const provider = new ethers.JsonRpcProvider('https://testnet.sapphire.oasis.dev');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Real Contract ABIs (matching deployed contracts)
const SENSOR_NFA_ABI = [
  "function mintSensor(string calldata sensorId, string calldata ipfsMetadata) external returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function sensorIdToTokenId(string memory sensorId) external view returns (uint256)",
  "function sensorMetadata(uint256 tokenId) external view returns (tuple(string sensorId, uint256 reputationScore, uint256 mintTimestamp, string ipfsMetadata, bool isActive, uint256 totalSubmissions, uint256 lastSubmission))",
  "function sensorExists(string memory sensorId) external view returns (bool)"
];

const DATA_REGISTRY_ABI = [
  "function submitDataBatch(string memory sensorId, string memory cid, bytes memory encryptedKey, bytes32 recordHash) external",
  "function getBatchData(string memory sensorId, uint256 batchIndex) external view returns (tuple(string cid, bytes32 recordHash, uint256 timestamp, bool verified))",
  "function getBatchCount(string memory sensorId) external view returns (uint256)"
];

const REWARD_DISTRIBUTOR_ABI = [
  "function rewardSensor(string memory sensorId) external",
  "function calculateReward(string memory sensorId) external view returns (uint256)",
  "function getRewardHistory(string memory sensorId) external view returns (tuple(uint256 amount, uint256 timestamp)[] memory)"
];

// Real Contract Instances
const sensorContract = new ethers.Contract(process.env.SENSOR_NFA_CONTRACT, SENSOR_NFA_ABI, wallet);
const dataContract = new ethers.Contract(process.env.DATA_REGISTRY_CONTRACT, DATA_REGISTRY_ABI, wallet);
const rewardContract = new ethers.Contract(process.env.REWARD_DISTRIBUTOR_CONTRACT, REWARD_DISTRIBUTOR_ABI, wallet);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mode: 'REAL_BLOCKCHAIN_MODE',
    network: 'Oasis Sapphire Testnet',
    contracts: {
      sensor: process.env.SENSOR_NFA_CONTRACT,
      data: process.env.DATA_REGISTRY_CONTRACT,
      reward: process.env.REWARD_DISTRIBUTOR_CONTRACT,
      dao: process.env.DAO_GOVERNANCE_CONTRACT
    },
    wallet: wallet.address,
    ready: true
  });
});

// REAL SENSOR MINTING
app.post('/api/sensors/mint', async (req, res) => {
  try {
    console.log('🔗 REAL Sensor minting request:', req.body);
    
    // Generate real sensor ID
    const sensorId = `REAL-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    console.log('📝 Calling real smart contract...');
    
    // Create IPFS metadata for the sensor
    const ipfsMetadata = JSON.stringify({
      type: 'climate-sensor',
      location: req.body.location || 'Unknown',
      capabilities: ['temperature', 'humidity', 'co2'],
      created: new Date().toISOString()
    });
    
    // REAL BLOCKCHAIN TRANSACTION
    const tx = await sensorContract.mintSensor(sensorId, ipfsMetadata);
    console.log('⏳ Transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    
    res.json({
      success: true,
      sensorId: sensorId,
      message: 'REAL sensor minted on Oasis Sapphire!',
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      contractAddress: process.env.SENSOR_NFA_CONTRACT,
      gasUsed: receipt.gasUsed.toString(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Real minting error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mint sensor on blockchain',
      details: error.message
    });
  }
});

// REAL DATA SUBMISSION
app.post('/api/data/submit', async (req, res) => {
  try {
    console.log('🌡️ REAL Climate data submission:', req.body);
    
    const { sensorId, timestamp, temperature, humidity, co2 } = req.body;
    
    // Real data validation
    if (temperature < -50 || temperature > 60) {
      return res.status(400).json({ error: 'Invalid temperature range' });
    }
    if (humidity < 0 || humidity > 100) {
      return res.status(400).json({ error: 'Invalid humidity range' });
    }
    if (co2 < 300 || co2 > 10000) {
      return res.status(400).json({ error: 'Invalid CO2 range' });
    }
    
    // Create real record hash
    const dataString = JSON.stringify({ sensorId, timestamp, temperature, humidity, co2 });
    const recordHash = ethers.keccak256(ethers.toUtf8Bytes(dataString));
    
    // For hackathon: simplified IPFS (would be real IPFS in production)
    const mockCid = `bafybeig6xv5nwphfmvcnektpnojts44jqcuam7brakmxjxxe3qns6btl${Math.random().toString(36).substring(2, 8)}`;
    const mockEncryptedKey = ethers.randomBytes(32);
    
    console.log('📝 Submitting to real smart contract...');
    
    // REAL BLOCKCHAIN TRANSACTION
    const tx = await dataContract.submitDataBatch(sensorId, mockCid, mockEncryptedKey, recordHash);
    console.log('⏳ Data submission transaction:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Data submitted in block:', receipt.blockNumber);
    
    res.json({
      success: true,
      message: 'REAL climate data submitted to blockchain!',
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      recordHash: recordHash,
      ipfsCid: mockCid,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Real data submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit data to blockchain',
      details: error.message
    });
  }
});

// REAL REWARD CALCULATION
app.get('/api/rewards/calculate/:sensorId', async (req, res) => {
  try {
    console.log('💰 REAL Reward calculation for:', req.params.sensorId);
    
    // REAL BLOCKCHAIN CALL
    const rewardAmount = await rewardContract.calculateReward(req.params.sensorId);
    
    res.json({
      success: true,
      sensorId: req.params.sensorId,
      rewardAmount: ethers.formatEther(rewardAmount),
      currency: 'ROSE',
      calculated: 'REAL blockchain calculation',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Real reward calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate reward from blockchain',
      details: error.message
    });
  }
});

// REAL REWARD DISTRIBUTION
app.post('/api/rewards/distribute/:sensorId', async (req, res) => {
  try {
    console.log('🎯 REAL Reward distribution for:', req.params.sensorId);
    
    // REAL BLOCKCHAIN TRANSACTION
    const tx = await rewardContract.rewardSensor(req.params.sensorId);
    console.log('⏳ Reward distribution transaction:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Reward distributed in block:', receipt.blockNumber);
    
    res.json({
      success: true,
      message: 'REAL ROSE tokens distributed!',
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Real reward distribution error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to distribute rewards on blockchain',
      details: error.message
    });
  }
});

// Check sensor ownership (REAL)
app.get('/api/sensors/:sensorId/owner', async (req, res) => {
  try {
    // First check if sensor exists
    const exists = await sensorContract.sensorExists(req.params.sensorId);
    if (!exists) {
      return res.status(404).json({ error: 'Sensor not found on blockchain' });
    }
    
    // Get token ID from sensor ID
    const tokenId = await sensorContract.sensorIdToTokenId(req.params.sensorId);
    
    // Get owner and metadata
    const owner = await sensorContract.ownerOf(tokenId);
    const metadata = await sensorContract.sensorMetadata(tokenId);
    
    res.json({
      sensorId: req.params.sensorId,
      tokenId: tokenId.toString(),
      owner: owner,
      createdAt: metadata.mintTimestamp.toString(),
      reputationScore: metadata.reputationScore.toString(),
      isActive: metadata.isActive,
      totalSubmissions: metadata.totalSubmissions.toString(),
      ipfsMetadata: metadata.ipfsMetadata,
      verified: 'REAL blockchain data'
    });
  } catch (error) {
    console.error('Error getting sensor owner:', error);
    res.status(404).json({ error: 'Sensor not found on blockchain' });
  }
});

// Get data batch count (REAL)
app.get('/api/data/:sensorId/count', async (req, res) => {
  try {
    const count = await dataContract.getBatchCount(req.params.sensorId);
    res.json({
      sensorId: req.params.sensorId,
      batchCount: count.toString(),
      source: 'REAL blockchain data'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get batch count from blockchain' });
  }
});

app.listen(port, async () => {
  try {
    // Test blockchain connection
    const balance = await provider.getBalance(wallet.address);
    const blockNumber = await provider.getBlockNumber();
    
    console.log(`🚀 D-Climate REAL BLOCKCHAIN Server running on http://localhost:${port}`);
    console.log(`🔗 Connected to Oasis Sapphire Testnet`);
    console.log(`📋 Status:`);
    console.log(`   Wallet: ${wallet.address}`);
    console.log(`   Balance: ${ethers.formatEther(balance)} ROSE`);
    console.log(`   Block: ${blockNumber}`);
    console.log(`   Sensor Contract: ${process.env.SENSOR_NFA_CONTRACT}`);
    console.log(`   Data Contract: ${process.env.DATA_REGISTRY_CONTRACT}`);
    console.log(`   Reward Contract: ${process.env.REWARD_DISTRIBUTOR_CONTRACT}`);
    console.log(`\n🎯 READY FOR REAL BLOCKCHAIN TRANSACTIONS!`);
  } catch (error) {
    console.error('❌ Failed to connect to blockchain:', error.message);
  }
});