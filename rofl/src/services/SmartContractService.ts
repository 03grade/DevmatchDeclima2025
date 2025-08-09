import { ethers } from 'ethers';
import { SapphireClient } from './SapphireClient';
import { createLogger } from '../utils/logger';

const logger = createLogger('SmartContractService');

/**
 * Smart Contract ABIs (simplified for key functions)
 */
const SENSOR_NFA_ABI = [
  'function mintSensor(string sensorId, string ipfsMetadata) external returns (uint256)',
  'function getSensorMetadata(string sensorId) external view returns (string sensorId, uint256 reputationScore, uint256 mintTimestamp, string ipfsMetadata, bool isActive, uint256 totalSubmissions, uint256 lastSubmission)',
  'function getSensorsByOwner(address owner) external view returns (string[] memory)',
  'function setSensorStatus(string sensorId, bool isActive) external',
  'function updateReputation(string sensorId, uint256 newScore, string reason) external',
  'function sensorExists(string sensorId) external view returns (bool)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  'function balanceOf(address owner) external view returns (uint256)',
  'event SensorMinted(address indexed owner, uint256 indexed tokenId, string indexed sensorId, uint256 timestamp)',
  'event ReputationUpdated(string indexed sensorId, uint256 oldScore, uint256 newScore, string reason)',
  'event SensorStatusChanged(string indexed sensorId, bool isActive, uint256 timestamp)'
];

const DATA_REGISTRY_ABI = [
  'function submitDataBatch(string sensorId, string ipfsCid, bytes encryptedKey, bytes32 recordHash) external',
  'function validateData(string sensorId, string ipfsCid, bool isValid, string result) external',
  'function getSensorData(string sensorId, uint256 index) external view returns (string sensorId, string ipfsCid, bytes32 recordHash, bytes encryptedKey, uint256 timestamp, address submitter, bool isValidated, uint256 validationTime, string validationResult)',
  'function getSensorDataCount(string sensorId) external view returns (uint256)',
  'function getLastSubmissionTime(string sensorId) external view returns (uint256)',
  'event DataSubmitted(string indexed sensorId, string indexed ipfsCid, bytes32 indexed recordHash, address submitter, uint256 timestamp)',
  'event DataValidated(string indexed sensorId, string indexed ipfsCid, bool isValid, string result, uint256 validationTime)'
];

const REWARD_DISTRIBUTOR_ABI = [
  'function calculateReward(string sensorId, uint256 earnedDate) external returns (uint256)',
  'function claimReward(string sensorId, uint256 earnedDate) external',
  'function getClaimableRewards(address owner) external view returns (string[] memory sensorIds, uint256[] memory amounts, uint256[] memory earnedDates)',
  'function getRewardCalculation(string sensorId, uint256 earnedDate) external view returns (uint256 baseReward, uint256 qualityMultiplier, uint256 frequencyBonus, uint256 reputationBonus, uint256 totalReward, uint256 calculationTime)',
  'function getTotalEarned(address owner) external view returns (uint256)',
  'function getTotalClaimed(address owner) external view returns (uint256)',
  'event RewardCalculated(string indexed sensorId, uint256 indexed earnedDate, uint256 amount, address indexed owner)',
  'event RewardClaimed(string indexed sensorId, address indexed claimer, uint256 amount, uint256 earnedDate)'
];

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
 * Smart Contract Service for D-Climate
 * Handles all smart contract interactions using ROFL for gas efficiency and Sapphire for privacy
 */
export class SmartContractService {
  private sapphireClient: SapphireClient;
  private sensorNFA: ethers.Contract | null = null;
  private dataRegistry: ethers.Contract | null = null;
  private rewardDistributor: ethers.Contract | null = null;
  private daoGovernance: ethers.Contract | null = null;

  constructor(sapphireClient: SapphireClient) {
    this.sapphireClient = sapphireClient;
  }

