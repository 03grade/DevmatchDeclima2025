const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');

const app = express();
const port = 3001;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: {
      hasPrivateKey: !!process.env.PRIVATE_KEY,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasSensorContract: !!process.env.SENSOR_NFA_CONTRACT,
      hasDataContract: !!process.env.DATA_REGISTRY_CONTRACT,
      hasRewardContract: !!process.env.REWARD_DISTRIBUTOR_CONTRACT,
      hasDAOContract: !!process.env.DAO_GOVERNANCE_CONTRACT,
      contractAddresses: {
        sensor: process.env.SENSOR_NFA_CONTRACT,
        data: process.env.DATA_REGISTRY_CONTRACT,
        reward: process.env.REWARD_DISTRIBUTOR_CONTRACT,
        dao: process.env.DAO_GOVERNANCE_CONTRACT
      }
    }
  });
});

// Simple sensor minting endpoint
app.post('/api/sensors/mint', (req, res) => {
  console.log('📝 Sensor mint request received:', req.body);
  
  // Generate a mock sensor ID for testing
  const sensorId = `TEST-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  
  res.json({
    success: true,
    sensorId: sensorId,
    message: 'Mock sensor minted successfully',
    contractAddress: process.env.SENSOR_NFA_CONTRACT || 'NOT_SET',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🚀 D-Climate ROFL Test Server running on http://localhost:${port}`);
  console.log(`📋 Environment Status:`);
  console.log(`   Private Key: ${process.env.PRIVATE_KEY ? '✅ Loaded' : '❌ Missing'}`);
  console.log(`   OpenAI API: ${process.env.OPENAI_API_KEY ? '✅ Loaded' : '❌ Missing'}`);
  console.log(`   Sensor Contract: ${process.env.SENSOR_NFA_CONTRACT ? '✅ Loaded' : '❌ Missing'}`);
  console.log(`   Data Contract: ${process.env.DATA_REGISTRY_CONTRACT ? '✅ Loaded' : '❌ Missing'}`);
  console.log(`   Reward Contract: ${process.env.REWARD_DISTRIBUTOR_CONTRACT ? '✅ Loaded' : '❌ Missing'}`);
  console.log(`   DAO Contract: ${process.env.DAO_GOVERNANCE_CONTRACT ? '✅ Loaded' : '❌ Missing'}`);
});