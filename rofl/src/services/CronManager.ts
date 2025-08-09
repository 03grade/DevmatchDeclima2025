import cron from 'node-cron';
import { createLogger } from '../utils/logger';
import { SapphireClient } from './SapphireClient';
import { RewardCalculator } from './RewardCalculator';
import { DataValidator } from './DataValidator';
import { AIProcessor, SummaryType } from './AIProcessor';

const logger = createLogger('CronManager');

/**
 * Cron Job Configuration
 */
interface CronJobConfig {
  schedule: string;
  name: string;
  enabled: boolean;
  timezone?: string;
}

/**
 * Cron Manager for D-Climate daily operations
 * Handles automated reward distribution, data validation, and AI insights generation
 */
export class CronManager {
  private rewardCalculator: RewardCalculator;
  private dataValidator: DataValidator;
  private sapphireClient: SapphireClient;
  private aiProcessor?: AIProcessor;
  private activeJobs: Map<string, cron.ScheduledTask> = new Map();
  private jobHistory: Map<string, Array<{ timestamp: number; success: boolean; error?: string }>> = new Map();

  // Cron job configurations
  private readonly CRON_CONFIGS: Record<string, CronJobConfig> = {
    dailyRewards: {
      schedule: '0 0 * * *', // Daily at midnight UTC
      name: 'Daily Reward Distribution',
      enabled: true,
      timezone: 'UTC'
    },
    dataValidation: {
      schedule: '*/30 * * * *', // Every 30 minutes
      name: 'Data Validation Processing',
      enabled: true,
      timezone: 'UTC'
    },
    aiInsights: {
      schedule: '0 6 * * *', // Daily at 6 AM UTC
      name: 'AI Insights Generation',
      enabled: true,
      timezone: 'UTC'
    },
    systemMaintenance: {
      schedule: '0 2 * * 0', // Weekly on Sunday at 2 AM UTC
      name: 'System Maintenance',
      enabled: true,
      timezone: 'UTC'
    }
  };

  constructor(
    rewardCalculator: RewardCalculator,
    dataValidator: DataValidator,
    sapphireClient: SapphireClient,
    aiProcessor?: AIProcessor
  ) {
    this.rewardCalculator = rewardCalculator;
    this.dataValidator = dataValidator;
    this.sapphireClient = sapphireClient;
    this.aiProcessor = aiProcessor;

    logger.info('⏰ CronManager initialized');
  }

  /**
   * Start daily reward distribution cron job
   */
  public startDailyRewardDistribution(): void {
    const config = this.CRON_CONFIGS.dailyRewards;
    
    if (!config.enabled) {
      logger.info('💰 Daily reward distribution is disabled');
      return;
    }

    const task = cron.schedule(config.schedule, async () => {
      await this.executeDailyRewardDistribution();
    }, {
      scheduled: false,
      timezone: config.timezone
    });

    this.activeJobs.set('dailyRewards', task);
    task.start();

    logger.info(`💰 Daily reward distribution scheduled: ${config.schedule} (${config.timezone})`);
  }

  /**
   * Start data validation cron job
   */
  public startDataValidationCron(): void {
    const config = this.CRON_CONFIGS.dataValidation;
    
    if (!config.enabled) {
      logger.info('🔍 Data validation cron is disabled');
      return;
    }

    const task = cron.schedule(config.schedule, async () => {
      await this.executeDataValidationTasks();
    }, {
      scheduled: false,
      timezone: config.timezone
    });

    this.activeJobs.set('dataValidation', task);
    task.start();

    logger.info(`🔍 Data validation scheduled: ${config.schedule} (${config.timezone})`);
  }

  /**
   * Start AI insights generation cron job
   */
  public startAIInsightsCron(): void {
    const config = this.CRON_CONFIGS.aiInsights;
    
    if (!config.enabled || !this.aiProcessor) {
      logger.info('🤖 AI insights cron is disabled or AI processor not available');
      return;
    }

    const task = cron.schedule(config.schedule, async () => {
      await this.executeAIInsightsGeneration();
    }, {
      scheduled: false,
      timezone: config.timezone
    });

    this.activeJobs.set('aiInsights', task);
    task.start();

    logger.info(`🤖 AI insights generation scheduled: ${config.schedule} (${config.timezone})`);
  }

