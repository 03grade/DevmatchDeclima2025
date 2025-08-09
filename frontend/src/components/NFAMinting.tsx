import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Zap, 
  Coins, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Camera,
  MapPin,
  Database
} from 'lucide-react';
import { useWeb3Store } from '../store/web3Store';

interface SensorMetadata {
  name: string;
  description: string;
  location: string;
  sensorType: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  capabilities: string[];
  imageUrl?: string;
}

interface NFAMintingProps {
  onMintComplete?: (tokenId: string) => void;
}

const NFAMinting: React.FC<NFAMintingProps> = ({ onMintComplete }) => {
  const { isConnected, account, connectWallet } = useWeb3Store();
  const [isMinting, setIsMinting] = useState(false);
  const [mintStep, setMintStep] = useState<'input' | 'uploading' | 'minting' | 'complete'>('input');
  const [mintProgress, setMintProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<string | null>(null);
  
  // Capabilities are automatically assigned by backend based on sensor type
  const defaultCapabilities = ['real-time', 'encrypted', 'batch-processing', 'ipfs-storage', 'sapphire-confidential'];
  
  const [sensorData, setSensorData] = useState<SensorMetadata>({
    name: '',
    description: '',
    location: '',
    sensorType: 'temperature',
    coordinates: {
      latitude: 0,
      longitude: 0
    },
    capabilities: defaultCapabilities,
    imageUrl: ''
  });

  const sensorTypes = [
    { value: 'temperature', label: 'Temperature Sensor', icon: '🌡️' },
    { value: 'humidity', label: 'Humidity Sensor', icon: '💧' },
    { value: 'air-quality', label: 'Air Quality Sensor', icon: '🌬️' },
    { value: 'pressure', label: 'Pressure Sensor', icon: '📊' },
    { value: 'multi-sensor', label: 'Multi-Sensor Array', icon: '🔧' }
  ];

  const handleInputChange = (field: keyof SensorMetadata, value: any) => {
    setSensorData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSensorData(prev => ({
            ...prev,
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Failed to get current location');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser');
    }
  };

  const validateForm = (): boolean => {
    if (!sensorData.name.trim()) {
      setError('Sensor name is required');
      return false;
    }
    if (!sensorData.description.trim()) {
      setError('Sensor description is required');
      return false;
    }
    if (!sensorData.location.trim()) {
      setError('Sensor location is required');
      return false;
    }
    if (sensorData.coordinates.latitude === 0 && sensorData.coordinates.longitude === 0) {
      setError('Please set sensor coordinates');
      return false;
    }
    return true;
  };

  const mintSensorNFA = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsMinting(true);
    setError(null);
    setMintStep('uploading');
    setMintProgress(10);

    try {
      // Step 1: Register sensor with backend (includes ROFL processing)
      setMintProgress(20);
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      
      const sensorRegistration = {
        name: sensorData.name,
        description: sensorData.description,
        location: sensorData.location,
        sensorType: sensorData.sensorType,
        coordinates: sensorData.coordinates,
        owner: account
      };

      const response = await fetch(`${API_BASE_URL}/api/device/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sensorRegistration)
      });

      if (!response.ok) {
        throw new Error('Failed to register sensor');
      }

      const result = await response.json();
      
      setMintProgress(50);
      setMintStep('minting');

      // Step 2: ROFL processing happens automatically in backend
      await new Promise(resolve => setTimeout(resolve, 2000)); // Show processing
      
      setMintProgress(100);
      setMintStep('complete');
      setTokenId(result.sensorId);

      // Call completion callback
      if (onMintComplete) {
        onMintComplete(result.sensorId);
      }

    } catch (error) {
      console.error('Minting failed:', error);
      setError('Failed to mint sensor NFA. Please try again.');
      setMintStep('input');
    } finally {
      setIsMinting(false);
    }
  };

  const resetForm = () => {
    setSensorData({
      name: '',
      description: '',
      location: '',
      sensorType: 'temperature',
      coordinates: {
        latitude: 0,
        longitude: 0
      },
      capabilities: [],
      imageUrl: ''
    });
    setMintStep('input');
    setMintProgress(0);
    setError(null);
    setTokenId(null);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-20 h-20 bg-custom-gradient rounded-full flex items-center justify-center mx-auto cyber-glow">
            <Shield className="w-10 h-10 text-black" />
          </div>
          <div>
            <h2 className="text-2xl font-cyber font-bold text-white mb-2">
              WALLET CONNECTION REQUIRED
            </h2>
            <p className="text-gray-400 font-tech mb-6">
              Connect your wallet to mint sensor NFAs
            </p>
            <button
              onClick={connectWallet}
              className="cyber-btn-primary"
            >
              <Zap className="w-5 h-5 mr-2" />
              CONNECT WALLET
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-cyber font-bold holo-text mb-2">
            MINT SENSOR NFA
          </h1>
          <p className="text-gray-400 font-tech">
            Create your sensor as a Non-Fungible Asset on Oasis Sapphire
          </p>
        </motion.div>

        {mintStep === 'complete' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="tech-panel p-8 text-center"
          >
            <div className="w-20 h-20 bg-custom-green rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-black" />
            </div>
            <h2 className="text-2xl font-cyber font-bold text-custom-green mb-4">
              SENSOR NFA MINTED SUCCESSFULLY!
            </h2>
            <p className="text-gray-400 font-tech mb-6">
              Your sensor is now registered as a Non-Fungible Asset on Oasis Sapphire
            </p>
            <div className="bg-gray-800 p-4 rounded-lg mb-6">
              <p className="text-sm font-tech text-gray-400 mb-2">Token ID</p>
              <p className="font-mono text-custom-green break-all">{tokenId}</p>
            </div>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={resetForm}
                className="cyber-btn-secondary"
              >
                MINT ANOTHER SENSOR
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="cyber-btn-primary"
              >
                GO TO DASHBOARD
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="tech-panel p-6"
            >
              <h2 className="text-xl font-cyber font-bold text-custom-green mb-6 flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>SENSOR METADATA</span>
              </h2>

              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <label className="block text-sm font-tech text-gray-400 mb-2">
                    Sensor Name *
                  </label>
                  <input
                    type="text"
                    value={sensorData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="cyber-input w-full"
                    placeholder="e.g., Downtown Temperature Monitor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-tech text-gray-400 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={sensorData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="cyber-input w-full h-24"
                    placeholder="Describe your sensor's purpose and capabilities..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-tech text-gray-400 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={sensorData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="cyber-input w-full"
                    placeholder="e.g., Singapore CBD, Marina Bay"
                  />
                </div>

                {/* Sensor Type */}
                <div>
                  <label className="block text-sm font-tech text-gray-400 mb-2">
                    Sensor Type *
                  </label>
                  <select
                    value={sensorData.sensorType}
                    onChange={(e) => handleInputChange('sensorType', e.target.value)}
                    className="cyber-input w-full"
                  >
                    {sensorTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Coordinates */}
                <div>
                  <label className="block text-sm font-tech text-gray-400 mb-2">
                    Coordinates
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      step="any"
                      value={sensorData.coordinates.latitude}
                      onChange={(e) => handleInputChange('coordinates', {
                        ...sensorData.coordinates,
                        latitude: parseFloat(e.target.value) || 0
                      })}
                      className="cyber-input"
                      placeholder="Latitude"
                    />
                    <input
                      type="number"
                      step="any"
                      value={sensorData.coordinates.longitude}
                      onChange={(e) => handleInputChange('coordinates', {
                        ...sensorData.coordinates,
                        longitude: parseFloat(e.target.value) || 0
                      })}
                      className="cyber-input"
                      placeholder="Longitude"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="cyber-btn-secondary text-sm mt-2 flex items-center space-x-2"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>USE CURRENT LOCATION</span>
                  </button>
                </div>

                {/* Capabilities - Auto-assigned by backend */}
                <div>
                  <label className="block text-sm font-tech text-gray-400 mb-2">
                    Capabilities (Auto-assigned)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {defaultCapabilities.map(capability => (
                      <div
                        key={capability}
                        className="flex items-center space-x-2 px-3 py-2 bg-custom-green/10 border border-custom-green/30 rounded"
                      >
                        <div className="w-2 h-2 bg-custom-green rounded-full"></div>
                        <span className="text-sm font-tech text-custom-green capitalize">
                          {capability.replace('-', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-tech">
                    All sensors automatically include these Oasis Sapphire features
                  </p>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-tech text-gray-400 mb-2">
                    Sensor Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={sensorData.imageUrl}
                    onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                    className="cyber-input w-full"
                    placeholder="https://example.com/sensor-image.jpg"
                  />
                </div>
              </div>
            </motion.div>

            {/* Preview & Mint Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Preview Card */}
              <div className="tech-panel p-6">
                <h3 className="text-lg font-cyber font-bold text-custom-green mb-4 flex items-center space-x-2">
                  <Camera className="w-5 h-5" />
                  <span>PREVIEW</span>
                </h3>

                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-custom-gradient rounded-lg flex items-center justify-center">
                      <Database className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h4 className="font-tech font-bold text-white">
                        {sensorData.name || 'Sensor Name'}
                      </h4>
                      <p className="text-sm text-gray-400 font-tech">
                        {sensorTypes.find(t => t.value === sensorData.sensorType)?.label || 'Sensor Type'}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-3">
                    {sensorData.description || 'Sensor description will appear here...'}
                  </p>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{sensorData.location || 'Location'}</span>
                  </div>
                </div>

                {/* Capabilities Preview */}
                {sensorData.capabilities.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-tech text-gray-400 mb-2">Capabilities:</p>
                    <div className="flex flex-wrap gap-2">
                      {sensorData.capabilities.map((cap: string) => (
                        <span
                          key={cap}
                          className="px-2 py-1 bg-custom-green/20 text-custom-green text-xs font-tech rounded"
                        >
                          {cap.replace('-', ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mint Progress */}
              {isMinting && (
                <div className="tech-panel p-6">
                  <h3 className="text-lg font-cyber font-bold text-custom-green mb-4 flex items-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>MINTING IN PROGRESS</span>
                  </h3>

                  <div className="space-y-4">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-custom-gradient h-2 rounded-full transition-all duration-300"
                        style={{ width: `${mintProgress}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-sm font-tech text-gray-400">
                      {mintStep === 'uploading' && 'Uploading metadata to IPFS...'}
                      {mintStep === 'minting' && 'Minting NFA on Sapphire...'}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="tech-panel p-4 border border-red-500/50 bg-red-500/10">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-tech">{error}</span>
                  </div>
                </div>
              )}

              {/* Mint Button */}
              <button
                onClick={mintSensorNFA}
                disabled={isMinting}
                className={`w-full cyber-btn-primary ${isMinting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isMinting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    MINTING...
                  </>
                ) : (
                  <>
                    <Coins className="w-5 h-5 mr-2" />
                    MINT SENSOR NFA
                  </>
                )}
              </button>

              <div className="text-center text-sm text-gray-400 font-tech">
                <p>Gas fees will be charged in ROSE tokens</p>
                <p>Estimated cost: ~0.01 ROSE</p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFAMinting;
