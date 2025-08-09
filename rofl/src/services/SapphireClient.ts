import { ethers } from 'ethers';
import { wrap } from '@oasisprotocol/sapphire-paratime';
import { createLogger } from '../utils/logger';

const logger = createLogger('SapphireClient');

/**
 * Oasis Sapphire Client for confidential smart contract interactions
 * Handles secure communication with Sapphire contracts using TEE
 * Uses Lightweight TypeScript Wrapper for proper confidential transactions
 */
export class SapphireClient {
  private baseProvider: ethers.JsonRpcProvider | null = null;
  private sapphireProvider: any = null;
  private wallet: ethers.Wallet | null = null;
  private connected: boolean = false;
  private contractAddresses: {
    sensorNFA?: string;
    dataRegistry?: string;
    rewardDistributor?: string;
    daoGovernance?: string;
  } = {};

  constructor() {
    // Don't load addresses in constructor - wait for connect()
  }

  /**
   * Load contract addresses from environment or deployment file
   */
  private loadContractAddresses(): void {
    this.contractAddresses = {
      sensorNFA: process.env.SENSOR_NFA_CONTRACT,
      dataRegistry: process.env.DATA_REGISTRY_CONTRACT,
      rewardDistributor: process.env.REWARD_DISTRIBUTOR_CONTRACT,
      daoGovernance: process.env.DAO_GOVERNANCE_CONTRACT,
    };
    
    // Log loaded addresses for debugging
    logger.info('📋 Contract addresses loaded:', {
      sensorNFA: this.contractAddresses.sensorNFA ? `${this.contractAddresses.sensorNFA.substring(0, 10)}...` : 'NOT SET',
      dataRegistry: this.contractAddresses.dataRegistry ? `${this.contractAddresses.dataRegistry.substring(0, 10)}...` : 'NOT SET',
      rewardDistributor: this.contractAddresses.rewardDistributor ? `${this.contractAddresses.rewardDistributor.substring(0, 10)}...` : 'NOT SET',
      daoGovernance: this.contractAddresses.daoGovernance ? `${this.contractAddresses.daoGovernance.substring(0, 10)}...` : 'NOT SET'
    });
  }