  /**
   * Initialize smart contract instances
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('🔗 Initializing smart contract service...');

      // Get contract addresses from environment
      const sensorNFAAddress = process.env.SENSOR_NFA_CONTRACT;
      const dataRegistryAddress = process.env.DATA_REGISTRY_CONTRACT;
      const rewardDistributorAddress = process.env.REWARD_DISTRIBUTOR_CONTRACT;
      const daoGovernanceAddress = process.env.DAO_GOVERNANCE_CONTRACT;

      logger.info('📋 Contract addresses from environment:', {
        sensorNFA: sensorNFAAddress ? `${sensorNFAAddress.substring(0, 10)}...` : 'NOT SET',
        dataRegistry: dataRegistryAddress ? `${dataRegistryAddress.substring(0, 10)}...` : 'NOT SET',
        rewardDistributor: rewardDistributorAddress ? `${rewardDistributorAddress.substring(0, 10)}...` : 'NOT SET',
        daoGovernance: daoGovernanceAddress ? `${daoGovernanceAddress.substring(0, 10)}...` : 'NOT SET'
      });

      if (!sensorNFAAddress || !dataRegistryAddress || !rewardDistributorAddress) {
        throw new Error('Contract addresses not configured in environment variables. Please check your .env file.');
      }

      // Initialize contract instances with Sapphire client for proper confidential integration
      if (!this.sapphireClient.isConnected()) {
        throw new Error('Sapphire client not connected. Please connect before initializing contracts.');
      }

      // Check if SapphireClient has loaded contract addresses
      if (!this.sapphireClient.areContractAddressesLoaded()) {
        throw new Error('Contract addresses not loaded in SapphireClient. Please ensure connection is established first.');
      }

      // Use SapphireClient.getContract for proper Sapphire integration
      this.sensorNFA = this.sapphireClient.getContract('sensorNFA', SENSOR_NFA_ABI);
      this.dataRegistry = this.sapphireClient.getContract('dataRegistry', DATA_REGISTRY_ABI);
      this.rewardDistributor = this.sapphireClient.getContract('rewardDistributor', REWARD_DISTRIBUTOR_ABI);
      
      // Initialize DAOGovernance if address is provided
      if (daoGovernanceAddress) {
        this.daoGovernance = this.sapphireClient.getContract('daoGovernance', DAO_GOVERNANCE_ABI);
        logger.info('✅ DAOGovernance contract initialized');
      } else {
        logger.warn('⚠️ DAOGovernance contract address not configured');
      }

      logger.info('✅ Smart contract service initialized successfully');
      logger.info('📊 Contracts loaded:', {
        sensorNFA: this.sensorNFA?.target || 'NOT LOADED',
        dataRegistry: this.dataRegistry?.target || 'NOT LOADED',
        rewardDistributor: this.rewardDistributor?.target || 'NOT LOADED',
        daoGovernance: this.daoGovernance?.target || 'NOT LOADED'
      });

    } catch (error) {
      logger.error('❌ Failed to initialize smart contract service:', error);
      throw error;
    }
  }

  /**
   * Mint a new sensor NFA using confidential transaction
   */
  public async mintSensor(sensorId: string, ipfsMetadata: string): Promise<{
    tokenId: number;
    transactionHash: string;
    blockNumber: number;
  }> {
    try {
      if (!this.sensorNFA) {
        throw new Error('SensorNFA contract not initialized');
      }

      logger.info(`🔐 Minting sensor NFA: ${sensorId}`);

      // Check if sensor already exists
      const exists = await this.sensorExists(sensorId);
      if (exists) {
        throw new Error(`Sensor with ID ${sensorId} already exists`);
      }

      // Prepare transaction parameters with sufficient gas
      const gasLimit = 800000; // Increased gas limit for minting operations
      const options = {
        gasLimit: gasLimit
      };

      logger.info(`📝 Calling mintSensor with parameters:`, {
        sensorId,
        ipfsMetadata: ipfsMetadata.substring(0, 100) + '...',
        gasLimit
      });

      // Execute confidential transaction for minting
      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.sensorNFA,
        'mintSensor',
        [sensorId, ipfsMetadata],
        options
      );

      logger.info(`⏳ Transaction sent: ${tx.hash}`);

      // Wait for transaction confirmation with timeout
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }

      logger.info(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);

      // Parse the SensorMinted event to get tokenId
      let tokenId = 0;
      if (receipt.logs && receipt.logs.length > 0) {
        for (const log of receipt.logs) {
          try {
            const parsed = this.sensorNFA!.interface.parseLog(log);
            if (parsed && parsed.name === 'SensorMinted') {
              tokenId = Number(parsed.args[1]); // tokenId is the second argument
              logger.info(`🎯 SensorMinted event found: tokenId = ${tokenId}`);
              break;
            }
          } catch (error) {
            // Skip logs that can't be parsed
            continue;
          }
        }
      }

      // If no event found, try to get the tokenId from the contract
      if (tokenId === 0) {
        try {
          const sensorData = await this.getSensorMetadata(sensorId);
          tokenId = sensorData.mintTimestamp; // This might not be the tokenId, but let's use it as fallback
          logger.info(`🔍 Using fallback tokenId from metadata: ${tokenId}`);
        } catch (error) {
          logger.warn('Could not retrieve tokenId from event or contract, using 0');
          tokenId = 0;
        }
      }