  /**
   * Start system maintenance cron job
   */
  public startSystemMaintenanceCron(): void {
    const config = this.CRON_CONFIGS.systemMaintenance;
    
    if (!config.enabled) {
      logger.info('🛠️ System maintenance cron is disabled');
      return;
    }

    const task = cron.schedule(config.schedule, async () => {
      await this.executeSystemMaintenance();
    }, {
      scheduled: false,
      timezone: config.timezone
    });

    this.activeJobs.set('systemMaintenance', task);
    task.start();

    logger.info(`🛠️ System maintenance scheduled: ${config.schedule} (${config.timezone})`);
  }

  /**
   * Execute daily reward distribution
   */
  private async executeDailyRewardDistribution(): Promise<void> {
    const jobName = 'dailyRewards';
    const startTime = Date.now();
    
    try {
      logger.info('💰 Starting daily reward distribution...');

      // Get yesterday's date for reward calculation
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const earnedDate = yesterday.getTime();

      // TODO: Get all active sensors from smart contract
      // For now, we'll simulate with mock data
      const activeSensors = await this.getActiveSensorsForRewards();

      if (activeSensors.length === 0) {
        logger.info('No active sensors eligible for rewards');
        this.recordJobExecution(jobName, true);
        return;
      }

      // Calculate rewards for all eligible sensors
      const { results, summary } = await this.rewardCalculator.calculateBatchRewards(
        activeSensors,
        earnedDate
      );

      // TODO: Submit reward calculations to smart contract
      await this.submitRewardsToContract(results);

      const duration = Date.now() - startTime;
      logger.info(`✅ Daily reward distribution completed in ${duration}ms`);
      logger.info(`📊 Distributed ${summary.totalRewardsDistributed} ROSE to ${summary.totalSensors} sensors`);

      this.recordJobExecution(jobName, true);

    } catch (error) {
      logger.error('❌ Daily reward distribution failed:', error);
      this.recordJobExecution(jobName, false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Execute data validation tasks
   */
  private async executeDataValidationTasks(): Promise<void> {
    const jobName = 'dataValidation';
    const startTime = Date.now();

    try {
      logger.info('🔍 Starting data validation tasks...');

      // TODO: Get pending data submissions from smart contract
      // For now, we'll log the validation status
      const stats = this.dataValidator.getStatistics();
      
      logger.info(`📊 Validation stats: ${stats.totalSubmissions} submissions from ${stats.totalSensors} sensors`);

      // Clean up old validation cache periodically
      if (Math.random() < 0.1) { // 10% chance to clean cache
        this.dataValidator.clearCache();
        logger.info('🧹 Cleared validation cache');
      }

      const duration = Date.now() - startTime;
      logger.info(`✅ Data validation tasks completed in ${duration}ms`);

      this.recordJobExecution(jobName, true);

    } catch (error) {
      logger.error('❌ Data validation tasks failed:', error);
      this.recordJobExecution(jobName, false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Execute AI insights generation
   */
  private async executeAIInsightsGeneration(): Promise<void> {
    const jobName = 'aiInsights';
    const startTime = Date.now();

    try {
      if (!this.aiProcessor) {
        throw new Error('AI Processor not available');
      }

      logger.info('🤖 Starting AI insights generation...');

      // TODO: Get aggregated climate data from the system
      // For now, we'll simulate with mock data
      const aggregatedData = await this.getAggregatedClimateData();

      if (aggregatedData.length === 0) {
        logger.info('No data available for AI insights generation');
        this.recordJobExecution(jobName, true);
        return;
      }

      // Generate daily overview
      const dailyOverview = await this.aiProcessor.generateDailyOverview(aggregatedData);
      logger.info('📋 Daily overview generated');

      // Generate regional snapshots for top regions
      const topRegions = aggregatedData
        .sort((a, b) => b.metrics.dataPoints - a.metrics.dataPoints)
        .slice(0, 3);

      for (const regionData of topRegions) {
        const snapshot = await this.aiProcessor.generateRegionalSnapshot(
          regionData.region,
          regionData
        );
        logger.info(`🏘️ Regional snapshot generated for ${regionData.region}`);
      }

      // Generate anomaly highlights if anomalies exist
      const anomalousRegions = aggregatedData.filter(region => region.outliers.length > 0);
      if (anomalousRegions.length > 0) {
        const anomalyHighlights = await this.aiProcessor.generateAnomalyHighlights(anomalousRegions);
        logger.info('⚠️ Anomaly highlights generated');
      }

      const duration = Date.now() - startTime;
      logger.info(`✅ AI insights generation completed in ${duration}ms`);

      this.recordJobExecution(jobName, true);

    } catch (error) {
      logger.error('❌ AI insights generation failed:', error);
      this.recordJobExecution(jobName, false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Execute system maintenance tasks
   */
  private async executeSystemMaintenance(): Promise<void> {
    const jobName = 'systemMaintenance';
    const startTime = Date.now();

    try {
      logger.info('🛠️ Starting system maintenance...');

      // Clear old cache data
      this.dataValidator.clearCache();
      this.rewardCalculator.clearHistory();
      if (this.aiProcessor) {
        this.aiProcessor.clearCache();
      }

      // TODO: Add more maintenance tasks:
      // - Clean up old IPFS files
      // - Compact databases
      // - Generate system reports
      // - Check contract balances

      // Clean job history (keep only last 100 entries per job)
      for (const [jobName, history] of this.jobHistory.entries()) {
        if (history.length > 100) {
          history.splice(0, history.length - 100);
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`✅ System maintenance completed in ${duration}ms`);

      this.recordJobExecution(jobName, true);

    } catch (error) {
      logger.error('❌ System maintenance failed:', error);
      this.recordJobExecution(jobName, false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Get active sensors eligible for rewards (mock implementation)
   */
  private async getActiveSensorsForRewards(): Promise<Array<{
    sensorId: string;
    reputationScore: number;
    validSubmissions: number;
    averageQualityScore: number;
  }>> {
    // TODO: Replace with actual smart contract calls
    // This is mock data for development
    return [
      {
        sensorId: 'CLI12345678-uuid-v4-example-1',
        reputationScore: 120,
        validSubmissions: 15,
        averageQualityScore: 850
      },
      {
        sensorId: 'CLI87654321-uuid-v4-example-2',
        reputationScore: 95,
        validSubmissions: 8,
        averageQualityScore: 720
      }
    ];
  }

  /**
   * Submit reward calculations to smart contract (mock implementation)
   */
  private async submitRewardsToContract(rewards: any[]): Promise<void> {
    // TODO: Implement actual smart contract interaction
    logger.info(`📤 Would submit ${rewards.length} reward calculations to smart contract`);
    
    // Simulate contract interaction delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Get aggregated climate data for AI processing (mock implementation)
   */
  private async getAggregatedClimateData(): Promise<any[]> {
    // TODO: Replace with actual data aggregation from storage
    // This is mock data for development
    return [
      {
        region: 'Malaysia',
        timeRange: { start: Date.now() - 24 * 60 * 60 * 1000, end: Date.now() },
        metrics: {
          avgCO2: 415.2,
          avgTemperature: 28.5,
          avgHumidity: 78.3,
          sensorCount: 12,
          dataPoints: 180
        },
        outliers: [
          {
            sensorId: 'CLI12345678-uuid-v4-example-1',
            metric: 'CO2',
            value: 850,
            deviation: 2.3
          }
        ]
      },
      {
        region: 'Singapore',
        timeRange: { start: Date.now() - 24 * 60 * 60 * 1000, end: Date.now() },
        metrics: {
          avgCO2: 398.7,
          avgTemperature: 27.2,
          avgHumidity: 82.1,
          sensorCount: 8,
          dataPoints: 120
        },
        outliers: []
      }
    ];
  }

  /**
   * Record job execution history
   */
  private recordJobExecution(jobName: string, success: boolean, error?: string): void {
    const history = this.jobHistory.get(jobName) || [];
    history.push({
      timestamp: Date.now(),
      success,
      error
    });
    this.jobHistory.set(jobName, history);
  }

  /**
   * Get job execution statistics
   */
  public getJobStatistics(): Record<string, {
    totalRuns: number;
    successRate: number;
    lastRun?: number;
    lastSuccess?: number;
    lastError?: string;
  }> {
    const stats: Record<string, any> = {};

    for (const [jobName, history] of this.jobHistory.entries()) {
      const totalRuns = history.length;
      const successCount = history.filter(h => h.success).length;
      const successRate = totalRuns > 0 ? (successCount / totalRuns) * 100 : 0;
      const lastRun = totalRuns > 0 ? history[history.length - 1] : undefined;
      const lastSuccess = history.filter(h => h.success).pop();
      const lastFailure = history.filter(h => !h.success).pop();

      stats[jobName] = {
        totalRuns,
        successRate: Math.round(successRate * 100) / 100,
        lastRun: lastRun?.timestamp,
        lastSuccess: lastSuccess?.timestamp,
        lastError: lastFailure?.error
      };
    }

    return stats;
  }

  /**
   * Manually trigger a cron job
   */
  public async triggerJob(jobName: string): Promise<void> {
    logger.info(`🎯 Manually triggering job: ${jobName}`);

    switch (jobName) {
      case 'dailyRewards':
        await this.executeDailyRewardDistribution();
        break;
      case 'dataValidation':
        await this.executeDataValidationTasks();
        break;
      case 'aiInsights':
        await this.executeAIInsightsGeneration();
        break;
      case 'systemMaintenance':
        await this.executeSystemMaintenance();
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }

  /**
   * Stop a specific cron job
   */
  public stopJob(jobName: string): void {
    const task = this.activeJobs.get(jobName);
    if (task) {
      task.stop();
      this.activeJobs.delete(jobName);
      logger.info(`⏹️ Stopped cron job: ${jobName}`);
    }
  }

  /**
   * Stop all cron jobs
   */
  public stopAll(): void {
    for (const [jobName, task] of this.activeJobs.entries()) {
      task.stop();
      logger.info(`⏹️ Stopped cron job: ${jobName}`);
    }
    this.activeJobs.clear();
    logger.info('🛑 All cron jobs stopped');
  }

  /**
   * Get active job status
   */
  public getActiveJobs(): Record<string, {
    name: string;
    schedule: string;
    enabled: boolean;
    running: boolean;
  }> {
    const status: Record<string, any> = {};

    for (const [jobKey, config] of Object.entries(this.CRON_CONFIGS)) {
      const task = this.activeJobs.get(jobKey);
      status[jobKey] = {
        name: config.name,
        schedule: config.schedule,
        enabled: config.enabled,
        running: task ? false : false // ScheduledTask doesn't have running property
      };
    }

    return status;
  }

  /**
   * Update cron job configuration
   */
  public updateJobConfig(jobName: string, config: Partial<CronJobConfig>): void {
    if (!this.CRON_CONFIGS[jobName]) {
      throw new Error(`Unknown job: ${jobName}`);
    }

    // Stop existing job
    this.stopJob(jobName);

    // Update configuration
    Object.assign(this.CRON_CONFIGS[jobName], config);

    // Restart job if enabled
    if (config.enabled !== false) {
      switch (jobName) {
        case 'dailyRewards':
          this.startDailyRewardDistribution();
          break;
        case 'dataValidation':
          this.startDataValidationCron();
          break;
        case 'aiInsights':
          this.startAIInsightsCron();
          break;
        case 'systemMaintenance':
          this.startSystemMaintenanceCron();
          break;
      }
    }

    logger.info(`⚙️ Updated cron job configuration for ${jobName}`);
  }
}