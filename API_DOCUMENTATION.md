# 🚀 D-Climate API Documentation

## 📋 **Overview**

D-Climate API provides a comprehensive interface for the decentralized climate data platform, built on Oasis Sapphire with confidential computing capabilities.

**Base URL**: `http://localhost:3001/api`
**Authentication**: Wallet signature verification (except public endpoints)

---

## 🔐 **Authentication**

### **Required Headers**
```http
x-wallet-address: <wallet_address>
x-wallet-signature: <signature>
x-wallet-message: <message>
x-wallet-timestamp: <timestamp>
```

### **Message Format**
```
D-Climate API Access
Timestamp: <timestamp>
Nonce: <generated_nonce>
```

---

## 📊 **Public Endpoints**

### **Health Check**
```http
GET /health
```
**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-09T13:07:18.408Z",
  "version": "1.0.0",
  "services": {
    "sapphire": true,
    "confidentialTransactions": true,
    "smartContracts": true,
    "ipfs": true,
    "encryption": true
  }
}
```

### **Public Data Explorer**
```http
GET /api/data/public/explorer?country=Malaysia&state=Selangor&city=Petaling%20Jaya
```
**Query Parameters**:
- `country` (optional): Country name
- `state` (optional): State/province name
- `city` (optional): City name
- `timeRange` (optional): JSON string with `start` and `end` timestamps
- `startDate` (optional): Start date in ISO format
- `endDate` (optional): End date in ISO format

**Response**:
```json
{
  "success": true,
  "data": {
    "scope": {
      "level": "city",
      "region": "Petaling Jaya",
      "breadcrumb": ["Malaysia", "Selangor", "Petaling Jaya"]
    },
    "metrics": {
      "avgCO2": 415.2,
      "avgTemperature": 28.5,
      "avgHumidity": 76.8,
      "sensorCount": 8,
      "dataPoints": 1890,
      "lastUpdated": 1691591238408
    },
    "regions": [],
    "sensors": [
      {
        "sensorId": "CLI12345678-550e8400-e29b-41d4-a716-446655440001",
        "maskedId": "CLI12345678-****-****-****-************",
        "reputationBadge": "🟢",
        "lastReading": {
          "timestamp": 1691591238408,
          "co2": 412.5,
          "temperature": 28.2,
          "humidity": 76.3
        }
      }
    ],
    "anomalies": [
      {
        "region": "CLI12345678",
        "metric": "CO2",
        "value": 850,
        "deviation": 2.3,
        "timestamp": 1691591238408
      }
    ]
  },
  "message": "Public data explorer data retrieved successfully"
}
```

---

## 🔧 **Protected Endpoints**

### **Sensors**

#### **Generate Sensor ID**
```http
POST /api/sensors/generate-id
Content-Type: application/json

{
  "region": "Malaysia",
  "sensorType": "climate"
}
```

#### **Mint Sensor**
```http
POST /api/sensors/mint
Content-Type: application/json

{
  "sensorId": "CLI12345678-550e8400-e29b-41d4-a716-446655440001",
  "ipfsMetadata": "QmX..."
}
```

#### **Get Sensor Metadata**
```http
GET /api/sensors/CLI12345678-550e8400-e29b-41d4-a716-446655440001
```

#### **Update Sensor Status**
```http
PUT /api/sensors/CLI12345678-550e8400-e29b-41d4-a716-446655440001/status
Content-Type: application/json

{
  "isActive": true
}
```

#### **Get User's Sensors**
```http
GET /api/sensors/owner/0x8Ea29D642B348984F7bAF3bFf889D1d997E9d243
```

### **Data**

#### **Submit Climate Data**
```http
POST /api/data/submit
Content-Type: application/json

{
  "sensorId": "CLI12345678-550e8400-e29b-41d4-a716-446655440001",
  "timestamp": 1691591238,
  "co2": 415.2,
  "temperature": 28.5,
  "humidity": 76.8
}
```

#### **Submit Batch Data**
```http
POST /api/data/submit-batch
Content-Type: application/json

{
  "sensorId": "CLI12345678-550e8400-e29b-41d4-a716-446655440001",
  "data": [
    {
      "timestamp": 1691591238,
      "co2": 415.2,
      "temperature": 28.5,
      "humidity": 76.8
    }
  ]
}
```

#### **Get Sensor Data**
```http
GET /api/data/CLI12345678-550e8400-e29b-41d4-a716-446655440001?limit=20
```

#### **Validate Data**
```http
POST /api/data/validate
Content-Type: application/json

{
  "sensorId": "CLI12345678-550e8400-e29b-41d4-a716-446655440001",
  "timestamp": 1691591238,
  "co2": 415.2,
  "temperature": 28.5,
  "humidity": 76.8
}
```

### **Rewards**

#### **Get Reward History**
```http
GET /api/rewards/sensor/CLI12345678-550e8400-e29b-41d4-a716-446655440001
```

#### **Calculate Rewards**
```http
POST /api/rewards/calculate
Content-Type: application/json

