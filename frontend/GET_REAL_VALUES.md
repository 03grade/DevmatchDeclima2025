# 🔧 Getting Real Environment Values

## Step 1: Get Your MetaMask Private Key

### ⚠️ WARNING: Never share your private key!

1. **Open MetaMask**
2. **Click the three dots** next to your account
3. **Click "Account Details"**
4. **Click "Export Private Key"**
5. **Enter your password**
6. **Copy the private key** (starts with `0x`)

**Example**: `0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890`

## Step 2: Set up Infura IPFS (FREE)

1. **Go to [Infura.io](https://infura.io/)**
2. **Sign up** for free account
3. **Create new project**
4. **Select "IPFS"** as the product
5. **Go to Settings → API Keys**
6. **Copy Project ID and Project Secret**

**Example**:
- Project ID: `2abc3def4ghi5jkl6mno7pqr8stu9vwx0yz1`
- Project Secret: `abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890`

## Step 3: Deploy Smart Contract

1. **Make sure you have ROSE tokens** in your MetaMask wallet
2. **Run deployment**:
   ```bash
   cd backend
   node scripts/deploy.js
   ```
3. **Copy the contract address** from the output

**Example**: `0x1234567890abcdef1234567890abcdef1234567890`

## Step 4: Update Your .env Files

### Frontend (.env in root directory)
```env
VITE_BACKEND_URL=http://localhost:3001
VITE_SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev
VITE_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef1234567890
```

### Backend (.env in backend directory)
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

## Quick Reference

| Variable | What it is | How to get it |
|----------|------------|---------------|
| `VITE_CONTRACT_ADDRESS` | Smart contract address | Deploy contract with `node scripts/deploy.js` |
| `SYSTEM_WALLET_PRIVATE_KEY` | Your MetaMask private key | Export from MetaMask Account Details |
| `IPFS_PROJECT_ID` | Infura IPFS Project ID | Create project at Infura.io |
| `IPFS_PROJECT_SECRET` | Infura IPFS Project Secret | Get from Infura project settings |
| `IPFS_PROTOCOL` | IPFS connection protocol | Always `https` for Infura |
| `MQTT_USERNAME` | MQTT broker username | Leave empty for hackathon |
| `MQTT_PASSWORD` | MQTT broker password | Leave empty for hackathon |

## For Hackathon Demo

**Minimum required values**:
- `SYSTEM_WALLET_PRIVATE_KEY` (your MetaMask private key)
- `VITE_CONTRACT_ADDRESS` (after deployment)

**Optional for demo**:
- IPFS credentials (can use mock data)
- MQTT credentials (not needed for demo)

## Testing Your Setup

1. **Test wallet connection**: Start frontend, click "Connect Wallet"
2. **Test backend**: Start backend, visit http://localhost:3001/health
3. **Test contract**: Deploy contract, check transaction on explorer

---

**🎯 Focus on getting the private key and contract address first!**
