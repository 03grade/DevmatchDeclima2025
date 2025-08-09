require('dotenv').config({ path: '../.env' });
const ethers = require('ethers');
const { wrap } = require('@oasisprotocol/sapphire-paratime');

async function testContractDirect() {
  console.log('🔍 TESTING CONTRACTS DIRECTLY\n');
  
  // Setup
  const plainProvider = new ethers.JsonRpcProvider('https://testnet.sapphire.oasis.dev');
  const provider = wrap(plainProvider);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('Wallet:', wallet.address);
  
  // Simplified ABIs for testing
  const sensorABI = [
    "function sensorExists(string memory sensorId) external view returns (bool)",
    "function sensorIdToTokenId(string memory sensorId) external view returns (uint256)",
    "function ownerOf(uint256 tokenId) external view returns (address)",
    "function sensorMetadata(uint256 tokenId) external view returns (tuple(string sensorId, uint256 reputationScore, uint256 mintTimestamp, string ipfsMetadata, bool isActive, uint256 totalSubmissions, uint256 lastSubmission))",
    "function isSensorActiveAndOwned(string calldata sensorId) external view returns (bool)"
  ];
  
  const sensorContract = new ethers.Contract(process.env.SENSOR_NFA_CONTRACT, sensorABI, wallet);
  
  const sensorId = 'SAPPHIRE-1754674947697-91329667';
  
  try {
    console.log('1️⃣ Testing sensor existence...');
    const exists = await sensorContract.sensorExists(sensorId);
    console.log('Sensor exists:', exists);
    
    if (exists) {
      console.log('\n2️⃣ Getting token ID...');
      const tokenId = await sensorContract.sensorIdToTokenId(sensorId);
      console.log('Token ID:', tokenId.toString());
      
      console.log('\n3️⃣ Getting owner...');
      const owner = await sensorContract.ownerOf(tokenId);
      console.log('Owner:', owner);
      console.log('Our wallet:', wallet.address);
      console.log('Owner matches:', owner.toLowerCase() === wallet.address.toLowerCase());
      
      console.log('\n4️⃣ Getting metadata...');
      const metadata = await sensorContract.sensorMetadata(tokenId);
      console.log('Metadata:', {
        sensorId: metadata.sensorId,
        reputationScore: metadata.reputationScore.toString(),
        isActive: metadata.isActive,
        totalSubmissions: metadata.totalSubmissions.toString()
      });
      
      console.log('\n5️⃣ Testing isSensorActiveAndOwned...');
      const activeAndOwned = await sensorContract.isSensorActiveAndOwned(sensorId);
      console.log('Is active and owned:', activeAndOwned);
      
      if (!activeAndOwned) {
        console.log('\n❌ ISSUE FOUND: Sensor is not recognized as active and owned!');
        console.log('Possible reasons:');
        console.log('- Sensor not active:', !metadata.isActive);
        console.log('- Wrong owner:', owner.toLowerCase() !== wallet.address.toLowerCase());
      } else {
        console.log('\n✅ Sensor is active and owned - DataRegistry issue is elsewhere');
      }
    }
    
  } catch (error) {
    console.error('❌ Contract test failed:', error.message);
  }
}

testContractDirect();