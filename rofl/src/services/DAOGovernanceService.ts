import { ethers } from 'ethers';
import { SapphireClient } from './SapphireClient';
import { createLogger } from '../utils/logger';

const logger = createLogger('DAOGovernanceService');

/**
 * DAO Governance ABI (simplified for key functions)
 */
const DAO_GOVERNANCE_ABI = [
  'function stake() external payable',
  'function unstake(uint256 amount) external',
  'function delegate(address delegateTo, uint256 amount) external',
  'function removeDelegation() external',
  'function createProposal(uint8 proposalType, string title, string description, address targetContract, bytes proposalData, uint256 value) external returns (uint256)',
  'function castVote(uint256 proposalId, uint8 support) external',
  'function queueProposal(uint256 proposalId) external',
  'function executeProposal(uint256 proposalId) external',
  'function cancelProposal(uint256 proposalId) external',
  'function getVotingPower(address user) external view returns (uint256)',
  'function getProposal(uint256 proposalId) external view returns (uint256 id, address proposer, uint8 proposalType, string title, string description, bytes proposalData, address targetContract, uint256 value, uint256 startTime, uint256 endTime, uint256 queuedTime, uint256 executionTime, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, uint8 state, bool executed)',
  'function getVote(uint256 proposalId, address voter) external view returns (bool hasVoted, uint8 support, uint256 weight, uint256 timestamp)',
  'function updateGovernanceParameters(uint256 _votingPeriod, uint256 _timelockPeriod, uint256 _proposalThreshold, uint256 _quorumThreshold, uint256 _majorityThreshold) external',
  'function emergencyPause() external',
  'function proposalCount() external view returns (uint256)',
  'function totalStaked() external view returns (uint256)',
  'function stakes(address user) external view returns (uint256)',
  'function delegations(address delegator) external view returns (address delegate, uint256 amount, uint256 timestamp, bool isActive)',
  'function delegatedPower(address delegate) external view returns (uint256)',
  'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, uint8 indexed proposalType, string title)',
  'event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 support, uint256 weight)',
  'event ProposalQueued(uint256 indexed proposalId, uint256 executionTime)',
  'event ProposalExecuted(uint256 indexed proposalId, bool success, bytes returnData)',
  'event ProposalCancelled(uint256 indexed proposalId)',
  'event DelegationChanged(address indexed delegator, address indexed delegate, uint256 amount)',
  'event StakeChanged(address indexed user, uint256 oldStake, uint256 newStake)'
];

/**
 * Proposal types
 */
export enum ProposalType {
  RewardConfigUpdate = 0,
  ReputationThresholdUpdate = 1,
  GovernanceParameterUpdate = 2,
  ContractUpgrade = 3,
  EmergencyAction = 4
}

/**
 * Proposal states
 */
export enum ProposalState {
  Draft = 0,
  Live = 1,
  Queued = 2,
  Executed = 3,
  Expired = 4,
  Cancelled = 5
}

/**
 * Vote support types
 */
export enum VoteSupport {
  Against = 0,
  For = 1,
  Abstain = 2
}

/**
 * Proposal interface
 */
export interface Proposal {
  id: number;
  proposer: string;
  proposalType: ProposalType;
  title: string;
  description: string;
  proposalData: string;
  targetContract: string;
  value: number;
  startTime: number;
  endTime: number;
  queuedTime: number;
  executionTime: number;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  state: ProposalState;
  executed: boolean;
}

/**
 * Vote interface
 */
export interface Vote {
  hasVoted: boolean;
  support: VoteSupport;
  weight: number;
  timestamp: number;
}

/**
 * Delegation interface
 */
export interface Delegation {
  delegate: string;
  amount: number;
  timestamp: number;
  isActive: boolean;
}

/**
 * DAO Governance Service for D-Climate
 * Handles all DAO governance operations using ROFL for gas efficiency and Sapphire for privacy
 */
export class DAOGovernanceService {
  private sapphireClient: SapphireClient;
  private daoGovernance: ethers.Contract | null = null;

