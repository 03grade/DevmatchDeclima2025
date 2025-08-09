import { useState, useEffect, useCallback } from 'react';
import { apiService, ApiResponse, ApiError } from '../services/apiService';

// Hook options interface
interface UseApiOptions<T> {
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  requiresAuth?: boolean;
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

// Hook return interface
interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (params?: any) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for authenticated API calls
 */
export function useApi<T = any>(options: UseApiOptions<T> = {}): UseApiReturn<T> {
  const {
    endpoint,
    method = 'GET',
    body,
    requiresAuth = true,
    immediate = false,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async (params?: any) => {
    if (!endpoint) return;

    setLoading(true);
    setError(null);

    try {
      let response: ApiResponse<T>;

      if (requiresAuth) {
        // Use authenticated request
        response = await apiService.makeAuthenticatedRequest<ApiResponse<T>>(endpoint, {
          method,
          body: params ? JSON.stringify(params) : body ? JSON.stringify(body) : undefined,
        });
      } else {
        // Use public request
        response = await apiService.makePublicRequest<ApiResponse<T>>(endpoint, {
          method,
          body: params ? JSON.stringify(params) : body ? JSON.stringify(body) : undefined,
        });
      }

      if (response.success && response.data) {
        setData(response.data);
        onSuccess?.(response.data);
      } else {
        throw new ApiError(response.message || 'API request failed', 0);
      }
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(err instanceof Error ? err.message : 'Unknown error', 0);
      setError(apiError);
      onError?.(apiError);
    } finally {
      setLoading(false);
    }
  }, [endpoint, method, body, requiresAuth, onSuccess, onError]);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  useEffect(() => {
    if (immediate && endpoint) {
      execute();
    }
  }, [immediate, endpoint, execute]);

  return { data, loading, error, execute, refetch };
}

/**
 * Custom hook for public API calls (no authentication required)
 */
export function usePublicApi<T = any>(options: UseApiOptions<T> = {}): UseApiReturn<T> {
  return useApi<T>({ ...options, requiresAuth: false });
}

/**
 * Custom hook for sensor data
 */
export function useSensorData(sensorId?: string, limit = 20) {
  const endpoint = sensorId ? `/data/${sensorId}?limit=${limit}` : undefined;
  return useApi({ endpoint, requiresAuth: true });
}

/**
 * Custom hook for user sensors
 */
export function useUserSensors(address?: string) {
  const endpoint = address ? `/sensors/owner/${address}` : undefined;
  return useApi({ endpoint, requiresAuth: true });
}

/**
 * Custom hook for public explorer data
 */
export function usePublicExplorer(params?: {
  country?: string;
  state?: string;
  city?: string;
  timeRange?: string;
  startDate?: string;
  endDate?: string;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getPublicExplorer(params);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new ApiError(response.message || 'Failed to fetch explorer data', 0);
      }
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(err instanceof Error ? err.message : 'Unknown error', 0);
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [params]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * Custom hook for DAO governance data
 */
export function useDAOData() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getProposals();
      if (response.success && response.data) {
        setProposals(response.data);
      } else {
        throw new ApiError(response.message || 'Failed to fetch proposals', 0);
      }
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(err instanceof Error ? err.message : 'Unknown error', 0);
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    return fetchProposals();
  }, [fetchProposals]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return { proposals, loading, error, refetch };
}

/**
 * Custom hook for AI insights
 */
export function useAIInsights() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getCachedSummaries();
      if (response.success && response.data) {
        setSummaries(response.data);
      } else {
        throw new ApiError(response.message || 'Failed to fetch AI summaries', 0);
      }
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(err instanceof Error ? err.message : 'Unknown error', 0);
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    return fetchSummaries();
  }, [fetchSummaries]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  return { summaries, loading, error, refetch };
} 