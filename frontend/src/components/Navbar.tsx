import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Menu, 
  X, 
  Globe, 
  Wallet, 
  ChevronDown,
  LogOut,
  Copy,
  ExternalLink,
  Shield,
  Vote
} from 'lucide-react';
import { useWeb3Store } from '../store/web3Store';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { 
    isConnected, 
    account, 
    roseBalance, 
    connectWallet, 
    disconnectWallet, 
    isLoading 
  } = useWeb3Store();

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWalletDropdown(false);
      }
    };

    if (showWalletDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWalletDropdown]);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Explore', href: '/explore' },
		{ name: 'Sensors', href:'/sensor-setup'},
    { name: 'Analytics', href: '/analytics' },
    { name: 'DAO', href: '/dao' }, 
  ];

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setShowWalletDropdown(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openExplorer = () => {
    if (account) {
      window.open(`https://explorer.oasis.io/testnet/sapphire/address/${account}`, '_blank');
      setShowWalletDropdown(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowWalletDropdown(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-custom-gradient rounded-lg flex items-center justify-center cyber-glow">
              <Globe className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-cyber font-bold holo-text">
              DECLIMA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`font-tech transition-colors ${
                  location.pathname === item.href
                    ? 'text-custom-green'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Wallet Connection */}
          <div className="hidden md:flex items-center space-x-4">
            {!isConnected ? (
              <button
                onClick={handleConnectWallet}
                disabled={isLoading}
                className="cyber-btn-primary flex items-center space-x-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                <span>{isLoading ? 'CONNECTING...' : 'CONNECT WALLET'}</span>
              </button>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                  className="cyber-btn-secondary flex items-center space-x-2"
                >
                  <div className="w-2 h-2 bg-custom-green rounded-full"></div>
                  <span className="font-mono">{formatAddress(account!)}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showWalletDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-64 tech-panel p-4 space-y-3"
                  >
                    {/* Balance */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-tech text-gray-400">Balance</span>
                      <span className="font-mono text-custom-green">{roseBalance} ROSE</span>
                    </div>

                    {/* Network */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-tech text-gray-400">Network</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-custom-green rounded-full"></div>
                        <span className="text-sm font-tech text-white">Sapphire</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-700 pt-3 space-y-2">
                      <button
                        onClick={copyAddress}
                        className="w-full flex items-center space-x-2 text-sm font-tech text-gray-300 hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy Address</span>
                      </button>

                      <button
                        onClick={openExplorer}
                        className="w-full flex items-center space-x-2 text-sm font-tech text-gray-300 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View on Explorer</span>
                      </button>

                      <button
                        onClick={handleDisconnect}
                        className="w-full flex items-center space-x-2 text-sm font-tech text-red-400 hover:text-red-300 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-black/95 backdrop-blur-md border-t border-gray-800"
        >
          <div className="px-4 py-4 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`block font-tech transition-colors ${
                  location.pathname === item.href
                    ? 'text-custom-green'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}

            <div className="pt-4 border-t border-gray-700">
              {!isConnected ? (
                <button
                  onClick={handleConnectWallet}
                  disabled={isLoading}
                  className="cyber-btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Wallet className="w-4 h-4" />
                  )}
                  <span>{isLoading ? 'CONNECTING...' : 'CONNECT WALLET'}</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-tech text-gray-400">Connected</span>
                    <span className="font-mono text-custom-green">{formatAddress(account!)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-tech text-gray-400">Balance</span>
                    <span className="font-mono text-custom-green">{roseBalance} ROSE</span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="cyber-btn-secondary w-full flex items-center justify-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>DISCONNECT</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
