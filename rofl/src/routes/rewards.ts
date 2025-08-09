import { Router, Response } from 'express';
import { RewardCalculator } from '../services/RewardCalculator';
import { SapphireClient } from '../services/SapphireClient';
import { SmartContractService } from '../services/SmartContractService';
import { AuthenticatedRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { createLogger } from '../utils/logger';
import Joi from 'joi';

const logger = createLogger('RewardRoutes');

/**
 * Reward routes for D-Climate ROFL API
 * Handles reward calculation, claiming, and statistics
 * Uses SmartContractService for real blockchain interactions
 */
export function rewardRoutes(
  rewardCalculator: RewardCalculator,
  sapphireClient: SapphireClient,
  smartContractService: SmartContractService
): Router {
  const router = Router();

  /**
   * GET /api/rewards/sensor/:sensorId
   * Get reward history for a specific sensor
   */
  router.get('/sensor/:sensorId',
    validateRequest(Joi.object({
      sensorId: Joi.string().required()
    }), 'params'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { sensorId } = req.params;
        const { days = 30 } = req.query as any;

        logger.info(`Getting reward history for sensor: ${sensorId}`);

        // Calculate rewards for the specified period
        const endDate = Date.now();
        const startDate = endDate - (parseInt(days) * 24 * 60 * 60 * 1000);

        const rewards = [];
        const currentDate = new Date(startDate);
        const endDateTime = new Date(endDate);

        while (currentDate <= endDateTime) {
          try {
            const earnedDate = Math.floor(currentDate.getTime() / 1000);
            const reward = await rewardCalculator.calculateDailyReward(
              sensorId, 
              earnedDate * 1000, 
              100, // Default reputation score
              1,   // Default valid submissions
              850  // Default quality score
            );
            
            if (reward.totalReward > 0) {
              rewards.push({
                earnedDate: earnedDate * 1000,
                amount: reward.totalReward,
                calculation: reward,
                claimed: false // TODO: Check if claimed from smart contract
              });
            }
          } catch (error) {
            logger.warn(`Failed to calculate reward for sensor ${sensorId} on ${currentDate.toISOString()}:`, error);
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }

        const totalRewards = rewards.reduce((sum, reward) => sum + reward.amount, 0);

        res.json({
          success: true,
          data: {
            sensorId,
            rewards,
            totalRewards,
            period: {
              startDate,
              endDate,
              days: parseInt(days)
            }
          },
          message: 'Reward history retrieved successfully'
        });

      } catch (error) {
        logger.error(`Failed to get reward history for sensor ${req.params.sensorId}:`, error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve reward history',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/rewards/calculate
   * Manually calculate reward for a sensor on a specific date
   */
  router.post('/calculate',
    validateRequest(Joi.object({
      sensorId: Joi.string().required(),
      earnedDate: Joi.number().integer().min(1600000000).required()
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { sensorId, earnedDate } = req.body;

        logger.info(`Calculating reward for sensor: ${sensorId} (date: ${earnedDate})`);

        // Calculate reward using smart contract
        const rewardResult = await smartContractService.calculateReward(sensorId, earnedDate);

        res.json({
          success: true,
          data: {
            sensorId,
            earnedDate,
            amount: rewardResult.amount,
            transactionHash: rewardResult.transactionHash,
            blockNumber: rewardResult.blockNumber,
            calculatedAt: Date.now()
          },
          message: 'Reward calculated successfully'
        });

      } catch (error) {
        logger.error('Reward calculation failed:', error);
        res.status(500).json({
          success: false,
          error: 'Reward calculation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/rewards/claimable/:address
   * Get claimable rewards for a wallet address
   */
  router.get('/claimable/:address',
    validateRequest(Joi.object({
      address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
    }), 'params'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { address } = req.params;

        logger.info(`Getting claimable rewards for address: ${address}`);

        // Get claimable rewards from smart contract
        const claimableRewards = await smartContractService.getClaimableRewards(address);

        const totalClaimable = claimableRewards.reduce((sum, reward) => sum + reward.amount, 0);

        res.json({
          success: true,
          data: {
            address,
            claimableRewards,
            totalClaimable,
            totalRewards: claimableRewards.length,
            lastUpdated: Date.now()
          },
          message: 'Claimable rewards retrieved successfully'
        });

      } catch (error) {
        logger.error(`Failed to get claimable rewards for ${req.params.address}:`, error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve claimable rewards',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/rewards/claim
   * Claim rewards for sensors (owner only)
   */
  router.post('/claim',
    validateRequest(Joi.object({
      claims: Joi.array().items(
        Joi.object({
          sensorId: Joi.string().required(),
          earnedDate: Joi.number().integer().required()
        })
      ).min(1).max(20).required()
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { claims } = req.body;
        const claimerAddress = req.auth!.address;

        logger.info(`Processing ${claims.length} reward claims for ${claimerAddress}`);

        const claimResults = [];
        let totalClaimed = 0;

        for (const claim of claims) {
          try {
            // Claim reward using smart contract
            const result = await smartContractService.claimReward(claim.sensorId, claim.earnedDate);
            
            claimResults.push({
              sensorId: claim.sensorId,
              earnedDate: claim.earnedDate,
              amount: result.amount,
              transactionHash: result.transactionHash,
              blockNumber: result.blockNumber,
              claimedAt: Date.now(),
              success: true
            });

            totalClaimed += result.amount;

          } catch (error) {
            logger.error(`Failed to claim reward for sensor ${claim.sensorId}:`, error);
            claimResults.push({
              sensorId: claim.sensorId,
              earnedDate: claim.earnedDate,
              amount: 0,
              transactionHash: null,
              blockNumber: null,
              claimedAt: Date.now(),
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        res.json({
          success: true,
          data: {
            claimer: claimerAddress,
            claims: claimResults,
            totalClaimed,
            claimedAt: Date.now()
          },
          message: `Successfully claimed ${totalClaimed.toFixed(4)} ROSE from ${claims.length} rewards`
        });

      } catch (error) {
        logger.error('Reward claiming failed:', error);
        res.status(500).json({
          success: false,
          error: 'Reward claiming failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/rewards/stats/global
   * Get global reward statistics
   */
  router.get('/stats/global',
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        logger.info('Getting global reward statistics');

        const globalStats = rewardCalculator.getGlobalRewardStats();

        res.json({
          success: true,
          data: {
            ...globalStats,
            retrievedAt: Date.now()
          },
          message: 'Global reward statistics retrieved successfully'
        });

      } catch (error) {
        logger.error('Failed to get global reward statistics:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve statistics',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/rewards/config
   * Get current reward configuration
   */
  router.get('/config',
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        logger.info('Getting reward configuration');

        const rewardConfig = rewardCalculator.getRewardConfig();

        res.json({
          success: true,
          data: rewardConfig,
          message: 'Reward configuration retrieved successfully'
        });

      } catch (error) {
        logger.error('Failed to get reward configuration:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve configuration',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * PUT /api/rewards/config
   * Update reward configuration (admin only)
   */
  router.put('/config',
    validateRequest(Joi.object({
      baseAmount: Joi.number().min(0).optional(),
      minReputation: Joi.number().min(0).max(200).optional(),
      reputationMultipliers: Joi.object({
        excellent: Joi.number().min(1).optional(),
        good: Joi.number().min(1).optional(),
        average: Joi.number().min(0).optional(),
        poor: Joi.number().min(0).optional()
      }).optional(),
      qualityBonuses: Joi.object({
        perfect: Joi.number().min(1).optional(),
        excellent: Joi.number().min(1).optional(),
        good: Joi.number().min(1).optional(),
        average: Joi.number().min(0).optional(),
        poor: Joi.number().min(0).optional()
      }).optional(),
      frequencyBonuses: Joi.object({
        veryActive: Joi.number().min(0).optional(),
        active: Joi.number().min(0).optional(),
        moderate: Joi.number().min(0).optional(),
        low: Joi.number().min(0).optional()
      }).optional()
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        logger.info('Updating reward configuration');

        // TODO: Add admin authorization check
        // For now, allow configuration updates for development

        const configUpdate = req.body;
        rewardCalculator.updateRewardConfig(configUpdate);

        const updatedConfig = rewardCalculator.getRewardConfig();

        res.json({
          success: true,
          data: updatedConfig,
          message: 'Reward configuration updated successfully'
        });

      } catch (error) {
        logger.error('Failed to update reward configuration:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update configuration',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/rewards/export
   * Export reward data for analysis
   */
  router.post('/export',
    validateRequest(Joi.object({
      sensorIds: Joi.array().items(Joi.string()).optional(),
      startDate: Joi.number().integer().min(1600000000).optional(),
      endDate: Joi.number().integer().min(Joi.ref('startDate')).optional(),
      format: Joi.string().valid('json', 'csv').default('json')
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { sensorIds, startDate, endDate, format } = req.body;

        logger.info('Exporting reward data', { sensorIds: sensorIds?.length, startDate, endDate, format });

        const rewardData = rewardCalculator.exportRewardData(
          sensorIds,
          startDate ? startDate * 1000 : undefined,
          endDate ? endDate * 1000 : undefined
        );

        if (format === 'csv') {
          // Convert to CSV format
          const csvHeader = 'sensorId,earnedDate,baseReward,reputationMultiplier,qualityBonus,frequencyBonus,totalReward,reputationScore,validSubmissions,qualityScore,calculatedAt\n';
          const csvRows = rewardData.map(reward => 
            `${reward.sensorId},${reward.earnedDate},${reward.baseReward},${reward.reputationMultiplier},${reward.qualityBonus},${reward.frequencyBonus},${reward.totalReward},${reward.metadata.reputationScore},${reward.metadata.validSubmissions},${reward.metadata.qualityScore},${reward.metadata.calculatedAt}`
          ).join('\n');
          
          const csvContent = csvHeader + csvRows;

          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="rewards-export-${Date.now()}.csv"`);
          res.send(csvContent);
        } else {
          res.json({
            success: true,
            data: {
              rewards: rewardData,
              exportedAt: Date.now(),
              filters: { sensorIds, startDate, endDate },
              totalRecords: rewardData.length
            },
            message: 'Reward data exported successfully'
          });
        }

      } catch (error) {
        logger.error('Failed to export reward data:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to export data',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  return router;
}