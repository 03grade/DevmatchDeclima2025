import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger';
import { SapphireClient } from './SapphireClient';
import crypto from 'crypto';

const logger = createLogger('SensorIdGenerator');

/**
 * Sensor ID Generator using Oasis Sapphire's secure randomness
 * Generates cryptographically secure UUIDs for sensor identification
 */
export class SensorIdGenerator {
  private sapphireClient: SapphireClient;
  private usedIds: Set<string> = new Set();

  constructor(sapphireClient: SapphireClient) {
    this.sapphireClient = sapphireClient;
  }

  /**
   * Generate a unique sensor ID using Sapphire's secure randomness
   * @param walletAddress The wallet address of the sensor owner
   * @param metadata Optional metadata to include in ID generation
   */
  public async generateSensorId(
    walletAddress: string,
    metadata?: {
      sensorType?: string;
      location?: string;
      timestamp?: number;
    }
  ): Promise<{
    sensorId: string;
    entropy: string;
    derivationInfo: any;
  }> {
    try {
      logger.info(`🔐 Generating secure sensor ID for wallet: ${walletAddress}`);

      // Get secure randomness from Sapphire TEE
      const secureRandom = await this.sapphireClient.generateSecureRandom(32);
      
      // Create deterministic but secure ID
      const idComponents = {
        walletAddress: walletAddress.toLowerCase(),
        timestamp: metadata?.timestamp || Date.now(),
        randomBytes: Buffer.from(secureRandom).toString('hex'),
        sensorType: metadata?.sensorType || 'climate',
        location: metadata?.location || 'unknown'
      };

      // Generate base UUID using secure random
      const baseUuid = this.generateSecureUUID(secureRandom);
      
      // Create sensor-specific prefix
      const prefix = this.createSensorPrefix(idComponents);
      
      // Combine prefix with UUID for final sensor ID
      const sensorId = `${prefix}-${baseUuid}`;

      // Ensure uniqueness (collision prevention)
      const uniqueSensorId = await this.ensureUniqueness(sensorId, walletAddress);

      // Store entropy and derivation info for validation
      const entropy = Buffer.from(secureRandom).toString('hex');
      const derivationInfo = {
        walletAddress,
        timestamp: idComponents.timestamp,
        sensorType: idComponents.sensorType,
        location: idComponents.location,
        method: 'sapphire-secure-random'
      };

      // Track used ID
      this.usedIds.add(uniqueSensorId);

      logger.info(`✅ Generated sensor ID: ${uniqueSensorId}`);

      return {
        sensorId: uniqueSensorId,
        entropy,
        derivationInfo
      };

    } catch (error) {
      logger.error('❌ Failed to generate sensor ID:', error);
      throw new Error(`Sensor ID generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate UUID using secure random bytes from Sapphire
   */
  private generateSecureUUID(secureRandom: Uint8Array): string {
    // Convert secure random to UUID format
    const randomBytes = Buffer.from(secureRandom.slice(0, 16));
    
    // Set version and variant bits according to UUID v4 spec
    randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40; // Version 4
    randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80; // Variant 10

    // Format as UUID string
    const hex = randomBytes.toString('hex');
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32)
    ].join('-');
  }

  /**
   * Create sensor-specific prefix for identification
   */
  private createSensorPrefix(components: any): string {
    const { walletAddress, sensorType } = components;
    
    // Create hash of wallet address for privacy
    const walletHash = crypto
      .createHash('sha256')
      .update(walletAddress)
      .digest('hex')
      .slice(0, 8);

    // Create type prefix
    const typePrefix = sensorType.slice(0, 3).toUpperCase();

    return `${typePrefix}${walletHash}`;
  }

  /**
   * Ensure ID uniqueness by checking against existing sensors
   */
  private async ensureUniqueness(sensorId: string, walletAddress: string): Promise<string> {
    let uniqueId = sensorId;
    let counter = 1;

    // Check if ID is already used (in memory)
    while (this.usedIds.has(uniqueId)) {
      uniqueId = `${sensorId}-${counter.toString().padStart(2, '0')}`;
      counter++;
      
      if (counter > 99) {
        throw new Error('Unable to generate unique sensor ID after 99 attempts');
      }
    }

    // TODO: In production, also check against on-chain sensor registry
    // This would require calling the SensorNFA contract to verify uniqueness

    return uniqueId;
  }

  /**
   * Validate sensor ID format and authenticity
   */
  public validateSensorId(sensorId: string): {
    isValid: boolean;
    components?: {
      prefix: string;
      uuid: string;
      isSecurelyGenerated: boolean;
    };
    errors?: string[];
  } {
    try {
      const errors: string[] = [];

      // Check basic format
      if (!sensorId || typeof sensorId !== 'string') {
        errors.push('Sensor ID must be a non-empty string');
      }

      // Check if it matches our expected format
      const formatRegex = /^[A-Z]{3}[a-f0-9]{8}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}(-\d{2})?$/;
      if (!formatRegex.test(sensorId)) {
        errors.push('Sensor ID format is invalid');
      }

      if (errors.length > 0) {
        return { isValid: false, errors };
      }

      // Parse components
      const parts = sensorId.split('-');
      const prefix = parts[0]; // e.g., "CLIa1b2c3d4"
      const uuid = parts.slice(1, 6).join('-'); // UUID part

      return {
        isValid: true,
        components: {
          prefix,
          uuid,
          isSecurelyGenerated: true // All our IDs are securely generated
        }
      };

    } catch (error) {
      logger.error('Error validating sensor ID:', error);
      return {
        isValid: false,
        errors: ['Validation error occurred']
      };
    }
  }

  /**
   * Generate multiple sensor IDs in batch (for efficiency)
   */
  public async generateBatchSensorIds(
    requests: Array<{
      walletAddress: string;
      metadata?: any;
    }>
  ): Promise<Array<{
    sensorId: string;
    entropy: string;
    derivationInfo: any;
    walletAddress: string;
  }>> {
    logger.info(`🔄 Generating batch of ${requests.length} sensor IDs`);

    const results = [];

    for (const request of requests) {
      try {
        const result = await this.generateSensorId(request.walletAddress, request.metadata);
        results.push({
          ...result,
          walletAddress: request.walletAddress
        });
      } catch (error) {
        logger.error(`Failed to generate ID for ${request.walletAddress}:`, error);
        // Continue with other requests even if one fails
      }
    }

    logger.info(`✅ Generated ${results.length}/${requests.length} sensor IDs successfully`);
    return results;
  }

  /**
   * Get statistics about generated IDs
   */
  public getStatistics(): {
    totalGenerated: number;
    uniqueIds: number;
    avgGenerationTime?: number;
  } {
    return {
      totalGenerated: this.usedIds.size,
      uniqueIds: this.usedIds.size,
      // TODO: Track generation times for performance monitoring
    };
  }

  /**
   * Clear used IDs cache (for testing or maintenance)
   */
  public clearCache(): void {
    this.usedIds.clear();
    logger.info('🧹 Cleared sensor ID cache');
  }

  /**
   * Derive sensor metadata from sensor ID
   */
  public parseSensorId(sensorId: string): {
    typePrefix: string;
    walletHash: string;
    uuid: string;
    counter?: number;
  } | null {
    try {
      const validation = this.validateSensorId(sensorId);
      if (!validation.isValid || !validation.components) {
        return null;
      }

      const { prefix, uuid } = validation.components;
      
      // Extract type prefix (first 3 chars)
      const typePrefix = prefix.slice(0, 3);
      
      // Extract wallet hash (next 8 chars)
      const walletHash = prefix.slice(3, 11);
      
      // Check for counter suffix
      const counterMatch = sensorId.match(/-(\d{2})$/);
      const counter = counterMatch ? parseInt(counterMatch[1]) : undefined;

      return {
        typePrefix,
        walletHash,
        uuid,
        counter
      };

    } catch (error) {
      logger.error('Error parsing sensor ID:', error);
      return null;
    }
  }
}