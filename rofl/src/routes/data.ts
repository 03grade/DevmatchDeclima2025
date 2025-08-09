import { Router, Response } from 'express';
import { DataValidator, ClimateData } from '../services/DataValidator';
import { EncryptionManager } from '../services/EncryptionManager';
import { IPFSManager } from '../services/IPFSManager';
import { SapphireClient } from '../services/SapphireClient';
import { SmartContractService } from '../services/SmartContractService';
import { AuthenticatedRequest, requireSensorOwnership } from '../middleware/auth';
import { 
  validateClimateData, 
  validateDataSubmission, 
  validateDataBatch,
  validatePagination,
  validateTimeQuery,
  validateRegionFilter
} from '../middleware/validation';
import { createLogger } from '../utils/logger';
import Joi from 'joi';
import { DataAggregationService } from '../services/DataAggregationService'; // Added import

const logger = createLogger('DataRoutes');

/**
 * Data routes for D-Climate ROFL API
 * Handles climate data submission, validation, and retrieval
 * Uses SmartContractService for real blockchain interactions
 */
export function dataRoutes(
  dataValidator: DataValidator,
  encryptionManager: EncryptionManager,
  ipfsManager: IPFSManager,
  sapphireClient: SapphireClient,
  smartContractService: SmartContractService,
  dataAggregationService: DataAggregationService // Added parameter
): Router {
  const router = Router();

  /**
   * POST /api/data/submit
   * Submit encrypted climate data to IPFS and register on blockchain
   */
  router.post('/submit',
    requireSensorOwnership('sensorId'),
    validateClimateData,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const climateData: ClimateData = req.body;
        const submitterAddress = req.auth!.address;

        logger.info(`Processing data submission for sensor: ${climateData.sensorId}`);

        // Step 1: Validate climate data
        const validationResult = await dataValidator.validateClimateData(
          climateData,
          submitterAddress
        );

        if (!validationResult.isValid) {
          logger.warn('Data validation failed', {
            sensorId: climateData.sensorId,
            errors: validationResult.errors
          });

          res.status(400).json({
            success: false,
            error: 'Data validation failed',
            message: 'Climate data does not meet validation requirements',
            details: {
              errors: validationResult.errors,
              warnings: validationResult.warnings,
              flags: validationResult.flags
            }
          });
          return;
        }

        // Step 2: Encrypt climate data
        const encryptedData = await encryptionManager.encryptClimateData(
          climateData,
          climateData.sensorId
        );

        // Step 3: Upload to IPFS
        const ipfsResult = await ipfsManager.uploadEncryptedData(
          encryptedData.encryptedData,
          {
            sensorId: climateData.sensorId,
            timestamp: climateData.timestamp,
            encryptedKey: encryptedData.encryptedKey,
            nonce: encryptedData.nonce,
            tag: encryptedData.tag,
            algorithm: encryptedData.metadata.algorithm
          }
        );

        // Step 4: Submit to blockchain using smart contract
        const recordHash = validationResult.metadata.dataHash;
        const txResult = await smartContractService.submitDataBatch(
          climateData.sensorId,
          ipfsResult.cid,
          encryptedData.encryptedKey,
          recordHash
        );

        logger.info(`Data submitted successfully: ${ipfsResult.cid} (tx: ${txResult.transactionHash})`);

        res.json({
          success: true,
          data: {
            sensorId: climateData.sensorId,
            ipfsCid: ipfsResult.cid,
            transactionHash: txResult.transactionHash,
            blockNumber: txResult.blockNumber,
            validationScore: validationResult.score,
            submittedAt: Date.now(),
            gateway: ipfsResult.gateway
          },
          message: 'Climate data submitted successfully',
          validation: {
            score: validationResult.score,
            warnings: validationResult.warnings,
            flags: validationResult.flags
          }
        });

      } catch (error) {
        logger.error('Data submission failed:', error);
        res.status(500).json({
          success: false,
          error: 'Data submission failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/data/submit-batch
   * Submit multiple climate data entries in a single transaction
   */
  router.post('/submit-batch',
    validateDataBatch,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { submissions } = req.body;
        const submitterAddress = req.auth!.address;

        logger.info(`Processing batch submission with ${submissions.length} entries`);

        const results = [];
        const errors = [];

        for (const climateData of submissions) {
          try {
            // Validate each submission
            const validationResult = await dataValidator.validateClimateData(
              climateData,
              submitterAddress
            );

            if (!validationResult.isValid) {
              errors.push({
                sensorId: climateData.sensorId,
                errors: validationResult.errors,
                warnings: validationResult.warnings
              });
              continue;
            }

            // Encrypt data
            const encryptedData = await encryptionManager.encryptClimateData(
              climateData,
              climateData.sensorId
            );

            // Upload to IPFS
            const ipfsResult = await ipfsManager.uploadEncryptedData(
              encryptedData.encryptedData,
              {
                sensorId: climateData.sensorId,
                timestamp: climateData.timestamp,
                encryptedKey: encryptedData.encryptedKey,
                nonce: encryptedData.nonce,
                tag: encryptedData.tag,
                algorithm: encryptedData.metadata.algorithm
              }
            );

            // Submit to blockchain
            const recordHash = validationResult.metadata.dataHash;
            const txResult = await smartContractService.submitDataBatch(
              climateData.sensorId,
              ipfsResult.cid,
              encryptedData.encryptedKey,
              recordHash
            );

            results.push({
              sensorId: climateData.sensorId,
              ipfsCid: ipfsResult.cid,
              transactionHash: txResult.transactionHash,
              blockNumber: txResult.blockNumber,
              validationScore: validationResult.score,
              success: true
            });

          } catch (error) {
            errors.push({
              sensorId: climateData.sensorId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        res.json({
          success: true,
          data: {
            totalSubmissions: submissions.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors
          },
          message: `Batch submission completed: ${results.length}/${submissions.length} successful`
        });

      } catch (error) {
        logger.error('Batch submission failed:', error);
        res.status(500).json({
          success: false,
          error: 'Batch submission failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/data/:sensorId
   * Get climate data for a specific sensor (owner only for decrypted data)
   */
  router.get('/:sensorId',
    validatePagination,
    validateTimeQuery,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { sensorId } = req.params;
        const { page = 1, limit = 20, timeRange, startDate, endDate } = req.query as any;

        logger.info(`Getting data for sensor: ${sensorId}`);

        // Get data submissions from smart contract
        const submissions = await smartContractService.getSensorData(sensorId, limit);

        // Process submissions and add decrypted data for owner
        const processedSubmissions = [];
        for (const submission of submissions) {
          const submissionData = {
            timestamp: submission.timestamp,
            ipfsCid: submission.ipfsCid,
            validationScore: 850, // Default score, could be enhanced
            isOwner: req.auth?.address === submission.submitter,
            data: null
          };

          // Decrypt data if owner
          if (submissionData.isOwner) {
            try {
              // Get encrypted data from IPFS
              const encryptedData = await ipfsManager.retrieveEncryptedData(submission.ipfsCid);
              if (encryptedData) {
                const decryptedData = await encryptionManager.decryptClimateData(
                  encryptedData.encryptedContent,
                  encryptedData.metadata.encryptedKey,
                  encryptedData.metadata.nonce,
                  encryptedData.metadata.tag,
                  sensorId
                );
                submissionData.data = JSON.parse(decryptedData);
              }
            } catch (error) {
              logger.warn(`Failed to decrypt data for sensor ${sensorId}:`, error);
            }
          }

          processedSubmissions.push(submissionData);
        }

        res.json({
          success: true,
          data: {
            sensorId,
            submissions: processedSubmissions,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: processedSubmissions.length,
              totalPages: Math.ceil(processedSubmissions.length / limit)
            },
            timeRange: { startDate, endDate, timeRange }
          },
          message: 'Sensor data retrieved successfully'
        });

      } catch (error) {
        logger.error(`Failed to get data for sensor ${req.params.sensorId}:`, error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve sensor data',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/data/public/explorer
   * Public hierarchical data explorer with aggregated metrics
   */
  router.get('/public/explorer',
    validateRegionFilter,
    validateTimeQuery,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { country, state, city, timeRange, startDate, endDate } = req.query as any;

        logger.info('Getting public data explorer data');

        // Calculate time range
        const now = Date.now();
        const defaultTimeRange = {
          start: now - (24 * 60 * 60 * 1000), // Last 24 hours
          end: now
        };

        let actualTimeRange = defaultTimeRange;
        if (timeRange) {
          try {
            actualTimeRange = JSON.parse(timeRange as string);
          } catch (error) {
            logger.warn('Invalid timeRange JSON, using default:', error);
            actualTimeRange = defaultTimeRange;
          }
        }
        
        if (startDate && endDate) {
          try {
            actualTimeRange.start = new Date(startDate as string).getTime();
            actualTimeRange.end = new Date(endDate as string).getTime();
          } catch (error) {
            logger.warn('Invalid date format, using default time range:', error);
          }
        }

        // Determine scope level
        const scopeLevel = city ? 'city' : state ? 'state' : country ? 'country' : 'global';
        const regionName = city || state || country || 'Global';

        // Get aggregated data using DataAggregationService
        let aggregatedData;
        try {
          if (scopeLevel === 'global') {
            aggregatedData = await dataAggregationService.getGlobalAggregatedData(actualTimeRange);
          } else {
            aggregatedData = await dataAggregationService.getAggregatedData(regionName, actualTimeRange);
          }
        } catch (error) {
          logger.warn('Failed to get aggregated data, using fallback:', error);
          // Fallback to mock data if aggregation fails
          aggregatedData = {
            region: regionName,
            timeRange: actualTimeRange,
            metrics: {
              avgCO2: 415.2,
              avgTemperature: 28.5,
              avgHumidity: 76.8,
              sensorCount: city ? 8 : state ? 45 : country ? 156 : 1247,
              dataPoints: 1890
            },
            outliers: []
          };
        }

        // Build response data
        const responseData = {
          scope: {
            level: scopeLevel,
            region: regionName,
            breadcrumb: [country, state, city].filter(Boolean)
          },
          metrics: {
            ...aggregatedData.metrics,
            lastUpdated: Date.now()
          },
          regions: scopeLevel === 'city' ? [] : scopeLevel === 'state' ? [
            { name: 'Petaling Jaya', avgCO2: 418.3, sensorCount: 12 },
            { name: 'Shah Alam', avgCO2: 412.1, sensorCount: 8 }
          ] : scopeLevel === 'country' ? [
            { name: 'Selangor', avgCO2: 415.2, sensorCount: 45 },
            { name: 'Kuala Lumpur', avgCO2: 420.1, sensorCount: 23 }
          ] : [
            { name: 'Malaysia', avgCO2: 415.2, sensorCount: 156 },
            { name: 'Singapore', avgCO2: 398.7, sensorCount: 89 }
          ],
          sensors: scopeLevel === 'city' ? [
            {
              sensorId: 'CLI12345678-550e8400-e29b-41d4-a716-446655440001',
              maskedId: 'CLI12345678-****-****-****-************',
              reputationBadge: '🟢',
              lastReading: {
                timestamp: Date.now() - (30 * 60 * 1000),
                co2: 412.5,
                temperature: 28.2,
                humidity: 76.3
              }
            }
          ] : [],
          anomalies: aggregatedData.outliers ? aggregatedData.outliers.map(outlier => ({
            region: outlier.sensorId ? outlier.sensorId.split('-')[0] : 'Unknown',
            metric: outlier.metric,
            value: outlier.value,
            deviation: outlier.deviation,
            timestamp: Date.now() - (3 * 60 * 60 * 1000)
          })) : []
        };

        res.json({
          success: true,
          data: responseData,
          message: 'Public data explorer data retrieved successfully'
        });

      } catch (error) {
        logger.error('Failed to get public explorer data:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve public explorer data',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/data/decrypt/:cid
   * Decrypt specific IPFS data (owner only)
   */
  router.get('/decrypt/:cid',
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { cid } = req.params;
        
        if (!req.auth) {
          res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Must be authenticated to decrypt data'
          });
          return;
        }

        logger.info(`Decrypting data for CID: ${cid}`);

        // Retrieve encrypted data from IPFS
        const encryptedData = await ipfsManager.retrieveEncryptedData(cid);
        
        if (!encryptedData) {
          res.status(404).json({
            success: false,
            error: 'Data not found',
            message: 'No data found for the specified CID'
          });
          return;
        }

        // TODO: Verify ownership of the sensor that generated this data
        // For now, allow decryption for development

        // Decrypt the data
        const decryptedData = await encryptionManager.decryptFromIPFS(
          encryptedData.encryptedContent,
          encryptedData.metadata
        );

        res.json({
          success: true,
          data: {
            cid,
            decryptedData,
            metadata: encryptedData.metadata,
            decryptedAt: Date.now()
          },
          message: 'Data decrypted successfully'
        });

      } catch (error) {
        logger.error(`Failed to decrypt data for CID ${req.params.cid}:`, error);
        res.status(500).json({
          success: false,
          error: 'Decryption failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/data/validate
   * Validate climate data without submitting
   */
  router.post('/validate',
    validateClimateData,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const climateData: ClimateData = req.body;
        const submitterAddress = req.auth?.address || 'anonymous';

        logger.info(`Validating data for sensor: ${climateData.sensorId}`);

        const validationResult = await dataValidator.validateClimateData(
          climateData,
          submitterAddress
        );

        res.json({
          success: true,
          data: {
            isValid: validationResult.isValid,
            score: validationResult.score,
            errors: validationResult.errors,
            warnings: validationResult.warnings,
            flags: validationResult.flags,
            metadata: validationResult.metadata
          },
          message: validationResult.isValid ? 'Data is valid' : 'Data validation failed'
        });

      } catch (error) {
        logger.error('Data validation failed:', error);
        res.status(500).json({
          success: false,
          error: 'Validation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/data/stats/validation
   * Get data validation statistics
   */
  router.get('/stats/validation',
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        logger.info('Getting validation statistics');

        const validationStats = dataValidator.getStatistics();

        res.json({
          success: true,
          data: validationStats,
          message: 'Validation statistics retrieved successfully'
        });

      } catch (error) {
        logger.error('Failed to get validation statistics:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve statistics',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/data/stats/storage
   * Get IPFS storage statistics
   */
  router.get('/stats/storage',
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        logger.info('Getting storage statistics');

        const storageStats = await ipfsManager.getStorageStats();

        res.json({
          success: true,
          data: storageStats,
          message: 'Storage statistics retrieved successfully'
        });

      } catch (error) {
        logger.error('Failed to get storage statistics:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve statistics',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  return router;
}