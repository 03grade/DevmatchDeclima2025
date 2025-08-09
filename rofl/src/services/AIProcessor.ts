import OpenAI from 'openai';
import { createLogger } from '../utils/logger';
import { SapphireClient } from './SapphireClient';
import { ClimateData } from './DataValidator';

const logger = createLogger('AIProcessor');

/**
 * AI Summary Types
 */
export enum SummaryType {
  DAILY_OVERVIEW = 'daily_overview',
  REGIONAL_SNAPSHOT = 'regional_snapshot',
  ANOMALY_HIGHLIGHTS = 'anomaly_highlights'
}

/**
 * AI Summary Result
 */
export interface AISummaryResult {
  type: SummaryType;
  summary: string;
  metadata: {
    dataPoints: number;
    regions: string[];
    timeRange: {
      start: number;
      end: number;
    };
    generatedAt: number;
    model: string;
    temperature: number;
    promptHash: string;
  };
  insights: {
    trends: string[];
    anomalies: string[];
    recommendations: string[];
  };
}

/**
 * Climate Data Aggregation
 */
export interface ClimateDataAggregation {
  region: string;
  timeRange: { start: number; end: number };
  metrics: {
    avgCO2: number;
    avgTemperature: number;
    avgHumidity: number;
    sensorCount: number;
    dataPoints: number;
  };
  outliers: Array<{
    sensorId: string;
    metric: string;
    value: number;
    deviation: number;
  }>;
}

/**
 * AI Processor for D-Climate using Oasis Sapphire confidential computing
 * Integrates with OpenAI GPT-4 for climate data insights generation
 */
export class AIProcessor {
  private openai: OpenAI;
  private sapphireClient: SapphireClient;
  private summaryCache: Map<string, AISummaryResult> = new Map();
  
  // AI Configuration
  private readonly AI_CONFIG = {
    model: 'gpt-4-turbo-preview',
    temperature: 0, // For reproducibility
    maxTokens: 1500,
    apiKey: process.env.OPENAI_API_KEY
  };

  constructor(sapphireClient: SapphireClient) {
    this.sapphireClient = sapphireClient;
    
    logger.info('🔧 Initializing AI Processor...');
    logger.info(`🔑 OpenAI API Key available: ${this.AI_CONFIG.apiKey ? 'YES' : 'NO'}`);
    
    if (!this.AI_CONFIG.apiKey) {
      logger.error('❌ OpenAI API key not found in environment variables');
      logger.error('Please set OPENAI_API_KEY in your .env file');
      logger.error('You can get an API key from: https://platform.openai.com/api-keys');
      logger.error('Current environment variables:', {
        NODE_ENV: process.env.NODE_ENV,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'
      });
      
      // Don't throw error, just log warning and continue without AI functionality
      logger.warn('⚠️ AI Processor will run without OpenAI integration');
      this.openai = null as any;
    } else {
      try {
        this.openai = new OpenAI({
          apiKey: this.AI_CONFIG.apiKey
        });
        logger.info('🤖 AI Processor initialized with OpenAI GPT-4');
      } catch (error) {
        logger.error('❌ Failed to initialize OpenAI client:', error);
        this.openai = null as any;
      }
    }
  }

