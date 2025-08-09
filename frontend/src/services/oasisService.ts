import Web3 from 'web3';
import { OASIS_CONFIG, SENSOR_VALIDATION, QUALITY_METRICS } from '../config/oasis';
import CryptoJS from 'crypto-js';

export interface SensorReading {
  sensorId: string;
  timestamp: number;
  value: number;
  type: 'temperature' | 'humidity' | 'co2' | 'air_quality';
  location: {
    latitude: number;
    longitude: number;
  };
  metadata: {
    deviceId: string;
    accuracy: number;
    batteryLevel?: number;
  };
}

export interface NFAMetadata {
  sensorId: string;
  name: string;
  description: string;
  sensorType: string;
  location: string;
  coordinates: [number, number];
  pricePerHour: number;
  owner: string;
  createdAt: number;
  qualityScore: number;
}

export interface DataBatch {
  batchId: string;
  sensorId: string;
  startTimestamp: number;
  endTimestamp: number;
  dataPoints: SensorReading[];
  encryptedData?: string;
  ipfsCid?: string;
  decryptionKey?: string;
}

// Dynamic validation configuration interface
interface ValidationConfig {
  penalties: {
    timeGap: number;
    rangeViolation: number;
    repeatedValues: number;
    locationVariance: number;
  };
  thresholds: {
    qualityScore: number;
    locationVariance: number;
    repeatedValueCount: number;
  };
}

class OasisService {
  private web3: Web3 | null = null;
  private account: string | null = null;
  private validationConfig: ValidationConfig;

  constructor() {
    // Initialize with configurable validation parameters
    this.validationConfig = this.loadValidationConfig();
  }

  // Load validation configuration from environment or defaults
  private loadValidationConfig(): ValidationConfig {
    return {
      penalties: {
        timeGap: parseInt(process.env.VITE_VALIDATION_TIME_GAP_PENALTY as string) || 10,
        rangeViolation: parseInt(process.env.VITE_VALIDATION_RANGE_PENALTY as string) || 15,
        repeatedValues: parseInt(process.env.VITE_VALIDATION_REPEATED_PENALTY as string) || 5,
        locationVariance: parseInt(process.env.VITE_VALIDATION_LOCATION_PENALTY as string) || 10
      },
      thresholds: {
        qualityScore: parseInt(process.env.VITE_VALIDATION_MIN_SCORE as string) || 50,
        locationVariance: parseFloat(process.env.VITE_VALIDATION_LOCATION_THRESHOLD as string) || 0.001,
        repeatedValueCount: parseInt(process.env.VITE_VALIDATION_REPEATED_COUNT as string) || 3
      }
    };
  }

