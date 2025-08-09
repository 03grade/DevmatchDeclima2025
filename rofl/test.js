require('dotenv').config({ path: '../.env' });

console.log('Environment variables:');
console.log('PRIVATE_KEY:', process.env.PRIVATE_KEY ? 'exists' : 'missing');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'exists' : 'missing');
console.log('SENSOR_NFA_CONTRACT:', process.env.SENSOR_NFA_CONTRACT ? 'exists' : 'missing');

console.log('Current working directory:', process.cwd());
console.log('Node version:', process.version);