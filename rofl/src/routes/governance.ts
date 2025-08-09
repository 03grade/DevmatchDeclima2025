import { Router, Response } from 'express';
import { SapphireClient } from '../services/SapphireClient';
import { SmartContractService } from '../services/SmartContractService';
import { AuthenticatedRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { createLogger } from '../utils/logger';
import Joi from 'joi';

const logger = createLogger('GovernanceRoutes');

/**
 * Governance routes for D-Climate ROFL API
 * Handles DAO governance operations including staking, voting, proposals, and delegations
 * Uses SmartContractService for real blockchain interactions
 */
export function governanceRoutes(
  sapphireClient: SapphireClient,
  smartContractService: SmartContractService
): Router {
  const router = Router();

  /**
   * POST /api/governance/stake
   * Stake ROSE tokens for voting power
   */
  router.post('/stake',
    validateRequest(Joi.object({
      amount: Joi.number().positive().required()
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        logger.info(`💰 Staking ROSE for wallet: ${req.auth?.address}`);

        const { amount } = req.body;
        const walletAddress = req.auth!.address;

        const result = await smartContractService.stake(amount);

        res.json({
          success: true,
          data: {
            amount,
            walletAddress,
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber
          },
          message: 'Staking request submitted successfully'
        });

      } catch (error) {
        logger.error('Staking failed:', error);
        res.status(500).json({
          success: false,
          error: 'Staking failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/governance/unstake
   * Unstake ROSE tokens
   */
  router.post('/unstake',
    validateRequest(Joi.object({
      amount: Joi.number().positive().required()
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        logger.info(`💰 Unstaking ROSE for wallet: ${req.auth?.address}`);

        const { amount } = req.body;
        const walletAddress = req.auth!.address;

        const result = await smartContractService.unstake(amount);

        res.json({
          success: true,
          data: {
            amount,
            walletAddress,
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber
          },
          message: 'Unstaking request submitted successfully'
        });

      } catch (error) {
        logger.error('Unstaking failed:', error);
        res.status(500).json({
          success: false,
          error: 'Unstaking failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/governance/delegate
   * Delegate voting power to another address
   */
  router.post('/delegate',
    validateRequest(Joi.object({
      delegateTo: Joi.string().required(),
      amount: Joi.number().positive().required()
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        logger.info(`🗳️ Delegating voting power for wallet: ${req.auth?.address}`);

        const { delegateTo, amount } = req.body;
        const walletAddress = req.auth!.address;

        const result = await smartContractService.delegate(delegateTo, amount);

        res.json({
          success: true,
          data: {
            delegateTo,
            amount,
            walletAddress,
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber
          },
          message: 'Delegation request submitted successfully'
        });

      } catch (error) {
        logger.error('Delegation failed:', error);
        res.status(500).json({
          success: false,
          error: 'Delegation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/governance/proposals
   * Create a new proposal
   */
  router.post('/proposals',
    validateRequest(Joi.object({
      proposalType: Joi.number().min(0).max(4).required(),
      title: Joi.string().required(),
      description: Joi.string().required(),
      targetContract: Joi.string().required(),
      proposalData: Joi.string().required(),
      value: Joi.number().min(0).default(0)
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        logger.info(`📋 Creating proposal for wallet: ${req.auth?.address}`);

        const { proposalType, title, description, targetContract, proposalData, value } = req.body;
        const walletAddress = req.auth!.address;

        const result = await smartContractService.createProposal(proposalType, title, description, targetContract, proposalData, value);

        res.json({
          success: true,
          data: {
            proposalId: result.proposalId,
            proposalType,
            title,
            description,
            targetContract,
            proposalData,
            value,
            proposer: walletAddress,
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber
          },
          message: 'Proposal creation request submitted successfully'
        });

      } catch (error) {
        logger.error('Proposal creation failed:', error);
        res.status(500).json({
          success: false,
          error: 'Proposal creation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/governance/proposals
   * Get all proposals
   */
  router.get('/proposals', async (req: AuthenticatedRequest, res: Response) => {
    try {
      logger.info('📋 Fetching all proposals');

      const proposalCount = await smartContractService.getProposalCount();
      const proposals = [];

      // Fetch all proposals
      for (let i = 1; i <= proposalCount; i++) {
        try {
          const proposal = await smartContractService.getProposal(i);
          proposals.push(proposal);
        } catch (error) {
          logger.warn(`Failed to fetch proposal ${i}:`, error);
        }
      }

      res.json({
        success: true,
        data: {
          proposals,
          total: proposalCount
        },
        message: 'Proposals fetched successfully'
      });

    } catch (error) {
      logger.error('Failed to fetch proposals:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch proposals',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/governance/proposals/:id
   * Get proposal details
   */
  router.get('/proposals/:id',
    validateRequest(Joi.object({
      id: Joi.number().positive().required()
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { id } = req.params;
        logger.info(`📋 Fetching proposal ${id}`);

        const proposal = await smartContractService.getProposal(Number(id));

        res.json({
          success: true,
          data: {
            id: Number(id),
            proposal
          },
          message: 'Proposal fetched successfully'
        });

      } catch (error) {
        logger.error('Failed to fetch proposal:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch proposal',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/governance/proposals/:id/vote
   * Cast a vote on a proposal
   */
  router.post('/proposals/:id/vote',
    validateRequest(Joi.object({
      support: Joi.number().min(0).max(2).required() // 0=against, 1=for, 2=abstain
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { id } = req.params;
        const { support } = req.body;
        const walletAddress = req.auth!.address;

        logger.info(`🗳️ Casting vote on proposal ${id} for wallet: ${walletAddress}`);

        const result = await smartContractService.castVote(Number(id), support);

        const supportText = support === 0 ? 'AGAINST' : support === 1 ? 'FOR' : 'ABSTAIN';

        res.json({
          success: true,
          data: {
            proposalId: Number(id),
            support,
            supportText,
            walletAddress,
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber
          },
          message: `Vote cast successfully: ${supportText}`
        });

      } catch (error) {
        logger.error('Voting failed:', error);
        res.status(500).json({
          success: false,
          error: 'Voting failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/governance/proposals/:id/queue
   * Queue a proposal for execution
   */
  router.post('/proposals/:id/queue',
    validateRequest(Joi.object({
      id: Joi.number().positive().required()
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { id } = req.params;
        logger.info(`⏰ Queueing proposal ${id} for execution`);

        const result = await smartContractService.queueProposal(Number(id));

        res.json({
          success: true,
          data: {
            proposalId: Number(id),
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber
          },
          message: 'Proposal queued successfully'
        });

      } catch (error) {
        logger.error('Proposal queuing failed:', error);
        res.status(500).json({
          success: false,
          error: 'Proposal queuing failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/governance/proposals/:id/execute
   * Execute a queued proposal
   */
  router.post('/proposals/:id/execute',
    validateRequest(Joi.object({
      id: Joi.number().positive().required()
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { id } = req.params;
        logger.info(`✅ Executing proposal ${id}`);

        const result = await smartContractService.executeProposal(Number(id));

        res.json({
          success: true,
          data: {
            proposalId: Number(id),
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber,
            success: result.success
          },
          message: 'Proposal executed successfully'
        });

      } catch (error) {
        logger.error('Proposal execution failed:', error);
        res.status(500).json({
          success: false,
          error: 'Proposal execution failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/governance/voting-power/:address
   * Get voting power for an address
   */
  router.get('/voting-power/:address',
    validateRequest(Joi.object({
      address: Joi.string().required()
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { address } = req.params;
        logger.info(`🗳️ Fetching voting power for address: ${address}`);

        const votingPower = await smartContractService.getVotingPower(address);

        res.json({
          success: true,
          data: {
            address,
            votingPower
          },
          message: 'Voting power fetched successfully'
        });

      } catch (error) {
        logger.error('Failed to fetch voting power:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch voting power',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/governance/stats
   * Get governance statistics
   */
  router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
    try {
      logger.info('📊 Fetching governance statistics');

      const totalStaked = await smartContractService.getTotalStaked();
      const totalProposals = await smartContractService.getProposalCount();

      res.json({
        success: true,
        data: {
          totalStaked,
          totalProposals,
          activeProposals: totalProposals, // TODO: Implement active proposals count
          totalVoters: 0 // TODO: Implement total voters count
        },
        message: 'Governance statistics fetched successfully'
      });

    } catch (error) {
      logger.error('Failed to fetch governance stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch governance stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
} 