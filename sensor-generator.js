#!/usr/bin/env node

/**
 * D-Climate Sensor Data Generator
 * 
 * This program acts as a simulated climate sensor that:
 * 1. Generates realistic climate data every 15 seconds
 * 2. Can be minted to Oasis Sapphire testnet
 * 3. Uses the actual owner address (your wallet)
 * 4. Creates real transactions on the blockchain
 * 
 * Usage: node sensor-generator.js [sensorId] [ownerAddress]
 */

const { ethers } = require('ethers');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3001',
  SENSOR_ID: process.argv[2] || 'CLI12345678-550e8400-e29b-41d4-a716-446655440001',
  OWNER_ADDRESS: process.argv[3] || '0x8Ea29D642B348984F7bAF3bFf889D1d997E9d243',
  INTERVAL: 15000, // 15 seconds
  LOCATION: 'Petaling Jaya, Selangor, Malaysia',
  SENSOR_TYPE: 'AIR_QUALITY',
  DATA_VARIANCE: 0.1 // 10% variance for realistic data
};

class ClimateSensor {
  constructor(config) {
    this.config = config;
    this.isRunning = false;
    this.dataHistory = [];
    this.lastSubmission = null;
    
    // Realistic baseline values for Malaysia climate
    this.baseline = {
      co2: 415, // ppm - typical outdoor CO2 levels
      temperature: 28.5, // °C - Malaysia average temperature
      humidity: 76.8, // % - Malaysia average humidity
      pressure: 1013.25, // hPa - standard atmospheric pressure
      pm25: 15, // μg/m³ - PM2.5 particulate matter
      pm10: 35 // μg/m³ - PM10 particulate matter
    };
    
    console.log('🌡️  D-Climate Sensor Data Generator');
    console.log('====================================');
    console.log(`Sensor ID: ${this.config.SENSOR_ID}`);
    console.log(`Owner: ${this.config.OWNER_ADDRESS}`);
    console.log(`Location: ${this.config.LOCATION}`);
    console.log(`Type: ${this.config.SENSOR_TYPE}`);
    console.log(`Interval: ${this.config.INTERVAL/1000}s`);
    console.log('');
  }