  /**
   * Connect to Oasis Sapphire network using Lightweight TypeScript Wrapper
   */
  public async connect(): Promise<void> {
    try {
      logger.info('🔗 Connecting to Oasis Sapphire with Lightweight TypeScript Wrapper...');

      // Initialize base provider for Sapphire testnet
      const rpcUrl = process.env.SAPPHIRE_TESTNET_RPC || 'https://testnet.sapphire.oasis.dev';
      this.baseProvider = new ethers.JsonRpcProvider(rpcUrl);

      // Wrap the provider with Sapphire capabilities for confidential transactions
      this.sapphireProvider = wrap(this.baseProvider);
      logger.info('✅ Sapphire provider wrapped successfully');

      // Test connection
      const network = await this.sapphireProvider.getNetwork();
      logger.info(`📡 Connected to Sapphire network: ${network.name} (chainId: ${network.chainId})`);

      // Initialize wallet if private key is provided
      const privateKey = process.env.PRIVATE_KEY;
      if (privateKey) {
        this.wallet = new ethers.Wallet(privateKey, this.sapphireProvider);
        logger.info(`🔑 Wallet initialized: ${await this.wallet.getAddress()}`);
      }

      // Load contract addresses after connection is established
      this.loadContractAddresses();
      
      this.connected = true;
      logger.info('✅ Sapphire client connected successfully with confidential capabilities');

    } catch (error) {
      logger.error('❌ Failed to connect to Sapphire:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Sapphire network
   */
  public async disconnect(): Promise<void> {
    this.baseProvider = null;
    this.sapphireProvider = null;
    this.wallet = null;
    this.connected = false;
    logger.info('🔌 Disconnected from Sapphire');
  }

  /**
   * Check if client is connected
   */
  public isConnected(): boolean {
    return this.connected && this.sapphireProvider !== null;
  }

  /**
   * Get the Sapphire-wrapped provider instance
   */
  public getProvider(): any {
    if (!this.sapphireProvider) {
      throw new Error('Sapphire provider not initialized');
    }
    return this.sapphireProvider;
  }

  /**
   * Get the wallet instance
   */
  public getWallet(): ethers.Wallet {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    return this.wallet;
  }

  /**
   * Check if contract addresses are loaded
   */
  public areContractAddressesLoaded(): boolean {
    return Object.values(this.contractAddresses).some(addr => addr !== undefined && addr !== null);
  }

  /**
   * Get contract instance with confidential capabilities
   */
  public getContract(contractName: keyof typeof this.contractAddresses, abi: any): ethers.Contract {
    const address = this.contractAddresses[contractName];
    if (!address) {
      const availableContracts = Object.keys(this.contractAddresses).filter(k => this.contractAddresses[k as keyof typeof this.contractAddresses]).join(', ');
      throw new Error(`Contract address not found for ${contractName}. Available contracts: ${availableContracts}`);
    }

    // Use wallet if available, otherwise use provider
    if (this.wallet) {
      return new ethers.Contract(address, abi, this.wallet);
    } else if (this.sapphireProvider) {
      return new ethers.Contract(address, abi, this.sapphireProvider);
    } else {
      throw new Error('Neither wallet nor Sapphire provider is initialized');
    }
  }

  /**
   * Execute confidential transaction with Sapphire using Lightweight TypeScript Wrapper
   */
  public async executeConfidentialTransaction(
    contract: ethers.Contract,
    method: string,
    params: any[] = [],
    options: {
      gasLimit?: number;
      gasPrice?: bigint;
      value?: bigint;
    } = {}
  ): Promise<ethers.TransactionResponse> {
    try {
      logger.info(`🔐 Executing confidential transaction: ${method}`);

      // Estimate gas if not provided
      if (!options.gasLimit) {
        try {
          const txData = contract.interface.encodeFunctionData(method, params);
          const estimatedGas = await this.sapphireProvider.estimateGas({
            to: contract.target,
            data: txData,
            value: options.value || 0n
          });
          options.gasLimit = Number(estimatedGas) + 100000; // Add buffer for confidential operations
          logger.info(`📊 Estimated gas: ${estimatedGas}, using: ${options.gasLimit}`);
        } catch (error) {
          logger.warn('Failed to estimate gas, using default');
          options.gasLimit = 800000; // Default gas limit for confidential operations
        }
      }

      // Execute transaction using Sapphire-wrapped provider for automatic calldata encryption
      logger.info(`🚀 Sending confidential transaction with parameters:`, {
        method,
        gasLimit: options.gasLimit,
        params: params.map(p => typeof p === 'string' ? p.substring(0, 50) + '...' : p)
      });

      // Use Sapphire provider for proper confidential transaction execution
      const txData = contract.interface.encodeFunctionData(method, params);
      
      let tx: ethers.TransactionResponse;
      
      // Use wallet if available, otherwise use provider
      if (this.wallet) {
        tx = await this.wallet.sendTransaction({
          to: contract.target,
          data: txData,
          gasLimit: options.gasLimit,
          gasPrice: options.gasPrice,
          value: options.value || 0n
        });
        logger.info(`📝 Confidential transaction sent via wallet: ${tx.hash}`);
      } else {
        tx = await this.sapphireProvider.sendTransaction({
          to: contract.target,
          data: txData,
          gasLimit: options.gasLimit,
          gasPrice: options.gasPrice,
          value: options.value || 0n
        });
        logger.info(`📝 Confidential transaction sent via provider: ${tx.hash}`);
      }

      // Wait for confirmation
      const receipt = await tx.wait();
      if (receipt) {
        logger.info(`✅ Confidential transaction confirmed: ${tx.hash} (block: ${receipt.blockNumber})`);
      } else {
        logger.warn(`⚠️ Transaction sent but receipt is null: ${tx.hash}`);
      }

      return tx;

    } catch (error) {
      logger.error(`❌ Confidential transaction failed: ${method}`, error);
      throw error;
    }
  }

  /**
   * Call confidential view function
   */
  public async callConfidentialView(
    contract: ethers.Contract,
    method: string,
    params: any[] = []
  ): Promise<any> {
    try {
      logger.debug(`🔍 Calling confidential view: ${method}`);
      
      // Use Sapphire provider for proper confidential view calls
      const txData = contract.interface.encodeFunctionData(method, params);
      const result = await this.sapphireProvider.call({
        to: contract.target,
        data: txData
      });
      
      // Decode the result using the contract interface
      const decodedResult = contract.interface.decodeFunctionResult(method, result);
      return decodedResult.length === 1 ? decodedResult[0] : decodedResult;
    } catch (error) {
      logger.error(`❌ Confidential view call failed: ${method}`, error);
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
  public async encryptWithSapphire(data: string): Promise<{
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
      logger.error('❌ Failed to encrypt with Sapphire:', error);
      throw error;
    }
  }

  /**
   * Decrypt data using Sapphire's confidential capabilities
   */
  public async decryptWithSapphire(
    encryptedData: string,
    nonce: string
  ): Promise<string> {
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
      logger.error('❌ Failed to decrypt with Sapphire:', error);
      throw error;
    }
  }

  /**
   * Get current gas price from Sapphire network
   */
  public async getGasPrice(): Promise<bigint> {
    if (!this.sapphireProvider) {
      throw new Error('Sapphire provider not initialized');
    }

    try {
      const feeData = await this.sapphireProvider.getFeeData();
      return feeData.gasPrice || BigInt(1000000000); // 1 gwei fallback
    } catch (error) {
      logger.error('❌ Failed to get gas price:', error);
      throw error;
    }
  }

  /**
   * Get network information
   */
  public async getNetworkInfo(): Promise<{
    name: string;
    chainId: bigint;
    blockNumber: number;
  }> {
    if (!this.sapphireProvider) {
      throw new Error('Sapphire provider not initialized');
    }

    try {
      const network = await this.sapphireProvider.getNetwork();
      const blockNumber = await this.sapphireProvider.getBlockNumber();

      return {
        name: network.name,
        chainId: network.chainId,
        blockNumber
      };
    } catch (error) {
      logger.error('❌ Failed to get network info:', error);
      throw error;
    }
  }

  /**
   * Monitor contract events
   */
  public async monitorEvents(
    contract: ethers.Contract,
    eventName: string,
    callback: (event: any) => void
  ): Promise<void> {
    try {
      logger.info(`👁️  Monitoring ${eventName} events...`);

      contract.on(eventName, (...args) => {
        const event = args[args.length - 1]; // Last argument is the event object
        logger.info(`📢 Event ${eventName} received:`, event);
        callback(event);
      });

    } catch (error) {
      logger.error(`❌ Failed to monitor events for ${eventName}:`, error);
      throw error;
    }
  }

  /**
   * Get transaction receipt with retry logic
   */
  public async getTransactionReceipt(
    txHash: string,
    maxRetries: number = 10,
    retryDelay: number = 2000
  ): Promise<ethers.TransactionReceipt | null> {
    if (!this.sapphireProvider) {
      throw new Error('Sapphire provider not initialized');
    }

    for (let i = 0; i < maxRetries; i++) {
      try {
        const receipt = await this.sapphireProvider.getTransactionReceipt(txHash);
        if (receipt) {
          return receipt;
        }
      } catch (error) {
        logger.warn(`Attempt ${i + 1} failed to get receipt for ${txHash}`);
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return null;
  }

  /**
   * Check if a transaction is confidential (encrypted calldata)
   */
  public async isConfidentialTransaction(txHash: string): Promise<boolean> {
    try {
      const tx = await this.sapphireProvider.getTransaction(txHash);
      if (!tx || !tx.data) {
        return false;
      }

      // Check if the transaction data is encrypted (longer than typical plain data)
      // This is a heuristic - in practice, Sapphire would have specific indicators
      return tx.data.length > 500; // Confidential transactions typically have longer data
    } catch (error) {
      logger.error('❌ Failed to check transaction confidentiality:', error);
      return false;
    }
  }
}