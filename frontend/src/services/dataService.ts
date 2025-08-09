import { apiService } from './apiService';

export interface SensorReading {
  timestamp: string;
  value: number;
  quality: number;
  sensorId?: string;
  type?: 'temperature' | 'humidity' | 'co2' | 'air_quality';
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: {
    deviceId: string;
    accuracy: number;
    batteryLevel: number;
  };
}

export interface SensorData {
  sensorId: string;
  readings: SensorReading[];
  lastUpdate: string;
  totalReadings: number;
}

class DataService {
  private dataCache: Map<string, SensorData> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly UPDATE_INTERVAL = 15000; // 15 seconds

  /**
   * Get sensor data with real-time updates
   */
  async getSensorData(sensorId: string, timeRange: string = '24h'): Promise<SensorReading[]> {
    // Check cache first to avoid repeated API calls
    const cached = this.dataCache.get(sensorId);
    if (cached) {
      console.log(`📊 Using cached data for sensor: ${sensorId}`);
      return this.filterDataByTimeRange(cached.readings, timeRange);
    }

    try {
      // Only try to get real data from backend once (not during real-time updates)
      const response = await apiService.getSensorData(sensorId, 100);
      
      if (response.success && response.data && response.data.length > 0) {
        // Transform backend data to match our interface
        const realData: SensorReading[] = response.data.map((reading: any) => ({
          timestamp: reading.timestamp,
          value: reading.value || reading.co2 || reading.temperature || reading.humidity,
          quality: reading.quality || 95,
          sensorId: reading.sensorId || sensorId,
          type: reading.type || 'temperature',
          location: reading.location,
          metadata: reading.metadata
        }));
        
        // Cache the real data
        this.dataCache.set(sensorId, {
          sensorId,
          readings: realData,
          lastUpdate: new Date().toISOString(),
          totalReadings: realData.length
        });
        
        return this.filterDataByTimeRange(realData, timeRange);
      }
    } catch (error) {
      console.warn('Failed to get real sensor data, using mock data:', error);
    }

    // Fallback to mock data generation
    const mockData = this.generateMockReadings(sensorId, timeRange);
    
    // Cache the mock data
    this.dataCache.set(sensorId, {
      sensorId,
      readings: mockData,
      lastUpdate: new Date().toISOString(),
      totalReadings: mockData.length
    });
    
    return mockData;
  }

  /**
   * Start real-time data generation for a sensor
   */
  startRealTimeData(sensorId: string, callback: (data: SensorReading) => void): void {
    // Clear any existing interval
    this.stopRealTimeData(sensorId);

    // Start new interval for continuous data generation
    const interval = setInterval(() => {
      const newReading = this.generateSingleReading(sensorId);
      callback(newReading);
      
      // Update cache
      const cached = this.dataCache.get(sensorId);
      if (cached) {
        cached.readings.push(newReading);
        cached.lastUpdate = new Date().toISOString();
        cached.totalReadings = cached.readings.length;
        
        // Keep only last 1000 readings to prevent memory issues
        if (cached.readings.length > 1000) {
          cached.readings = cached.readings.slice(-1000);
        }
      }
    }, this.UPDATE_INTERVAL);

    this.updateIntervals.set(sensorId, interval);
  }

  /**
   * Stop real-time data generation for a sensor
   */
  stopRealTimeData(sensorId: string): void {
    const interval = this.updateIntervals.get(sensorId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(sensorId);
    }
  }

  /**
   * Generate a single reading for a sensor
   */
  private generateSingleReading(sensorId: string): SensorReading {
    const now = new Date();
    const baseValue = this.getBaseValueForSensor(sensorId);
    const variation = Math.sin(now.getTime() * 0.001) * 15 + Math.random() * 10 - 5;
    const value = Math.max(10, baseValue + variation);
    const quality = Math.max(70, 100 - Math.abs(variation) * 2 + Math.random() * 10);

    return {
      timestamp: now.toISOString(),
      value: Math.round(value * 10) / 10,
      quality: Math.round(quality * 10) / 10,
      sensorId,
      type: this.getSensorType(sensorId),
      location: this.getSensorLocation(sensorId),
      metadata: {
        deviceId: `device_${sensorId}`,
        accuracy: 0.95 + Math.random() * 0.05,
        batteryLevel: 80 + Math.random() * 20
      }
    };
  }

