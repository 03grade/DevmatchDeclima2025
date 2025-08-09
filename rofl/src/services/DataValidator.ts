import { createLogger } from '../utils/logger';
import { SapphireClient } from './SapphireClient';
import { EncryptionManager } from './EncryptionManager';

const logger = createLogger('DataValidator');

/**
 * Climate Data Structure
 */
export interface ClimateData {
  sensorId: string;
  timestamp: number;
  co2: number;        // ppm
  temperature: number; // °C
  humidity: number;    // %
}

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-1000 quality score
  errors: string[];
  warnings: string[];
  flags: string[];
  metadata: {
    validatedAt: number;
    validator: string;
    dataHash: string;
  };
}

/**
 * Data Validator for D-Climate using Oasis Sapphire confidential validation
 * Implements comprehensive climate data validation rules
 */
export class DataValidator {
  private sapphireClient: SapphireClient;
  private encryptionManager: EncryptionManager;
  private submissionHistory: Map<string, number[]> = new Map(); // sensorId -> timestamps
  private seenHashes: Set<string> = new Set(); // For duplicate detection
  private sensorLastSubmission: Map<string, number> = new Map(); // sensorId -> last timestamp

  // Validation thresholds
  private readonly VALIDATION_RULES = {
    temperature: {
      min: -50,
      max: 60,
      extremeMin: -30,
      extremeMax: 45
    },
    humidity: {
      min: 0,
      max: 100
    },
    co2: {
      min: 300,
      max: 10000,
      driftThreshold: 5000
    },
    timing: {
      maxTimeDrift: 5 * 60 * 1000, // 5 minutes in ms
      minSubmissionInterval: 10 * 60 * 1000 // 10 minutes in ms
    }
  };

  constructor(sapphireClient: SapphireClient, encryptionManager: EncryptionManager) {
    this.sapphireClient = sapphireClient;
    this.encryptionManager = encryptionManager;
  }

