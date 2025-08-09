import { createLogger } from '../utils/logger';
import { SapphireClient } from './SapphireClient';
import { ValidationResult } from './DataValidator';

const logger = createLogger('RewardCalculator');

/**
 * Reward Calculation Result
 */
export interface RewardCalculationResult {
  sensorId: string;
  earnedDate: number;
  baseReward: number;
  reputationMultiplier: number;
  qualityBonus: number;
  frequencyBonus: number;
  totalReward: number;
  metadata: {
    reputationScore: number;
    validSubmissions: number;
    qualityScore: number;
    calculatedAt: number;
  };
}

/**
 * Daily Reward Summary
 */
export interface DailyRewardSummary {
  date: number;
  totalSensors: number;
  totalRewardsDistributed: number;
  averageReward: number;
  topPerformingSensor: string;
  qualityStats: {
    averageQuality: number;
    highQualityCount: number;
    flaggedCount: number;
  };
}

/**
 * Reward Calculator for D-Climate using Oasis Sapphire confidential computing
 * Implements simple and straightforward reward distribution logic
 */
export class RewardCalculator {
  private sapphireClient: SapphireClient;
  private rewardHistory: Map<string, RewardCalculationResult[]> = new Map();
  
  // Simple reward configuration
  private readonly REWARD_CONFIG = {
    baseAmount: 10, // 10 ROSE base reward
    minReputation: 50, // Minimum reputation to earn rewards
    reputationMultipliers: {
      excellent: 1.5, // 150+ reputation
      good: 1.2,      // 100-149 reputation
      average: 1.0,   // 50-99 reputation
      poor: 0.5       // Below 50 (shouldn't qualify but backup)
    },
    qualityBonuses: {
      perfect: 2.0,   // 900+ quality score
      excellent: 1.5, // 800-899
      good: 1.2,      // 700-799
      average: 1.0,   // 600-699
      poor: 0.8       // Below 600
    },
    frequencyBonuses: {
      veryActive: 1.0,    // 20+ submissions
      active: 0.5,        // 10-19 submissions
      moderate: 0.2,      // 5-9 submissions
      low: 0.0            // Less than 5 submissions
    }
  };

  constructor(sapphireClient: SapphireClient) {
    this.sapphireClient = sapphireClient;
  }

