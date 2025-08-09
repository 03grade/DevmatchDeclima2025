import { useWeb3Store } from '../store/web3Store';
import CryptoJS from 'crypto-js';

// API Response Types
export interface ApiResponse<T = any> {
  success?: boolean;
  status?: string;
  data?: T;
  error?: string;
  message?: string;
  rofl?: {
    available: boolean;
    appId?: string | null;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Error Types
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API Service Configuration
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
};

/**
 * Centralized API Service for D-Climate Frontend
 * Handles wallet signature authentication and API communication
 */
class ApiService {
  private baseUrl: string;
  private timeout: number;
  private retries: number;
  private retryDelay: number;
  private authCache: Map<string, { headers: Record<string, string>; expires: number }> = new Map();
  private authThrottle: Map<string, number> = new Map();
  private readonly AUTH_CACHE_DURATION = 4 * 60 * 1000; // 4 minutes (less than 5 min backend limit)
  private readonly AUTH_THROTTLE_DURATION = 30 * 1000; // 30 seconds between auth requests

  constructor() {
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    this.timeout = 30000;
    this.retries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Generate a deterministic nonce for authentication (matches backend exactly)
   */
  private generateNonce(address: string, timestamp: number): string {
    // Match backend's crypto-based nonce generation using SHA-256
    const data = `${address.toLowerCase()}-${timestamp}`;
    const hash = CryptoJS.SHA256(data);
    return hash.toString().substring(0, 16);
  }

  /**
   * Get authentication headers with caching and throttling
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { account, signMessage } = useWeb3Store.getState();
    
    if (!account) {
      throw new ApiError('Wallet not connected', 401, 'WALLET_NOT_CONNECTED');
    }

    // Check cache first
    const cached = this.authCache.get(account);
    const now = Date.now();
    
    if (cached && cached.expires > now) {
      console.log('🔐 Using cached auth headers for:', account);
      return cached.headers;
    }

    // Check throttle
    const lastAuth = this.authThrottle.get(account);
    if (lastAuth && (now - lastAuth) < this.AUTH_THROTTLE_DURATION) {
      console.log('⏱️ Auth throttled for:', account);
      throw new ApiError('Authentication throttled', 429, 'AUTH_THROTTLED');
    }

    try {
      const timestamp = Date.now();
      const nonce = this.generateNonce(account, timestamp);
      const message = `D-Climate API Access\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
      
      console.log('🔐 Signing message for:', account);
      
      // Check if signMessage function exists
      if (!signMessage || typeof signMessage !== 'function') {
        throw new ApiError('Wallet signature function not available', 401, 'SIGNATURE_NOT_AVAILABLE');
      }
      
      // Sign the message using the wallet
      const signature = await signMessage(message);
      
      if (!signature) {
        throw new ApiError('Failed to sign message', 401, 'SIGNATURE_FAILED');
      }
      
      console.log('✅ Message signed successfully for:', account);
      
      const headers = {
        'Content-Type': 'application/json',
        'x-wallet-address': account,
        'x-wallet-signature': signature,
        'x-wallet-message': message,
        'x-wallet-timestamp': timestamp.toString(),
      };

      // Cache the headers
      this.authCache.set(account, {
        headers,
        expires: now + this.AUTH_CACHE_DURATION
      });

      // Update throttle
      this.authThrottle.set(account, now);
      
      return headers;
    } catch (error) {
      console.error('Failed to generate auth headers for:', account, error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to authenticate wallet', 401, 'AUTH_FAILED');
    }
  }

  /**
   * Clear auth cache for a specific account
   */
  private clearAuthCache(account?: string): void {
    if (account) {
      this.authCache.delete(account);
      this.authThrottle.delete(account);
    } else {
      this.authCache.clear();
      this.authThrottle.clear();
    }
  }

  /**
   * Make authenticated request with proper error handling
   */
  private async makeAuthenticatedRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const headers = await this.getAuthHeaders();
      
      // Merge headers carefully, avoiding duplicates and invalid values
      const mergedHeaders: Record<string, string> = {};
      
      // Start with auth headers
      Object.entries(headers).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          mergedHeaders[key] = value;
        }
      });
      
      // Override with options headers (but avoid duplicate Content-Type)
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          if (value && typeof value === 'string' && key !== 'Content-Type') {
            mergedHeaders[key] = value;
          }
        });
      }
      
      console.log('🔐 Merged headers:', mergedHeaders);
      
      // Create a clean options object without spreading to avoid header conflicts
      const cleanOptions: RequestInit = {
        method: options.method,
        body: options.body,
        signal: options.signal,
        headers: mergedHeaders,
      };
      
      const response = await this.makeRequest<T>(endpoint, cleanOptions);
      
      return response;
    } catch (error) {
      // Clear auth cache on authentication errors
      if (error instanceof ApiError && error.code === 'AUTH_FAILED') {
        const { account } = useWeb3Store.getState();
        if (account) {
          this.clearAuthCache(account);
        }
      }
      
      // Handle throttling
      if (error instanceof ApiError && error.code === 'AUTH_THROTTLED') {
        console.log('⏱️ Authentication throttled, retrying in 30 seconds...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        return this.makeAuthenticatedRequest<T>(endpoint, options);
      }
      
      throw error;
    }
  }

  /**
   * Make a public API request (no authentication required)
   */
  private async makePublicRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    return this.makeRequest<T>(endpoint, config);
  }

  /**
   * Make a request with retry logic and error handling
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    // Handle endpoints that don't need /api prefix (like /health and /rofl/)
    const url = endpoint.startsWith('/health') || endpoint.startsWith('/rofl/')
      ? `${this.baseUrl}${endpoint}`
      : `${this.baseUrl}/api${endpoint}`;
    
    try {
      // Add timeout to the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      console.log(`🌐 Making request to: ${url}`);
      console.log(`📋 Request options:`, {
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body ? 'Body present' : 'No body'
      });
      
      // Validate headers before making the request
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          if (value === undefined || value === null) {
            console.warn(`⚠️ Header ${key} has invalid value:`, value);
          }
        });
      }
      
      // Create a clean fetch options object
      const fetchOptions: RequestInit = {
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
      };
      
      const response = await fetch(url, fetchOptions);
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData.code
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Retry logic for network errors
      if (retryCount < this.retries && this.shouldRetry(error)) {
        console.warn(`API request failed, retrying... (${retryCount + 1}/${this.retries})`);
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.makeRequest<T>(endpoint, options, retryCount + 1);
      }

      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * Check if the error should trigger a retry
   */
  private shouldRetry(error: any): boolean {
    if (error.name === 'AbortError') return false;
    if (error.status >= 400 && error.status < 500) return false;
    return true;
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== PUBLIC ENDPOINTS ====================

  /**
   * Get health status (includes ROFL status)
   */
  async getHealth(): Promise<ApiResponse> {
    try {
      console.log('🔍 Making health check request to:', `${this.baseUrl}/health`);
      const response = await this.makePublicRequest<ApiResponse>('/health');
      console.log('✅ Health check successful:', response);
      return response;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }

  /**
   * Get ROFL app ID
   */
  async getROFLAppId(): Promise<ApiResponse> {
    try {
      console.log('🔍 Getting ROFL app ID...');
      const response = await this.makePublicRequest<ApiResponse>('/rofl/v1/app/id');
      console.log('✅ ROFL app ID retrieved:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to get ROFL app ID:', error);
      throw error;
    }
  }

  /**
   * Generate ROFL key
   */
  async generateROFLKey(keyId: string, kind: 'raw-256' | 'raw-384' | 'ed25519' | 'secp256k1'): Promise<ApiResponse> {
    try {
      console.log(`🔍 Generating ROFL ${kind} key for ${keyId}...`);
      const response = await this.makePublicRequest<ApiResponse>('/rofl/v1/keys/generate', {
        method: 'POST',
        body: JSON.stringify({
          key_id: keyId,
          kind: kind
        })
      });
      console.log('✅ ROFL key generated successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to generate ROFL key:', error);
      throw error;
    }
  }

  /**
   * Submit authenticated transaction via ROFL
   */
  async submitROFLTransaction(txData: any, encrypt: boolean = true): Promise<ApiResponse> {
    try {
      console.log('🔍 Submitting authenticated transaction via ROFL...');
      const response = await this.makePublicRequest<ApiResponse>('/rofl/v1/tx/sign-submit', {
        method: 'POST',
        body: JSON.stringify({
          tx: txData,
          encrypt: encrypt
        })
      });
      console.log('✅ ROFL transaction submitted successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to submit ROFL transaction:', error);
      throw error;
    }
  }

  /**
   * Get public explorer data
   */
  async getPublicExplorer(params?: {
    country?: string;
    state?: string;
    city?: string;
    timeRange?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.country) queryParams.append('country', params.country);
      if (params?.state) queryParams.append('state', params.state);
      if (params?.city) queryParams.append('city', params.city);
      if (params?.timeRange) queryParams.append('timeRange', params.timeRange);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);

      const endpoint = `/data/public/explorer${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🔍 Fetching public explorer data from:', endpoint);
      
      // Use makePublicRequest for public endpoints (no authentication required)
      const response = await this.makePublicRequest<ApiResponse>(endpoint);
      console.log('✅ Public explorer response:', response);
      
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch public explorer data:', error);
      throw error;
    }
  }

  // ==================== AUTHENTICATED ENDPOINTS ====================

  /**
   * Get user's sensors
   */
  async getUserSensors(address: string): Promise<ApiResponse> {
    try {
      console.log(`🔍 Fetching sensors for address: ${address}`);
      const response = await this.makeAuthenticatedRequest<ApiResponse>(`/sensors/owner/${address}`);
      console.log('✅ Sensors response:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch user sensors:', error);
      throw error;
    }
  }

  /**
   * Generate sensor ID
   */
  async generateSensorId(data: {
    region: string;
    sensorType: string;
  }): Promise<ApiResponse> {
    return this.makeAuthenticatedRequest<ApiResponse>('/sensors/generate-id', {
      method: 'POST',
      body: JSON.stringify({
        metadata: {
          sensorType: data.sensorType,
          location: data.region,
          description: `Climate sensor in ${data.region}`
        }
      }),
    });
  }

  /**
   * Mint sensor NFA
   */
  async mintSensor(data: {
    sensorId: string;
    ipfsMetadata: string;
  }): Promise<ApiResponse> {
    return this.makeAuthenticatedRequest<ApiResponse>('/sensors/mint', {
      method: 'POST',
      body: JSON.stringify({
        metadata: {
          sensorType: 'climate',
          location: 'Confidential Location',
          description: 'Climate sensor with confidential metadata'
        },
        ipfsMetadata: data.ipfsMetadata
      }),
    });
  }

  /**
   * Submit climate data
   */
  async submitClimateData(data: {
    sensorId: string;
    timestamp: number;
    co2: number;
    temperature: number;
    humidity: number;
  }): Promise<ApiResponse> {
    return this.makeAuthenticatedRequest<ApiResponse>('/data/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get sensor data
   */
  async getSensorData(sensorId: string, limit = 20): Promise<ApiResponse> {
    return this.makeAuthenticatedRequest<ApiResponse>(`/data/${sensorId}?limit=${limit}`);
  }

  /**
   * Get reward history
   */
  async getRewardHistory(sensorId: string): Promise<ApiResponse> {
    return this.makeAuthenticatedRequest<ApiResponse>(`/rewards/sensor/${sensorId}`);
  }

  /**
   * Get claimable rewards
   */
  async getClaimableRewards(address: string): Promise<ApiResponse> {
    return this.makeAuthenticatedRequest<ApiResponse>(`/rewards/claimable/${address}`);
  }

  /**
   * Claim rewards
   */
  async claimRewards(data: {
    sensorId: string;
    earnedDate: number;
  }): Promise<ApiResponse> {
    return this.makeAuthenticatedRequest<ApiResponse>('/rewards/claim', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==================== DAO GOVERNANCE ENDPOINTS ====================

  /**
   * Stake ROSE tokens
   */
  async stakeROSE(amount: number): Promise<ApiResponse> {
    return this.makeAuthenticatedRequest<ApiResponse>('/governance/stake', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  /**
   * Unstake ROSE tokens
   */
  async unstakeROSE(amount: number): Promise<ApiResponse> {
    return this.makeAuthenticatedRequest<ApiResponse>('/governance/unstake', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  /**
   * Delegate tokens
   */
  async delegateTokens(data: {
    delegateTo: string;
    amount: number;
  }): Promise<ApiResponse> {
    return this.makeAuthenticatedRequest<ApiResponse>('/governance/delegate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get proposals
   */
  async getProposals(): Promise<ApiResponse> {
    return this.makeAuthenticatedRequest<ApiResponse>('/governance/proposals');
  }

  /**
   * Create proposal
   */
  async createProposal(data: {
    proposalType: number;
    title: string;
    description: string;
    targetContract: string;
    proposalData: string;
    value: number;
  }): Promise<ApiResponse> {
    return this.makeAuthenticatedRequest<ApiResponse>('/governance/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Vote on proposal
   */
  async voteOnProposal(proposalId: string, support: number): Promise<ApiResponse> {
    return this.makeAuthenticatedRequest<ApiResponse>(`/governance/proposals/${proposalId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ support }),
    });
  }

  /**
   * Get voting power
   */
  async getVotingPower(address: string): Promise<ApiResponse> {
    return this.makeAuthenticatedRequest<ApiResponse>(`/governance/voting-power/${address}`);
  }

  // ==================== AI INSIGHTS ENDPOINTS ====================

  /**
   * Generate daily overview
   */
  async generateDailyOverview(data: {
    regions: string[];
    timeRange: { start: number; end: number };
  }): Promise<ApiResponse> {
    return this.makeAuthenticatedRequest<ApiResponse>('/ai/summary/daily-overview', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Generate regional snapshot
   */
  async generateRegionalSnapshot(data: {
    region: string;
    timeRange: { start: number; end: number };
  }): Promise<ApiResponse> {
    return this.makePublicRequest<ApiResponse>('/ai/public/summary/regional-snapshot', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get cached summaries
   */
  async getCachedSummaries(): Promise<ApiResponse> {
    return this.makeAuthenticatedRequest<ApiResponse>('/ai/summaries/cached');
  }
}

// Export singleton instance
export const apiService = new ApiService(); 