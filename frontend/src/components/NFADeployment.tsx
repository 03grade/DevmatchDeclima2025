import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader, ExternalLink, Copy, Shield, Zap, Globe, DollarSign, ArrowLeft, RotateCcw } from 'lucide-react';
import { useWeb3Store } from '../store/web3Store';
import { apiService } from '../services/apiService';

interface NFADeploymentProps {
  sensorSpecs: any;
  configurationData: any;
  deviceId: string;
  qualityScore: number;
}

const NFADeployment: React.FC<NFADeploymentProps> = ({ 
  sensorSpecs, 
  configurationData,
  deviceId, 
  qualityScore 
}) => {
  const navigate = useNavigate();
  const { account } = useWeb3Store();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStep, setDeploymentStep] = useState(0);
  const [deploymentComplete, setDeploymentComplete] = useState(false);
  const [nfaAddress, setNfaAddress] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const deploymentSteps = [
    { name: 'Preparing metadata', duration: 2000 },
    { name: 'Generating sensor ID', duration: 1500 },
    { name: 'Minting sensor NFA', duration: 3000 },
  ];

  useEffect(() => {
    if (isDeploying && deploymentStep < deploymentSteps.length) {
      const timer = setTimeout(() => {
        setDeploymentStep(prev => prev + 1);
      }, deploymentSteps[deploymentStep].duration);

      return () => clearTimeout(timer);
    } else if (isDeploying && deploymentStep === deploymentSteps.length) {
      // Deployment complete
      setDeploymentComplete(true);
    }
  }, [isDeploying, deploymentStep]);

  const startDeployment = async () => {
    if (!account) {
      setError('Wallet not connected. Please connect your wallet first.');
      return;
    }

    setIsDeploying(true);
    setDeploymentStep(0);
    setDeploymentComplete(false);
    setError(null);
    
    try {
      console.log('🔄 Starting real sensor deployment...');
      
      // Step 1: Generate sensor ID
      console.log('📝 Step 1: Generating sensor ID...');
      const sensorIdResponse = await apiService.generateSensorId({
        region: sensorSpecs?.location || 'Unknown',
        sensorType: sensorSpecs?.type || 'temperature'
      });

      if (!sensorIdResponse.success) {
        throw new Error(sensorIdResponse.message || 'Failed to generate sensor ID');
      }

      const sensorId = sensorIdResponse.data.sensorId;
      console.log('✅ Sensor ID generated:', sensorId);

      // Step 2: Prepare metadata for IPFS
      console.log('📝 Step 2: Preparing metadata...');
      const metadata = {
        type: 'climate-sensor',
        name: sensorSpecs?.name || 'Climate Sensor',
        description: sensorSpecs?.description || 'Environmental monitoring sensor',
        location: sensorSpecs?.location || 'Unknown Location',
        capabilities: ['temperature', 'humidity', 'co2'],
        owner: account,
        created: new Date().toISOString(),
        qualityScore: qualityScore,
        confidential: true,
        sapphireWrapped: true
      };

      const ipfsMetadata = JSON.stringify(metadata);
      console.log('✅ Metadata prepared:', metadata);

      // Step 3: Mint sensor on blockchain
      console.log('📝 Step 3: Minting sensor on blockchain...');
      console.log('🔐 Calling mintSensor with:', { sensorId, ipfsMetadata });
      
      const mintResponse = await apiService.mintSensor({
        sensorId: sensorId,
        ipfsMetadata: ipfsMetadata
      });

      if (!mintResponse.success) {
        throw new Error(mintResponse.message || 'Failed to mint sensor');
      }

      console.log('✅ Sensor minted successfully:', mintResponse.data);
      
      setNfaAddress(sensorId);
      setTransactionHash(mintResponse.data.transactionHash || '');
      setContractAddress(mintResponse.data.contractAddress || '');
      setDeploymentComplete(true);

    } catch (error) {
      console.error('❌ Sensor deployment failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to deploy sensor');
      setIsDeploying(false);
    }
  };

  const resetDeployment = () => {
    setIsDeploying(false);
    setDeploymentStep(0);
    setDeploymentComplete(false);
    setNfaAddress('');
    setTransactionHash('');
    setContractAddress('');
    setError(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard:', text);
    });
  };

  const handleViewOnExplorer = () => {
    // In production, this would open the actual blockchain explorer
    window.open(`https://explorer.oasis.io/testnet/sapphire/tx/${transactionHash}`, '_blank');
  };

  const handleManageSensor = () => {
    // Navigate to dashboard and refresh the page to show new sensor
    navigate('/dashboard');
    window.location.reload(); // Force refresh to fetch new sensor data
  };

  if (deploymentComplete) {
    return (
      <div className="space-y-6">
        <div className="tech-panel p-6">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 bg-custom-green rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-12 h-12 text-black" />
            </motion.div>
            
            <h3 className="font-cyber font-bold text-custom-green text-3xl mb-2 cyber-glow">
              SENSOR DEPLOYED SUCCESSFULLY
            </h3>
            <p className="font-tech text-gray-300">
              Your sensor has been minted on Oasis Sapphire
            </p>
          </div>

          {/* Deployment Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="p-4 bg-black border border-gray-700 rounded">
                <h4 className="font-cyber text-custom-green mb-3">CONTRACT</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-tech text-gray-400 text-sm">Address:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-tech text-white text-sm">
                        {contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : 'Loading...'}
                      </span>
                      <button
                        onClick={() => copyToClipboard(contractAddress)}
                        className="text-custom-green hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-tech text-gray-400 text-sm">Token ID:</span>
                    <span className="font-tech text-white text-sm">#{deviceId?.slice(-6) || '000001'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-black border border-gray-700 rounded">
                <h4 className="font-cyber text-custom-green mb-3">TRANSACTION</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-tech text-gray-400 text-sm">Hash:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-tech text-white text-sm">
                        {transactionHash ? `${transactionHash.slice(0, 6)}...${transactionHash.slice(-4)}` : 'Loading...'}
                      </span>
                      <button
                        onClick={() => copyToClipboard(transactionHash)}
                        className="text-custom-green hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-tech text-gray-400 text-sm">Network:</span>
                    <span className="font-tech text-white text-sm">Oasis Sapphire Testnet</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-black border border-gray-700 rounded">
                <h4 className="font-cyber text-custom-green mb-3">SENSOR DETAILS</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-tech text-gray-400">Name:</span>
                    <span className="font-tech text-white">{configurationData?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-tech text-gray-400">Type:</span>
                    <span className="font-tech text-white capitalize">
                      {sensorSpecs?.type?.replace('_', ' ') || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-tech text-gray-400">Quality:</span>
                    <span className="font-tech text-custom-green">{qualityScore}%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-black border border-gray-700 rounded">
                <h4 className="font-cyber text-custom-green mb-3">STATUS</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-custom-green" />
                    <span className="font-tech text-white">Blockchain Deployed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-custom-green" />
                    <span className="font-tech text-white">Ready</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-custom-green" />
                    <span className="font-tech text-white">Earning Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid md:grid-cols-3 gap-4">
            <button 
              onClick={handleViewOnExplorer}
              className="cyber-btn px-4 py-3 font-bold tracking-wider flex items-center justify-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>EXPLORER</span>
            </button>
            
            <button 
              onClick={handleManageSensor}
              className="cyber-btn px-4 py-3 font-bold tracking-wider flex items-center justify-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>DASHBOARD</span>
            </button>

            <button 
              onClick={resetDeployment}
              className="cyber-btn px-4 py-3 font-bold tracking-wider flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>DEPLOY NEW</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isDeploying) {
    return (
      <div className="space-y-6">
        <div className="tech-panel p-6">
          <h3 className="font-cyber font-bold text-custom-green text-xl mb-6 tracking-wide">
            DEPLOYMENT IN PROGRESS
          </h3>

          <div className="space-y-4">
            {deploymentSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-4 border rounded ${
                  index < deploymentStep 
                    ? 'border-custom-green bg-custom-green bg-opacity-10' 
                    : index === deploymentStep
                    ? 'border-yellow-500 bg-yellow-500 bg-opacity-10'
                    : 'border-gray-700 bg-gray-800'
                }`}
              >
                <span className={`font-tech ${
                  index < deploymentStep 
                    ? 'text-white' 
                    : index === deploymentStep
                    ? 'text-yellow-400'
                    : 'text-gray-400'
                }`}>
                  {step.name}
                </span>

                <div className="flex items-center space-x-2">
                  {index < deploymentStep && (
                    <CheckCircle className="w-5 h-5 text-custom-green" />
                  )}
                  {index === deploymentStep && (
                    <Loader className="w-5 h-5 text-yellow-500 animate-spin" />
                  )}
                  {index > deploymentStep && (
                    <div className="w-5 h-5 border-2 border-gray-600 rounded-full"></div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-900 bg-opacity-20 border border-blue-600 rounded">
            <p className="font-tech text-blue-400 text-sm text-center">
              Please wait while your sensor is being deployed to the blockchain...
            </p>
          </div>

          {/* Cancel Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={resetDeployment}
              className="px-6 py-2 bg-gray-700 text-gray-300 font-tech border border-gray-600 hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>CANCEL DEPLOYMENT</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="tech-panel p-6">
        <h3 className="font-cyber font-bold text-custom-green text-xl mb-6 tracking-wide">
          READY FOR DEPLOYMENT
        </h3>

        {/* Deployment Summary */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <h4 className="font-cyber text-white font-bold">SENSOR CONFIGURATION</h4>
            <div className="p-4 bg-black border border-gray-700 rounded">
              <div className="space-y-2 text-sm font-tech text-gray-300">
                <div>Name: <span className="text-white">{configurationData?.name || 'N/A'}</span></div>
                <div>Type: <span className="text-white capitalize">{sensorSpecs?.type?.replace('_', ' ') || 'N/A'}</span></div>
                <div>Unit: <span className="text-white">{configurationData?.unit || 'N/A'}</span></div>
                <div>Location: <span className="text-white">{configurationData?.location || 'N/A'}</span></div>
                {configurationData?.latitude && configurationData?.longitude && (
                  <div>Coordinates: <span className="text-white">{configurationData.latitude}, {configurationData.longitude}</span></div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-cyber text-white font-bold">VALIDATION STATUS</h4>
            <div className="p-4 bg-black border border-gray-700 rounded">
              <div className="space-y-2 text-sm font-tech text-gray-300">
                <div>Device ID: <span className="text-white">{deviceId || 'N/A'}</span></div>
                <div>Quality Score: <span className="text-custom-green">{qualityScore}%</span></div>
                <div>Signal Strength: <span className="text-custom-green">{sensorSpecs?.signal || 0}%</span></div>
                <div>Blockchain: <span className="text-white">Oasis Sapphire</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Deploy Button */}
        <button
          onClick={startDeployment}
          className="w-full h-16 bg-gradient-to-r from-custom-green to-yellow-400 text-black font-cyber font-bold text-xl tracking-wider hover:shadow-lg hover:shadow-custom-green/30 transition-all duration-300 flex items-center justify-center space-x-3"
          style={{
            clipPath: 'polygon(20px 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%)'
          }}
        >
          <Shield className="w-6 h-6" />
          <span>DEPLOY SENSOR TO BLOCKCHAIN</span>
        </button>
      </div>
    </div>
  );
};

export default NFADeployment;
