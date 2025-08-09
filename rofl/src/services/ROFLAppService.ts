import { createLogger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('ROFLAppService');

/**
 * ROFL App Service - Integrates with rofl-appd daemon
 * Based on https://docs.oasis.io/build/rofl/features/rest
 */
export class ROFLAppService {
  private socketPath: string;
  private appId: string | null = null;
  private isDevelopmentMode: boolean;

  constructor() {
    // Use Windows-compatible socket path or fallback to development mode
    if (process.platform === 'win32') {
      this.socketPath = '\\\\.\\pipe\\rofl-appd'; // Windows named pipe
      this.isDevelopmentMode = true; // Force development mode on Windows for now
      logger.info('🔧 Initializing ROFL App Service for Windows (Development Mode)');
    } else {
      this.socketPath = '/run/rofl-appd.sock'; // Unix socket
      this.isDevelopmentMode = false;
      logger.info('🔧 Initializing ROFL App Service for Unix');
    }
  }

  /**
   * Check if ROFL app daemon is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (this.isDevelopmentMode) {
        // In development mode, we simulate ROFL availability
        return true;
      }
      return fs.existsSync(this.socketPath);
    } catch (error) {
      logger.warn('ROFL app daemon socket not found:', error);
      return false;
    }
  }

  /**
   * Get the current ROFL app's identifier
   * Endpoint: /rofl/v1/app/id (GET)
   */
  async getAppId(): Promise<string> {
    try {
      if (this.isDevelopmentMode) {
        // In development mode, return a mock app ID
        this.appId = 'rofl1qqn9xndja7e2pnxhttktmecvwzz0yqwxsquqyxdf';
        logger.info(`✅ ROFL App ID (development mode): ${this.appId}`);
        return this.appId;
      }

      // In production mode, this would communicate with the actual ROFL daemon
      const response = await this.makeROFLRequest('/rofl/v1/app/id', 'GET');
      this.appId = response.data || response;
      logger.info(`✅ ROFL App ID: ${this.appId}`);
      return this.appId!;
    } catch (error) {
      logger.error('Failed to get ROFL app ID:', error);
      throw new Error('Failed to get ROFL app identifier');
    }
  }

  /**
   * Generate a key using ROFL's decentralized key management
   * Endpoint: /rofl/v1/keys/generate (POST)
   */
  async generateKey(keyId: string, kind: 'raw-256' | 'raw-384' | 'ed25519' | 'secp256k1'): Promise<string> {
    try {
      if (this.isDevelopmentMode) {
        // In development mode, generate a mock key
        const mockKey = this.generateMockKey(kind);
        logger.info(`✅ Generated ${kind} key for ${keyId} (development mode): ${mockKey}`);
        return mockKey;
      }

      const response = await this.makeROFLRequest('/rofl/v1/keys/generate', 'POST', {
        key_id: keyId,
        kind: kind
      });
      
      logger.info(`✅ Generated ${kind} key for ${keyId}`);
      return response.key;
    } catch (error) {
      logger.error('Failed to generate ROFL key:', error);
      throw new Error(`Failed to generate ${kind} key`);
    }
  }

  /**
   * Submit an authenticated transaction to the chain
   * Endpoint: /rofl/v1/tx/sign-submit (POST)
   */
  async submitAuthenticatedTransaction(txData: any, encrypt: boolean = true): Promise<string> {
    try {
      if (this.isDevelopmentMode) {
        // In development mode, simulate transaction submission
        const mockTxHash = this.generateMockTransactionHash();
        logger.info(`✅ Authenticated transaction submitted successfully (development mode): ${mockTxHash}`);
        return mockTxHash;
      }

      const response = await this.makeROFLRequest('/rofl/v1/tx/sign-submit', 'POST', {
        tx: txData,
        encrypt: encrypt
      });
      
      logger.info('✅ Authenticated transaction submitted successfully');
      return response.data;
    } catch (error) {
      logger.error('Failed to submit authenticated transaction:', error);
      throw new Error('Failed to submit authenticated transaction');
    }
  }

  /**
   * Make a request to the ROFL app daemon
   */
  private async makeROFLRequest(endpoint: string, method: string, data?: any): Promise<any> {
    if (!await this.isAvailable()) {
      throw new Error('ROFL app daemon not available');
    }

    if (this.isDevelopmentMode) {
      // In development mode, don't make actual ROFL requests
      throw new Error('ROFL requests not supported in development mode');
    }

    // In production mode, this would use proper UNIX socket communication
    // For now, we'll throw an error to indicate this needs proper implementation
    throw new Error('ROFL daemon communication not yet implemented');
  }

  /**
   * Generate a mock key for development mode
   */
  private generateMockKey(kind: string): string {
    const length = kind === 'raw-256' ? 32 : kind === 'raw-384' ? 48 : 32;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate a mock transaction hash for development mode
   */
  private generateMockTransactionHash(): string {
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return '0x' + Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get ROFL-specific headers for authentication
   */
  getROFLHeaders(): Record<string, string> {
    return {
      'X-ROFL-App-ID': this.appId || '',
      'X-ROFL-Version': 'v1',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get ROFL service status
   */
  getStatus(): {
    available: boolean;
    appId: string | null;
    developmentMode: boolean;
    socketPath: string;
  } {
    const isAvailable = this.isAvailableSync();
    return {
      available: isAvailable,
      appId: this.appId,
      developmentMode: this.isDevelopmentMode,
      socketPath: this.socketPath
    };
  }

  /**
   * Synchronous check for ROFL availability (for status checks)
   */
  private isAvailableSync(): boolean {
    try {
      if (this.isDevelopmentMode) {
        // In development mode, we simulate ROFL availability
        return true;
      }
      return fs.existsSync(this.socketPath);
    } catch (error) {
      return false;
    }
  }
} 