  /**
   * Generate custom AI insights based on user prompt and context
   */
  public async generateCustomInsight(
    prompt: string,
    aggregatedData: ClimateDataAggregation | null = null,
    context: any = null
  ): Promise<{
    type: 'custom_insight';
    prompt: string;
    response: string;
    context: any;
    metadata: {
      generatedAt: number;
      model: string;
      temperature: number;
      promptHash: string;
    };
    confidence: number;
  }> {
    try {
      logger.info('💬 Generating custom AI insight...');

      const promptHash = this.generatePromptHash(prompt);
      const cacheKey = `custom_${promptHash}`;

      // Check cache first
      if (this.summaryCache.has(cacheKey)) {
        logger.info('📋 Using cached custom insight');
        const cached = this.summaryCache.get(cacheKey)!;
        return {
          type: 'custom_insight',
          prompt,
          response: cached.summary,
          context: context || {},
          metadata: {
            generatedAt: cached.metadata.generatedAt,
            model: cached.metadata.model,
            temperature: cached.metadata.temperature,
            promptHash
          },
          confidence: 0.85
        };
      }

      // Build custom prompt
      let customPrompt = `Based on the following climate data and user query, provide a detailed analysis:\n\n`;
      customPrompt += `User Query: ${prompt}\n\n`;

      if (aggregatedData) {
        customPrompt += `Climate Data Context:\n`;
        customPrompt += `- Region: ${aggregatedData.region}\n`;
        customPrompt += `- Time Range: ${this.formatTimeRange(aggregatedData.timeRange)}\n`;
        customPrompt += `- Average CO2: ${aggregatedData.metrics.avgCO2.toFixed(1)} ppm\n`;
        customPrompt += `- Average Temperature: ${aggregatedData.metrics.avgTemperature.toFixed(1)}°C\n`;
        customPrompt += `- Average Humidity: ${aggregatedData.metrics.avgHumidity.toFixed(1)}%\n`;
        customPrompt += `- Sensor Count: ${aggregatedData.metrics.sensorCount}\n`;
        customPrompt += `- Data Points: ${aggregatedData.metrics.dataPoints}\n`;
        
        if (aggregatedData.outliers.length > 0) {
          customPrompt += `- Anomalies: ${aggregatedData.outliers.length} detected\n`;
        }
      }

      if (context) {
        customPrompt += `\nAdditional Context: ${JSON.stringify(context, null, 2)}\n`;
      }

      customPrompt += `\nPlease provide a comprehensive analysis addressing the user's query with specific insights, trends, and recommendations based on the available climate data.`;

      // Call OpenAI with higher temperature for more creative responses
      const response = await this.callOpenAI(customPrompt, 3);
      
      const result = {
        type: 'custom_insight' as const,
        prompt,
        response,
        context: context || {},
        metadata: {
          generatedAt: Date.now(),
          model: this.AI_CONFIG.model,
          temperature: 0.3, // Higher temperature for custom insights
          promptHash
        },
        confidence: 0.85
      };

      // Cache the result
      this.summaryCache.set(cacheKey, {
        type: SummaryType.DAILY_OVERVIEW, // Use existing type for caching
        summary: response,
        metadata: {
          dataPoints: aggregatedData?.metrics.dataPoints || 0,
          regions: aggregatedData ? [aggregatedData.region] : [],
          timeRange: aggregatedData?.timeRange || { start: 0, end: 0 },
          generatedAt: result.metadata.generatedAt,
          model: result.metadata.model,
          temperature: result.metadata.temperature,
          promptHash
        },
        insights: {
          trends: [],
          anomalies: [],
          recommendations: []
        }
      });

      logger.info('✅ Custom AI insight generated successfully');
      return result;

    } catch (error) {
      logger.error('❌ Failed to generate custom insight:', error);
      throw new Error(`Custom insight generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate daily climate overview summary
   */
  public async generateDailyOverview(
    aggregatedData: ClimateDataAggregation[]
  ): Promise<AISummaryResult> {
    try {
      logger.info('🌍 Generating daily climate overview...');

      const prompt = this.buildDailyOverviewPrompt(aggregatedData);
      const promptHash = this.generatePromptHash(prompt);

      // Check cache first
      const cacheKey = `daily_${promptHash}`;
      if (this.summaryCache.has(cacheKey)) {
        logger.info('📋 Using cached daily overview');
        return this.summaryCache.get(cacheKey)!;
      }

      const summary = await this.callOpenAI(prompt);
      const insights = this.extractInsights(summary);

      const result: AISummaryResult = {
        type: SummaryType.DAILY_OVERVIEW,
        summary,
        metadata: {
          dataPoints: aggregatedData.reduce((sum, region) => sum + region.metrics.dataPoints, 0),
          regions: aggregatedData.map(region => region.region),
          timeRange: this.getTimeRange(aggregatedData),
          generatedAt: Date.now(),
          model: this.AI_CONFIG.model,
          temperature: this.AI_CONFIG.temperature,
          promptHash
        },
        insights
      };

      // Cache the result
      this.summaryCache.set(cacheKey, result);

      logger.info('✅ Daily overview generated successfully');
      return result;

    } catch (error) {
      logger.error('❌ Failed to generate daily overview:', error);
      throw new Error(`Daily overview generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate regional climate snapshot
   */
  public async generateRegionalSnapshot(
    region: string,
    regionData: ClimateDataAggregation
  ): Promise<AISummaryResult> {
    try {
      logger.info(`🏘️ Generating regional snapshot for ${region}...`);

      const prompt = this.buildRegionalSnapshotPrompt(region, regionData);
      const promptHash = this.generatePromptHash(prompt);

      // Check cache first
      const cacheKey = `regional_${region}_${promptHash}`;
      if (this.summaryCache.has(cacheKey)) {
        logger.info('📋 Using cached regional snapshot');
        return this.summaryCache.get(cacheKey)!;
      }

      const summary = await this.callOpenAI(prompt);
      const insights = this.extractInsights(summary);

      const result: AISummaryResult = {
        type: SummaryType.REGIONAL_SNAPSHOT,
        summary,
        metadata: {
          dataPoints: regionData.metrics.dataPoints,
          regions: [region],
          timeRange: regionData.timeRange,
          generatedAt: Date.now(),
          model: this.AI_CONFIG.model,
          temperature: this.AI_CONFIG.temperature,
          promptHash
        },
        insights
      };

      // Cache the result
      this.summaryCache.set(cacheKey, result);

      logger.info(`✅ Regional snapshot generated for ${region}`);
      return result;

    } catch (error) {
      logger.error(`❌ Failed to generate regional snapshot for ${region}:`, error);
      throw new Error(`Regional snapshot generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate anomaly highlights
   */
  public async generateAnomalyHighlights(
    anomalousData: ClimateDataAggregation[]
  ): Promise<AISummaryResult> {
    try {
      logger.info('⚠️ Generating anomaly highlights...');

      const prompt = this.buildAnomalyHighlightsPrompt(anomalousData);
      const promptHash = this.generatePromptHash(prompt);

      // Check cache first
      const cacheKey = `anomaly_${promptHash}`;
      if (this.summaryCache.has(cacheKey)) {
        logger.info('📋 Using cached anomaly highlights');
        return this.summaryCache.get(cacheKey)!;
      }

      const summary = await this.callOpenAI(prompt);
      const insights = this.extractInsights(summary);

      const result: AISummaryResult = {
        type: SummaryType.ANOMALY_HIGHLIGHTS,
        summary,
        metadata: {
          dataPoints: anomalousData.reduce((sum, region) => sum + region.metrics.dataPoints, 0),
          regions: anomalousData.map(region => region.region),
          timeRange: this.getTimeRange(anomalousData),
          generatedAt: Date.now(),
          model: this.AI_CONFIG.model,
          temperature: this.AI_CONFIG.temperature,
          promptHash
        },
        insights
      };

      // Cache the result
      this.summaryCache.set(cacheKey, result);

      logger.info('✅ Anomaly highlights generated successfully');
      return result;

    } catch (error) {
      logger.error('❌ Failed to generate anomaly highlights:', error);
      throw new Error(`Anomaly generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build prompt for daily overview
   */
  private buildDailyOverviewPrompt(aggregatedData: ClimateDataAggregation[]): string {
    const globalStats = this.calculateGlobalStats(aggregatedData);
    const topRegions = aggregatedData
      .sort((a, b) => b.metrics.dataPoints - a.metrics.dataPoints)
      .slice(0, 3);

    return `
You are a climate data analyst providing a daily climate overview for D-Climate platform.

GLOBAL DATA SUMMARY:
- Total Regions: ${aggregatedData.length}
- Average CO2: ${globalStats.avgCO2.toFixed(1)} ppm
- Average Temperature: ${globalStats.avgTemperature.toFixed(1)}°C
- Average Humidity: ${globalStats.avgHumidity.toFixed(1)}%
- Total Sensors: ${globalStats.totalSensors}
- Total Data Points: ${globalStats.totalDataPoints}

TOP DATA-CONTRIBUTING REGIONS:
${topRegions.map(region => 
  `- ${region.region}: ${region.metrics.dataPoints} points, CO2: ${region.metrics.avgCO2.toFixed(1)}ppm, Temp: ${region.metrics.avgTemperature.toFixed(1)}°C`
).join('\n')}

DETECTED ANOMALIES:
${aggregatedData.flatMap(region => region.outliers).slice(0, 3).map(outlier => 
  `- ${outlier.sensorId}: ${outlier.metric} = ${outlier.value} (${outlier.deviation.toFixed(1)}σ deviation)`
).join('\n')}

Please provide a brief, engaging daily climate summary following this format:
"Today's data shows [CO2 trend] in CO2 ([percentage change]), with [region] recording the [significant change]. Sensor activity was highest in [region] with [stability description]."

Keep it concise (2-3 sentences), mention specific numbers, and highlight the most interesting trend or regional difference.
    `.trim();
  }

  /**
   * Build prompt for regional snapshot
   */
  private buildRegionalSnapshotPrompt(region: string, regionData: ClimateDataAggregation): string {
    const metrics = regionData.metrics;
    const timeRangeStr = this.formatTimeRange(regionData.timeRange);

    return `
You are a climate data analyst providing a regional climate snapshot for D-Climate platform.

REGION: ${region}
TIME PERIOD: ${timeRangeStr}

REGIONAL METRICS:
- Average CO2: ${metrics.avgCO2.toFixed(1)} ppm
- Average Temperature: ${metrics.avgTemperature.toFixed(1)}°C  
- Average Humidity: ${metrics.avgHumidity.toFixed(1)}%
- Active Sensors: ${metrics.sensorCount}
- Data Points: ${metrics.dataPoints}

OUTLIERS IN REGION:
${regionData.outliers.map(outlier => 
  `- Sensor ${outlier.sensorId}: ${outlier.metric} = ${outlier.value} (${outlier.deviation.toFixed(1)}σ from regional avg)`
).join('\n') || '- No significant outliers detected'}

Please provide a focused regional summary following this format:
"In ${region}, average CO2 reached [value]ppm, [comparison to normal]. Temperature varied between [range], and [number] sensors flagged [notable events]."

Include specific numbers, mention if values are above/below normal ranges, and highlight any concerning patterns. Keep it informative but concise (2-3 sentences).
    `.trim();
  }

  /**
   * Build prompt for anomaly highlights
   */
  private buildAnomalyHighlightsPrompt(anomalousData: ClimateDataAggregation[]): string {
    const allOutliers = anomalousData.flatMap(region => 
      region.outliers.map(outlier => ({ ...outlier, region: region.region }))
    ).sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

    const topAnomalies = allOutliers.slice(0, 5);

    return `
You are a climate data analyst identifying unusual patterns for D-Climate platform.

DETECTED ANOMALIES (by severity):
${topAnomalies.map((anomaly, index) => 
  `${index + 1}. Region: ${anomaly.region} | Sensor: ${anomaly.sensorId} | ${anomaly.metric}: ${anomaly.value} (${anomaly.deviation.toFixed(1)}σ deviation)`
).join('\n')}

REGIONAL ANOMALY BREAKDOWN:
${anomalousData.map(region => 
  `- ${region.region}: ${region.outliers.length} anomalies, avg CO2: ${region.metrics.avgCO2.toFixed(1)}ppm`
).join('\n')}

Please provide an anomaly highlight summary following this format:
"Unusual spike detected near [location]: [metric] levels [action] to [value] from one sensor. Cross-checking for sensor errors. No similar patterns in nearby regions."

Focus on the most severe anomaly, mention the specific values, suggest possible causes (sensor drift vs real event), and note if it's isolated or part of a pattern. Keep it analytical but accessible (2-3 sentences).
    `.trim();
  }

  /**
   * Call OpenAI API with error handling and retry logic
   */
  private async callOpenAI(prompt: string, retries: number = 3): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured. AI functionality is disabled.');
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.debug(`🤖 Calling OpenAI API (attempt ${attempt}/${retries})`);

        const response = await this.openai.chat.completions.create({
          model: this.AI_CONFIG.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert climate data analyst providing clear, accurate, and engaging summaries of environmental data. Always include specific numbers and avoid speculation.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: this.AI_CONFIG.temperature,
          max_tokens: this.AI_CONFIG.maxTokens
        });

        const summary = response.choices[0]?.message?.content;
        if (!summary) {
          throw new Error('No content received from OpenAI');
        }

        logger.debug(`✅ OpenAI API call successful (${response.usage?.total_tokens} tokens)`);
        return summary.trim();

      } catch (error) {
        logger.warn(`❌ OpenAI API call failed (attempt ${attempt}/${retries}):`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error('OpenAI API call failed after all retries');
  }

  /**
   * Extract insights from AI summary
   */
  private extractInsights(summary: string): {
    trends: string[];
    anomalies: string[];
    recommendations: string[];
  } {
    // Simple keyword-based insight extraction
    const trends: string[] = [];
    const anomalies: string[] = [];
    const recommendations: string[] = [];

    const text = summary.toLowerCase();

    // Extract trends
    if (text.includes('increase') || text.includes('rise') || text.includes('spike')) {
      trends.push('Increasing trend detected');
    }
    if (text.includes('decrease') || text.includes('drop') || text.includes('fall')) {
      trends.push('Decreasing trend detected');
    }
    if (text.includes('stable') || text.includes('steady')) {
      trends.push('Stable conditions observed');
    }

    // Extract anomalies
    if (text.includes('unusual') || text.includes('anomaly') || text.includes('spike')) {
      anomalies.push('Unusual pattern detected');
    }
    if (text.includes('error') || text.includes('drift')) {
      anomalies.push('Potential sensor issue identified');
    }

    // Extract recommendations
    if (text.includes('check') || text.includes('monitor')) {
      recommendations.push('Further monitoring recommended');
    }
    if (text.includes('investigate') || text.includes('cross-check')) {
      recommendations.push('Investigation suggested');
    }

    return { trends, anomalies, recommendations };
  }

  /**
   * Calculate global statistics from aggregated data
   */
  private calculateGlobalStats(aggregatedData: ClimateDataAggregation[]): {
    avgCO2: number;
    avgTemperature: number;
    avgHumidity: number;
    totalSensors: number;
    totalDataPoints: number;
  } {
    const totalDataPoints = aggregatedData.reduce((sum, region) => sum + region.metrics.dataPoints, 0);
    const totalSensors = aggregatedData.reduce((sum, region) => sum + region.metrics.sensorCount, 0);

    // Weighted averages by data points
    const weightedCO2 = aggregatedData.reduce((sum, region) => 
      sum + (region.metrics.avgCO2 * region.metrics.dataPoints), 0) / totalDataPoints;
    const weightedTemp = aggregatedData.reduce((sum, region) => 
      sum + (region.metrics.avgTemperature * region.metrics.dataPoints), 0) / totalDataPoints;
    const weightedHumidity = aggregatedData.reduce((sum, region) => 
      sum + (region.metrics.avgHumidity * region.metrics.dataPoints), 0) / totalDataPoints;

    return {
      avgCO2: weightedCO2 || 0,
      avgTemperature: weightedTemp || 0,
      avgHumidity: weightedHumidity || 0,
      totalSensors,
      totalDataPoints
    };
  }

  /**
   * Get time range from aggregated data
   */
  private getTimeRange(aggregatedData: ClimateDataAggregation[]): { start: number; end: number } {
    const allRanges = aggregatedData.map(region => region.timeRange);
    return {
      start: Math.min(...allRanges.map(range => range.start)),
      end: Math.max(...allRanges.map(range => range.end))
    };
  }

  /**
   * Format time range for display
   */
  private formatTimeRange(timeRange: { start: number; end: number }): string {
    const start = new Date(timeRange.start).toLocaleDateString();
    const end = new Date(timeRange.end).toLocaleDateString();
    return start === end ? start : `${start} - ${end}`;
  }

  /**
   * Generate hash for prompt caching
   */
  private generatePromptHash(prompt: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(prompt).digest('hex').substring(0, 8);
  }

  /**
   * Get cached summaries
   */
  public getCachedSummaries(type?: SummaryType): AISummaryResult[] {
    const cached = Array.from(this.summaryCache.values());
    return type ? cached.filter(summary => summary.type === type) : cached;
  }

  /**
   * Clear AI cache
   */
  public clearCache(): void {
    this.summaryCache.clear();
    logger.info('🧹 AI processor cache cleared');
  }

  /**
   * Get AI processing statistics
   */
  public getStatistics(): {
    cachedSummaries: number;
    apiCallsToday: number;
    averageResponseTime: number;
    modelUsed: string;
  } {
    return {
      cachedSummaries: this.summaryCache.size,
      apiCallsToday: 0, // TODO: Implement call tracking
      averageResponseTime: 0, // TODO: Implement timing tracking
      modelUsed: this.AI_CONFIG.model
    };
  }

  /**
   * Test OpenAI connection
   */
  public async testOpenAIConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.openai) {
      return {
        success: false,
        message: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file'
      };
    }

    try {
      logger.info('🧪 Testing OpenAI connection...');
      
      const response = await this.openai.chat.completions.create({
        model: this.AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: 'Hello, please respond with "OpenAI connection successful"'
          }
        ],
        temperature: 0,
        max_tokens: 50
      });

      const result = response.choices[0]?.message?.content;
      if (result && result.includes('successful')) {
        logger.info('✅ OpenAI connection test successful');
        return {
          success: true,
          message: 'OpenAI connection successful'
        };
      } else {
        throw new Error('Unexpected response from OpenAI');
      }
    } catch (error) {
      logger.error('❌ OpenAI connection test failed:', error);
      return {
        success: false,
        message: `OpenAI connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}