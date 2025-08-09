const express = require('express');

// Hardcode the values for testing (since .env has issues)
process.env.SENSOR_NFA_CONTRACT = '0xdE2D86cE2A540Be6F71b714F2386020b124c9141';
process.env.DATA_REGISTRY_CONTRACT = '0xB02104F64D2ED472Fa4023d2d4D45486163598d3';
process.env.REWARD_DISTRIBUTOR_CONTRACT = '0x31Bc258a6f1984301c1E69aFC9aC5bEf38b9C134';
process.env.DAO_GOVERNANCE_CONTRACT = '0x4f8917C300Cab8738C9800bf410CBb729e3884da';
process.env.OPENAI_API_KEY = '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';
process.env.PRIVATE_KEY = '0x6275efe0945c0a8f17d5bc4867788fb5aecc796c7430630bf97046d0d3734275';

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
    contractAddress: process.env.SENSOR_NFA_CONTRACT,
    timestamp: new Date().toISOString()
  });
});

// Data submission endpoints
app.post('/api/data/submit', (req, res) => {
  console.log('🌡️ Climate data submission received:', req.body);
  
  // Mock validation
  const { temperature, humidity, co2 } = req.body;
  if (temperature > 60 || humidity > 100 || co2 < 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid climate data values',
      details: 'Temperature must be -50 to 60°C, humidity 0-100%, CO2 must be positive'
    });
  }
  
  res.json({
    success: true,
    message: 'Climate data submitted and encrypted',
    ipfsCid: `bafybeig6xv5nwphfmvcnektpnojts44jqcuam7brakmxjxxe3qns6btl${Math.random().toString(36).substring(2, 8)}`,
    recordHash: `0x${Buffer.from(JSON.stringify(req.body)).toString('hex').substring(0, 64)}`,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/data/sensor/:sensorId', (req, res) => {
  console.log('🔍 Data retrieval request for sensor:', req.params.sensorId);
  
  res.json({
    sensorId: req.params.sensorId,
    encryptedData: 'AES256:encrypted_climate_data_blob',
    recordCount: Math.floor(Math.random() * 100) + 1,
    lastUpdate: new Date().toISOString()
  });
});

// Reward system endpoints
app.get('/api/rewards/calculate/:sensorId', (req, res) => {
  console.log('💰 Reward calculation for sensor:', req.params.sensorId);
  
  const baseReward = 10;
  const reputationMultiplier = 1.2;
  const totalReward = baseReward * reputationMultiplier;
  
  res.json({
    sensorId: req.params.sensorId,
    baseReward: baseReward,
    reputationMultiplier: reputationMultiplier,
    totalReward: totalReward,
    currency: 'ROSE',
    calculation: 'Base (10 ROSE) × Reputation (1.2x) = 12 ROSE'
  });
});

app.get('/api/rewards/history/:sensorId', (req, res) => {
  res.json({
    sensorId: req.params.sensorId,
    totalEarned: 156.8,
    currency: 'ROSE',
    recentRewards: [
      { date: '2025-08-08', amount: 12, status: 'claimed' },
      { date: '2025-08-07', amount: 11.5, status: 'pending' },
      { date: '2025-08-06', amount: 12.2, status: 'claimed' }
    ]
  });
});

app.post('/api/rewards/distribute', (req, res) => {
  console.log('🎯 Reward distribution request:', req.body);
  
  res.json({
    success: true,
    distributedAmount: 12.5,
    currency: 'ROSE',
    transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/rewards/claim', (req, res) => {
  console.log('💎 Reward claiming request:', req.body);
  
  res.json({
    success: true,
    claimedAmount: 25.8,
    currency: 'ROSE',
    transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
    walletAddress: req.body.walletAddress
  });
});

// AI insights endpoints
app.post('/api/ai/insights/daily-overview', (req, res) => {
  console.log('🤖 AI daily overview request:', req.body);
  
  res.json({
    type: 'daily-overview',
    region: req.body.region || 'Global',
    summary: `Climate data for ${req.body.region || 'Global'} shows moderate temperatures averaging 28°C with 75% humidity. CO2 levels stable at 420 ppm. No significant anomalies detected.`,
    metrics: {
      averageTemperature: 28.5,
      averageHumidity: 75.2,
      averageCO2: 420.8,
      sensorCount: 42,
      dataQuality: 'High'
    },
    generatedAt: new Date().toISOString()
  });
});

app.post('/api/ai/insights/regional-snapshot', (req, res) => {
  res.json({
    type: 'regional-snapshot',
    region: req.body.region,
    analysis: `Regional analysis for ${req.body.region} indicates stable climate patterns with typical seasonal variations. Air quality remains within acceptable ranges.`,
    trends: ['Slight temperature increase', 'Humidity stable', 'CO2 levels normal'],
    recommendations: ['Continue monitoring', 'Deploy additional sensors in urban areas']
  });
});

app.post('/api/ai/insights/anomaly-highlights', (req, res) => {
  res.json({
    type: 'anomaly-highlights',
    anomaliesDetected: 2,
    highlights: [
      'Unusual CO2 spike detected in Sector 7A - investigating sensor calibration',
      'Temperature readings 3°C above normal in coastal areas - possible equipment malfunction'
    ],
    severity: 'Low',
    actionRequired: false
  });
});

app.post('/api/ai/insights/custom-query', (req, res) => {
  console.log('💬 Custom AI query:', req.body.query);
  
  res.json({
    query: req.body.query,
    response: `Based on current climate data trends in the specified region, temperatures have been relatively stable with minor fluctuations. The data suggests normal seasonal patterns with good air quality indices.`,
    confidence: 0.87,
    sources: ['Real-time sensor network', 'Historical climate database']
  });
});

// Data explorer endpoints
app.get('/api/data/explore', (req, res) => {
  console.log('🔍 Data explorer request:', req.query);
  
  res.json({
    region: req.query.region || 'Global',
    timeRange: req.query.timeRange || 'today',
    data: [
      { timestamp: new Date().toISOString(), temperature: 28.5, humidity: 75, co2: 420 },
      { timestamp: new Date(Date.now() - 3600000).toISOString(), temperature: 27.8, humidity: 78, co2: 418 }
    ],
    aggregations: {
      averageTemperature: 28.2,
      averageHumidity: 76.5,
      averageCO2: 419,
      sensorCount: 15
    },
    pagination: {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      total: 150,
      pages: 15
    }
  });
});

app.get('/api/data/export', (req, res) => {
  res.json({
    format: req.query.format || 'csv',
    recordCount: 1250,
    fileSize: '2.4 MB',
    downloadUrl: '/download/climate-data-export.csv',
    generatedAt: new Date().toISOString()
  });
});

app.get('/api/data/realtime', (req, res) => {
  res.json({
    newData: [
      { sensorId: 'SENS001', temperature: 29.1, timestamp: new Date().toISOString() },
      { sensorId: 'SENS002', temperature: 27.5, timestamp: new Date().toISOString() }
    ],
    lastUpdate: Math.floor(Date.now() / 1000),
    activeStreams: 8
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
  console.log(`\n🎯 Ready to test APIs!`);
});