  constructor(sapphireClient: SapphireClient) {
    this.sapphireClient = sapphireClient;
  }

  /**
   * Initialize DAOGovernance contract instance
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('🏛️ Initializing DAO Governance service...');

      const daoGovernanceAddress = process.env.DAO_GOVERNANCE_CONTRACT;
      if (!daoGovernanceAddress) {
        throw new Error('DAOGovernance contract address not configured in environment variables');
      }

      this.daoGovernance = new ethers.Contract(daoGovernanceAddress, DAO_GOVERNANCE_ABI, this.sapphireClient.getWallet());
      logger.info('✅ DAO Governance service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize DAO Governance service:', error);
      throw error;
    }
  }

  /**
   * Stake ROSE tokens for voting power
   */
  public async stake(amount: number): Promise<{
    transactionHash: string;
    blockNumber: number;
  }> {
    try {
      if (!this.daoGovernance) {
        throw new Error('DAOGovernance contract not initialized');
      }

      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.daoGovernance,
        'stake',
        [],
        { value: ethers.parseEther(amount.toString()) }
      );

      logger.info(`💰 Staked ${amount} ROSE for voting power`);
      return {
        transactionHash: tx.hash,
        blockNumber: tx.blockNumber || 0
      };
    } catch (error) {
      logger.error('❌ Failed to stake ROSE:', error);
      throw error;
    }
  }

  /**
   * Unstake ROSE tokens
   */
  public async unstake(amount: number): Promise<{
    transactionHash: string;
    blockNumber: number;
  }> {
    try {
      if (!this.daoGovernance) {
        throw new Error('DAOGovernance contract not initialized');
      }

      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.daoGovernance,
        'unstake',
        [ethers.parseEther(amount.toString())]
      );

      logger.info(`💰 Unstaked ${amount} ROSE`);
      return {
        transactionHash: tx.hash,
        blockNumber: tx.blockNumber || 0
      };
    } catch (error) {
      logger.error('❌ Failed to unstake ROSE:', error);
      throw error;
    }
  }

  /**
   * Delegate voting power to another address
   */
  public async delegate(delegateTo: string, amount: number): Promise<{
    transactionHash: string;
    blockNumber: number;
  }> {
    try {
      if (!this.daoGovernance) {
        throw new Error('DAOGovernance contract not initialized');
      }

      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.daoGovernance,
        'delegate',
        [delegateTo, ethers.parseEther(amount.toString())]
      );

      logger.info(`🗳️ Delegated ${amount} ROSE voting power to ${delegateTo}`);
      return {
        transactionHash: tx.hash,
        blockNumber: tx.blockNumber || 0
      };
    } catch (error) {
      logger.error('❌ Failed to delegate voting power:', error);
      throw error;
    }
  }

  /**
   * Remove delegation
   */
  public async removeDelegation(): Promise<{
    transactionHash: string;
    blockNumber: number;
  }> {
    try {
      if (!this.daoGovernance) {
        throw new Error('DAOGovernance contract not initialized');
      }

      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.daoGovernance,
        'removeDelegation',
        []
      );

      logger.info('🗳️ Removed delegation');
      return {
        transactionHash: tx.hash,
        blockNumber: tx.blockNumber || 0
      };
    } catch (error) {
      logger.error('❌ Failed to remove delegation:', error);
      throw error;
    }
  }

  /**
   * Create a new proposal
   */
  public async createProposal(
    proposalType: ProposalType,
    title: string,
    description: string,
    targetContract: string,
    proposalData: string,
    value: number = 0
  ): Promise<{
    proposalId: number;
    transactionHash: string;
    blockNumber: number;
  }> {
    try {
      if (!this.daoGovernance) {
        throw new Error('DAOGovernance contract not initialized');
      }

      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.daoGovernance,
        'createProposal',
        [proposalType, title, description, targetContract, proposalData, ethers.parseEther(value.toString())]
      );

      // Parse the ProposalCreated event to get the proposal ID
      const receipt = await tx.wait();
      const event = receipt?.logs?.find((log: any) => {
        try {
          const parsed = this.daoGovernance!.interface.parseLog(log);
          return parsed?.name === 'ProposalCreated';
        } catch {
          return false;
        }
      });

      let proposalId = 0;
      if (event) {
        const parsed = this.daoGovernance!.interface.parseLog(event);
        proposalId = parsed?.args?.[0] || 0;
      }

      logger.info(`📋 Created proposal ${proposalId}: ${title}`);
      return {
        proposalId,
        transactionHash: tx.hash,
        blockNumber: tx.blockNumber || 0
      };
    } catch (error) {
      logger.error('❌ Failed to create proposal:', error);
      throw error;
    }
  }

  /**
   * Cast a vote on a proposal
   */
  public async castVote(proposalId: number, support: VoteSupport): Promise<{
    transactionHash: string;
    blockNumber: number;
  }> {
    try {
      if (!this.daoGovernance) {
        throw new Error('DAOGovernance contract not initialized');
      }

      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.daoGovernance,
        'castVote',
        [proposalId, support]
      );

      const supportText = support === VoteSupport.For ? 'FOR' : support === VoteSupport.Against ? 'AGAINST' : 'ABSTAIN';
      logger.info(`🗳️ Cast ${supportText} vote on proposal ${proposalId}`);
      return {
        transactionHash: tx.hash,
        blockNumber: tx.blockNumber || 0
      };
    } catch (error) {
      logger.error('❌ Failed to cast vote:', error);
      throw error;
    }
  }

  /**
   * Queue a proposal for execution
   */
  public async queueProposal(proposalId: number): Promise<{
    transactionHash: string;
    blockNumber: number;
  }> {
    try {
      if (!this.daoGovernance) {
        throw new Error('DAOGovernance contract not initialized');
      }

      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.daoGovernance,
        'queueProposal',
        [proposalId]
      );

      logger.info(`⏰ Queued proposal ${proposalId} for execution`);
      return {
        transactionHash: tx.hash,
        blockNumber: tx.blockNumber || 0
      };
    } catch (error) {
      logger.error('❌ Failed to queue proposal:', error);
      throw error;
    }
  }

  /**
   * Execute a queued proposal
   */
  public async executeProposal(proposalId: number): Promise<{
    success: boolean;
    transactionHash: string;
    blockNumber: number;
  }> {
    try {
      if (!this.daoGovernance) {
        throw new Error('DAOGovernance contract not initialized');
      }

      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.daoGovernance,
        'executeProposal',
        [proposalId]
      );

      logger.info(`✅ Executed proposal ${proposalId}`);
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: tx.blockNumber || 0
      };
    } catch (error) {
      logger.error('❌ Failed to execute proposal:', error);
      throw error;
    }
  }

  /**
   * Cancel a proposal
   */
  public async cancelProposal(proposalId: number): Promise<{
    transactionHash: string;
    blockNumber: number;
  }> {
    try {
      if (!this.daoGovernance) {
        throw new Error('DAOGovernance contract not initialized');
      }

      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.daoGovernance,
        'cancelProposal',
        [proposalId]
      );

      logger.info(`❌ Cancelled proposal ${proposalId}`);
      return {
        transactionHash: tx.hash,
        blockNumber: tx.blockNumber || 0
      };
    } catch (error) {
      logger.error('❌ Failed to cancel proposal:', error);
      throw error;
    }
  }

  /**
   * Get voting power for an address
   */
  public async getVotingPower(userAddress: string): Promise<number> {
    try {
      if (!this.daoGovernance) {
        throw new Error('DAOGovernance contract not initialized');
      }

      const votingPower = await this.sapphireClient.callConfidentialView(
        this.daoGovernance,
        'getVotingPower',
        [userAddress]
      );

      return Number(ethers.formatEther(votingPower));
    } catch (error) {
      logger.error('❌ Failed to get voting power:', error);
      throw error;
    }
  }

  /**
   * Get proposal details
   */
  public async getProposal(proposalId: number): Promise<Proposal> {
    try {
      if (!this.daoGovernance) {
        throw new Error('DAOGovernance contract not initialized');
      }

      const proposal = await this.sapphireClient.callConfidentialView(
        this.daoGovernance,
        'getProposal',
        [proposalId]
      );

      return {
        id: Number(proposal[0]),
        proposer: proposal[1],
        proposalType: Number(proposal[2]) as ProposalType,
        title: proposal[3],
        description: proposal[4],
        proposalData: proposal[5],
        targetContract: proposal[6],
        value: Number(ethers.formatEther(proposal[7])),
        startTime: Number(proposal[8]),
        endTime: Number(proposal[9]),
        queuedTime: Number(proposal[10]),
        executionTime: Number(proposal[11]),
        forVotes: Number(ethers.formatEther(proposal[12])),
        againstVotes: Number(ethers.formatEther(proposal[13])),
        abstainVotes: Number(ethers.formatEther(proposal[14])),
        state: Number(proposal[15]) as ProposalState,
        executed: proposal[16]
      };
    } catch (error) {
      logger.error('❌ Failed to get proposal:', error);
      throw error;
    }
  }

  /**
   * Get vote details for a user on a proposal
   */
  public async getVote(proposalId: number, voterAddress: string): Promise<Vote> {
    try {
      if (!this.daoGovernance) {
        throw new Error('DAOGovernance contract not initialized');
      }

      const vote = await this.sapphireClient.callConfidentialView(
        this.daoGovernance,
        'getVote',
        [proposalId, voterAddress]
      );

      return {
        hasVoted: vote[0],
        support: Number(vote[1]) as VoteSupport,
        weight: Number(ethers.formatEther(vote[2])),
        timestamp: Number(vote[3])
      };
    } catch (error) {
      logger.error('❌ Failed to get vote:', error);
      throw error;
    }
  }

  /**
   * Get total staked amount
   */
  public async getTotalStaked(): Promise<number> {
    try {
      if (!this.daoGovernance) {
        throw new Error('DAOGovernance contract not initialized');
      }

      const totalStaked = await this.sapphireClient.callConfidentialView(
        this.daoGovernance,
        'totalStaked',
        []
      );

      return Number(ethers.formatEther(totalStaked));
    } catch (error) {
      logger.error('❌ Failed to get total staked:', error);
      throw error;
    }
  }

  /**
   * Get user's staked amount
   */
  public async getStake(userAddress: string): Promise<number> {
    try {
      if (!this.daoGovernance) {
        throw new Error('DAOGovernance contract not initialized');
      }

      const stake = await this.sapphireClient.callConfidentialView(
        this.daoGovernance,
        'stakes',
        [userAddress]
      );

      return Number(ethers.formatEther(stake));
    } catch (error) {
      logger.error('❌ Failed to get stake:', error);
      throw error;
    }
  }

  /**
   * Get user's delegation
   */
  public async getDelegation(delegatorAddress: string): Promise<Delegation> {
    try {
      if (!this.daoGovernance) {
        throw new Error('DAOGovernance contract not initialized');
      }

      const delegation = await this.sapphireClient.callConfidentialView(
        this.daoGovernance,
        'delegations',
        [delegatorAddress]
      );

      return {
        delegate: delegation[0],
        amount: Number(ethers.formatEther(delegation[1])),
        timestamp: Number(delegation[2]),
        isActive: delegation[3]
      };
    } catch (error) {
      logger.error('❌ Failed to get delegation:', error);
      throw error;
    }
  }

  /**
   * Get proposal count
   */
  public async getProposalCount(): Promise<number> {
    try {
      if (!this.daoGovernance) {
        throw new Error('DAOGovernance contract not initialized');
      }

      const count = await this.sapphireClient.callConfidentialView(
        this.daoGovernance,
        'proposalCount',
        []
      );

      return Number(count);
    } catch (error) {
      logger.error('❌ Failed to get proposal count:', error);
      throw error;
    }
  }
} 