#!/bin/bash

echo "🚀 Decentralized Data Climate Marketplace - Quick Start"
echo "======================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Create environment files if they don't exist
echo "🔧 Setting up environment files..."

# Frontend .env
if [ ! -f .env ]; then
    echo "Creating frontend .env file..."
    cat > .env << EOF
VITE_BACKEND_URL=http://localhost:3001
VITE_SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
EOF
fi

# Backend .env
if [ ! -f backend/.env ]; then
    echo "Creating backend .env file..."
    cat > backend/.env << EOF
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
EOF
fi

echo "✅ Environment files created"

echo ""
echo "🎯 Next Steps:"
echo "1. Configure your .env files with your actual values"
echo "2. Get ROSE tokens from the Oasis Sapphire testnet faucet"
echo "3. Deploy the smart contract using: cd backend && node scripts/deploy.js"
echo "4. Start the backend: cd backend && npm start"
echo "5. Start the frontend: npm run dev"
echo ""
echo "📖 For detailed instructions, see SETUP_GUIDE.md"
echo ""
echo "🚀 Happy hacking!"