  /**
   * Calculate reward for a single sensor for a specific date
   */
  public async calculateDailyReward(
    sensorId: string,
    earnedDate: number,
    reputationScore: number,
    validSubmissions: number,
    averageQualityScore: number
  ): Promise<RewardCalculationResult> {
    try {
      logger.info(`💰 Calculating reward for sensor ${sensorId} on ${new Date(earnedDate).toISOString()}`);

      // Check minimum reputation requirement
      if (reputationScore < this.REWARD_CONFIG.minReputation) {
        throw new Error(`Sensor reputation ${reputationScore} below minimum ${this.REWARD_CONFIG.minReputation}`);
      }

      // Calculate base reward
      const baseReward = this.REWARD_CONFIG.baseAmount;

      // Calculate reputation multiplier
      const reputationMultiplier = this.calculateReputationMultiplier(reputationScore);

      // Calculate quality bonus
      const qualityBonus = this.calculateQualityBonus(averageQualityScore);

      // Calculate frequency bonus
      const frequencyBonus = this.calculateFrequencyBonus(validSubmissions);

      // Calculate total reward using simple formula
      const totalReward = this.calculateTotalReward(
        baseReward,
        reputationMultiplier,
        qualityBonus,
        frequencyBonus
      );

      const result: RewardCalculationResult = {
        sensorId,
        earnedDate,
        baseReward,
        reputationMultiplier,
        qualityBonus,
        frequencyBonus,
        totalReward,
        metadata: {
          reputationScore,
          validSubmissions,
          qualityScore: averageQualityScore,
          calculatedAt: Date.now()
        }
      };

      // Store reward calculation
      this.storeRewardCalculation(result);

      logger.info(`✅ Reward calculated: ${totalReward} ROSE for sensor ${sensorId}`);
      return result;

    } catch (error) {
      logger.error(`❌ Failed to calculate reward for sensor ${sensorId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate reputation multiplier based on sensor reputation
   */
  private calculateReputationMultiplier(reputationScore: number): number {
    const config = this.REWARD_CONFIG.reputationMultipliers;

    if (reputationScore >= 150) return config.excellent;
    if (reputationScore >= 100) return config.good;
    if (reputationScore >= 50) return config.average;
    return config.poor;
  }

  /**
   * Calculate quality bonus based on average quality score
   */
  private calculateQualityBonus(qualityScore: number): number {
    const config = this.REWARD_CONFIG.qualityBonuses;

    if (qualityScore >= 900) return config.perfect;
    if (qualityScore >= 800) return config.excellent;
    if (qualityScore >= 700) return config.good;
    if (qualityScore >= 600) return config.average;
    return config.poor;
  }

  /**
   * Calculate frequency bonus based on number of valid submissions
   */
  private calculateFrequencyBonus(validSubmissions: number): number {
    const config = this.REWARD_CONFIG.frequencyBonuses;

    if (validSubmissions >= 20) return config.veryActive;
    if (validSubmissions >= 10) return config.active;
    if (validSubmissions >= 5) return config.moderate;
    return config.low;
  }

  /**
   * Calculate total reward using simple formula
   */
  private calculateTotalReward(
    baseReward: number,
    reputationMultiplier: number,
    qualityBonus: number,
    frequencyBonus: number
  ): number {
    // Simple formula: (Base × ReputationMultiplier × QualityBonus) + FrequencyBonus
    const multipliedBase = baseReward * reputationMultiplier * qualityBonus;
    const total = multipliedBase + frequencyBonus;
    
    // Round to 4 decimal places (reasonable for ROSE)
    return Math.round(total * 10000) / 10000;
  }

  /**
   * Calculate rewards for multiple sensors (batch processing)
   */
  public async calculateBatchRewards(
    sensorRewards: Array<{
      sensorId: string;
      reputationScore: number;
      validSubmissions: number;
      averageQualityScore: number;
    }>,
    earnedDate: number
  ): Promise<{
    results: RewardCalculationResult[];
    summary: DailyRewardSummary;
  }> {
    logger.info(`🔄 Calculating batch rewards for ${sensorRewards.length} sensors`);

    const results: RewardCalculationResult[] = [];
    let totalRewards = 0;
    let qualitySum = 0;
    let highQualityCount = 0;
    let flaggedCount = 0;
    let topReward = 0;
    let topSensor = '';

    for (const sensorData of sensorRewards) {
      try {
        const result = await this.calculateDailyReward(
          sensorData.sensorId,
          earnedDate,
          sensorData.reputationScore,
          sensorData.validSubmissions,
          sensorData.averageQualityScore
        );

        results.push(result);
        totalRewards += result.totalReward;
        qualitySum += sensorData.averageQualityScore;

        // Track quality statistics
        if (sensorData.averageQualityScore >= 800) {
          highQualityCount++;
        }
        if (sensorData.averageQualityScore < 600) {
          flaggedCount++;
        }

        // Track top performer
        if (result.totalReward > topReward) {
          topReward = result.totalReward;
          topSensor = sensorData.sensorId;
        }

      } catch (error) {
        logger.error(`Failed to calculate reward for sensor ${sensorData.sensorId}:`, error);
        // Continue with other sensors
      }
    }

    const summary: DailyRewardSummary = {
      date: earnedDate,
      totalSensors: results.length,
      totalRewardsDistributed: totalRewards,
      averageReward: results.length > 0 ? totalRewards / results.length : 0,
      topPerformingSensor: topSensor,
      qualityStats: {
        averageQuality: results.length > 0 ? qualitySum / results.length : 0,
        highQualityCount,
        flaggedCount
      }
    };

    logger.info(`✅ Batch calculation complete: ${results.length} rewards totaling ${totalRewards} ROSE`);

    return { results, summary };
  }

  /**
   * Get reward history for a sensor
   */
  public getSensorRewardHistory(
    sensorId: string,
    limit: number = 30
  ): RewardCalculationResult[] {
    const history = this.rewardHistory.get(sensorId) || [];
    return history
      .sort((a, b) => b.earnedDate - a.earnedDate)
      .slice(0, limit);
  }

  /**
   * Get reward statistics for a sensor
   */
  public getSensorRewardStats(sensorId: string): {
    totalRewards: number;
    totalDays: number;
    averageReward: number;
    bestDay: RewardCalculationResult | null;
    worstDay: RewardCalculationResult | null;
    currentStreak: number;
  } {
    const history = this.getSensorRewardHistory(sensorId, 1000);
    
    if (history.length === 0) {
      return {
        totalRewards: 0,
        totalDays: 0,
        averageReward: 0,
        bestDay: null,
        worstDay: null,
        currentStreak: 0
      };
    }

    const totalRewards = history.reduce((sum, r) => sum + r.totalReward, 0);
    const bestDay = history.reduce((best, r) => r.totalReward > best.totalReward ? r : best);
    const worstDay = history.reduce((worst, r) => r.totalReward < worst.totalReward ? r : worst);

    // Calculate current streak (consecutive days with rewards)
    let currentStreak = 0;
    const sortedHistory = history.sort((a, b) => b.earnedDate - a.earnedDate);
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < sortedHistory.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const dayDiff = (sortedHistory[i - 1].earnedDate - sortedHistory[i].earnedDate) / oneDayMs;
        if (Math.abs(dayDiff - 1) < 0.1) { // Allow for small timing differences
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return {
      totalRewards,
      totalDays: history.length,
      averageReward: totalRewards / history.length,
      bestDay,
      worstDay,
      currentStreak
    };
  }

  /**
   * Get global reward statistics
   */
  public getGlobalRewardStats(): {
    totalSensors: number;
    totalRewardsDistributed: number;
    totalDays: number;
    averageDailyReward: number;
    topPerformingSensors: Array<{
      sensorId: string;
      totalRewards: number;
      averageReward: number;
    }>;
  } {
    const allSensors = Array.from(this.rewardHistory.keys());
    let totalRewards = 0;
    let totalDays = 0;
    
    const sensorStats = allSensors.map(sensorId => {
      const history = this.rewardHistory.get(sensorId) || [];
      const sensorTotal = history.reduce((sum, r) => sum + r.totalReward, 0);
      totalRewards += sensorTotal;
      totalDays += history.length;
      
      return {
        sensorId,
        totalRewards: sensorTotal,
        averageReward: history.length > 0 ? sensorTotal / history.length : 0
      };
    });

    const topPerformers = sensorStats
      .sort((a, b) => b.totalRewards - a.totalRewards)
      .slice(0, 10);

    return {
      totalSensors: allSensors.length,
      totalRewardsDistributed: totalRewards,
      totalDays,
      averageDailyReward: totalDays > 0 ? totalRewards / totalDays : 0,
      topPerformingSensors: topPerformers
    };
  }

  /**
   * Validate reward calculation parameters
   */
  public validateRewardParameters(
    reputationScore: number,
    validSubmissions: number,
    qualityScore: number
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate reputation score
    if (typeof reputationScore !== 'number' || reputationScore < 0 || reputationScore > 200) {
      errors.push('Reputation score must be between 0 and 200');
    }
    if (reputationScore < this.REWARD_CONFIG.minReputation) {
      errors.push(`Reputation score below minimum ${this.REWARD_CONFIG.minReputation}`);
    }

    // Validate submission count
    if (typeof validSubmissions !== 'number' || validSubmissions < 0) {
      errors.push('Valid submissions must be a non-negative number');
    }
    if (validSubmissions === 0) {
      warnings.push('No valid submissions for the day');
    }

    // Validate quality score
    if (typeof qualityScore !== 'number' || qualityScore < 0 || qualityScore > 1000) {
      errors.push('Quality score must be between 0 and 1000');
    }
    if (qualityScore < 500) {
      warnings.push('Low quality score may result in reduced rewards');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Store reward calculation in history
   */
  private storeRewardCalculation(result: RewardCalculationResult): void {
    const history = this.rewardHistory.get(result.sensorId) || [];
    history.push(result);
    
    // Keep only last 365 days of history per sensor
    if (history.length > 365) {
      history.splice(0, history.length - 365);
    }
    
    this.rewardHistory.set(result.sensorId, history);
  }

  /**
   * Clear reward history (for testing)
   */
  public clearHistory(): void {
    this.rewardHistory.clear();
    logger.info('🧹 Reward calculator history cleared');
  }

  /**
   * Export reward data for external analysis
   */
  public exportRewardData(
    sensorIds?: string[],
    startDate?: number,
    endDate?: number
  ): RewardCalculationResult[] {
    const sensorsToExport = sensorIds || Array.from(this.rewardHistory.keys());
    const allRewards: RewardCalculationResult[] = [];

    for (const sensorId of sensorsToExport) {
      const history = this.rewardHistory.get(sensorId) || [];
      
      let filteredHistory = history;
      
      if (startDate || endDate) {
        filteredHistory = history.filter(reward => {
          if (startDate && reward.earnedDate < startDate) return false;
          if (endDate && reward.earnedDate > endDate) return false;
          return true;
        });
      }
      
      allRewards.push(...filteredHistory);
    }

    return allRewards.sort((a, b) => b.earnedDate - a.earnedDate);
  }

  /**
   * Get reward configuration
   */
  public getRewardConfig(): typeof this.REWARD_CONFIG {
    return { ...this.REWARD_CONFIG };
  }

  /**
   * Update reward configuration (for DAO governance)
   */
  public updateRewardConfig(newConfig: Partial<typeof this.REWARD_CONFIG>): void {
    Object.assign(this.REWARD_CONFIG, newConfig);
    logger.info('⚙️ Reward configuration updated:', newConfig);
  }
}