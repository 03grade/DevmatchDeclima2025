// Oasis Protocol Configuration
export const OASIS_CONFIG = {
  // Sapphire Testnet Configuration
  sapphire: {
    chainId: 0x5aff, // Sapphire Testnet
    rpcUrl: 'https://testnet.sapphire.oasis.dev',
    name: 'Sapphire Testnet',
    currency: {
      name: 'TEST',
      symbol: 'TEST',
      decimals: 18
    },
    blockExplorer: 'https://explorer.oasis.io/testnet/sapphire'
  },
  
  // Smart Contract Addresses (to be deployed)
  contracts: {
    nfaRegistry: '', // NFA Registry Contract
    dataMarketplace: '', // Data Marketplace Contract
    rewardDistributor: '', // Reward Distribution Contract
    dataValidator: '' // Data Validation Contract
  },
  
  // ROFL Configuration
  rofl: {
    appId: '', // ROFL App ID (to be registered)
    endpoint: 'https://testnet.sapphire.oasis.dev/rofl',
    batchSize: 100, // Data points per batch
    validationThreshold: 5 // Minimum readings for sensor validation
  },
  
  // IPFS Configuration
  ipfs: {
    gateway: 'https://ipfs.io/ipfs/',
    api: 'https://api.pinata.cloud/pinning/pinFileToIPFS'
  },
  
  // Encryption Configuration
  encryption: {
    algorithm: 'AES-256-GCM',
    keyLength: 32,
    ivLength: 16
  }
};

// Sensor validation parameters
export const SENSOR_VALIDATION = {
  minReadings: 5,
  maxTimeGap: 300000, // 5 minutes in milliseconds
  temperatureRange: [-50, 60], // Celsius
  humidityRange: [0, 100], // Percentage
  co2Range: [300, 5000], // PPM
  airQualityRange: [0, 500] // AQI
};

// Data quality scoring
export const QUALITY_METRICS = {
  consistency: 0.3,
  frequency: 0.2,
  accuracy: 0.3,
  location: 0.2
};
