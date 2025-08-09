import { Router, Response } from 'express';
import { AIProcessor, SummaryType, ClimateDataAggregation } from '../services/AIProcessor';
import { SapphireClient } from '../services/SapphireClient';
import { DataAggregationService } from '../services/DataAggregationService';
import { AuthenticatedRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { createLogger } from '../utils/logger';
import Joi from 'joi';

const logger = createLogger('AIRoutes');

/**
 * AI routes for D-Climate ROFL API
 * Handles AI-powered climate insights and summary generation
 * Uses DataAggregationService for real data aggregation
 */
export function aiRoutes(
  aiProcessor: AIProcessor,
  sapphireClient: SapphireClient,
  dataAggregationService: DataAggregationService
): Router {
  const router = Router();

  /**
   * GET /api/ai/public/test-connection
   * Test OpenAI connection and configuration (public endpoint)
   */
  router.get('/public/test-connection', async (req: any, res: Response) => {
    try {
      logger.info('🧪 Testing OpenAI connection...');
      
      const testResult = await aiProcessor.testOpenAIConnection();
      
      res.json({
        success: testResult.success,
        message: testResult.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('OpenAI connection test failed:', error);
      res.status(500).json({
        success: false,
        error: 'Connection test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/ai/summary/daily-overview
   * Generate daily climate overview summary
   */
  router.post('/summary/daily-overview',
    validateRequest(Joi.object({
      date: Joi.number().integer().min(1600000000).max(Math.floor(Date.now() / 1000)).optional(),
      regions: Joi.array().items(Joi.string()).optional()
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { date, regions } = req.body;
        const targetDate = date ? new Date(date * 1000) : new Date();

        logger.info(`Generating daily overview for ${targetDate.toISOString()}`);

        // Calculate time range for the target date
        const timeRange = {
          start: targetDate.getTime() - (24 * 60 * 60 * 1000), // 24 hours ago
          end: targetDate.getTime()
        };

        let aggregatedData: ClimateDataAggregation[];

        if (regions && regions.length > 0) {
          // Get aggregated data for specific regions
          aggregatedData = await dataAggregationService.getMultiRegionAggregatedData(regions, timeRange);
        } else {
          // Get global aggregated data
          const globalData = await dataAggregationService.getGlobalAggregatedData(timeRange);
          aggregatedData = [globalData];
        }

        if (aggregatedData.length === 0 || aggregatedData.every(data => data.metrics.dataPoints === 0)) {
          res.status(404).json({
            success: false,
            error: 'No data available',
            message: 'No climate data found for the specified criteria'
          });
          return;
        }

        const summary = await aiProcessor.generateDailyOverview(aggregatedData);

        res.json({
          success: true,
          data: summary,
          message: 'Daily overview generated successfully'
        });

      } catch (error) {
        logger.error('Daily overview generation failed:', error);
        res.status(500).json({
          success: false,
          error: 'Daily overview generation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/ai/public/summary/regional-snapshot
   * Generate regional climate snapshot (public endpoint)
   */
  router.post('/public/summary/regional-snapshot',
    validateRequest(Joi.object({
      region: Joi.string().required(),
      timeRange: Joi.object({
        start: Joi.number().integer().min(1600000000).required(),
        end: Joi.number().integer().min(Joi.ref('start')).required()
      }).optional()
    })),
    async (req: any, res: Response) => {
      try {
        const { region, timeRange } = req.body;

        logger.info(`Generating regional snapshot for ${region}`);

        const defaultTimeRange = {
          start: Date.now() - (24 * 60 * 60 * 1000),
          end: Date.now()
        };

        const actualTimeRange = timeRange ? {
          start: timeRange.start * 1000,
          end: timeRange.end * 1000
        } : defaultTimeRange;

        // Get aggregated data for the region
        const regionalData = await dataAggregationService.getAggregatedData(region, actualTimeRange);

        if (regionalData.metrics.dataPoints === 0) {
          res.status(404).json({
            success: false,
            error: 'No data available',
            message: `No climate data found for region: ${region}`
          });
          return;
        }

        const summary = await aiProcessor.generateRegionalSnapshot(region, regionalData);

        res.json({
          success: true,
          data: summary,
          message: 'Regional snapshot generated successfully'
        });

      } catch (error) {
        logger.error(`Regional snapshot generation failed for ${req.body.region}:`, error);
        res.status(500).json({
          success: false,
          error: 'Regional snapshot generation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/ai/summary/anomaly-highlights
   * Generate anomaly highlights summary
   */
  router.post('/summary/anomaly-highlights',
    validateRequest(Joi.object({
      timeRange: Joi.object({
        start: Joi.number().integer().min(1600000000).required(),
        end: Joi.number().integer().min(Joi.ref('start')).max(Math.floor(Date.now() / 1000)).required()
      }).optional(),
      severityThreshold: Joi.number().min(1).max(5).default(2),
      maxAnomalies: Joi.number().integer().min(1).max(20).default(10)
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { timeRange, severityThreshold = 2, maxAnomalies = 10 } = req.body;

        logger.info('Generating anomaly highlights');

        const defaultTimeRange = {
          start: Date.now() - (24 * 60 * 60 * 1000),
          end: Date.now()
        };

        const actualTimeRange = timeRange ? {
          start: timeRange.start * 1000,
          end: timeRange.end * 1000
        } : defaultTimeRange;

        // Get global aggregated data to find anomalies
        const globalData = await dataAggregationService.getGlobalAggregatedData(actualTimeRange);

        if (globalData.metrics.dataPoints === 0) {
          res.status(404).json({
            success: false,
            error: 'No data available',
            message: 'No climate data found for anomaly detection'
          });
          return;
        }

        // Filter anomalies by severity threshold
        const filteredAnomalies = globalData.outliers.filter(outlier => outlier.deviation >= severityThreshold);
        
        if (filteredAnomalies.length === 0) {
          res.json({
            success: true,
            data: {
              type: SummaryType.ANOMALY_HIGHLIGHTS,
              summary: 'No significant anomalies detected in the specified time range.',
              metadata: {
                dataPoints: globalData.metrics.dataPoints,
                regions: [globalData.region],
                timeRange: actualTimeRange,
                generatedAt: Date.now(),
                model: 'gpt-4-turbo-preview',
                temperature: 0,
                promptHash: 'anomaly-none'
              },
              insights: {
                trends: [],
                anomalies: [],
                recommendations: ['Continue monitoring for potential anomalies']
              }
            },
            message: 'No anomalies detected'
          });
          return;
        }

        // Create anomaly data structure
        const anomalyData: ClimateDataAggregation = {
          region: globalData.region,
          timeRange: actualTimeRange,
          metrics: globalData.metrics,
          outliers: filteredAnomalies.slice(0, maxAnomalies)
        };

        const summary = await aiProcessor.generateAnomalyHighlights([anomalyData]);

        res.json({
          success: true,
          data: summary,
          message: 'Anomaly highlights generated successfully'
        });

      } catch (error) {
        logger.error('Anomaly highlights generation failed:', error);
        res.status(500).json({
          success: false,
          error: 'Anomaly highlights generation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/ai/summaries/cached
   * Get cached AI summaries
   */
  router.get('/summaries/cached',
    validateRequest(Joi.object({
      type: Joi.string().valid('daily_overview', 'regional_snapshot', 'anomaly_highlights').optional(),
      limit: Joi.number().integer().min(1).max(100).default(20)
    }), 'query'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { type, limit } = req.query as any;

        logger.info('Getting cached AI summaries', { type, limit });

        const summaryType = type as SummaryType | undefined;
        const cachedSummaries = aiProcessor.getCachedSummaries(summaryType)
          .sort((a, b) => b.metadata.generatedAt - a.metadata.generatedAt)
          .slice(0, parseInt(limit) || 20);

        res.json({
          success: true,
          data: {
            summaries: cachedSummaries,
            totalCached: cachedSummaries.length,
            filteredBy: type || 'all',
            retrievedAt: Date.now()
          },
          message: 'Cached summaries retrieved successfully'
        });

      } catch (error) {
        logger.error('Failed to get cached summaries:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve cached summaries',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/ai/insights/custom
   * Generate custom AI insights with user-provided prompt
   */
  router.post('/insights/custom',
    validateRequest(Joi.object({
      prompt: Joi.string().min(10).max(500).required(),
      context: Joi.object({
        region: Joi.string().optional(),
        timeRange: Joi.object({
          start: Joi.number().integer().min(1600000000).required(),
          end: Joi.number().integer().min(Joi.ref('start')).required()
        }).optional(),
        sensorIds: Joi.array().items(Joi.string()).max(50).optional()
      }).optional()
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { prompt, context } = req.body;

        logger.info('Generating custom AI insights', { promptLength: prompt.length, context });

        // Get relevant data based on context
        let aggregatedData: ClimateDataAggregation | null = null;

        if (context?.region) {
          const timeRange = context.timeRange ? {
            start: context.timeRange.start * 1000,
            end: context.timeRange.end * 1000
          } : {
            start: Date.now() - (24 * 60 * 60 * 1000),
            end: Date.now()
          };

          aggregatedData = await dataAggregationService.getAggregatedData(context.region, timeRange);
        }

        // Generate custom insight using AI processor
        const customInsight = await aiProcessor.generateCustomInsight(prompt, aggregatedData, context);

        res.json({
          success: true,
          data: customInsight,
          message: 'Custom insight generated successfully'
        });

      } catch (error) {
        logger.error('Custom insight generation failed:', error);
        res.status(500).json({
          success: false,
          error: 'Custom insight generation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/ai/stats
   * Get AI processing statistics
   */
  router.get('/stats',
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        logger.info('Getting AI processing statistics');

        const aiStats = aiProcessor.getStatistics();

        res.json({
          success: true,
          data: {
            ...aiStats,
            retrievedAt: Date.now()
          },
          message: 'AI statistics retrieved successfully'
        });

      } catch (error) {
        logger.error('Failed to get AI statistics:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve statistics',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * DELETE /api/ai/cache
   * Clear AI processing cache (admin only)
   */
  router.delete('/cache',
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        logger.info('Clearing AI cache');

        // TODO: Add admin authorization check
        aiProcessor.clearCache();

        res.json({
          success: true,
          data: {
            clearedAt: Date.now()
          },
          message: 'AI cache cleared successfully'
        });

      } catch (error) {
        logger.error('Failed to clear AI cache:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to clear cache',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/ai/models/available
   * Get available AI models and their capabilities
   */
  router.get('/models/available',
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        logger.info('Getting available AI models');

        const availableModels = {
          current: 'gpt-4-turbo-preview',
          models: [
            {
              name: 'gpt-4-turbo-preview',
              description: 'Most capable model for complex climate analysis',
              maxTokens: 4096,
              temperature: { min: 0, max: 2, default: 0 },
              supportedTasks: ['daily_overview', 'regional_snapshot', 'anomaly_highlights', 'custom_insights']
            },
            {
              name: 'gpt-3.5-turbo',
              description: 'Faster model for basic summaries',
              maxTokens: 4096,
              temperature: { min: 0, max: 2, default: 0 },
              supportedTasks: ['daily_overview', 'regional_snapshot']
            }
          ],
          capabilities: {
            reproducibility: 'Temperature 0 ensures consistent outputs',
            confidentiality: 'All processing occurs within Sapphire TEE',
            languages: ['English'],
            outputFormats: ['text', 'structured_insights']
          }
        };

        res.json({
          success: true,
          data: availableModels,
          message: 'Available models retrieved successfully'
        });

      } catch (error) {
        logger.error('Failed to get available models:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve models',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  return router;
}