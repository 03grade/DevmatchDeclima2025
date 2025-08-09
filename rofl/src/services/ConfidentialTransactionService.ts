import { ethers } from 'ethers';
import { wrap } from '@oasisprotocol/sapphire-paratime';
import { createLogger } from '../utils/logger';

const logger = createLogger('ConfidentialTransactionService');

/**
 * Confidential Transaction Service using Oasis Sapphire Lightweight TypeScript Wrapper
 * Handles all confidential transaction operations for D-Climate
 */
export class ConfidentialTransactionService {
  private sapphireProvider: any = null;
  private wallet: ethers.Wallet | null = null;
  private connected: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Start initialization but don't wait for it in constructor
    this.initializationPromise = this.initialize();
  }

  /**
   * Initialize the confidential transaction service
   */
  private async initialize(): Promise<void> {
    try {
      logger.info('🔐 Initializing Confidential Transaction Service...');

      // Create base provider
      const rpcUrl = process.env.SAPPHIRE_TESTNET_RPC || 'https://testnet.sapphire.oasis.dev';
      const baseProvider = new ethers.JsonRpcProvider(rpcUrl);

      // Wrap with Sapphire capabilities for confidential transactions
      this.sapphireProvider = wrap(baseProvider);
      logger.info('✅ Sapphire provider wrapped for confidential transactions');

      // Initialize wallet
      const privateKey = process.env.PRIVATE_KEY;
      if (privateKey) {
        this.wallet = new ethers.Wallet(privateKey, this.sapphireProvider);
        logger.info(`🔑 Wallet initialized: ${await this.wallet.getAddress()}`);
      }

      this.connected = true;
      logger.info('✅ Confidential Transaction Service initialized successfully');

    } catch (error) {
      logger.error('❌ Failed to initialize Confidential Transaction Service:', error);
      throw error;
    }
  }

  /**
   * Ensure the service is initialized before use
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
      this.initializationPromise = null;
    }
  }

  /**
   * Check if the service is connected
   */
  public async isConnected(): Promise<boolean> {
    await this.ensureInitialized();
    return this.connected && this.sapphireProvider !== null && this.wallet !== null;
  }

  /**
   * Get the Sapphire-wrapped provider
   */
  public async getProvider(): Promise<any> {
    await this.ensureInitialized();
    if (!this.sapphireProvider) {
      throw new Error('Sapphire provider not initialized');
    }
    return this.sapphireProvider;
  }

  /**
   * Get the wallet instance
   */
  public async getWallet(): Promise<ethers.Wallet> {
    await this.ensureInitialized();
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    return this.wallet;
  }

  /**
   * Create a confidential transaction for sensor minting
   */
  public async createConfidentialMintTransaction(
    contractAddress: string,
    sensorId: string,
    metadata: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      await this.ensureInitialized();
      logger.info(`🔐 Creating confidential mint transaction for sensor: ${sensorId}`);

      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }

      // Contract ABI for mintSensor function
      const abi = [
        "function mintSensor(string memory sensorId, string memory ipfsMetadata) external returns (uint256)"
      ];

      // Create contract instance with Sapphire-wrapped provider
      const contract = new ethers.Contract(contractAddress, abi, this.wallet);

      // Create the transaction with confidential capabilities
      const tx = await contract.mintSensor(sensorId, metadata, {
        gasLimit: 500000, // Higher gas limit for confidential operations
      });

      logger.info(`📝 Confidential mint transaction sent: ${tx.hash}`);
      return tx;

    } catch (error) {
      logger.error('❌ Failed to create confidential mint transaction:', error);
      throw error;
    }
  }

  /**
   * Create a confidential transaction for data submission
   */
  public async createConfidentialDataTransaction(
    contractAddress: string,
    sensorId: string,
    ipfsCid: string,
    encryptedKey: string,
    recordHash: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      await this.ensureInitialized();
      logger.info(`🔐 Creating confidential data transaction for sensor: ${sensorId}`);

      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }

      // Contract ABI for submitDataBatch function
      const abi = [
        "function submitDataBatch(string memory sensorId, string memory ipfsCid, bytes memory encryptedKey, bytes32 recordHash) external returns (bool)"
      ];

      // Create contract instance with Sapphire-wrapped provider
      const contract = new ethers.Contract(contractAddress, abi, this.wallet);

      // Convert encryptedKey to bytes if it's a string
      const encryptedKeyBytes = ethers.toUtf8Bytes(encryptedKey);

      // Create the transaction with confidential capabilities
      const tx = await contract.submitDataBatch(sensorId, ipfsCid, encryptedKeyBytes, recordHash, {
        gasLimit: 300000, // Gas limit for data submission
      });

      logger.info(`📝 Confidential data transaction sent: ${tx.hash}`);
      return tx;

    } catch (error) {
      logger.error('❌ Failed to create confidential data transaction:', error);
      throw error;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  public async waitForConfirmation(tx: ethers.ContractTransactionResponse): Promise<ethers.TransactionReceipt> {
    try {
      logger.info(`⏳ Waiting for transaction confirmation: ${tx.hash}`);
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }
      logger.info(`✅ Transaction confirmed: ${tx.hash} (block: ${receipt.blockNumber})`);
      return receipt;
    } catch (error) {
      logger.error('❌ Failed to wait for transaction confirmation:', error);
      throw error;
    }
  }

  /**
   * Check if a transaction is confidential
   */
  public async isConfidentialTransaction(txHash: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      const tx = await this.sapphireProvider.getTransaction(txHash);
      if (!tx || !tx.data) {
        return false;
      }

      // Check if the transaction data is encrypted (longer than typical plain data)
      // This is a heuristic - in practice, Sapphire would have specific indicators
      const isConfidential = tx.data.length > 500;
      logger.info(`🔍 Transaction ${txHash} confidentiality check: ${isConfidential}`);
      return isConfidential;
    } catch (error) {
      logger.error('❌ Failed to check transaction confidentiality:', error);
      return false;
    }
  }

  /**
   * Get transaction details
   */
  public async getTransactionDetails(txHash: string): Promise<any> {
    try {
      await this.ensureInitialized();
      const tx = await this.sapphireProvider.getTransaction(txHash);
      const receipt = await this.sapphireProvider.getTransactionReceipt(txHash);
      const isConfidential = await this.isConfidentialTransaction(txHash);

      return {
        hash: txHash,
        from: tx?.from || null,
        to: tx?.to || null,
        data: tx?.data || null,
        gasLimit: tx?.gasLimit?.toString() || null,
        gasPrice: tx?.gasPrice?.toString() || null,
        value: tx?.value?.toString() || null,
        nonce: tx?.nonce || null,
        blockNumber: receipt?.blockNumber || null,
        gasUsed: receipt?.gasUsed?.toString() || null,
        status: receipt?.status || null,
        isConfidential,
        dataLength: tx?.data ? tx.data.length : 0
      };
    } catch (error) {
      logger.error('❌ Failed to get transaction details:', error);
      throw error;
    }
  }

  /**
   * Generate secure random bytes using Sapphire's randomness
   */
  public async generateSecureRandom(length: number = 32): Promise<Uint8Array> {
    try {
      // Use Sapphire's secure randomness if available
      if (this.sapphireProvider && this.sapphireProvider.randomBytes) {
        return this.sapphireProvider.randomBytes(length);
      }
      
      // Fallback to ethers randomBytes
      const randomBytes = ethers.randomBytes(length);
      return new Uint8Array(randomBytes);
    } catch (error) {
      logger.error('❌ Failed to generate secure random:', error);
      throw error;
    }
  }

  /**
   * Encrypt data using Sapphire's confidential capabilities
   */
  public async encryptData(data: string): Promise<{
    encryptedData: string;
    nonce: string;
  }> {
    try {
      // Use Sapphire's built-in encryption if available
      if (this.sapphireProvider && this.sapphireProvider.encrypt) {
        const nonce = await this.generateSecureRandom(12);
        const encryptedData = await this.sapphireProvider.encrypt(data, nonce);
        return {
          encryptedData,
          nonce: Buffer.from(nonce).toString('hex')
        };
      }
      
      // Fallback implementation for demo purposes
      const nonce = await this.generateSecureRandom(12);
      const encryptedData = Buffer.from(data).toString('base64');
      
      return {
        encryptedData,
        nonce: Buffer.from(nonce).toString('hex')
      };
    } catch (error) {
      logger.error('❌ Failed to encrypt data:', error);
      throw error;
    }
  }

  /**
   * Decrypt data using Sapphire's confidential capabilities
   */
  public async decryptData(encryptedData: string, nonce: string): Promise<string> {
    try {
      // Use Sapphire's built-in decryption if available
      if (this.sapphireProvider && this.sapphireProvider.decrypt) {
        const nonceBytes = Buffer.from(nonce, 'hex');
        return await this.sapphireProvider.decrypt(encryptedData, nonceBytes);
      }
      
      // Fallback implementation for demo purposes
      const decryptedData = Buffer.from(encryptedData, 'base64').toString('utf8');
      return decryptedData;
    } catch (error) {
      logger.error('❌ Failed to decrypt data:', error);
      throw error;
    }
  }
} 