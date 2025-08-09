# 🚀 Decentralized Data Climate Marketplace - Setup Guide

## 📋 Project Overview

This is a **Decentralized Data Climate Marketplace** built for the OASIS Protocol hackathon. The project implements:

- **Oasis Sapphire** blockchain integration
- **Runtime Offchain Logic (ROFL)** for batch processing
- **IPFS** for decentralized data storage
- **NFA (Non-Fungible Asset)** minting for sensors
- **Real-time sensor data collection** and processing

## 🛠️ Prerequisites

Before starting, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MetaMask** browser extension
- **Git**

## 📦 Installation Steps

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd Devmatch-ver2

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Configuration

#### Frontend Configuration

Create `.env` file in the root directory:

```env
VITE_BACKEND_URL=http://localhost:3001
VITE_SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
```

#### Backend Configuration

Create `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database Configuration
DATABASE_URL=sqlite://./climate_marketplace.db

# Oasis Sapphire Configuration
SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev
CONTRACT_ADDRESS=your_deployed_contract_address
SYSTEM_WALLET_PRIVATE_KEY=your_private_key_here

# IPFS Configuration
IPFS_HOST=ipfs.infura.io
IPFS_PORT=5001
IPFS_PROTOCOL=https
IPFS_PROJECT_ID=your_infura_project_id
IPFS_PROJECT_SECRET=your_infura_project_secret
IPFS_API_URL=https://ipfs.infura.io:5001

# MQTT Configuration
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=your_mqtt_username
MQTT_PASSWORD=your_mqtt_password

# Batch Processing Configuration
BATCH_SIZE=10
BATCH_TIMEOUT_MS=300000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### 3. Get Oasis Sapphire Testnet ROSE

1. Visit [Oasis Sapphire Testnet Faucet](https://faucet.testnet.oasis.dev/)
2. Connect your MetaMask wallet
3. Request test ROSE tokens
4. Add Oasis Sapphire Testnet to MetaMask:
   - Network Name: Oasis Sapphire Testnet
   - RPC URL: https://testnet.sapphire.oasis.dev
   - Chain ID: 23295
   - Currency Symbol: ROSE

### 4. Deploy Smart Contract

```bash
# Navigate to backend directory
cd backend

# Install additional dependencies for deployment
npm install @oasisprotocol/sapphire-paratime web3

# Deploy the contract
node scripts/deploy.js
```

**Important:** Make sure to:
- Have ROSE tokens in your wallet
- Update the contract address in your `.env` files after deployment

### 5. Set up IPFS (Optional)

For production, you can use:
- **Infura IPFS** (recommended for beginners)
- **Pinata** 
- **Local IPFS node**

For Infura IPFS:
1. Create account at [Infura](https://infura.io/)
2. Create an IPFS project
3. Get your Project ID and Secret
4. Update the IPFS configuration in `.env`

## 🚀 Running the Application

### 1. Start the Backend

```bash
cd backend
npm start
```

The backend will start on `http://localhost:3001`

### 2. Start the Frontend

```bash
# In a new terminal, from the root directory
npm run dev
```

The frontend will start on `http://localhost:5173`

## 🎯 How to Use the Application

### For Merchants (Sensor Owners)

1. **Connect Wallet**
   - Open the application
   - Click "Connect Wallet" in the navbar
   - Ensure you're on Oasis Sapphire Testnet

2. **Mint Sensor NFA**
   - Go to Dashboard
   - Click "MINT SENSOR NFA"
   - Fill in sensor details
   - Pay gas fees in ROSE tokens

3. **Configure Sensor**
   - Set up your physical sensor
   - Configure it to send data to the backend
   - Monitor data collection in the dashboard

4. **Monitor Earnings**
   - View your sensor performance
   - Track data sales and earnings
   - Manage sensor settings

### For Buyers (Data Consumers)

1. **Browse Marketplace**
   - View available climate data
   - Filter by sensor type, location, quality

2. **Purchase Data**
   - Select data batches
   - Pay in ROSE tokens
   - Download encrypted data

3. **Access Data**
   - Use the provided decryption keys
   - Integrate data into your applications

## 🔧 Technical Features

### Oasis Sapphire Integration

- **Confidential Computing**: Data is encrypted and processed confidentially
- **Runtime Offchain Logic (ROFL)**: Batch processing happens off-chain
- **Gas Optimization**: Efficient smart contract design

### Batch Processing (ROFL)

- **Automatic Batching**: Sensor data is automatically batched
- **Quality Scoring**: Each batch gets a quality score
- **IPFS Storage**: Encrypted data stored on IPFS
- **Blockchain Metadata**: Only metadata stored on-chain

### Security Features

- **AES Encryption**: All sensor data is encrypted
- **Sapphire Confidential**: Leverages Oasis Sapphire's confidential features
- **Access Control**: Only authorized users can access data

## 🐛 Troubleshooting

### Common Issues

1. **Wallet Connection Fails**
   - Ensure MetaMask is installed
   - Check if you're on the correct network
   - Try refreshing the page

2. **Contract Deployment Fails**
   - Check if you have enough ROSE tokens
   - Verify your private key is correct
   - Ensure network connectivity

3. **Backend Won't Start**
   - Check if all environment variables are set
   - Verify database permissions
   - Check port availability

4. **IPFS Upload Fails**
   - Verify IPFS credentials
   - Check network connectivity
   - Try using HTTP fallback

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

## 📊 Project Structure

```
Devmatch-ver2/
├── src/                    # Frontend React app
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── store/            # Zustand state management
│   └── services/         # API services
├── backend/              # Backend Node.js app
│   ├── contracts/        # Smart contracts
│   ├── services/         # Backend services
│   ├── routes/           # API routes
│   └── scripts/          # Deployment scripts
├── firmware/             # Sensor firmware
└── docs/                 # Documentation
```

## 🎉 Hackathon Submission

### Key Features for OASIS Protocol Track

1. **Sapphire Integration**: Full Oasis Sapphire blockchain integration
2. **ROFL Implementation**: Runtime offchain logic for batch processing
3. **Confidential Computing**: Encrypted data processing
4. **NFA Minting**: Sensors as Non-Fungible Assets
5. **Real-time Data**: Live sensor data collection and processing

### Demo Flow

1. **Setup**: Deploy contract, configure environment
2. **Mint NFA**: Create sensor as NFA on Sapphire
3. **Collect Data**: Simulate sensor data collection
4. **Batch Process**: Show ROFL batch processing
5. **Marketplace**: Demonstrate data buying/selling

## 📞 Support

For hackathon support:
- Check the troubleshooting section
- Review the code comments
- Test with the provided mock data first

## 🚀 Next Steps

After the hackathon:
1. **Production Deployment**: Deploy to mainnet
2. **Sensor Integration**: Connect real IoT sensors
3. **Advanced Analytics**: Add data visualization
4. **Mobile App**: Create mobile companion app
5. **API Documentation**: Complete API docs

---

**Good luck with your hackathon submission! 🎉**
