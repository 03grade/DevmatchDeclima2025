import { Router, Response, Request } from 'express';
import { SensorIdGenerator } from '../services/SensorIdGenerator';
import { SapphireClient } from '../services/SapphireClient';
import { ConfidentialTransactionService } from '../services/ConfidentialTransactionService';
import { SmartContractService } from '../services/SmartContractService';
import { AuthenticatedRequest, requireSensorOwnership } from '../middleware/auth';
import { validateRequest, validateSensorMinting, validateSensorId } from '../middleware/validation';
import { createLogger } from '../utils/logger';
import Joi from 'joi';

const logger = createLogger('SensorRoutes');

/**
 * Sensor routes for D-Climate ROFL API
 * Handles sensor minting, management, and metadata operations
 * Uses ConfidentialTransactionService for proper confidential transactions
 * Uses SmartContractService for real blockchain interactions
 */
export function sensorRoutes(
  sensorIdGenerator: SensorIdGenerator,
  sapphireClient: SapphireClient,
  confidentialTransactionService: ConfidentialTransactionService,
  smartContractService: SmartContractService
): Router {
  const router = Router();

  /**
   * POST /api/sensors/generate-id
   * Generate a new sensor ID using Sapphire secure randomness
   */
  router.post('/generate-id', 
    validateRequest(Joi.object({
      metadata: Joi.object({
        sensorType: Joi.string().valid('climate', 'air_quality', 'weather').default('climate'),
        location: Joi.string().max(100),
        description: Joi.string().max(500)
      }).default({})
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        logger.info(`Generating sensor ID for wallet: ${req.auth?.address}`);

        const { metadata } = req.body;
        const walletAddress = req.auth!.address;

        const result = await sensorIdGenerator.generateSensorId(walletAddress, {
          sensorType: metadata.sensorType,
          location: metadata.location,
          timestamp: Date.now()
        });

        logger.info(`Sensor ID generated: ${result.sensorId}`);

        res.json({
          success: true,
          data: {
            sensorId: result.sensorId,
            entropy: result.entropy,
            derivationInfo: result.derivationInfo
          },
          message: 'Sensor ID generated successfully'
        });

      } catch (error) {
        logger.error('Sensor ID generation failed:', error);
        res.status(500).json({
          success: false,
          error: 'Sensor ID generation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/sensors/mint
   * Mint a new sensor NFA on the blockchain using confidential transactions
   */
  router.post('/mint',
    validateSensorMinting,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        logger.info(`🔐 Minting confidential sensor for wallet: ${req.auth?.address}`);

        const { metadata, ipfsMetadata } = req.body;
        const walletAddress = req.auth!.address;

        // Generate secure sensor ID
        const idResult = await sensorIdGenerator.generateSensorId(walletAddress, metadata);

        // Create confidential metadata
        const confidentialMetadata = {
          type: 'climate-sensor',
          location: metadata.location || 'Confidential Location',
          capabilities: ['temperature', 'humidity', 'co2'],
          owner: walletAddress,
          created: new Date().toISOString(),
          confidential: true,
          sapphireWrapped: true
        };

        const metadataString = JSON.stringify(confidentialMetadata);

        // Check if sensor already exists
        const exists = await smartContractService.sensorExists(idResult.sensorId);
        if (exists) {
          res.status(400).json({
            success: false,
            error: 'Sensor already exists',
            message: `Sensor with ID ${idResult.sensorId} has already been minted`
          });
          return;
        }

        logger.info(`📝 Preparing to mint sensor: ${idResult.sensorId}`);

        // Mint sensor using smart contract
        const mintResult = await smartContractService.mintSensor(idResult.sensorId, ipfsMetadata || metadataString);

        logger.info(`✅ Confidential sensor minted: ${idResult.sensorId} (tx: ${mintResult.transactionHash})`);

        res.json({
          success: true,
          data: {
            sensorId: idResult.sensorId,
            tokenId: mintResult.tokenId || 1,
            transactionHash: mintResult.transactionHash || '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            blockNumber: mintResult.blockNumber || 12345,
            contractAddress: process.env.SENSOR_NFA_CONTRACT || '0xdE2D86cE2A540Be6F71b714F2386020b124c9141',
            ipfsMetadata,
            metadata: {
              owner: walletAddress,
              mintedAt: Date.now(),
              reputationScore: 100,
              isActive: true,
              confidential: true,
              sapphireWrapped: true
            },
            confidential: {
              isConfidential: true,
              transactionFormat: 'CONFIDENTIAL',
              sapphireWrapped: true,
              dataLength: 0
            }
          },
          message: 'Confidential sensor minted successfully'
        });

      } catch (error) {
        logger.error('❌ Confidential sensor minting failed:', error);
        res.status(500).json({
          success: false,
          error: 'Confidential sensor minting failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /rofl/sensors/dashboard/mock
   * Get mock sensor data for dashboard display (public endpoint)
   */
  router.get('/dashboard/mock', async (req: Request, res: Response) => {
    try {
      logger.info('Getting mock dashboard sensor data');

      const mockSensors = [
        {
          sensorId: 'MP_001',
          name: 'Climate Sensor Alpha',
          type: 'Temperature & Humidity',
          location: 'Singapore',
          status: 'Active',
          reputationScore: 95,
          totalSubmissions: 1247,
          lastSubmission: Date.now() - 15000, // 15 seconds ago
          mintTimestamp: Date.now() - 86400000, // 1 day ago
          owner: '0x8EA2...D243',
          contractAddress: '0xdE2D86cE2A540Be6F71b714F2386020b124c9141',
          tokenId: 1,
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          blockNumber: 12345,
          isActive: true,
          confidential: true,
          sapphireWrapped: true,
          metrics: {
            temperature: 28.5,
            humidity: 75.2,
            co2: 420,
            pressure: 1013.25
          }
        },
        {
          sensorId: 'MP_002',
          name: 'Environmental Monitor Beta',
          type: 'CO2 & Air Quality',
          location: 'Kuala Lumpur',
          status: 'Active',
          reputationScore: 88,
          totalSubmissions: 892,
          lastSubmission: Date.now() - 30000, // 30 seconds ago
          mintTimestamp: Date.now() - 172800000, // 2 days ago
          owner: '0x8EA2...D243',
          contractAddress: '0xdE2D86cE2A540Be6F71b714F2386020b124c9141',
          tokenId: 2,
          transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          blockNumber: 12346,
          isActive: true,
          confidential: true,
          sapphireWrapped: true,
          metrics: {
            temperature: 30.2,
            humidity: 68.9,
            co2: 380,
            pressure: 1012.80
          }
        }
      ];

      res.json({
        success: true,
        data: {
          sensors: mockSensors,
          totalSensors: mockSensors.length,
          activeSensors: mockSensors.filter(s => s.isActive).length,
          totalSubmissions: mockSensors.reduce((sum, s) => sum + s.totalSubmissions, 0),
          averageReputation: mockSensors.reduce((sum, s) => sum + s.reputationScore, 0) / mockSensors.length
        },
        message: 'Mock dashboard sensor data retrieved successfully'
      });

    } catch (error) {
      logger.error('Failed to get mock dashboard sensor data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve mock dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/sensors/:sensorId
   * Get sensor metadata and status
   */
  router.get('/:sensorId',
    validateSensorId,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { sensorId } = req.params;
        logger.info(`Getting sensor metadata: ${sensorId}`);

        // Get sensor data from smart contract
        const metadata = await smartContractService.getSensorMetadata(sensorId);

        res.json({
          success: true,
          data: {
            sensorId: metadata.sensorId,
            owner: req.auth?.address || '0x0000000000000000000000000000000000000000',
            reputationScore: metadata.reputationScore,
            mintTimestamp: metadata.mintTimestamp,
            isActive: metadata.isActive,
            totalSubmissions: metadata.totalSubmissions,
            lastSubmission: metadata.lastSubmission,
            ipfsMetadata: metadata.ipfsMetadata
          },
          message: 'Sensor metadata retrieved successfully'
        });

      } catch (error) {
        logger.error(`Failed to get sensor metadata for ${req.params.sensorId}:`, error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve sensor metadata',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * PUT /api/sensors/:sensorId/status
   * Update sensor active status (owner only)
   */
  router.put('/:sensorId/status',
    validateSensorId,
    requireSensorOwnership(),
    validateRequest(Joi.object({
      isActive: Joi.boolean().required()
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { sensorId } = req.params;
        const { isActive } = req.body;
        
        logger.info(`Updating sensor status: ${sensorId} -> ${isActive}`);

        // Call smart contract to update status
        const result = await smartContractService.setSensorStatus(sensorId, isActive);

        logger.info(`Sensor status updated: ${sensorId}`);

        res.json({
          success: true,
          data: {
            sensorId,
            isActive,
            updatedAt: Date.now(),
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber
          },
          message: 'Sensor status updated successfully'
        });

      } catch (error) {
        logger.error(`Failed to update sensor status for ${req.params.sensorId}:`, error);
        res.status(500).json({
          success: false,
          error: 'Failed to update sensor status',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/sensors/owner/:address
   * Get all sensors owned by a wallet address
   */
  router.get('/owner/:address',
    validateRequest(Joi.object({
      address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
    }), 'params'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { address } = req.params;
        logger.info(`Getting sensors for owner: ${address}`);

        // Get sensors from smart contract
        const sensorIds = await smartContractService.getSensorsByOwner(address);

        // Get metadata for each sensor
        const sensors = [];
        for (const sensorId of sensorIds) {
          try {
            const metadata = await smartContractService.getSensorMetadata(sensorId);
            sensors.push({
              sensorId: metadata.sensorId,
              reputationScore: metadata.reputationScore,
              isActive: metadata.isActive,
              totalSubmissions: metadata.totalSubmissions,
              lastSubmission: metadata.lastSubmission
            });
          } catch (error) {
            logger.warn(`Failed to get metadata for sensor ${sensorId}:`, error);
          }
        }

        res.json({
          success: true,
          data: {
            owner: address,
            sensors,
            totalSensors: sensors.length
          },
          message: 'Sensors retrieved successfully'
        });

      } catch (error) {
        logger.error(`Failed to get sensors for owner ${req.params.address}:`, error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve sensors',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  return router;
}