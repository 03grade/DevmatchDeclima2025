import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables from parent directory
dotenv.config({ path: '../.env' });
import { createLogger } from './utils/logger';
import { SensorIdGenerator } from './services/SensorIdGenerator';
import { DataValidator } from './services/DataValidator';
import { EncryptionManager } from './services/EncryptionManager';
import { AIProcessor } from './services/AIProcessor';
import { RewardCalculator } from './services/RewardCalculator';
import { SapphireClient } from './services/SapphireClient';
import { ConfidentialTransactionService } from './services/ConfidentialTransactionService';
import { SmartContractService } from './services/SmartContractService';
import { DataAggregationService } from './services/DataAggregationService';
import { IPFSManager } from './services/IPFSManager';
import { CronManager } from './services/CronManager';
import { ROFLAppService } from './services/ROFLAppService';
import { authMiddleware } from './middleware/auth';
import { validateRequest } from './middleware/validation';
import { sensorRoutes } from './routes/sensors';
import { dataRoutes } from './routes/data';
import { rewardRoutes } from './routes/rewards';
import { aiRoutes } from './routes/ai';
import { governanceRoutes } from './routes/governance';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = createLogger('ROFL-Main');

/**
 * D-Climate ROFL Runtime
 * Confidential off-chain logic for Oasis Sapphire integration
 * 
 * This implementation follows the ROFL specification from:
 * https://docs.oasis.io/build/rofl/features/rest
 */