  // Initialize Oasis Sapphire connection
  async initializeSapphire(): Promise<void> {
    try {
      if (typeof window.ethereum !== 'undefined') {
        this.web3 = new Web3(window.ethereum);
        
        // Add Sapphire network if not exists
        await this.addSapphireNetwork();
        
        // Switch to Sapphire network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${OASIS_CONFIG.sapphire.chainId.toString(16)}` }]
        });

        const accounts = await this.web3.eth.getAccounts();
        this.account = accounts[0];
        
        console.log('✅ Sapphire network initialized');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Sapphire:', error);
      throw error;
    }
  }

  // Add Sapphire network to wallet
  private async addSapphireNetwork(): Promise<void> {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${OASIS_CONFIG.sapphire.chainId.toString(16)}`,
          chainName: OASIS_CONFIG.sapphire.name,
          nativeCurrency: OASIS_CONFIG.sapphire.currency,
          rpcUrls: [OASIS_CONFIG.sapphire.rpcUrl],
          blockExplorerUrls: [OASIS_CONFIG.sapphire.blockExplorer]
        }]
      });
    } catch (error) {
      console.log('Network already exists or user rejected');
    }
  }

  // Enhanced validate sensor readings with dynamic configuration
  async validateSensorReadings(readings: SensorReading[]): Promise<{
    isValid: boolean;
    qualityScore: number;
    issues: string[];
  }> {
    const issues: string[] = [];
    let qualityScore = 100;

    // Check minimum readings requirement (configurable)
    if (readings.length < SENSOR_VALIDATION.minReadings) {
      issues.push(`Insufficient readings: ${readings.length}/${SENSOR_VALIDATION.minReadings}`);
      return { isValid: false, qualityScore: 0, issues };
    }

    // Validate data consistency and ranges with dynamic penalties
    for (let i = 0; i < readings.length; i++) {
      const reading = readings[i];
      
      // Check timestamp consistency with configurable penalty
      if (i > 0) {
        const timeDiff = reading.timestamp - readings[i - 1].timestamp;
        if (timeDiff > SENSOR_VALIDATION.maxTimeGap) {
          issues.push('Inconsistent timestamp gaps detected');
          qualityScore -= this.validationConfig.penalties.timeGap;
        }
      }

      // Validate value ranges with configurable penalty
      const isInRange = this.validateValueRange(reading.value, reading.type);
      if (!isInRange) {
        issues.push(`Out of range value for ${reading.type}: ${reading.value}`);
        qualityScore -= this.validationConfig.penalties.rangeViolation;
      }

      // Check for repeated values with configurable threshold and penalty
      if (i >= this.validationConfig.thresholds.repeatedValueCount - 1) {
        const lastValues = readings.slice(i - (this.validationConfig.thresholds.repeatedValueCount - 1), i + 1);
        if (lastValues.every(r => r.value === reading.value)) {
          issues.push('Repeated identical values detected');
          qualityScore -= this.validationConfig.penalties.repeatedValues;
        }
      }
    }

    // Calculate location consistency with configurable threshold and penalty
    const locationVariance = this.calculateLocationVariance(readings);
    if (locationVariance > this.validationConfig.thresholds.locationVariance) {
      issues.push('High location variance detected');
      qualityScore -= this.validationConfig.penalties.locationVariance;
    }

    return {
      isValid: issues.length === 0 || qualityScore > this.validationConfig.thresholds.qualityScore,
      qualityScore: Math.max(0, qualityScore),
      issues
    };
  }

  // Validate sensor value ranges (unchanged logic, same behavior)
  private validateValueRange(value: number, type: string): boolean {
    switch (type) {
      case 'temperature':
        return value >= SENSOR_VALIDATION.temperatureRange[0] && 
               value <= SENSOR_VALIDATION.temperatureRange[1];
      case 'humidity':
        return value >= SENSOR_VALIDATION.humidityRange[0] && 
               value <= SENSOR_VALIDATION.humidityRange[1];
      case 'co2':
        return value >= SENSOR_VALIDATION.co2Range[0] && 
               value <= SENSOR_VALIDATION.co2Range[1];
      case 'air_quality':
        return value >= SENSOR_VALIDATION.airQualityRange[0] && 
               value <= SENSOR_VALIDATION.airQualityRange[1];
      default:
        return true;
    }
  }

  // Calculate location variance for readings (unchanged logic)
  private calculateLocationVariance(readings: SensorReading[]): number {
    if (readings.length < 2) return 0;
    
    const avgLat = readings.reduce((sum, r) => sum + r.location.latitude, 0) / readings.length;
    const avgLng = readings.reduce((sum, r) => sum + r.location.longitude, 0) / readings.length;
    
    const variance = readings.reduce((sum, r) => {
      const latDiff = r.location.latitude - avgLat;
      const lngDiff = r.location.longitude - avgLng;
      return sum + (latDiff * latDiff + lngDiff * lngDiff);
    }, 0) / readings.length;
    
    return Math.sqrt(variance);
  }

  // Process and encrypt data batch for IPFS storage (unchanged)
  async processDataBatch(readings: SensorReading[]): Promise<DataBatch> {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTimestamp = Math.min(...readings.map(r => r.timestamp));
    const endTimestamp = Math.max(...readings.map(r => r.timestamp));
    
    // Generate encryption key
    const encryptionKey = CryptoJS.lib.WordArray.random(OASIS_CONFIG.encryption.keyLength);
    const keyHex = encryptionKey.toString(CryptoJS.enc.Hex);
    
    // Encrypt data
    const dataString = JSON.stringify(readings);
    const encrypted = CryptoJS.AES.encrypt(dataString, keyHex).toString();
    
    // Simulate IPFS upload (in production, use actual IPFS service)
    const ipfsCid = await this.uploadToIPFS(encrypted);
    
    return {
      batchId,
      sensorId: readings[0]?.sensorId || '',
      startTimestamp,
      endTimestamp,
      dataPoints: readings,
      encryptedData: encrypted,
      ipfsCid,
      decryptionKey: keyHex
    };
  }

  // Upload encrypted data to IPFS (unchanged)
  private async uploadToIPFS(encryptedData: string): Promise<string> {
    // Simulate IPFS upload - in production, integrate with actual IPFS service
    const mockCid = `Qm${Math.random().toString(36).substr(2, 44)}`;
    
    // Store in localStorage for demo purposes
    localStorage.setItem(`ipfs_${mockCid}`, encryptedData);
    
    return mockCid;
  }

  // Retrieve and decrypt data from IPFS (unchanged)
  async retrieveDataFromIPFS(cid: string, decryptionKey: string): Promise<SensorReading[]> {
    try {
      // Retrieve from localStorage for demo (in production, fetch from IPFS)
      const encryptedData = localStorage.getItem(`ipfs_${cid}`);
      if (!encryptedData) {
        throw new Error('Data not found in IPFS');
      }
      
      // Decrypt data
      const decrypted = CryptoJS.AES.decrypt(encryptedData, decryptionKey);
      const dataString = decrypted.toString(CryptoJS.enc.Utf8);
      
      return JSON.parse(dataString);
    } catch (error) {
      console.error('Failed to retrieve data from IPFS:', error);
      throw error;
    }
  }

  // Mint NFA using Sapphire smart contract (unchanged)
  async mintNFA(metadata: NFAMetadata): Promise<string> {
    if (!this.web3 || !this.account) {
      throw new Error('Sapphire not initialized');
    }

    try {
      // Simulate smart contract interaction
      const nfaId = `NFA_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      // Store NFA metadata (in production, this would be stored on Sapphire)
      const nfaData = {
        ...metadata,
        nfaId,
        mintedAt: Date.now(),
        owner: this.account
      };
      
      localStorage.setItem(`nfa_${nfaId}`, JSON.stringify(nfaData));
      
      console.log('✅ NFA minted successfully:', nfaId);
      return nfaId;
    } catch (error) {
      console.error('❌ Failed to mint NFA:', error);
      throw error;
    }
  }

  // Purchase data using ROSE tokens (unchanged)
  async purchaseData(nfaId: string, timeframe: { start: number; end: number }): Promise<{
    transactionId: string;
    data: SensorReading[];
    cost: number;
  }> {
    if (!this.web3 || !this.account) {
      throw new Error('Sapphire not initialized');
    }

    try {
      // Retrieve NFA metadata
      const nfaData = localStorage.getItem(`nfa_${nfaId}`);
      if (!nfaData) {
        throw new Error('NFA not found');
      }

      const nfa = JSON.parse(nfaData);
      const hoursDiff = (timeframe.end - timeframe.start) / (1000 * 60 * 60);
      const cost = hoursDiff * nfa.pricePerHour;

      // Simulate payment transaction
      const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      // Generate mock data for the timeframe
      const mockData = this.generateMockSensorData(nfa.sensorId, timeframe.start, timeframe.end, nfa.sensorType);
      
      console.log('✅ Data purchased successfully:', transactionId);
      
      return {
        transactionId,
        data: mockData,
        cost
      };
    } catch (error) {
      console.error('❌ Failed to purchase data:', error);
      throw error;
    }
  }

  // Generate mock sensor data for demo (unchanged)
  private generateMockSensorData(sensorId: string, startTime: number, endTime: number, type: string): SensorReading[] {
    const readings: SensorReading[] = [];
    const interval = 60000; // 1 minute intervals
    
    for (let time = startTime; time <= endTime; time += interval) {
      let value: number;
      
      switch (type) {
        case 'temperature':
          value = 20 + Math.random() * 15; // 20-35°C
          break;
        case 'humidity':
          value = 40 + Math.random() * 40; // 40-80%
          break;
        case 'co2':
          value = 400 + Math.random() * 200; // 400-600 PPM
          break;
        case 'air_quality':
          value = 50 + Math.random() * 100; // 50-150 AQI
          break;
        default:
          value = Math.random() * 100;
      }
      
      readings.push({
        sensorId,
        timestamp: time,
        value: Math.round(value * 100) / 100,
        type: type as any,
        location: {
          latitude: 1.3521 + (Math.random() - 0.5) * 0.01,
          longitude: 103.8198 + (Math.random() - 0.5) * 0.01
        },
        metadata: {
          deviceId: `device_${sensorId}`,
          accuracy: 0.95 + Math.random() * 0.05,
          batteryLevel: 80 + Math.random() * 20
        }
      });
    }
    
    return readings;
  }

  // Calculate reputation score with dynamic factors
  calculateReputationScore(nfaId: string): number {
    // Enhanced reputation calculation using configurable parameters
    const baseScore = 75;
    const qualityWeight = parseFloat(process.env.VITE_REPUTATION_QUALITY_WEIGHT as string) || 0.4;
    const consistencyWeight = parseFloat(process.env.VITE_REPUTATION_CONSISTENCY_WEIGHT as string) || 0.3;
    const uptimeWeight = parseFloat(process.env.VITE_REPUTATION_UPTIME_WEIGHT as string) || 0.3;
    
    // Simulate dynamic reputation factors
    const qualityFactor = 0.8 + Math.random() * 0.2; // 0.8-1.0
    const consistencyFactor = 0.7 + Math.random() * 0.3; // 0.7-1.0
    const uptimeFactor = 0.85 + Math.random() * 0.15; // 0.85-1.0
    
    const dynamicScore = baseScore * (
      qualityFactor * qualityWeight +
      consistencyFactor * consistencyWeight +
      uptimeFactor * uptimeWeight
    );
    
    return Math.max(0, Math.min(100, Math.round(dynamicScore)));
  }

  // Update validation configuration at runtime
  updateValidationConfig(newConfig: Partial<ValidationConfig>): void {
    this.validationConfig = { ...this.validationConfig, ...newConfig };
    console.log('✅ Validation configuration updated:', this.validationConfig);
  }

  // Get current validation configuration
  getValidationConfig(): ValidationConfig {
    return { ...this.validationConfig };
  }

  // Get current account
  getCurrentAccount(): string | null {
    return this.account;
  }

  // Check if connected to Sapphire
  isConnectedToSapphire(): boolean {
    return this.web3 !== null && this.account !== null;
  }
}

export const oasisService = new OasisService();
