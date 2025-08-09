import { create } from 'zustand';
import { oasisService, SensorReading, NFAMetadata, DataBatch } from '../services/oasisService';

interface OasisState {
  // Connection state
  isConnectedToSapphire: boolean;
  isInitializing: boolean;
  
  // Sensor validation
  sensorReadings: SensorReading[];
  validationResult: {
    isValid: boolean;
    qualityScore: number;
    issues: string[];
  } | null;
  
  // NFA management
  userNFAs: NFAMetadata[];
  mintingInProgress: boolean;
  
  // Data batches
  dataBatches: DataBatch[];
  processingBatch: boolean;
  
  // Purchase history
  purchaseHistory: Array<{
    transactionId: string;
    nfaId: string;
    cost: number;
    timestamp: number;
    data: SensorReading[];
  }>;
  
  // Actions
  initializeSapphire: () => Promise<void>;
  validateSensorData: (readings: SensorReading[]) => Promise<void>;
  mintNFA: (metadata: Omit<NFAMetadata, 'qualityScore' | 'createdAt'>) => Promise<string>;
  processDataBatch: (readings: SensorReading[]) => Promise<void>;
  purchaseData: (nfaId: string, timeframe: { start: number; end: number }) => Promise<void>;
  addSensorReading: (reading: SensorReading) => void;
  clearSensorReadings: () => void;
  getReputationScore: (nfaId: string) => number;
}

export const useOasisStore = create<OasisState>((set, get) => ({
  // Initial state
  isConnectedToSapphire: false,
  isInitializing: false,
  sensorReadings: [],
  validationResult: null,
  userNFAs: [],
  mintingInProgress: false,
  dataBatches: [],
  processingBatch: false,
  purchaseHistory: [],

  // Initialize Sapphire connection
  initializeSapphire: async () => {
    set({ isInitializing: true });
    
    try {
      await oasisService.initializeSapphire();
      set({ 
        isConnectedToSapphire: true,
        isInitializing: false 
      });
    } catch (error) {
      console.error('Failed to initialize Sapphire:', error);
      set({ 
        isConnectedToSapphire: false,
        isInitializing: false 
      });
      throw error;
    }
  },

  // Validate sensor readings
  validateSensorData: async (readings: SensorReading[]) => {
    try {
      const result = await oasisService.validateSensorReadings(readings);
      set({ validationResult: result });
    } catch (error) {
      console.error('Sensor validation failed:', error);
      set({ 
        validationResult: {
          isValid: false,
          qualityScore: 0,
          issues: ['Validation service unavailable']
        }
      });
    }
  },

  // Mint new NFA
  mintNFA: async (metadata: Omit<NFAMetadata, 'qualityScore' | 'createdAt'>) => {
    set({ mintingInProgress: true });
    
    try {
      const { sensorReadings } = get();
      
      // Validate sensor data first
      if (sensorReadings.length === 0) {
        throw new Error('No sensor readings available for validation');
      }
      
      const validation = await oasisService.validateSensorReadings(sensorReadings);
      if (!validation.isValid) {
        throw new Error(`Sensor validation failed: ${validation.issues.join(', ')}`);
      }
      
      // Create NFA metadata with quality score
      const nfaMetadata: NFAMetadata = {
        ...metadata,
        qualityScore: validation.qualityScore,
        createdAt: Date.now()
      };
      
      const nfaId = await oasisService.mintNFA(nfaMetadata);
      
      // Add to user's NFAs
      set(state => ({
        userNFAs: [...state.userNFAs, { ...nfaMetadata, sensorId: nfaId }],
        mintingInProgress: false
      }));
      
      return nfaId;
    } catch (error) {
      set({ mintingInProgress: false });
      throw error;
    }
  },

  // Process data batch
  processDataBatch: async (readings: SensorReading[]) => {
    set({ processingBatch: true });
    
    try {
      const batch = await oasisService.processDataBatch(readings);
      
      set(state => ({
        dataBatches: [...state.dataBatches, batch],
        processingBatch: false
      }));
    } catch (error) {
      set({ processingBatch: false });
      throw error;
    }
  },

  // Purchase data
  purchaseData: async (nfaId: string, timeframe: { start: number; end: number }) => {
    try {
      const result = await oasisService.purchaseData(nfaId, timeframe);
      
      set(state => ({
        purchaseHistory: [...state.purchaseHistory, {
          transactionId: result.transactionId,
          nfaId,
          cost: result.cost,
          timestamp: Date.now(),
          data: result.data
        }]
      }));
    } catch (error) {
      console.error('Data purchase failed:', error);
      throw error;
    }
  },

  // Add sensor reading
  addSensorReading: (reading: SensorReading) => {
    set(state => ({
      sensorReadings: [...state.sensorReadings, reading]
    }));
  },

  // Clear sensor readings
  clearSensorReadings: () => {
    set({ 
      sensorReadings: [],
      validationResult: null 
    });
  },

  // Get reputation score
  getReputationScore: (nfaId: string) => {
    return oasisService.calculateReputationScore(nfaId);
  }
}));
