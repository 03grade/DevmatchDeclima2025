import { create } from 'zustand';

export interface Sensor {
  id: string;
  name: string;
  type: 'temperature' | 'humidity' | 'co2' | 'air_quality';
  location: string;
  price: number;
  status: 'active' | 'inactive' | 'maintenance';
  lastReading: number;
  earnings: number;
  nfaId: string;
  owner: string;
  description: string;
  coordinates: [number, number];
}

export interface SensorReading {
  timestamp: string;
  value: number;
  quality: number;
}

export interface DataListing {
  id: string;
  sensorId: string;
  sensor: Sensor;
  timeframe: string;
  price: number;
  dataPoints: number;
  quality: 'high' | 'medium' | 'low';
  provider: string;
  location: string;
  type: string;
}

export interface Transaction {
  id: string;
  type: 'purchase' | 'sale' | 'reward';
  amount: number;
  sensor: string;
  buyer?: string;
  seller?: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

interface DataState {
  sensors: Sensor[];
  listings: DataListing[];
  transactions: Transaction[];
  sensorReadings: Map<string, SensorReading[]>;
  totalEarnings: number;
  addSensor: (sensor: Omit<Sensor, 'id' | 'earnings' | 'nfaId'>) => void;
  updateSensor: (id: string, updates: Partial<Sensor>) => void;
  addSensorReading: (sensorId: string, reading: SensorReading) => void;
  getSensorReadings: (sensorId: string, timeRange?: string) => SensorReading[];
  purchaseData: (listingId: string, buyerAddress: string) => void;
  getActiveSensors: () => Sensor[];
  getRecentTransactions: () => Transaction[];
}

export const useDataStore = create<DataState>((set, get) => ({
  sensors: [
    {
      id: 'sensor-1',
      name: 'Urban Air Monitor',
      type: 'air_quality',
      location: 'Singapore CBD',
      price: 0.5,
      status: 'active',
      lastReading: 156,
      earnings: 45.2,
      nfaId: 'NFA-001',
      owner: '0x742d35Cc6634C0532925a3b8D5c0B7c7C8F6D4E8',
      description: 'High-precision air quality sensor monitoring PM2.5, PM10, and AQI',
      coordinates: [1.3521, 103.8198]
    },
    {
      id: 'sensor-2',
      name: 'Tropical Climate Station',
      type: 'temperature',
      location: 'Kuala Lumpur',
      price: 0.3,
      status: 'active',
      lastReading: 32.5,
      earnings: 28.7,
      nfaId: 'NFA-002',
      owner: '0x742d35Cc6634C0532925a3b8D5c0B7c7C8F6D4E8',
      description: 'Weather station tracking temperature and humidity patterns',
      coordinates: [3.1390, 101.6869]
    },
    {
      id: 'sensor-3',
      name: 'CO2 Emissions Tracker',
      type: 'co2',
      location: 'Jakarta Industrial',
      price: 0.8,
      status: 'active',
      lastReading: 420,
      earnings: 67.3,
      nfaId: 'NFA-003',
      owner: '0x742d35Cc6634C0532925a3b8D5c0B7c7C8F6D4E8',
      description: 'Industrial CO2 emissions monitoring for carbon footprint analysis',
      coordinates: [-6.2088, 106.8456]
    }
  ],

  listings: [
    {
      id: 'listing-1',
      sensorId: 'sensor-1',
      sensor: {} as Sensor,
      timeframe: 'Last 24 hours',
      price: 12.5,
      dataPoints: 1440,
      quality: 'high',
      provider: '0x742d35Cc6634C0532925a3b8D5c0B7c7C8F6D4E8',
      location: 'Singapore CBD',
      type: 'Air Quality'
    },
    {
      id: 'listing-2',
      sensorId: 'sensor-2',
      sensor: {} as Sensor,
      timeframe: 'Last 7 days',
      price: 8.3,
      dataPoints: 10080,
      quality: 'high',
      provider: '0x9A8B7c6D5e4F3g2H1i0J',
      location: 'Kuala Lumpur',
      type: 'Temperature'
    },
    {
      id: 'listing-3',
      sensorId: 'sensor-3',
      sensor: {} as Sensor,
      timeframe: 'Last 30 days',
      price: 45.0,
      dataPoints: 43200,
      quality: 'medium',
      provider: '0xA1B2C3D4E5F6G7H8I9J0',
      location: 'Jakarta Industrial',
      type: 'CO2 Emissions'
    }
  ],

  transactions: [
    {
      id: 'tx-1',
      type: 'sale',
      amount: 12.5,
      sensor: 'Urban Air Monitor',
      buyer: '0xBuyer123',
      seller: '0x742d35Cc6634C0532925a3b8D5c0B7c7C8F6D4E8',
      timestamp: new Date(Date.now() - 3600000),
      status: 'completed'
    },
    {
      id: 'tx-2',
      type: 'reward',
      amount: 5.2,
      sensor: 'Tropical Climate Station',
      timestamp: new Date(Date.now() - 7200000),
      status: 'completed'
    },
    {
      id: 'tx-3',
      type: 'purchase',
      amount: 8.3,
      sensor: 'CO2 Emissions Tracker',
      buyer: '0x742d35Cc6634C0532925a3b8D5c0B7c7C8F6D4E8',
      seller: '0xSeller456',
      timestamp: new Date(Date.now() - 10800000),
      status: 'completed'
    }
  ],

  sensorReadings: new Map(),
  totalEarnings: 141.2,

  addSensor: (sensorData) => {
    const newSensor: Sensor = {
      ...sensorData,
      id: `sensor-${Date.now()}`,
      earnings: 0,
      nfaId: `NFA-${Date.now().toString().slice(-6)}`
    };

    set((state) => ({
      sensors: [...state.sensors, newSensor]
    }));
  },

  updateSensor: (id, updates) => {
    set((state) => ({
      sensors: state.sensors.map(sensor =>
        sensor.id === id ? { ...sensor, ...updates } : sensor
      )
    }));
  },

  addSensorReading: (sensorId, reading) => {
    set((state) => {
      const newReadings = new Map(state.sensorReadings);
      const currentReadings = newReadings.get(sensorId) || [];
      
      // Add new reading and keep only last 1000 readings
      const updatedReadings = [...currentReadings, reading].slice(-1000);
      newReadings.set(sensorId, updatedReadings);
      
      return { sensorReadings: newReadings };
    });
  },

  getSensorReadings: (sensorId, timeRange = '24h') => {
    const { sensorReadings } = get();
    const readings = sensorReadings.get(sensorId) || [];
    
    if (!timeRange || timeRange === 'all') {
      return readings;
    }
    
    // Filter by time range
    const now = new Date();
    let cutoffTime = new Date();
    
    switch (timeRange) {
      case '1h':
        cutoffTime.setHours(now.getHours() - 1);
        break;
      case '6h':
        cutoffTime.setHours(now.getHours() - 6);
        break;
      case '24h':
        cutoffTime.setHours(now.getHours() - 24);
        break;
      case '7d':
        cutoffTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffTime.setDate(now.getDate() - 30);
        break;
      default:
        return readings;
    }
    
    return readings.filter(reading => new Date(reading.timestamp) >= cutoffTime);
  },

  purchaseData: (listingId, buyerAddress) => {
    const { listings } = get();
    const listing = listings.find(l => l.id === listingId);
    
    if (listing) {
      const newTransaction: Transaction = {
        id: `tx-${Date.now()}`,
        type: 'purchase',
        amount: listing.price,
        sensor: listing.type,
        buyer: buyerAddress,
        seller: listing.provider,
        timestamp: new Date(),
        status: 'completed'
      };

      set((state) => ({
        transactions: [newTransaction, ...state.transactions],
        totalEarnings: state.totalEarnings + (listing.provider === buyerAddress ? listing.price : 0)
      }));
    }
  },

  getActiveSensors: () => {
    const { sensors } = get();
    return sensors.filter(sensor => sensor.status === 'active');
  },

  getRecentTransactions: () => {
    const { transactions } = get();
    return transactions.slice(0, 5);
  }
}));