  /**
   * Generate mock readings for a sensor
   */
  public generateMockReadings(sensorId: string, timeRange: string): SensorReading[] {
    const now = new Date();
    const readings: SensorReading[] = [];
    let intervals: number;
    let stepMinutes: number;

    switch (timeRange) {
      case '1h':
        intervals = 12; // 5-minute intervals
        stepMinutes = 5;
        break;
      case '6h':
        intervals = 36; // 10-minute intervals
        stepMinutes = 10;
        break;
      case '24h':
        intervals = 96; // 15-minute intervals
        stepMinutes = 15;
        break;
      case '7d':
        intervals = 168; // 1-hour intervals
        stepMinutes = 60;
        break;
      case '30d':
        intervals = 180; // 4-hour intervals
        stepMinutes = 240;
        break;
      default:
        intervals = 96;
        stepMinutes = 15;
    }

    for (let i = intervals; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * stepMinutes * 60 * 1000));
      
      // Generate realistic data based on sensor type
      const baseValue = this.getBaseValueForSensor(sensorId);
      const variation = Math.sin(i * 0.1) * 15 + Math.random() * 10 - 5;
      const value = Math.max(10, baseValue + variation);
      const quality = Math.max(70, 100 - Math.abs(variation) * 2 + Math.random() * 10);

      readings.push({
        timestamp: timestamp.toISOString(),
        value: Math.round(value * 10) / 10,
        quality: Math.round(quality * 10) / 10,
        sensorId,
        type: this.getSensorType(sensorId),
        location: this.getSensorLocation(sensorId),
        metadata: {
          deviceId: `device_${sensorId}`,
          accuracy: 0.95 + Math.random() * 0.05,
          batteryLevel: 80 + Math.random() * 20
        }
      });
    }

    return readings;
  }

  /**
   * Filter data by time range
   */
  private filterDataByTimeRange(data: SensorReading[], timeRange: string): SensorReading[] {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default to 24h
    }

    return data.filter(reading => new Date(reading.timestamp) >= startDate);
  }

  /**
   * Get base value for sensor type
   */
  private getBaseValueForSensor(sensorId: string): number {
    // Determine sensor type from ID or use default
    const sensorType = this.getSensorType(sensorId);
    
    switch (sensorType) {
      case 'temperature':
        return 25; // 25°C baseline
      case 'humidity':
        return 60; // 60% baseline
      case 'co2':
        return 400; // 400 PPM baseline
      case 'air_quality':
        return 45; // 45 AQI baseline
      default:
        return 50; // Default baseline
    }
  }

  /**
   * Get sensor type from sensor ID
   */
  private getSensorType(sensorId: string): 'temperature' | 'humidity' | 'co2' | 'air_quality' {
    // Extract type from sensor ID or use default
    if (sensorId.includes('TEMP')) return 'temperature';
    if (sensorId.includes('HUMIDITY')) return 'humidity';
    if (sensorId.includes('CO2')) return 'co2';
    if (sensorId.includes('AIR')) return 'air_quality';
    
    // Default based on hash of sensor ID
    const hash = sensorId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const types: Array<'temperature' | 'humidity' | 'co2' | 'air_quality'> = ['temperature', 'humidity', 'co2', 'air_quality'];
    return types[Math.abs(hash) % types.length];
  }

  /**
   * Get sensor location from sensor ID
   */
  private getSensorLocation(sensorId: string): { latitude: number; longitude: number } {
    // Extract location from sensor ID or use default
    const hash = sensorId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    // Generate deterministic but varied locations
    const baseLat = 1.3521; // Singapore base
    const baseLng = 103.8198;
    const latVariation = (Math.abs(hash) % 1000) / 10000;
    const lngVariation = ((Math.abs(hash) >> 8) % 1000) / 10000;
    
    return {
      latitude: baseLat + latVariation,
      longitude: baseLng + lngVariation
    };
  }

  /**
   * Get cached sensor data
   */
  getCachedSensorData(sensorId: string): SensorData | null {
    return this.dataCache.get(sensorId) || null;
  }

  /**
   * Clear cached data for a sensor
   */
  clearCachedData(sensorId: string): void {
    this.dataCache.delete(sensorId);
    this.stopRealTimeData(sensorId);
  }

  /**
   * Get all cached sensor IDs
   */
  getCachedSensorIds(): string[] {
    return Array.from(this.dataCache.keys());
  }
}

export const dataService = new DataService();