class DClimateROFL {
  private app: express.Application;
  private port: number;
  private sensorIdGenerator!: SensorIdGenerator;
  private dataValidator!: DataValidator;
  private encryptionManager!: EncryptionManager;
  private aiProcessor!: AIProcessor;
  private rewardCalculator!: RewardCalculator;
  private sapphireClient!: SapphireClient;
  private confidentialTransactionService!: ConfidentialTransactionService;
  private smartContractService!: SmartContractService;
  private dataAggregationService!: DataAggregationService;
  private ipfsManager!: IPFSManager;
  private cronManager!: CronManager;
  private roflAppService!: ROFLAppService;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.ROFL_PORT || '3001');
  }

  private async initializeServices(): Promise<void> {
    logger.info('🔧 Initializing ROFL services...');

    try {
      // Initialize ROFL app service first (required for ROFL-specific operations)
      this.roflAppService = new ROFLAppService();
      const roflStatus = this.roflAppService.getStatus();
      
      if (roflStatus.available) {
        logger.info('✅ ROFL app daemon available');
        try {
          const appId = await this.roflAppService.getAppId();
          logger.info(`✅ ROFL App ID: ${appId}`);
        } catch (error) {
          logger.warn('⚠️ Failed to get ROFL app ID (continuing without ROFL features):', error);
        }
      } else {
        logger.warn('⚠️ ROFL app daemon not available - running in development mode');
      }
      
      // Initialize Sapphire client first (required for confidential operations)
      this.sapphireClient = new SapphireClient();
      await this.sapphireClient.connect();
      
      // Initialize confidential transaction service with Lightweight TypeScript Wrapper
      this.confidentialTransactionService = new ConfidentialTransactionService();
      logger.info('✅ Confidential Transaction Service initialized');
      
      // Initialize smart contract service for blockchain interactions
      this.smartContractService = new SmartContractService(this.sapphireClient);
      await this.smartContractService.initialize();
      logger.info('✅ Smart Contract Service initialized');
      
      // Initialize encryption manager with Sapphire TEE
      this.encryptionManager = new EncryptionManager(this.sapphireClient);
      // Wait for encryption manager to be ready
      while (!this.encryptionManager.isReady()) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Initialize IPFS for data storage
      this.ipfsManager = new IPFSManager();
      await this.ipfsManager.initialize();
      
      // Initialize data aggregation service for AI insights
      this.dataAggregationService = new DataAggregationService(
        this.smartContractService,
        this.ipfsManager,
        this.encryptionManager
      );
      logger.info('✅ Data Aggregation Service initialized');
      
      // Initialize confidential services
      this.sensorIdGenerator = new SensorIdGenerator(this.sapphireClient);
      this.dataValidator = new DataValidator(this.sapphireClient, this.encryptionManager);
      this.aiProcessor = new AIProcessor(this.sapphireClient);
      this.rewardCalculator = new RewardCalculator(this.sapphireClient);
      
      // Initialize cron manager for daily operations
      this.cronManager = new CronManager(
        this.rewardCalculator,
        this.dataValidator,
        this.sapphireClient,
        this.aiProcessor
      );
      logger.info('✅ Cron Manager initialized');
      
      logger.info('✅ All ROFL services initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize ROFL services:', error);
      throw error;
    }
  }

  private setupMiddleware(): void {
    logger.info('🛡️  Setting up middleware...');
    
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));
    
    // CORS for frontend access
    this.app.use(cors({
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:5173', // Vite dev server
        'http://127.0.0.1:5173', // Vite dev server alternative
        'http://localhost:3000', // Alternative frontend port
        'http://127.0.0.1:3000'  // Alternative frontend port
      ],
      credentials: true,
    }));
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });
    
    // Auth middleware for protected routes (excluding public endpoints)
    this.app.use('/api', (req, res, next) => {
      // Skip auth for public endpoints
      if (req.path.includes('/public/') || req.originalUrl.includes('/public/')) {
        logger.debug(`Skipping auth for public endpoint: ${req.path}`);
        return next();
      }
      // Apply auth middleware for protected endpoints
      return authMiddleware(req, res, next);
    });
  }

  private setupRoutes(): void {
    logger.info('🛣️  Setting up routes...');
    
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const confidentialTransactionsStatus = await this.confidentialTransactionService.isConnected();
        const roflStatus = this.roflAppService.getStatus();
        
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          services: {
            sapphire: this.sapphireClient.isConnected(),
            confidentialTransactions: confidentialTransactionsStatus,
            smartContracts: true,
            ipfs: this.ipfsManager.isConnected(),
            encryption: this.encryptionManager.isReady(),
            rofl: roflStatus.available
          },
          rofl: {
            available: roflStatus.available,
            appId: roflStatus.appId,
            developmentMode: roflStatus.developmentMode,
            socketPath: roflStatus.socketPath
          }
        });
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // ROFL-specific routes (following https://docs.oasis.io/build/rofl/features/rest)
    this.app.get('/rofl/v1/app/id', async (req, res) => {
      try {
        const roflStatus = this.roflAppService.getStatus();
        if (roflStatus.available) {
          const appId = await this.roflAppService.getAppId();
          res.send(appId);
        } else {
          res.status(503).json({
            error: 'ROFL app daemon not available',
            message: 'ROFL app daemon is not running or not accessible'
          });
        }
      } catch (error) {
        logger.error('Failed to get ROFL app ID:', error);
        res.status(500).json({
          error: 'Failed to get ROFL app ID',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    this.app.post('/rofl/v1/keys/generate', async (req, res) => {
      try {
        const { key_id, kind } = req.body;
        
        if (!key_id || !kind) {
          return res.status(400).json({
            error: 'Missing required fields',
            message: 'key_id and kind are required'
          });
        }
        
        const roflStatus = this.roflAppService.getStatus();
        if (roflStatus.available) {
          const key = await this.roflAppService.generateKey(key_id, kind);
          res.json({ key });
        } else {
          res.status(503).json({
            error: 'ROFL app daemon not available',
            message: 'ROFL app daemon is not running or not accessible'
          });
        }
      } catch (error) {
        logger.error('Failed to generate ROFL key:', error);
        res.status(500).json({
          error: 'Failed to generate key',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    this.app.post('/rofl/v1/tx/sign-submit', async (req, res) => {
      try {
        const { tx, encrypt = true } = req.body;
        
        if (!tx) {
          return res.status(400).json({
            error: 'Missing required fields',
            message: 'tx is required'
          });
        }
        
        const roflStatus = this.roflAppService.getStatus();
        if (roflStatus.available) {
          const result = await this.roflAppService.submitAuthenticatedTransaction(tx, encrypt);
          res.json({ data: result });
        } else {
          res.status(503).json({
            error: 'ROFL app daemon not available',
            message: 'ROFL app daemon is not running or not accessible'
          });
        }
      } catch (error) {
        logger.error('Failed to submit authenticated transaction:', error);
        res.status(500).json({
          error: 'Failed to submit transaction',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // API routes with service injection
    logger.info('Setting up sensor routes...');
    const sensorRouter = sensorRoutes(
      this.sensorIdGenerator, 
      this.sapphireClient,
      this.confidentialTransactionService,
      this.smartContractService
    );
    logger.info('Sensor routes created:', !!sensorRouter);
    this.app.use('/api/sensors', sensorRouter);
    
    logger.info('Setting up data routes...');
    const dataRouter = dataRoutes(
      this.dataValidator,
      this.encryptionManager,
      this.ipfsManager,
      this.sapphireClient,
      this.smartContractService,
      this.dataAggregationService
    );
    logger.info('Data routes created:', !!dataRouter);
    this.app.use('/api/data', dataRouter);
    
    logger.info('Setting up reward routes...');
    const rewardRouter = rewardRoutes(
      this.rewardCalculator, 
      this.sapphireClient,
      this.smartContractService
    );
    logger.info('Reward routes created:', !!rewardRouter);
    this.app.use('/api/rewards', rewardRouter);
    
    logger.info('Setting up AI routes...');
    const aiRouter = aiRoutes(this.aiProcessor, this.sapphireClient, this.dataAggregationService);
    logger.info('AI routes created:', !!aiRouter);
    this.app.use('/api/ai', aiRouter);
    
    logger.info('Setting up governance routes...');
    const governanceRouter = governanceRoutes(this.sapphireClient, this.smartContractService);
    logger.info('Governance routes created:', !!governanceRouter);
    this.app.use('/api/governance', governanceRouter);
    
    // Error handling
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not found',
        message: `Route ${req.originalUrl} not found`
      });
    });
  }

  private setupCronJobs(): void {
    logger.info('⏰ Setting up cron jobs...');
    
    // Start daily reward distribution cron
    this.cronManager.startDailyRewardDistribution();
    
    // Start data validation cron
    this.cronManager.startDataValidationCron();
    
    // Start AI insights generation cron
    this.cronManager.startAIInsightsCron();
  }

  public async start(): Promise<void> {
    try {
      // Initialize all services
      await this.initializeServices();
      
      // Setup middleware and routes
      this.setupMiddleware();
      this.setupRoutes();
      this.setupCronJobs();
      
      // Start server
      this.app.listen(this.port, () => {
        logger.info(`🚀 D-Climate ROFL Runtime started on port ${this.port}`);
        logger.info(`🌐 Health check: http://localhost:${this.port}/health`);
        logger.info(`📡 API base URL: http://localhost:${this.port}/api`);
        logger.info('🔐 Confidential operations powered by Oasis Sapphire');
      });
      
      // Graceful shutdown handling
      process.on('SIGTERM', this.shutdown.bind(this));
      process.on('SIGINT', this.shutdown.bind(this));
      
    } catch (error) {
      logger.error('❌ Failed to start ROFL runtime:', error);
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    logger.info('🛑 Shutting down ROFL runtime...');
    
    try {
      // Stop cron jobs
      this.cronManager.stopAll();
      
      // Disconnect from services
      await this.sapphireClient.disconnect();
      await this.ipfsManager.disconnect();
      
      logger.info('✅ ROFL runtime shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the ROFL runtime
if (require.main === module) {
  const rofl = new DClimateROFL();
  rofl.start().catch(error => {
    console.error('Failed to start ROFL runtime:', error);
    process.exit(1);
  });
}

export { DClimateROFL };