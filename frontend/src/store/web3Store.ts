import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Oasis Sapphire Testnet Configuration
const OASIS_SAPPHIRE_CONFIG = {
  chainId: '0x5aff', // 23295 in hex
  chainName: 'Sapphire Testnet',
  nativeCurrency: {
    name: 'ROSE',
    symbol: 'ROSE',
    decimals: 18,
  },
  rpcUrls: ['https://testnet.sapphire.oasis.dev'],
  blockExplorerUrls: ['https://explorer.oasis.io/testnet/sapphire'],
};

interface Web3State {
  isConnected: boolean;
  account: string | null;
  balance: string;
  roseBalance: string;
  chainId: string | null;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  updateBalance: () => Promise<void>;
  switchToOasisNetwork: () => Promise<void>;
  initializeConnection: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
}

export const useWeb3Store = create<Web3State>()(
  persist(
    (set, get) => ({
  isConnected: false,
  account: null,
  balance: '0',
  roseBalance: '0',
  chainId: null,
  isLoading: false,
  error: null,

  switchToOasisNetwork: async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    try {
      // Try to switch to Oasis Sapphire network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: OASIS_SAPPHIRE_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [OASIS_SAPPHIRE_CONFIG],
          });
        } catch (addError) {
          throw new Error('Failed to add Oasis Sapphire network');
        }
      } else {
        throw new Error('Failed to switch to Oasis Sapphire network');
      }
    }
  },

  connectWallet: async () => {
    set({ isLoading: true, error: null });
    
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      // Get current chain ID
      const chainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });

      // Check if we're on the correct network
      if (chainId !== OASIS_SAPPHIRE_CONFIG.chainId) {
        // Try to switch to Oasis network
        await get().switchToOasisNetwork();
      }

      // Get balance
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest'],
      });

      // Convert balance from wei to ROSE
      const balanceInRose = parseInt(balance, 16) / Math.pow(10, 18);

      set({
        isConnected: true,
        account: accounts[0],
        balance: balanceInRose.toFixed(4),
        roseBalance: balanceInRose.toFixed(2),
        chainId: OASIS_SAPPHIRE_CONFIG.chainId,
        isLoading: false,
        error: null
      });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          get().disconnectWallet();
        } else {
          set({ account: accounts[0] });
          get().updateBalance();
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId: string) => {
        set({ chainId });
        if (chainId !== OASIS_SAPPHIRE_CONFIG.chainId) {
          set({ 
            error: 'Please switch to Oasis Sapphire Testnet',
            isConnected: false 
          });
        } else {
          set({ error: null, isConnected: true });
          get().updateBalance();
        }
      });

    } catch (error: any) {
      console.error('Wallet connection error:', error);
      set({
        error: error.message || 'Failed to connect wallet',
        isLoading: false,
        isConnected: false
      });
      throw error;
    }
  },

  disconnectWallet: () => {
    // Remove event listeners
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
    }

    set({
      isConnected: false,
      account: null,
      balance: '0',
      roseBalance: '0',
      chainId: null,
      error: null
    });
  },

  updateBalance: async () => {
    const { account } = get();
    if (!account || typeof window.ethereum === 'undefined') return;

    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [account, 'latest'],
      });

      const balanceInRose = parseInt(balance, 16) / Math.pow(10, 18);
      
      set({ 
        balance: balanceInRose.toFixed(4),
        roseBalance: balanceInRose.toFixed(2)
      });
    } catch (error) {
      console.error('Failed to update balance:', error);
    }
  },

  initializeConnection: async () => {
    if (typeof window.ethereum === 'undefined') return;
    
    try {
      // Check if wallet was previously connected
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        const account = accounts[0];
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        set({
          isConnected: true,
          account,
          chainId,
          error: null
        });
        
        // Update balance
        get().updateBalance();
      }
    } catch (error) {
      console.error('Failed to initialize connection:', error);
      set({ error: 'Failed to initialize wallet connection' });
    }
  },

  signMessage: async (message: string) => {
    const { account } = get();
    if (!account || typeof window.ethereum === 'undefined') {
      throw new Error('Wallet not connected');
    }

    try {
      // MetaMask expects the message as a string, not hex
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account],
      });

      return signature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw new Error('Failed to sign message');
    }
  }
}),
    {
      name: 'web3-storage',
      partialize: (state) => ({
        isConnected: state.isConnected,
        account: state.account,
        chainId: state.chainId,
        balance: state.balance,
        roseBalance: state.roseBalance
      })
    }
  )
);

// Add type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (data: any) => void) => void;
      removeAllListeners: (event: string) => void;
      isMetaMask?: boolean;
    };
  }
}