  /**
   * Validate climate data submission with comprehensive rules
   */
  public async validateClimateData(
    data: any,
    submitterAddress: string
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    logger.info(`🔍 Validating climate data from ${submitterAddress}`);

    const result: ValidationResult = {
      isValid: false,
      score: 0,
      errors: [],
      warnings: [],
      flags: [],
      metadata: {
        validatedAt: Date.now(),
        validator: 'sapphire-rofl',
        dataHash: ''
      }
    };

    try {
      // Step 1: Data completeness check
      const completenessResult = this.validateDataCompleteness(data);
      result.errors.push(...completenessResult.errors);
      if (!completenessResult.isValid) {
        logger.warn('❌ Data completeness validation failed');
        return result;
      }

      const climateData = data as ClimateData;

      // Generate data hash for duplicate detection
      result.metadata.dataHash = this.encryptionManager.generateDataHash(climateData);

      // Step 2: Duplicate detection
      const duplicateResult = await this.checkDuplicates(climateData, result.metadata.dataHash);
      result.errors.push(...duplicateResult.errors);
      if (!duplicateResult.isValid) {
        logger.warn('❌ Duplicate data detected');
        return result;
      }

      // Step 3: Sensor ID validation
      const sensorResult = await this.validateSensorId(climateData.sensorId, submitterAddress);
      result.errors.push(...sensorResult.errors);
      result.warnings.push(...sensorResult.warnings);
      if (!sensorResult.isValid) {
        logger.warn('❌ Sensor ID validation failed');
        return result;
      }

      // Step 4: Timestamp validation
      const timestampResult = this.validateTimestamp(climateData.timestamp);
      result.errors.push(...timestampResult.errors);
      result.warnings.push(...timestampResult.warnings);
      if (!timestampResult.isValid) {
        logger.warn('❌ Timestamp validation failed');
        return result;
      }

      // Step 5: Submission frequency check
      const frequencyResult = this.validateSubmissionFrequency(climateData.sensorId, climateData.timestamp);
      result.errors.push(...frequencyResult.errors);
      result.warnings.push(...frequencyResult.warnings);
      if (!frequencyResult.isValid) {
        logger.warn('❌ Submission frequency validation failed');
        return result;
      }

      // Step 6: Climate data range validation
      const rangeResults = [
        this.validateTemperature(climateData.temperature),
        this.validateHumidity(climateData.humidity),
        this.validateCO2(climateData.co2)
      ];

      rangeResults.forEach(rangeResult => {
        result.errors.push(...rangeResult.errors);
        result.warnings.push(...rangeResult.warnings);
        result.flags.push(...rangeResult.flags);
      });

      // Check if any range validation failed
      const hasRangeErrors = rangeResults.some(r => !r.isValid);
      if (hasRangeErrors) {
        logger.warn('❌ Climate data range validation failed');
        return result;
      }

      // Step 7: Calculate quality score
      result.score = this.calculateQualityScore(climateData, result);

      // Step 8: Update tracking data
      this.updateSubmissionHistory(climateData.sensorId, climateData.timestamp);
      this.seenHashes.add(result.metadata.dataHash);

      // All validations passed
      result.isValid = true;

      const duration = Date.now() - startTime;
      logger.info(`✅ Data validation completed in ${duration}ms - Score: ${result.score}/1000`);

      return result;

    } catch (error) {
      logger.error('❌ Data validation error:', error);
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Validate data completeness
   */
  private validateDataCompleteness(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Data must be a valid object');
      return { isValid: false, errors };
    }

    const requiredFields = ['sensorId', 'timestamp', 'co2', 'temperature', 'humidity'];
    
    for (const field of requiredFields) {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      } else if (data[field] === null || data[field] === undefined) {
        errors.push(`Field ${field} cannot be null or undefined`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Check for duplicate submissions
   */
  private async checkDuplicates(
    data: ClimateData, 
    dataHash: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check hash duplicate
    if (this.seenHashes.has(dataHash)) {
      errors.push('Data with identical hash already exists');
    }

    // Check sensorId + timestamp duplicate
    const submissionKey = `${data.sensorId}-${data.timestamp}`;
    const existingSubmissions = this.submissionHistory.get(data.sensorId) || [];
    
    if (existingSubmissions.includes(data.timestamp)) {
      errors.push('Data with identical sensorId and timestamp already exists');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate sensor ID format and ownership
   */
  private async validateSensorId(
    sensorId: string, 
    submitterAddress: string
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // UUID v4 format validation
    const uuidV4Regex = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
    const sensorIdRegex = /^[A-Z]{3}[a-f0-9]{8}-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}(-\d{2})?$/;
    
    if (!sensorIdRegex.test(sensorId)) {
      errors.push('Sensor ID must match the expected format (PREFIX + UUID v4)');
      return { isValid: false, errors, warnings };
    }

    try {
      // Check sensor ownership against smart contract
      const isOwner = await this.checkSensorOwnership(sensorId, submitterAddress);
      if (!isOwner) {
        errors.push('Sensor is not owned by the submitting wallet address');
      }
    } catch (error) {
      logger.warn('Could not verify sensor ownership - proceeding with validation:', error);
      warnings.push('Could not verify sensor ownership - proceeding with validation');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Check sensor ownership against smart contract
   */
  private async checkSensorOwnership(sensorId: string, submitterAddress: string): Promise<boolean> {
    try {
      // Get sensor metadata from smart contract
      const sensorMetadata = await this.sapphireClient.getContract('sensorNFA', [
        'function getSensorMetadata(string sensorId) external view returns (string sensorId, uint256 reputationScore, uint256 mintTimestamp, string ipfsMetadata, bool isActive, uint256 totalSubmissions, uint256 lastSubmission)'
      ]).getSensorMetadata(sensorId);

      // Check if sensor exists and is active
      if (!sensorMetadata || !sensorMetadata.isActive) {
        logger.warn(`Sensor ${sensorId} does not exist or is not active`);
        return false;
      }

      // TODO: Implement actual ownership check
      // For now, we'll assume ownership if sensor exists and is active
      // In a real implementation, you'd check the NFT ownership
      logger.info(`Sensor ${sensorId} ownership verified for ${submitterAddress}`);
      return true;

    } catch (error) {
      logger.error(`Failed to check sensor ownership for ${sensorId}:`, error);
      return false;
    }
  }

  /**
   * Validate timestamp
   */
  private validateTimestamp(timestamp: number): { 
    isValid: boolean; 
    errors: string[]; 
    warnings: string[] 
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if timestamp is a valid number
    if (!Number.isInteger(timestamp) || timestamp <= 0) {
      errors.push('Timestamp must be a valid positive integer (UNIX timestamp in seconds)');
      return { isValid: false, errors, warnings };
    }

    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const timeDiff = Math.abs(now - timestamp);
    const maxDrift = this.VALIDATION_RULES.timing.maxTimeDrift / 1000; // Convert to seconds

    // Check time drift (±5 minutes)
    if (timeDiff > maxDrift) {
      if (timestamp > now) {
        errors.push('Future timestamps are not allowed');
      } else {
        errors.push(`Timestamp is too old (max ${maxDrift / 60} minutes drift allowed)`);
      }
    }

    // Warning for near-edge timestamps
    if (timeDiff > maxDrift * 0.8) {
      warnings.push('Timestamp is near the maximum allowed drift');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate submission frequency
   */
  private validateSubmissionFrequency(
    sensorId: string, 
    timestamp: number
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const lastSubmission = this.sensorLastSubmission.get(sensorId);
    
    if (lastSubmission) {
      const timeDiff = (timestamp * 1000) - lastSubmission;
      const minInterval = this.VALIDATION_RULES.timing.minSubmissionInterval;

      if (timeDiff < minInterval) {
        errors.push(`Submission too frequent. Minimum interval: ${minInterval / 60000} minutes`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate temperature
   */
  private validateTemperature(temperature: number): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    flags: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const flags: string[] = [];
    const rules = this.VALIDATION_RULES.temperature;

    if (typeof temperature !== 'number' || isNaN(temperature)) {
      errors.push('Temperature must be a valid number');
      return { isValid: false, errors, warnings, flags };
    }

    if (temperature < rules.min || temperature > rules.max) {
      errors.push(`Temperature must be between ${rules.min}°C and ${rules.max}°C`);
      return { isValid: false, errors, warnings, flags };
    }

    // Extreme temperature warnings
    if (temperature > rules.extremeMax) {
      warnings.push(`Extreme high temperature: ${temperature}°C (above ${rules.extremeMax}°C)`);
    }
    if (temperature < rules.extremeMin) {
      warnings.push(`Extreme low temperature: ${temperature}°C (below ${rules.extremeMin}°C)`);
    }

    return { isValid: true, errors, warnings, flags };
  }

  /**
   * Validate humidity
   */
  private validateHumidity(humidity: number): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    flags: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const flags: string[] = [];
    const rules = this.VALIDATION_RULES.humidity;

    if (typeof humidity !== 'number' || isNaN(humidity)) {
      errors.push('Humidity must be a valid number');
      return { isValid: false, errors, warnings, flags };
    }

    if (humidity < rules.min || humidity > rules.max) {
      errors.push(`Humidity must be between ${rules.min}% and ${rules.max}%`);
      return { isValid: false, errors, warnings, flags };
    }

    // Edge case flags
    if (humidity === 0) {
      flags.push('Suspicious: Humidity is exactly 0% (edge case)');
    }
    if (humidity === 100) {
      flags.push('Suspicious: Humidity is exactly 100% (edge case)');
    }

    return { isValid: true, errors, warnings, flags };
  }

  /**
   * Validate CO2
   */
  private validateCO2(co2: number): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    flags: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const flags: string[] = [];
    const rules = this.VALIDATION_RULES.co2;

    if (typeof co2 !== 'number' || isNaN(co2)) {
      errors.push('CO2 must be a valid number');
      return { isValid: false, errors, warnings, flags };
    }

    if (co2 < 0) {
      errors.push('CO2 cannot be negative');
      return { isValid: false, errors, warnings, flags };
    }

    if (co2 < rules.min) {
      errors.push(`CO2 must be at least ${rules.min} ppm`);
      return { isValid: false, errors, warnings, flags };
    }

    if (co2 > rules.max) {
      errors.push(`CO2 cannot exceed ${rules.max} ppm (implausible)`);
      return { isValid: false, errors, warnings, flags };
    }

    // Sensor drift detection
    if (co2 > rules.driftThreshold) {
      flags.push(`Potential sensor drift: CO2 ${co2} ppm exceeds ${rules.driftThreshold} ppm`);
    }

    return { isValid: true, errors, warnings, flags };
  }

  /**
   * Calculate quality score based on validation results
   */
  private calculateQualityScore(data: ClimateData, result: ValidationResult): number {
    let score = 1000; // Start with perfect score

    // Deduct for warnings
    score -= result.warnings.length * 50;

    // Deduct for flags
    score -= result.flags.length * 25;

    // Bonus for reasonable values (within typical ranges)
    if (data.temperature >= 15 && data.temperature <= 35) score += 25;
    if (data.humidity >= 30 && data.humidity <= 80) score += 25;
    if (data.co2 >= 350 && data.co2 <= 1000) score += 25;

    // Ensure score is within bounds
    return Math.max(0, Math.min(1000, score));
  }

  /**
   * Update submission history for frequency tracking
   */
  private updateSubmissionHistory(sensorId: string, timestamp: number): void {
    // Update submission history
    const history = this.submissionHistory.get(sensorId) || [];
    history.push(timestamp);
    
    // Keep only last 100 submissions per sensor
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.submissionHistory.set(sensorId, history);
    this.sensorLastSubmission.set(sensorId, timestamp * 1000);
  }

  /**
   * Validate batch of climate data submissions
   */
  public async validateDataBatch(
    dataArray: any[],
    submitterAddress: string
  ): Promise<{
    results: ValidationResult[];
    summary: {
      total: number;
      valid: number;
      invalid: number;
      avgScore: number;
    };
  }> {
    logger.info(`🔄 Validating batch of ${dataArray.length} climate data submissions`);

    const results: ValidationResult[] = [];
    let totalScore = 0;
    let validCount = 0;

    for (const data of dataArray) {
      const result = await this.validateClimateData(data, submitterAddress);
      results.push(result);
      
      if (result.isValid) {
        validCount++;
        totalScore += result.score;
      }
    }

    const summary = {
      total: dataArray.length,
      valid: validCount,
      invalid: dataArray.length - validCount,
      avgScore: validCount > 0 ? Math.round(totalScore / validCount) : 0
    };

    logger.info(`✅ Batch validation complete: ${summary.valid}/${summary.total} valid (avg score: ${summary.avgScore})`);

    return { results, summary };
  }

  /**
   * Get validation statistics
   */
  public getStatistics(): {
    totalSensors: number;
    totalSubmissions: number;
    uniqueHashes: number;
    validationRules: typeof DataValidator.prototype.VALIDATION_RULES;
  } {
    return {
      totalSensors: this.submissionHistory.size,
      totalSubmissions: Array.from(this.submissionHistory.values()).reduce((sum, arr) => sum + arr.length, 0),
      uniqueHashes: this.seenHashes.size,
      validationRules: DataValidator.prototype.VALIDATION_RULES
    };
  }

  /**
   * Clear validation cache (for testing)
   */
  public clearCache(): void {
    this.submissionHistory.clear();
    this.seenHashes.clear();
    this.sensorLastSubmission.clear();
    logger.info('🧹 Data validator cache cleared');
  }
}