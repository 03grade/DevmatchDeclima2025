# D-Climate: Decentralized Climate Data Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/your-username/d-climate)
[![ROFL Status](https://img.shields.io/badge/ROFL-enabled-blue)](https://docs.oasis.io/build/rofl/)
[![Sapphire Status](https://img.shields.io/badge/Sapphire-enabled-green)](https://docs.oasis.io/build/sapphire/)

## 🌍 Overview

D-Climate is a decentralized climate data platform built for the DevMatch 2025 hackathon, leveraging **Oasis Sapphire** for privacy-preserving transactions and **ROFL (Rollup-Optimized Framework for L2s)** for gas efficiency. The platform enables users to mint, deploy, and manage climate sensors as Non-Fungible Agents (NFAs) while maintaining data confidentiality and incentivizing environmental monitoring.

## ✨ Key Features

### 🔐 **Privacy & Confidentiality**
- **Oasis Sapphire Integration**: All transactions are encrypted using Sapphire's TEE (Trusted Execution Environment)
- **Confidential Transactions**: Sensor data and metadata are encrypted on-chain
- **Zero-Knowledge Proofs**: Privacy-preserving data validation

### ⚡ **Gas Efficiency with ROFL**
- **L2 Rollup Optimization**: Offloads computation from main chain
- **Batch Processing**: Efficient handling of multiple sensor operations
- **Smart Contract Optimization**: Reduced gas costs for frequent operations

### 📡 **Sensor Management**
- **NFA Minting**: Mint climate sensors as unique digital assets
- **Real-time Data**: Continuous climate data generation and monitoring
- **IPFS Storage**: Decentralized metadata storage
- **Reputation System**: Quality scoring for sensor data

### 🤖 **AI-Powered Insights**
- **OpenAI GPT-4 Integration**: Intelligent climate analysis and predictions
- **Regional Snapshots**: Automated environmental assessment reports
- **Predictive Analytics**: Climate trend forecasting

### 🏛️ **DAO Governance**
- **Staking Mechanism**: Stake ROSE tokens for governance rights
- **Voting System**: Community-driven decision making
- **Reward Distribution**: Incentivized participation

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   ROFL Backend   │    │   Oasis Sapphire│
│   (React +      │◄──►│   (Node.js +     │◄──►│   (Smart       │
│    TypeScript)  │    │    Express)      │    │    Contracts)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   IPFS Storage  │    │   AI Processor   │    │   Confidential  │
│   (Metadata)    │    │   (OpenAI GPT-4) │    │   Transactions  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- **MetaMask** or compatible Web3 wallet
- **Oasis Sapphire Testnet** ROSE tokens
- **OpenAI API Key** (for AI insights)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/d-climate.git
   cd d-climate
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd rofl
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Configuration**
   
   Create `.env` files in both `rofl/` and `frontend/` directories:
   
   **Backend (rofl/.env):**
   ```env
   # Oasis Sapphire Configuration
   SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev
   SAPPHIRE_CHAIN_ID=23295
   
   # Contract Addresses
   SENSOR_NFA_CONTRACT=0xdE2D86cE2A540Be6F71b714F2386020b124c9141
   DATA_REGISTRY_CONTRACT=0xB02104F64D2ED472Fa4023d2d4D45486163598d3
   REWARD_DISTRIBUTOR_CONTRACT=0x31Bc258a6f1984301c1E69aFC9aC5bEf38b9C134
   DAO_GOVERNANCE_CONTRACT=0x4f8917C300Cab8738C9800bf410CBb729e3884da
   
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # IPFS Configuration
   IPFS_STORAGE_PATH=./data/ipfs-storage
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   ```

   **Frontend (frontend/.env):**
   ```env
   VITE_BACKEND_URL=http://localhost:3001
   VITE_SAPPHIRE_CHAIN_ID=23295
   VITE_SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev
   ```

4. **Build the project**
   ```bash
   # Build backend
   cd rofl
   npm run build
   
   # Build frontend
   cd ../frontend
   npm run build
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd rofl
   npm run dev
   ```
   
   The backend will be available at `http://localhost:3001`

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   
   The frontend will be available at `http://localhost:5173`

3. **Access the application**
   - Open `http://localhost:5173` in your browser
   - Connect your MetaMask wallet
   - Ensure you're on Oasis Sapphire Testnet (Chain ID: 23295)

## 📱 Usage Guide

### 1. **Sensor Minting**
- Navigate to the **Sensors** page
- Click **"Deploy New Sensor"**
- Fill in sensor metadata (type, location, description)
- Confirm the transaction in MetaMask
- Your sensor will be minted as an NFA on the blockchain

### 2. **Dashboard Overview**
- View your minted sensors and their status
- Monitor real-time climate data
- Track reputation scores and submission counts
- Access AI-generated insights

### 3. **Data Exploration**
- Browse publicly available sensors
- View historical climate data
- Analyze trends and patterns
- Download data for research purposes

### 4. **DAO Participation**
- Stake ROSE tokens for governance rights
- Participate in community voting
- Earn rewards for active participation

## 🔧 Development

### Project Structure

```
d-climate/
├── rofl/                          # Backend (ROFL + Sapphire)
│   ├── src/
│   │   ├── services/             # Core services
│   │   ├── routes/               # API endpoints
│   │   ├── middleware/           # Authentication & validation
│   │   ├── utils/                # Utilities & helpers
│   │   └── index.ts              # Main entry point
│   ├── contracts/                # Smart contracts
│   └── package.json
├── frontend/                      # React frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API services
│   │   ├── stores/               # State management
│   │   └── App.tsx               # Main app component
│   └── package.json
└── README.md
```

### Key Services

#### **SmartContractService**
- Manages interactions with deployed smart contracts
- Handles sensor minting, status updates, and metadata retrieval
- Implements gas optimization strategies

#### **ConfidentialTransactionService**
- Wraps transactions using Sapphire's confidential capabilities
- Ensures data privacy and encryption
- Manages TEE integration

#### **AIProcessor**
- Integrates with OpenAI GPT-4 for climate insights
- Generates regional snapshots and predictions
- Provides intelligent data analysis

#### **IPFSManager**
- Handles decentralized metadata storage
- Manages file uploads and retrievals
- Implements content addressing

### API Endpoints

#### **Sensors**
- `POST /api/sensors/generate-id` - Generate secure sensor ID
- `POST /api/sensors/mint` - Mint new sensor NFA
- `GET /api/sensors/:sensorId` - Get sensor metadata
- `GET /api/sensors/dashboard/mock` - Get mock dashboard data

#### **AI Insights**
- `GET /api/ai/public/summary/regional-snapshot` - Generate climate insights
- `GET /api/ai/public/test-connection` - Test OpenAI connection

#### **Data Management**
- `POST /api/data/submit` - Submit sensor data
- `GET /api/data/:sensorId` - Retrieve sensor data

## 🧪 Testing

### Backend Testing
```bash
cd rofl
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Integration Testing
```bash
# Test sensor minting
cd rofl
node test-mint-sensor.js

# Test OpenAI connection
node test-openai.js
```

## 🔒 Security Features

- **Wallet Authentication**: MetaMask signature verification
- **Request Validation**: Joi schema validation for all inputs
- **Rate Limiting**: API request throttling
- **CORS Protection**: Cross-origin request security
- **Environment Variables**: Secure configuration management

## 🌐 Network Configuration

### Oasis Sapphire Testnet
- **RPC URL**: `https://testnet.sapphire.oasis.dev`
- **Chain ID**: `23295`
- **Currency**: ROSE (testnet tokens)
- **Block Explorer**: [Sapphire Testnet Explorer](https://testnet.explorer.sapphire.oasis.dev/)

### Contract Addresses (Testnet)
- **SensorNFA**: `0xdE2D86cE2A540Be6F71b714F2386020b124c9141`
- **DataRegistry**: `0xB02104F64D2ED472Fa4023d2d4D45486163598d3`
- **RewardDistributor**: `0x31Bc258a6f1984301c1E69aFC9aC5bEf38b9C134`
- **DAOGovernance**: `0x4f8917C300Cab8738C9800bf410CBb729e3884da`

## 📊 Current Status

### ✅ **Completed Features**
- [x] Oasis Sapphire integration with confidential transactions
- [x] ROFL backend framework implementation
- [x] Smart contract service integration
- [x] Frontend React application
- [x] Wallet authentication system
- [x] Sensor NFA minting (with mock fallbacks)
- [x] IPFS metadata storage
- [x] AI insights integration (OpenAI GPT-4)
- [x] Dashboard with mock sensor data
- [x] Basic DAO staking interface

### 🔄 **In Progress**
- [ ] Real blockchain transaction integration
- [ ] Continuous sensor data generation
- [ ] Advanced AI insights and predictions
- [ ] Complete DAO governance implementation

### 📋 **Planned Features**
- [ ] Sensor data marketplace
- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] Multi-chain support
- [ ] Community governance tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Oasis Foundation** for Sapphire and ROFL technologies
- **OpenAI** for GPT-4 integration
- **DevMatch 2025** hackathon organizers
- **Community contributors** and testers

## 📞 Support

- **Documentation**: [Project Wiki](https://github.com/your-username/d-climate/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/d-climate/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/d-climate/discussions)
- **Email**: declima8@gmail.com

---

**Built with ❤️ for a sustainable future using blockchain technology**