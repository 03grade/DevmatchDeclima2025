# 🔧 Real Environment Setup Guide

## Frontend Environment (.env in root directory)

Create a `.env` file in your project root:

```env
# Backend API URL (keep this as is for local development)
VITE_BACKEND_URL=http://localhost:3001

# Oasis Sapphire Testnet RPC (this is the correct URL)
VITE_SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev

# Contract address (you'll get this after deploying)
VITE_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
```

## Backend Environment (.env in backend directory)

Create a `.env` file in the `backend` folder:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database Configuration (SQLite for development)
DATABASE_URL=sqlite://./climate_marketplace.db

# Oasis Sapphire Configuration
SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
SYSTEM_WALLET_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# IPFS Configuration (using Infura - FREE)
IPFS_HOST=ipfs.infura.io
IPFS_PORT=5001
IPFS_PROTOCOL=https
IPFS_PROJECT_ID=your_infura_project_id_here
IPFS_PROJECT_SECRET=your_infura_project_secret_here
IPFS_API_URL=https://ipfs.infura.io:5001

# MQTT Configuration (optional for now)
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# Batch Processing Configuration
BATCH_SIZE=10
BATCH_TIMEOUT_MS=300000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## Step-by-Step Setup

### Step 1: Get Oasis Sapphire Testnet ROSE

1. **Install MetaMask** if you haven't already
2. **Add Oasis Sapphire Testnet to MetaMask:**
   - Open MetaMask
   - Click the network dropdown (top right)
   - Click "Add Network"
   - Fill in:
     - Network Name: `Oasis Sapphire Testnet`
     - RPC URL: `https://testnet.sapphire.oasis.dev`
     - Chain ID: `23295`
     - Currency Symbol: `ROSE`
     - Block Explorer URL: `https://explorer.oasis.io/testnet/sapphire`

3. **Get Test ROSE:**
   - Go to: https://faucet.testnet.oasis.dev/
   - Connect your MetaMask wallet
   - Request test ROSE tokens

### Step 2: Get Your Private Key

**⚠️ WARNING: Never share your private key!**

1. **Create a new wallet for testing:**
   - In MetaMask, click the account icon
   - Click "Create Account"
   - Name it "Climate Marketplace Test"
   - This creates a new account with a new private key

2. **Export the private key:**
   - Click the three dots next to your account
   - Click "Account Details"
   - Click "Export Private Key"
   - Enter your password
   - Copy the private key (starts with 0x)

3. **Add it to your .env:**
   ```env
   SYSTEM_WALLET_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
   ```

### Step 3: Set up IPFS (Infura - FREE)

1. **Create Infura account:**
   - Go to: https://infura.io/
   - Sign up for free account
   - Create a new project
   - Select "IPFS" as the product

2. **Get your credentials:**
   - In your IPFS project, go to "Settings"
   - Copy your Project ID and Project Secret

3. **Add to your .env:**
   ```env
   IPFS_PROJECT_ID=your_actual_project_id_here
   IPFS_PROJECT_SECRET=your_actual_project_secret_here
   ```

### Step 4: Deploy Smart Contract

1. **Make sure you have ROSE tokens** in your test wallet
2. **Run the deployment:**
   ```bash
   cd backend
   node scripts/deploy.js
   ```
3. **Copy the contract address** from the output
4. **Update both .env files** with the contract address:
   ```env
   CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef1234567890
   VITE_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef1234567890
   ```

## Example Complete .env Files

### Frontend (.env)
```env
VITE_BACKEND_URL=http://localhost:3001
VITE_SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev
VITE_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef1234567890
```

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DATABASE_URL=sqlite://./climate_marketplace.db
SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev
CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef1234567890
SYSTEM_WALLET_PRIVATE_KEY=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
IPFS_HOST=ipfs.infura.io
IPFS_PORT=5001
IPFS_PROTOCOL=https
IPFS_PROJECT_ID=2abc3def4ghi5jkl6mno7pqr8stu9vwx0yz1
IPFS_PROJECT_SECRET=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
IPFS_API_URL=https://ipfs.infura.io:5001
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
BATCH_SIZE=10
BATCH_TIMEOUT_MS=300000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

## Testing Your Setup

1. **Test wallet connection:**
   - Start the frontend: `npm run dev`
   - Click "Connect Wallet"
   - Should connect to Oasis Sapphire Testnet

2. **Test backend:**
   - Start the backend: `cd backend && npm start`
   - Visit: http://localhost:3001/health
   - Should show healthy status

3. **Test contract deployment:**
   - Run: `cd backend && node scripts/deploy.js`
   - Should deploy successfully and show contract address
