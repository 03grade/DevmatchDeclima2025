# 🌡️ D-Climate Sensor Data Generator

A standalone program that acts as a simulated climate sensor, generating realistic climate data every 15 seconds and submitting it to the D-Climate backend.

## 🚀 Features

- **Realistic Climate Data**: Generates realistic CO2, temperature, humidity, and air quality data
- **Time-based Variations**: Data varies based on time of day for realistic patterns
- **Real Blockchain Integration**: Can be minted to Oasis Sapphire testnet
- **Owner Address Support**: Uses actual wallet address for transactions
- **Continuous Operation**: Runs continuously with 15-second intervals
- **Quality Scoring**: Generates realistic quality scores for data validation

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd sensor-generator

# Install dependencies
npm install
```

## 🔧 Configuration

The sensor can be configured via environment variables or command line arguments:

```bash
# Environment variables
export BACKEND_URL="http://localhost:3001"
export SENSOR_ID="CLI12345678-550e8400-e29b-41d4-a716-446655440001"
export OWNER_ADDRESS="0x8Ea29D642B348984F7bAF3bFf889D1d997E9d243"

# Or use command line arguments
node sensor-generator.js [sensorId] [ownerAddress]
```

## 🎯 Usage

### Basic Usage

```bash
# Start with default configuration
npm start

# Or run directly
node sensor-generator.js
```

### Custom Configuration

```bash
# Specify custom sensor ID and owner address
node sensor-generator.js CLI12345678-custom-sensor-001 0xYourWalletAddress

# Use environment variables
BACKEND_URL=http://localhost:3001 node sensor-generator.js
```

### Development Mode

```bash
# Start with development configuration
npm run dev
```

## 📊 Generated Data

The sensor generates the following climate data:

- **CO2 Levels**: 350-600 ppm (typical outdoor levels)
- **Temperature**: 20-35°C (Malaysia climate range)
- **Humidity**: 40-95% (realistic humidity range)
- **Air Pressure**: 1008-1018 hPa (standard atmospheric pressure)
- **PM2.5**: 0-500 μg/m³ (particulate matter)
- **PM10**: 0-1000 μg/m³ (larger particulate matter)

### Data Variations

- **Time-based**: Data varies based on time of day (peak hours, etc.)
- **Random Noise**: Realistic random variations (±10%)
- **Quality Scoring**: 60-100% quality scores with occasional dips

## 🔗 Backend Integration

The sensor submits data to the D-Climate backend API:

- **Endpoint**: `POST /api/data/submit`
- **Authentication**: Wallet signature authentication
- **Data Format**: JSON with climate metrics
- **Frequency**: Every 15 seconds

### Example Data Submission

```json
{
  "sensorId": "CLI12345678-550e8400-e29b-41d4-a716-446655440001",
  "timestamp": 1703123456789,
  "co2": 415.2,
  "temperature": 28.5,
  "humidity": 76.8,
  "pressure": 1013.25,
  "pm25": 15.3,
  "pm10": 35.7,
  "quality": 92.5,
  "location": "Petaling Jaya, Selangor, Malaysia",
  "sensorType": "AIR_QUALITY"
}
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Sensor Data   │───▶│   D-Climate     │───▶│   Oasis         │
│   Generator     │    │   Backend API   │    │   Sapphire      │
│                 │    │                 │    │   Blockchain    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔐 Security

- **Authentication**: Uses wallet signature authentication
- **Data Encryption**: Data is encrypted before submission
- **Nonce Generation**: Secure nonce generation for replay protection
- **Rate Limiting**: Built-in rate limiting to prevent spam

## 📈 Monitoring

The sensor provides real-time monitoring:

```bash
🕒 14:30:25 - Generating climate data...
   CO2: 415.2 ppm
   Temperature: 28.5°C
   Humidity: 76.8%
   Quality: 92.5%
   Status: ✅ Submitted successfully
```

## 🛠️ Development

### Running Tests

```bash
npm test
```

### Customizing Data Generation

Edit the `baseline` object in `sensor-generator.js`:

```javascript
this.baseline = {
  co2: 415,           // Baseline CO2 level
  temperature: 28.5,  // Baseline temperature
  humidity: 76.8,     // Baseline humidity
  pressure: 1013.25,  // Baseline pressure
  pm25: 15,          // Baseline PM2.5
  pm10: 35           // Baseline PM10
};
```

## 🎯 Use Cases

1. **Development Testing**: Test D-Climate backend with realistic data
2. **Demo Purposes**: Show real-time data generation during demos
3. **Sensor Simulation**: Simulate real climate sensors for testing
4. **Blockchain Integration**: Test Oasis Sapphire integration

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support, please contact the D-Climate team or create an issue in the repository. 