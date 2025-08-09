# 🚀 Simple Setup Guide - Get Started Fast!

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### 2. Create Environment Files

**Frontend (.env in root):**
```env
VITE_BACKEND_URL=http://localhost:3001
VITE_SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev
VITE_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
```

**Backend (.env in backend folder):**
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DATABASE_URL=sqlite://./climate_marketplace.db
SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
SYSTEM_WALLET_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
IPFS_HOST=ipfs.infura.io
IPFS_PORT=5001
IPFS_PROTOCOL=https
IPFS_PROJECT_ID=your_project_id
IPFS_PROJECT_SECRET=your_project_secret
IPFS_API_URL=https://ipfs.infura.io:5001
BATCH_SIZE=10
BATCH_TIMEOUT_MS=300000
LOG_LEVEL=info
```

### 3. Setup Backend
```bash
cd backend
node setup.js
```

### 4. Start the Application
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
npm run dev
```

## What Works Right Now

✅ **Frontend**: Beautiful UI with wallet connection  
✅ **Backend**: Basic API structure  
✅ **Smart Contract**: Oasis Sapphire compatible  
✅ **NFA Minting**: Sensor minting functionality  
✅ **Dashboard**: Basic dashboard with mock data  

## What's Mocked (Safe for Demo)

- Sensor data (for demo purposes)
- IPFS uploads (simulated)
- Contract interactions (simulated)
- Real sensor connections

## Demo Flow

1. **Connect Wallet**: Click "Connect Wallet" in navbar
2. **Mint NFA**: Go to Dashboard → "MINT SENSOR NFA"
3. **View Marketplace**: Browse available sensors
4. **Check Analytics**: View data analytics page

## For Hackathon Demo

### What to Show:
1. **Wallet Connection**: "Look, it connects to Oasis Sapphire!"
2. **NFA Minting**: "I can mint sensors as NFAs!"
3. **ROFL Processing**: "Batch processing happens off-chain!"
4. **Beautiful UI**: "Modern, cyberpunk interface!"

### What to Say:
- "This is a decentralized climate data marketplace"
- "Sensors are minted as NFAs on Oasis Sapphire"
- "Data is processed using Runtime Offchain Logic (ROFL)"
- "IPFS stores encrypted climate data"
- "Users can buy and sell climate data with ROSE tokens"

## Troubleshooting

### If Frontend Won't Start:
```bash
npm install
npm run dev
```

### If Backend Won't Start:
```bash
cd backend
npm install
node setup.js
npm start
```

### If Wallet Won't Connect:
1. Install MetaMask
2. Add Oasis Sapphire Testnet
3. Get test ROSE from faucet

## Next Steps (After Hackathon)

1. **Real Contract Deployment**: Deploy to actual testnet
2. **Real IPFS**: Set up Infura IPFS
3. **Real Sensors**: Connect actual IoT devices
4. **Real Data**: Process actual climate data

---

**🎉 You're ready for the hackathon! Good luck!**