{
  "sensorId": "CLI12345678-550e8400-e29b-41d4-a716-446655440001",
  "earnedDate": 1691591238000
}
```

#### **Get Claimable Rewards**
```http
GET /api/rewards/claimable/0x8Ea29D642B348984F7bAF3bFf889D1d997E9d243
```

#### **Claim Rewards**
```http
POST /api/rewards/claim
Content-Type: application/json

{
  "sensorId": "CLI12345678-550e8400-e29b-41d4-a716-446655440001",
  "earnedDate": 1691591238000
}
```

### **AI Insights**

#### **Generate Daily Overview**
```http
POST /api/ai/summary/daily-overview
Content-Type: application/json

{
  "regions": ["Malaysia", "Singapore"],
  "timeRange": {
    "start": 1691591238000,
    "end": 1691677638000
  }
}
```

#### **Generate Regional Snapshot**
```http
POST /api/ai/summary/regional-snapshot
Content-Type: application/json

{
  "region": "Malaysia",
  "timeRange": {
    "start": 1691591238000,
    "end": 1691677638000
  }
}
```

#### **Generate Anomaly Highlights**
```http
POST /api/ai/summary/anomaly-highlights
Content-Type: application/json

{
  "timeRange": {
    "start": 1691591238000,
    "end": 1691677638000
  }
}
```

#### **Get Cached Summaries**
```http
GET /api/ai/summaries/cached
```

### **Governance**

#### **Stake Tokens**
```http
POST /api/governance/stake
Content-Type: application/json

{
  "amount": 1000
}
```

#### **Unstake Tokens**
```http
POST /api/governance/unstake
Content-Type: application/json

{
  "amount": 500
}
```

#### **Delegate Tokens**
```http
POST /api/governance/delegate
Content-Type: application/json

{
  "delegateTo": "0x1234567890123456789012345678901234567890",
  "amount": 1000
}
```

#### **Create Proposal**
```http
POST /api/governance/proposals
Content-Type: application/json

{
  "proposalType": 0,
  "title": "Update Reward Parameters",
  "description": "Increase base reward from 10 to 15 ROSE",
  "targetContract": "0x1234567890123456789012345678901234567890",
  "proposalData": "0x...",
  "value": 0
}
```

#### **Cast Vote**
```http
POST /api/governance/proposals/1/vote
Content-Type: application/json

{
  "support": 1
}
```

#### **Get Proposals**
```http
GET /api/governance/proposals
```

#### **Get Proposal Details**
```http
GET /api/governance/proposals/1
```

#### **Get Voting Power**
```http
GET /api/governance/voting-power/0x8Ea29D642B348984F7bAF3bFf889D1d997E9d243
```

#### **Get Governance Stats**
```http
GET /api/governance/stats
```

---

## 🎯 **Error Responses**

### **Authentication Error**
```json
{
  "error": "Authentication required",
  "message": "Missing required authentication headers"
}
```

### **Validation Error**
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Invalid sensor ID format",
  "details": [
    "Sensor ID must match the expected format (PREFIX + UUID v4)"
  ]
}
```

### **Server Error**
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Something went wrong"
}
```

---

## 🚀 **Frontend Integration Examples**

### **React Hook for API Calls**
```typescript
import { useState, useEffect } from 'react';

interface UseApiOptions {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  requiresAuth?: boolean;
}

export const useApi = ({ endpoint, method = 'GET', body, requiresAuth = true }: UseApiOptions) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (requiresAuth) {
          // Add wallet authentication headers
          const timestamp = Date.now().toString();
          const message = `D-Climate API Access\nTimestamp: ${timestamp}\nNonce: ${generateNonce(walletAddress, timestamp)}`;
          const signature = await signMessage(message);
          
          headers['x-wallet-address'] = walletAddress;
          headers['x-wallet-signature'] = signature;
          headers['x-wallet-message'] = message;
          headers['x-wallet-timestamp'] = timestamp;
        }

        const response = await fetch(`http://localhost:3001/api${endpoint}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'API request failed');
        }

        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, method, body, requiresAuth]);

  return { data, loading, error };
};
```

### **Usage Examples**
```typescript
// Public data explorer
const { data: explorerData, loading: explorerLoading } = useApi({
  endpoint: '/data/public/explorer?country=Malaysia',
  requiresAuth: false
});

// User's sensors
const { data: sensors, loading: sensorsLoading } = useApi({
  endpoint: `/sensors/owner/${walletAddress}`,
  requiresAuth: true
});

// Submit climate data
const submitData = async (sensorId: string, climateData: any) => {
  const { data, error } = await useApi({
    endpoint: '/data/submit',
    method: 'POST',
    body: { sensorId, ...climateData },
    requiresAuth: true
  });
  
  if (error) {
    console.error('Failed to submit data:', error);
  }
  
  return data;
};
```

---

## 📞 **Support**

For API support and questions:
- **Documentation**: See `TODO_BACKEND_COMPLETION.md` for implementation status
- **Health Check**: `GET /health` for service status
- **Logs**: Check server logs for detailed error information

---

**Status**: ✅ Ready for Frontend Integration
**Version**: 1.0.0
**Last Updated**: 2025-08-09 