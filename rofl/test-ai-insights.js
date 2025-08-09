const axios = require('axios');

async function testAIInsights() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🤖 Testing D-Climate AI Insights...\n');
  
  try {
    // Step 1: Test daily climate overview
    console.log('📊 1. Testing Daily Climate Overview...');
    const overviewResponse = await axios.post(`${baseUrl}/api/ai/insights/daily-overview`, {
      region: 'Malaysia',
      date: Math.floor(Date.now() / 1000)
    });
    console.log('✅ Daily overview generated!');
    console.log('AI Summary:', JSON.stringify(overviewResponse.data, null, 2));
    console.log('');
    
    // Step 2: Test regional climate snapshot
    console.log('🌍 2. Testing Regional Climate Snapshot...');
    const snapshotResponse = await axios.post(`${baseUrl}/api/ai/insights/regional-snapshot`, {
      region: 'Selangor',
      timeRange: {
        start: Math.floor(Date.now() / 1000) - (24 * 60 * 60), // 24 hours ago
        end: Math.floor(Date.now() / 1000)
      }
    });
    console.log('✅ Regional snapshot generated!');
    console.log('AI Analysis:', JSON.stringify(snapshotResponse.data, null, 2));
    console.log('');
    
    // Step 3: Test anomaly detection
    console.log('🚨 3. Testing Anomaly Detection...');
    const anomalyResponse = await axios.post(`${baseUrl}/api/ai/insights/anomaly-highlights`, {
      region: 'Southeast Asia',
      timeRange: {
        start: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60), // 7 days ago
        end: Math.floor(Date.now() / 1000)
      }
    });
    console.log('✅ Anomaly detection completed!');
    console.log('Anomalies found:', JSON.stringify(anomalyResponse.data, null, 2));
    console.log('');
    
    // Step 4: Test custom AI query
    console.log('💬 4. Testing Custom AI Query...');
    const queryResponse = await axios.post(`${baseUrl}/api/ai/insights/custom-query`, {
      query: "What are the climate trends in Malaysia this week?",
      context: {
        region: 'Malaysia',
        timeframe: 'week',
        includeComparisons: true
      }
    });
    console.log('✅ Custom AI query processed!');
    console.log('AI Response:', JSON.stringify(queryResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAIInsights();