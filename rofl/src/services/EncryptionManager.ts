import crypto from 'crypto';
import { createLogger } from '../utils/logger';
import { SapphireClient } from './SapphireClient';

const logger = createLogger('EncryptionManager');

/**
 * Encryption Manager using Oasis Sapphire's Trusted Execution Environment
 * Handles all encryption/decryption operations for climate data confidentiality
 */
export class EncryptionManager {
  private sapphireClient: SapphireClient;
  private ready: boolean = false;
  private encryptionCache: Map<string, any> = new Map();

  constructor(sapphireClient: SapphireClient) {
    this.sapphireClient = sapphireClient;
    this.initialize();
  }

  /**
   * Initialize encryption manager
   */
  private async initialize(): Promise<void> {
    try {
      logger.info('🔐 Initializing Encryption Manager with Sapphire TEE...');
      
      // Verify Sapphire connection
      if (!this.sapphireClient.isConnected()) {
        throw new Error('Sapphire client not connected');
      }

      this.ready = true;
      logger.info('✅ Encryption Manager ready');

    } catch (error) {
      logger.error('❌ Failed to initialize Encryption Manager:', error);
      throw error;
    }
  }

  /**
   * Check if encryption manager is ready
   */
  public isReady(): boolean {
    return this.ready && this.sapphireClient.isConnected();
  }

  /**
   * Encrypt climate data using AES-256-GCM with Sapphire-generated keys
   */
  public async encryptClimateData(
    data: any,
    sensorId: string
  ): Promise<{
    encryptedData: string;
    encryptedKey: string;
    nonce: string;
    tag: string;
    metadata: {
      algorithm: string;
      keyDerivation: string;
      timestamp: number;
      sensorId: string;
    };
  }> {
    try {
      logger.info(`🔒 Encrypting climate data for sensor: ${sensorId}`);

      // Generate secure AES key using Sapphire's randomness
      const aesKey = await this.generateSecureAESKey();
      
      // Generate nonce using Sapphire
      const nonce = await this.sapphireClient.generateSecureRandom(12);
      
      // Serialize data to JSON
      const jsonData = JSON.stringify(data);
      const dataBuffer = Buffer.from(jsonData, 'utf8');

      // Encrypt data with AES-256-GCM
      const cipher = crypto.createCipher('aes-256-gcm', aesKey);
      cipher.setAAD(Buffer.from(sensorId)); // Additional authenticated data
      
      let encrypted = cipher.update(dataBuffer);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      const tag = cipher.getAuthTag();

      // Encrypt the AES key using Sapphire's TEE capabilities
      const encryptedKey = await this.encryptKeyWithSapphire(aesKey, sensorId);

      const result = {
        encryptedData: encrypted.toString('base64'),
        encryptedKey: encryptedKey,
        nonce: Buffer.from(nonce).toString('hex'),
        tag: tag.toString('hex'),
        metadata: {
          algorithm: 'aes-256-gcm',
          keyDerivation: 'sapphire-tee',
          timestamp: Date.now(),
          sensorId
        }
      };

      logger.info(`✅ Climate data encrypted successfully for sensor: ${sensorId}`);
      return result;

    } catch (error) {
      logger.error(`❌ Failed to encrypt climate data for ${sensorId}:`, error);
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt climate data using Sapphire TEE
   */
  public async decryptClimateData(
    encryptedData: string,
    encryptedKey: string,
    nonce: string,
    tag: string,
    sensorId: string
  ): Promise<any> {
    try {
      logger.info(`🔓 Decrypting climate data for sensor: ${sensorId}`);

      // Decrypt the AES key using Sapphire
      const aesKey = await this.decryptKeyWithSapphire(encryptedKey, sensorId);

      // Convert hex strings back to buffers
      const nonceBuffer = Buffer.from(nonce, 'hex');
      const tagBuffer = Buffer.from(tag, 'hex');
      const encryptedBuffer = Buffer.from(encryptedData, 'base64');

      // Decrypt data with AES-256-GCM
      const decipher = crypto.createDecipher('aes-256-gcm', aesKey);
      decipher.setAuthTag(tagBuffer);
      decipher.setAAD(Buffer.from(sensorId)); // Same AAD used in encryption

      let decrypted = decipher.update(encryptedBuffer);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      // Parse JSON data
      const jsonData = decrypted.toString('utf8');
      const data = JSON.parse(jsonData);

      logger.info(`✅ Climate data decrypted successfully for sensor: ${sensorId}`);
      return data;

    } catch (error) {
      logger.error(`❌ Failed to decrypt climate data for ${sensorId}:`, error);
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate secure AES key using Sapphire's randomness
   */
  private async generateSecureAESKey(): Promise<Buffer> {
    const keyBytes = await this.sapphireClient.generateSecureRandom(32); // 256 bits
    return Buffer.from(keyBytes);
  }

  /**
   * Encrypt AES key using Sapphire's TEE capabilities
   */
  private async encryptKeyWithSapphire(aesKey: Buffer, sensorId: string): Promise<string> {
    try {
      // In production, this would use Sapphire's built-in key encryption
      // For now, we'll use a deterministic encryption based on sensor ID
      const result = await this.sapphireClient.encryptWithSapphire(aesKey.toString('hex'));
      return result.encryptedData;

    } catch (error) {
      logger.error('❌ Failed to encrypt AES key with Sapphire:', error);
      throw error;
    }
  }

  /**
   * Decrypt AES key using Sapphire's TEE capabilities
   */
  private async decryptKeyWithSapphire(encryptedKey: string, sensorId: string): Promise<Buffer> {
    try {
      // In production, this would use Sapphire's built-in key decryption
      const decryptedHex = await this.sapphireClient.decryptWithSapphire(encryptedKey, '');
      return Buffer.from(decryptedHex, 'hex');

    } catch (error) {
      logger.error('❌ Failed to decrypt AES key with Sapphire:', error);
      throw error;
    }
  }

  /**
   * Generate cryptographic hash for data integrity
   */
  public generateDataHash(data: any): string {
    try {
      // Canonicalize data for consistent hashing
      const canonicalData = this.canonicalizeData(data);
      const jsonString = JSON.stringify(canonicalData);
      
      // Generate SHA-256 hash
      const hash = crypto.createHash('sha256');
      hash.update(jsonString, 'utf8');
      
      return hash.digest('hex');

    } catch (error) {
      logger.error('❌ Failed to generate data hash:', error);
      throw error;
    }
  }

  /**
   * Verify data integrity using hash
   */
  public verifyDataHash(data: any, expectedHash: string): boolean {
    try {
      const calculatedHash = this.generateDataHash(data);
      return calculatedHash === expectedHash;

    } catch (error) {
      logger.error('❌ Failed to verify data hash:', error);
      return false;
    }
  }

  /**
   * Canonicalize data for consistent hashing
   */
  private canonicalizeData(data: any): any {
    if (data === null || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.canonicalizeData(item));
    }

    // Sort object keys for deterministic ordering
    const sortedKeys = Object.keys(data).sort();
    const canonicalized: any = {};

    for (const key of sortedKeys) {
      canonicalized[key] = this.canonicalizeData(data[key]);
    }

    return canonicalized;
  }

  /**
   * Encrypt data for IPFS storage
   */
  public async encryptForIPFS(
    data: any,
    sensorId: string
  ): Promise<{
    encryptedContent: string;
    encryptionMetadata: {
      encryptedKey: string;
      nonce: string;
      tag: string;
      algorithm: string;
      sensorId: string;
      timestamp: number;
    };
  }> {
    try {
      const encrypted = await this.encryptClimateData(data, sensorId);
      
      return {
        encryptedContent: encrypted.encryptedData,
        encryptionMetadata: {
          encryptedKey: encrypted.encryptedKey,
          nonce: encrypted.nonce,
          tag: encrypted.tag,
          algorithm: encrypted.metadata.algorithm,
          sensorId: encrypted.metadata.sensorId,
          timestamp: encrypted.metadata.timestamp
        }
      };

    } catch (error) {
      logger.error('❌ Failed to encrypt data for IPFS:', error);
      throw error;
    }
  }

  /**
   * Decrypt data from IPFS
   */
  public async decryptFromIPFS(
    encryptedContent: string,
    encryptionMetadata: {
      encryptedKey: string;
      nonce: string;
      tag: string;
      sensorId: string;
    }
  ): Promise<any> {
    try {
      return await this.decryptClimateData(
        encryptedContent,
        encryptionMetadata.encryptedKey,
        encryptionMetadata.nonce,
        encryptionMetadata.tag,
        encryptionMetadata.sensorId
      );

    } catch (error) {
      logger.error('❌ Failed to decrypt data from IPFS:', error);
      throw error;
    }
  }

  /**
   * Generate data signature for authentication
   */
  public async generateDataSignature(
    data: any,
    privateKey?: string
  ): Promise<string> {
    try {
      const dataHash = this.generateDataHash(data);
      
      // In production, use Sapphire's signing capabilities
      // For now, use a simple HMAC
      const secret = privateKey || process.env.ROFL_AUTH_TOKEN || 'default-secret';
      const signature = crypto
        .createHmac('sha256', secret)
        .update(dataHash)
        .digest('hex');

      return signature;

    } catch (error) {
      logger.error('❌ Failed to generate data signature:', error);
      throw error;
    }
  }

  /**
   * Verify data signature
   */
  public async verifyDataSignature(
    data: any,
    signature: string,
    publicKey?: string
  ): Promise<boolean> {
    try {
      const expectedSignature = await this.generateDataSignature(data, publicKey);
      return signature === expectedSignature;

    } catch (error) {
      logger.error('❌ Failed to verify data signature:', error);
      return false;
    }
  }

  /**
   * Clear encryption cache
   */
  public clearCache(): void {
    this.encryptionCache.clear();
    logger.info('🧹 Encryption cache cleared');
  }

  /**
   * Get encryption statistics
   */
  public getStatistics(): {
    cacheSize: number;
    isReady: boolean;
    sapphireConnected: boolean;
  } {
    return {
      cacheSize: this.encryptionCache.size,
      isReady: this.ready,
      sapphireConnected: this.sapphireClient.isConnected()
    };
  }
}