  /**
   * Generate realistic climate data with noise
   */
  generateClimateData() {
    const timestamp = Date.now();
    
    // Add realistic variations based on time of day
    const hour = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      timeZone: 'Asia/Kuala_Lumpur' 
    }).split(':')[0];
    
    const timeFactor = Math.sin((hour - 6) * Math.PI / 12); // Peak at 6 AM and 6 PM
    
    const data = {
      sensorId: this.config.SENSOR_ID,
      timestamp: timestamp,
      co2: this.generateValue(this.baseline.co2, 20, timeFactor),
      temperature: this.generateValue(this.baseline.temperature, 5, timeFactor),
      humidity: this.generateValue(this.baseline.humidity, 10, -timeFactor), // Inverse relationship
      pressure: this.generateValue(this.baseline.pressure, 5, 0),
      pm25: this.generateValue(this.baseline.pm25, 8, timeFactor),
      pm10: this.generateValue(this.baseline.pm10, 15, timeFactor),
      quality: this.generateQualityScore(),
      location: this.config.LOCATION,
      sensorType: this.config.SENSOR_TYPE
    };

    return data;
  }

  /**
   * Generate a realistic value with noise and time variation
   */
  generateValue(baseline, variance, timeFactor = 0) {
    const noise = (Math.random() - 0.5) * variance;
    const timeVariation = timeFactor * variance * 0.3;
    const value = baseline + noise + timeVariation;
    
    // Ensure values are within realistic bounds
    switch (this.config.SENSOR_TYPE) {
      case 'CO2':
        return Math.max(350, Math.min(600, value));
      case 'TEMP':
        return Math.max(20, Math.min(35, value));
      case 'HUMIDITY':
        return Math.max(40, Math.min(95, value));
      case 'AIR_QUALITY':
        return Math.max(0, Math.min(500, value));
      default:
        return value;
    }
  }

  /**
   * Generate a quality score for the sensor reading
   */
  generateQualityScore() {
    // Quality score between 80-100 with occasional dips
    const baseQuality = 85 + Math.random() * 10;
    const randomFactor = Math.random();
    
    if (randomFactor < 0.05) {
      // 5% chance of lower quality reading
      return Math.max(60, baseQuality - 20);
    }
    
    return Math.min(100, baseQuality);
  }

  /**
   * Submit data to the backend API
   */
  async submitData(data) {
    try {
      const timestamp = Date.now();
      const nonce = this.generateNonce(this.config.OWNER_ADDRESS, timestamp);
      const message = `D-Climate API Access\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
      
      // For demo purposes, we'll use a mock signature
      // In production, you'd use the actual wallet signature
      const signature = this.generateMockSignature(message);
      
      const response = await fetch(`${this.config.BACKEND_URL}/api/data/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': this.config.OWNER_ADDRESS,
          'x-wallet-signature': signature,
          'x-wallet-message': message,
          'x-wallet-timestamp': timestamp.toString()
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Data submitted successfully: ${JSON.stringify(data, null, 2)}`);
        return result;
      } else {
        const error = await response.text();
        console.error(`❌ Failed to submit data: ${error}`);
        return null;
      }
    } catch (error) {
      console.error('❌ Error submitting data:', error.message);
      return null;
    }
  }

  /**
   * Generate a deterministic nonce (matches backend)
   */
  generateNonce(address, timestamp) {
    const data = `${address.toLowerCase()}-${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Generate a mock signature for demo purposes
   */
  generateMockSignature(message) {
    // In production, this would be a real wallet signature
    const data = `${message}-${this.config.OWNER_ADDRESS}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Start the sensor data generation
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Sensor is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting climate sensor data generation...');
    console.log(`📊 Generating data every ${this.config.INTERVAL/1000} seconds`);
    console.log('');

    // Initial data generation
    await this.generateAndSubmit();

    // Set up interval for continuous data generation
    this.interval = setInterval(async () => {
      await this.generateAndSubmit();
    }, this.config.INTERVAL);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down sensor...');
      this.stop();
      process.exit(0);
    });
  }

  /**
   * Generate and submit a single data reading
   */
  async generateAndSubmit() {
    const data = this.generateClimateData();
    this.dataHistory.push(data);
    
    console.log(`🕒 ${new Date().toLocaleTimeString()} - Generating climate data...`);
    console.log(`   CO2: ${data.co2.toFixed(1)} ppm`);
    console.log(`   Temperature: ${data.temperature.toFixed(1)}°C`);
    console.log(`   Humidity: ${data.humidity.toFixed(1)}%`);
    console.log(`   Quality: ${data.quality.toFixed(1)}%`);
    
    const result = await this.submitData(data);
    
    if (result) {
      this.lastSubmission = new Date();
      console.log(`   Status: ✅ Submitted successfully`);
    } else {
      console.log(`   Status: ❌ Submission failed`);
    }
    
    console.log('');
    
    // Keep only last 100 readings in memory
    if (this.dataHistory.length > 100) {
      this.dataHistory = this.dataHistory.slice(-100);
    }
  }

  /**
   * Stop the sensor data generation
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('🛑 Sensor stopped');
  }

  /**
   * Get sensor statistics
   */
  getStats() {
    if (this.dataHistory.length === 0) {
      return { readings: 0, lastSubmission: null };
    }

    const latest = this.dataHistory[this.dataHistory.length - 1];
    return {
      readings: this.dataHistory.length,
      lastSubmission: this.lastSubmission,
      latestReading: latest
    };
  }
}

// Main execution
async function main() {
  const sensor = new ClimateSensor(CONFIG);
  
  try {
    await sensor.start();
  } catch (error) {
    console.error('❌ Failed to start sensor:', error.message);
    process.exit(1);
  }
}

// Run the sensor if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = ClimateSensor; 