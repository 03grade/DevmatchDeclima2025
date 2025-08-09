require('dotenv').config({ path: '../.env' });
const axios = require('axios');

async function testOpenAI() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🧪 Testing OpenAI Configuration...\n');
  console.log('Environment variables:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
  console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log('');
  
  try {
    // Test OpenAI connection
    console.log('🔗 Testing OpenAI connection...');
    const response = await axios.get(`${baseUrl}/api/ai/public/test-connection`);
    
    if (response.data.success) {
      console.log('✅ OpenAI connection successful!');
      console.log('Message:', response.data.message);
    } else {
      console.log('❌ OpenAI connection failed!');
      console.log('Error:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
}

testOpenAI(); 