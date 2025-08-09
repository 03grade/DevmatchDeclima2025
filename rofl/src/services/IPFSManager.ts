import { createLogger } from '../utils/logger';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const logger = createLogger('IPFSManager');

/**
 * IPFS Storage Result
 */
export interface IPFSUploadResult {
  cid: string;
  size: number;
  uploadedAt: number;
  gateway: string;
}

/**
 * IPFS Manager for D-Climate data storage
 * Uses local file storage as IPFS alternative for development/hackathon
 * Can be easily swapped with actual IPFS when ready
 */
export class IPFSManager {
  private connected: boolean = false;
  private storagePath: string;
  private gatewayUrl: string;
  private uploadedFiles: Map<string, IPFSUploadResult> = new Map();

  constructor() {
    this.storagePath = process.env.IPFS_STORAGE_PATH || './data/ipfs-storage';
    this.gatewayUrl = process.env.IPFS_GATEWAY_URL || 'http://localhost:3001/api/ipfs';
  }

  /**
   * Initialize IPFS Manager
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('📦 Initializing IPFS Manager...');

      // Create storage directory if it doesn't exist
      await this.ensureStorageDirectory();

      // Load existing file index
      await this.loadFileIndex();

      this.connected = true;
      logger.info('✅ IPFS Manager initialized successfully');
      logger.info(`📁 Storage path: ${this.storagePath}`);

    } catch (error) {
      logger.error('❌ Failed to initialize IPFS Manager:', error);
      throw error;
    }
  }

  /**
   * Check if IPFS manager is connected
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Upload encrypted data to IPFS (simulated with local storage)
   */
  public async uploadEncryptedData(
    encryptedContent: string,
    metadata: {
      sensorId: string;
      timestamp: number;
      encryptedKey: string;
      nonce: string;
      tag: string;
      algorithm: string;
    }
  ): Promise<IPFSUploadResult> {
    try {
      logger.info(`📤 Uploading encrypted data for sensor: ${metadata.sensorId}`);

      if (!this.connected) {
        throw new Error('IPFS Manager not initialized');
      }

      // Create data package
      const dataPackage = {
        encryptedContent,
        metadata: {
          ...metadata,
          uploadedAt: Date.now(),
          version: '1.0'
        }
      };

      // Generate CID (Content Identifier) - simplified version
      const cid = this.generateCID(dataPackage);

      // Store data locally (simulating IPFS)
      const filePath = path.join(this.storagePath, `${cid}.json`);
      await fs.writeFile(filePath, JSON.stringify(dataPackage, null, 2));

      // Create upload result
      const result: IPFSUploadResult = {
        cid,
        size: Buffer.byteLength(JSON.stringify(dataPackage)),
        uploadedAt: Date.now(),
        gateway: `${this.gatewayUrl}/${cid}`
      };

      // Cache the result
      this.uploadedFiles.set(cid, result);

      // Update file index
      await this.updateFileIndex();

      logger.info(`✅ Data uploaded successfully - CID: ${cid}`);
      return result;

    } catch (error) {
      logger.error('❌ Failed to upload encrypted data:', error);
      throw new Error(`IPFS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve encrypted data from IPFS
   */
  public async retrieveEncryptedData(cid: string): Promise<{
    encryptedContent: string;
    metadata: any;
  } | null> {
    try {
      logger.info(`📥 Retrieving data with CID: ${cid}`);

      if (!this.connected) {
        throw new Error('IPFS Manager not initialized');
      }

      // Check if file exists locally
      const filePath = path.join(this.storagePath, `${cid}.json`);
      
      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const dataPackage = JSON.parse(fileContent);

        logger.info(`✅ Data retrieved successfully - CID: ${cid}`);
        return {
          encryptedContent: dataPackage.encryptedContent,
          metadata: dataPackage.metadata
        };

      } catch (fileError) {
        logger.warn(`📭 File not found locally for CID: ${cid}`);
        return null;
      }

    } catch (error) {
      logger.error(`❌ Failed to retrieve data for CID ${cid}:`, error);
      throw error;
    }
  }

  /**
   * Check if data exists in IPFS
   */
  public async dataExists(cid: string): Promise<boolean> {
    try {
      const filePath = path.join(this.storagePath, `${cid}.json`);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Upload JSON data directly
   */
  public async uploadJSON(data: any, filename?: string): Promise<IPFSUploadResult> {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const cid = this.generateCID(data);
      
      const filePath = path.join(this.storagePath, `${filename || cid}.json`);
      await fs.writeFile(filePath, jsonString);

      const result: IPFSUploadResult = {
        cid,
        size: Buffer.byteLength(jsonString),
        uploadedAt: Date.now(),
        gateway: `${this.gatewayUrl}/${cid}`
      };

      this.uploadedFiles.set(cid, result);
      await this.updateFileIndex();

      logger.info(`✅ JSON uploaded - CID: ${cid}`);
      return result;

    } catch (error) {
      logger.error('❌ Failed to upload JSON:', error);
      throw error;
    }
  }

  /**
   * Retrieve JSON data
   */
  public async retrieveJSON(cid: string): Promise<any | null> {
    try {
      const filePath = path.join(this.storagePath, `${cid}.json`);
      const fileContent = await fs.readFile(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch {
      return null;
    }
  }

  /**
   * Upload batch of data
   */
  public async uploadBatch(
    dataArray: Array<{
      content: any;
      metadata?: any;
    }>
  ): Promise<IPFSUploadResult[]> {
    logger.info(`📦 Uploading batch of ${dataArray.length} items`);

    const results: IPFSUploadResult[] = [];

    for (const { content, metadata } of dataArray) {
      try {
        let result: IPFSUploadResult;

        if (metadata && 'encryptedKey' in metadata) {
          // This is encrypted climate data
          result = await this.uploadEncryptedData(content, metadata);
        } else {
          // Regular JSON data
          result = await this.uploadJSON(content);
        }

        results.push(result);
      } catch (error) {
        logger.error('Failed to upload item in batch:', error);
        // Continue with other items
      }
    }

    logger.info(`✅ Batch upload complete: ${results.length}/${dataArray.length} successful`);
    return results;
  }

  /**
   * Get storage statistics
   */
  public async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    storagePath: string;
    connected: boolean;
    oldestFile?: Date;
    newestFile?: Date;
  }> {
    try {
      const files = await fs.readdir(this.storagePath);
      let totalSize = 0;
      let oldestTime = Date.now();
      let newestTime = 0;

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.storagePath, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
          
          const mtime = stats.mtime.getTime();
          if (mtime < oldestTime) oldestTime = mtime;
          if (mtime > newestTime) newestTime = mtime;
        }
      }

      return {
        totalFiles: files.filter(f => f.endsWith('.json')).length,
        totalSize,
        storagePath: this.storagePath,
        connected: this.connected,
        oldestFile: oldestTime < Date.now() ? new Date(oldestTime) : undefined,
        newestFile: newestTime > 0 ? new Date(newestTime) : undefined
      };

    } catch (error) {
      logger.error('❌ Failed to get storage stats:', error);
      throw error;
    }
  }

  /**
   * List all stored files
   */
  public async listFiles(limit: number = 100): Promise<Array<{
    cid: string;
    size: number;
    uploadedAt: number;
    gateway: string;
  }>> {
    const files = Array.from(this.uploadedFiles.values())
      .sort((a, b) => b.uploadedAt - a.uploadedAt)
      .slice(0, limit);

    return files;
  }

  /**
   * Delete file by CID
   */
  public async deleteFile(cid: string): Promise<boolean> {
    try {
      const filePath = path.join(this.storagePath, `${cid}.json`);
      await fs.unlink(filePath);
      this.uploadedFiles.delete(cid);
      await this.updateFileIndex();
      
      logger.info(`🗑️ File deleted: ${cid}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup old files (older than specified days)
   */
  public async cleanupOldFiles(daysOld: number = 30): Promise<number> {
    try {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      const files = await fs.readdir(this.storagePath);
      let deletedCount = 0;

      for (const file of files) {
        if (file.endsWith('.json') && file !== 'file-index.json') {
          const filePath = path.join(this.storagePath, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime.getTime() < cutoffTime) {
            await fs.unlink(filePath);
            const cid = file.replace('.json', '');
            this.uploadedFiles.delete(cid);
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        await this.updateFileIndex();
        logger.info(`🧹 Cleaned up ${deletedCount} old files`);
      }

      return deletedCount;
    } catch (error) {
      logger.error('❌ Failed to cleanup old files:', error);
      return 0;
    }
  }

  /**
   * Disconnect from IPFS
   */
  public async disconnect(): Promise<void> {
    this.connected = false;
    await this.updateFileIndex();
    logger.info('🔌 IPFS Manager disconnected');
  }

  /**
   * Generate CID (simplified version for local storage)
   */
  private generateCID(data: any): string {
    const content = JSON.stringify(data);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    // Create IPFS-like CID format
    const prefix = 'Qm'; // IPFS v0 CID prefix
    const cidHash = hash.substring(0, 44); // Take first 44 chars
    
    return `${prefix}${cidHash}`;
  }

  /**
   * Ensure storage directory exists
   */
  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
    } catch (error) {
      if ((error as any).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Load file index from disk
   */
  private async loadFileIndex(): Promise<void> {
    try {
      const indexPath = path.join(this.storagePath, 'file-index.json');
      const indexContent = await fs.readFile(indexPath, 'utf8');
      const index = JSON.parse(indexContent);
      
      this.uploadedFiles = new Map(Object.entries(index));
      logger.info(`📇 Loaded ${this.uploadedFiles.size} files from index`);
    } catch {
      logger.info('📇 No existing file index found, starting fresh');
    }
  }

  /**
   * Update file index on disk
   */
  private async updateFileIndex(): Promise<void> {
    try {
      const indexPath = path.join(this.storagePath, 'file-index.json');
      const index = Object.fromEntries(this.uploadedFiles);
      await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
    } catch (error) {
      logger.error('❌ Failed to update file index:', error);
    }
  }
}