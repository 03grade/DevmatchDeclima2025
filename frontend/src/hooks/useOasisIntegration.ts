import { useEffect, useState } from 'react';
import { useOasisStore } from '../store/oasisStore';
import { useWeb3Store } from '../store/web3Store';

export const useOasisIntegration = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    isConnectedToSapphire, 
    isInitializing, 
    initializeSapphire 
  } = useOasisStore();
  
  const { isConnected } = useWeb3Store();

  // Initialize Oasis integration when wallet is connected
  useEffect(() => {
    const initialize = async () => {
      if (isConnected && !isConnectedToSapphire && !isInitializing) {
        try {
          setError(null);
          await initializeSapphire();
          setIsReady(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to initialize Oasis');
          setIsReady(false);
        }
      }
    };

    initialize();
  }, [isConnected, isConnectedToSapphire, isInitializing, initializeSapphire]);

  // Update ready state based on connection status
  useEffect(() => {
    setIsReady(isConnected && isConnectedToSapphire);
  }, [isConnected, isConnectedToSapphire]);

  return {
    isReady,
    isInitializing,
    error,
    isConnectedToSapphire
  };
};