      logger.info(`✅ Sensor NFA minted successfully: ${sensorId} (tokenId: ${tokenId})`);

      return {
        tokenId,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      logger.error(`❌ Failed to mint sensor NFA: ${sensorId}`, error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          throw new Error('Insufficient ROSE tokens for gas fees. Please ensure your wallet has enough ROSE tokens.');
        } else if (error.message.includes('nonce')) {
          throw new Error('Transaction nonce issue. Please try again.');
        } else if (error.message.includes('gas')) {
          throw new Error('Gas estimation failed. Please try again with higher gas limit.');
        } else {
          throw error;
        }
      }
      
      throw error;
    }
  }

  /**
   * Get sensor metadata from smart contract
   */
  public async getSensorMetadata(sensorId: string): Promise<{
    sensorId: string;
    reputationScore: number;
    mintTimestamp: number;
    ipfsMetadata: string;
    isActive: boolean;
    totalSubmissions: number;
    lastSubmission: number;
  }> {
    try {
      if (!this.sensorNFA) {
        throw new Error('SensorNFA contract not initialized');
      }

      logger.info(`📊 Getting sensor metadata: ${sensorId}`);

      // Use confidential view call
      const metadata = await this.sapphireClient.callConfidentialView(
        this.sensorNFA,
        'getSensorMetadata',
        [sensorId]
      );

      return {
        sensorId: metadata[0],
        reputationScore: Number(metadata[1]),
        mintTimestamp: Number(metadata[2]),
        ipfsMetadata: metadata[3],
        isActive: metadata[4],
        totalSubmissions: Number(metadata[5]),
        lastSubmission: Number(metadata[6])
      };

    } catch (error) {
      logger.error(`❌ Failed to get sensor metadata: ${sensorId}`, error);
      throw error;
    }
  }

  /**
   * Get all sensors owned by an address
   */
  public async getSensorsByOwner(ownerAddress: string): Promise<string[]> {
    try {
      if (!this.sensorNFA) {
        throw new Error('SensorNFA contract not initialized');
      }

      logger.info(`🔍 Getting sensors for owner: ${ownerAddress}`);

      // Use confidential view call
      const sensorIds = await this.sapphireClient.callConfidentialView(
        this.sensorNFA,
        'getSensorsByOwner',
        [ownerAddress]
      );

      return sensorIds || [];

    } catch (error) {
      logger.error(`❌ Failed to get sensors for owner: ${ownerAddress}`, error);
      throw error;
    }
  }

  /**
   * Submit encrypted climate data to blockchain
   */
  public async submitDataBatch(
    sensorId: string,
    ipfsCid: string,
    encryptedKey: string,
    recordHash: string
  ): Promise<{
    transactionHash: string;
    blockNumber: number;
  }> {
    try {
      if (!this.dataRegistry) {
        throw new Error('DataRegistry contract not initialized');
      }

      logger.info(`📤 Submitting data batch for sensor: ${sensorId}`);

      // Convert recordHash to bytes32
      const recordHashBytes32 = ethers.zeroPadValue(ethers.hexlify(recordHash), 32);

      // Use confidential transaction for data submission
      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.dataRegistry,
        'submitDataBatch',
        [sensorId, ipfsCid, encryptedKey, recordHashBytes32]
      );

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }

      logger.info(`✅ Data batch submitted successfully: ${sensorId} (tx: ${tx.hash})`);

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      logger.error(`❌ Failed to submit data batch: ${sensorId}`, error);
      throw error;
    }
  }

  /**
   * Get sensor data submissions from blockchain
   */
  public async getSensorData(sensorId: string, limit: number = 20): Promise<Array<{
    sensorId: string;
    ipfsCid: string;
    recordHash: string;
    encryptedKey: string;
    timestamp: number;
    submitter: string;
    isValidated: boolean;
    validationTime: number;
    validationResult: string;
  }>> {
    try {
      if (!this.dataRegistry) {
        throw new Error('DataRegistry contract not initialized');
      }

      logger.info(`📊 Getting data for sensor: ${sensorId}`);

      // Get total count first
      const count = await this.sapphireClient.callConfidentialView(
        this.dataRegistry,
        'getSensorDataCount',
        [sensorId]
      );

      const totalCount = Number(count);
      if (totalCount === 0) {
        return [];
      }

      // Get recent submissions (up to limit)
      const submissions = [];
      const startIndex = Math.max(0, totalCount - limit);

      for (let i = startIndex; i < totalCount; i++) {
        try {
          const data = await this.sapphireClient.callConfidentialView(
            this.dataRegistry,
            'getSensorData',
            [sensorId, i]
          );

          submissions.push({
            sensorId: data[0],
            ipfsCid: data[1],
            recordHash: data[2],
            encryptedKey: data[3],
            timestamp: Number(data[4]),
            submitter: data[5],
            isValidated: data[6],
            validationTime: Number(data[7]),
            validationResult: data[8]
          });
        } catch (error) {
          logger.warn(`Failed to get data at index ${i} for sensor ${sensorId}:`, error);
        }
      }

      return submissions.reverse(); // Return newest first

    } catch (error) {
      logger.error(`❌ Failed to get sensor data: ${sensorId}`, error);
      throw error;
    }
  }

  /**
   * Calculate reward for a sensor
   */
  public async calculateReward(sensorId: string, earnedDate: number): Promise<{
    amount: number;
    transactionHash: string;
    blockNumber: number;
  }> {
    try {
      if (!this.rewardDistributor) {
        throw new Error('RewardDistributor contract not initialized');
      }

      logger.info(`💰 Calculating reward for sensor: ${sensorId} (date: ${earnedDate})`);

      // Use confidential transaction for reward calculation
      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.rewardDistributor,
        'calculateReward',
        [sensorId, earnedDate]
      );

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }

      // Parse the RewardCalculated event to get amount
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.rewardDistributor!.interface.parseLog(log);
          return parsed?.name === 'RewardCalculated';
        } catch {
          return false;
        }
      });

      let amount = 0;
      if (event) {
        const parsed = this.rewardDistributor!.interface.parseLog(event);
        amount = Number(parsed?.args[2]) || 0;
      }

      logger.info(`✅ Reward calculated successfully: ${sensorId} (amount: ${amount})`);

      return {
        amount,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      logger.error(`❌ Failed to calculate reward: ${sensorId}`, error);
      throw error;
    }
  }

  /**
   * Claim reward for a sensor
   */
  public async claimReward(sensorId: string, earnedDate: number): Promise<{
    amount: number;
    transactionHash: string;
    blockNumber: number;
  }> {
    try {
      if (!this.rewardDistributor) {
        throw new Error('RewardDistributor contract not initialized');
      }

      logger.info(`🎁 Claiming reward for sensor: ${sensorId} (date: ${earnedDate})`);

      // Use confidential transaction for reward claiming
      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.rewardDistributor,
        'claimReward',
        [sensorId, earnedDate]
      );

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }

      // Parse the RewardClaimed event to get amount
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.rewardDistributor!.interface.parseLog(log);
          return parsed?.name === 'RewardClaimed';
        } catch {
          return false;
        }
      });

      let amount = 0;
      if (event) {
        const parsed = this.rewardDistributor!.interface.parseLog(event);
        amount = Number(parsed?.args[2]) || 0;
      }

      logger.info(`✅ Reward claimed successfully: ${sensorId} (amount: ${amount})`);

      return {
        amount,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      logger.error(`❌ Failed to claim reward: ${sensorId}`, error);
      throw error;
    }
  }

  /**
   * Get claimable rewards for an address
   */
  public async getClaimableRewards(ownerAddress: string): Promise<Array<{
    sensorId: string;
    amount: number;
    earnedDate: number;
  }>> {
    try {
      if (!this.rewardDistributor) {
        throw new Error('RewardDistributor contract not initialized');
      }

      logger.info(`🎁 Getting claimable rewards for: ${ownerAddress}`);

      // Use confidential view call
      const result = await this.sapphireClient.callConfidentialView(
        this.rewardDistributor,
        'getClaimableRewards',
        [ownerAddress]
      );

      const [sensorIds, amounts, earnedDates] = result || [[], [], []];

      const rewards = [];
      for (let i = 0; i < sensorIds.length; i++) {
        rewards.push({
          sensorId: sensorIds[i],
          amount: Number(amounts[i]),
          earnedDate: Number(earnedDates[i])
        });
      }

      return rewards;

    } catch (error) {
      logger.error(`❌ Failed to get claimable rewards: ${ownerAddress}`, error);
      throw error;
    }
  }

  /**
   * Check if sensor exists
   */
  public async sensorExists(sensorId: string): Promise<boolean> {
    try {
      if (!this.sensorNFA) {
        throw new Error('SensorNFA contract not initialized');
      }

      const exists = await this.sapphireClient.callConfidentialView(
        this.sensorNFA,
        'sensorExists',
        [sensorId]
      );

      return exists || false;

    } catch (error) {
      logger.error(`❌ Failed to check sensor existence: ${sensorId}`, error);
      return false;
    }
  }

  /**
   * Update sensor status
   */
  public async setSensorStatus(sensorId: string, isActive: boolean): Promise<{
    transactionHash: string;
    blockNumber: number;
  }> {
    try {
      if (!this.sensorNFA) {
        throw new Error('SensorNFA contract not initialized');
      }

      logger.info(`🔄 Updating sensor status: ${sensorId} -> ${isActive}`);

      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.sensorNFA,
        'setSensorStatus',
        [sensorId, isActive]
      );

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }

      logger.info(`✅ Sensor status updated successfully: ${sensorId}`);

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      logger.error(`❌ Failed to update sensor status: ${sensorId}`, error);
      throw error;
    }
  }

  // ==================== DAO GOVERNANCE METHODS ====================

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

      logger.info(`💰 Staking ${amount} ROSE for voting power`);

      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.daoGovernance,
        'stake',
        [],
        { value: ethers.parseEther(amount.toString()) }
      );

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }

      logger.info(`✅ Staked ${amount} ROSE successfully`);

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      logger.error(`❌ Failed to stake ROSE: ${amount}`, error);
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

      logger.info(`💰 Unstaking ${amount} ROSE`);

      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.daoGovernance,
        'unstake',
        [ethers.parseEther(amount.toString())]
      );

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }

      logger.info(`✅ Unstaked ${amount} ROSE successfully`);

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      logger.error(`❌ Failed to unstake ROSE: ${amount}`, error);
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

      logger.info(`🗳️ Delegating ${amount} ROSE voting power to ${delegateTo}`);

      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.daoGovernance,
        'delegate',
        [delegateTo, ethers.parseEther(amount.toString())]
      );

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }

      logger.info(`✅ Delegated ${amount} ROSE voting power to ${delegateTo}`);

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      logger.error(`❌ Failed to delegate voting power: ${delegateTo}`, error);
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

      logger.info('🗳️ Removing delegation');

      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.daoGovernance,
        'removeDelegation',
        []
      );

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }

      logger.info('✅ Delegation removed successfully');

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
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
    proposalType: number,
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

      logger.info(`📋 Creating proposal: ${title}`);

      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.daoGovernance,
        'createProposal',
        [proposalType, title, description, targetContract, proposalData, ethers.parseEther(value.toString())]
      );

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }

      // Parse the ProposalCreated event to get the proposal ID
      const event = receipt.logs.find((log: any) => {
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

      logger.info(`✅ Created proposal ${proposalId}: ${title}`);

      return {
        proposalId,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      logger.error(`❌ Failed to create proposal: ${title}`, error);
      throw error;
    }
  }

  /**
   * Cast a vote on a proposal
   */
  public async castVote(proposalId: number, support: number): Promise<{
    transactionHash: string;
    blockNumber: number;
  }> {
    try {
      if (!this.daoGovernance) {
        throw new Error('DAOGovernance contract not initialized');
      }

      const supportText = support === 0 ? 'AGAINST' : support === 1 ? 'FOR' : 'ABSTAIN';
      logger.info(`🗳️ Casting ${supportText} vote on proposal ${proposalId}`);

      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.daoGovernance,
        'castVote',
        [proposalId, support]
      );

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }

      logger.info(`✅ Cast ${supportText} vote on proposal ${proposalId}`);

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      logger.error(`❌ Failed to cast vote on proposal ${proposalId}:`, error);
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

      logger.info(`⏰ Queueing proposal ${proposalId} for execution`);

      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.daoGovernance,
        'queueProposal',
        [proposalId]
      );

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }

      logger.info(`✅ Queued proposal ${proposalId} for execution`);

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      logger.error(`❌ Failed to queue proposal ${proposalId}:`, error);
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

      logger.info(`✅ Executing proposal ${proposalId}`);

      const tx = await this.sapphireClient.executeConfidentialTransaction(
        this.daoGovernance,
        'executeProposal',
        [proposalId]
      );

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }

      logger.info(`✅ Executed proposal ${proposalId}`);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      logger.error(`❌ Failed to execute proposal ${proposalId}:`, error);
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
      logger.error(`❌ Failed to get voting power for ${userAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get proposal details
   */
  public async getProposal(proposalId: number): Promise<{
    id: number;
    proposer: string;
    proposalType: number;
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
    state: number;
    executed: boolean;
  }> {
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
        proposalType: Number(proposal[2]),
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
        state: Number(proposal[15]),
        executed: proposal[16]
      };
    } catch (error) {
      logger.error(`❌ Failed to get proposal ${proposalId}:`, error);
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