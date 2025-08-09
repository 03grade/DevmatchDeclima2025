import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  BarChart3, 
  Coins,
  Award,
  CheckCircle,
  Globe,
  Zap
} from 'lucide-react';
import { useWeb3Store } from '../store/web3Store';
import { apiService } from '../services/apiService';

interface SensorStats {
  id: string;
  name: string;
  type: string;
  sensorType?: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  dataPoints: number;
  downloads: number;
  views: number;
  lastUpdate: string;
  qualityScore: number;
}

interface RewardData {
  sensorId: string;
  earnedDate: number;
  amount: number;
  claimed: boolean;
  claimableAfter?: number;
  calculation?: any;
}

const Dashboard: React.FC = () => {
  const { isConnected, account } = useWeb3Store();
  const [sensorStats, setSensorStats] = useState<SensorStats[]>([]);
  const [rewardData, setRewardData] = useState<RewardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimingRewards, setClaimingRewards] = useState(false);

  // Mock data for development - 2 sensors with detailed information
  const mockSensors: SensorStats[] = [
    {
      id: 'MP_001',
      name: 'Climate Sensor Alpha',
      type: 'climate',
      sensorType: 'Temperature & Humidity',
      location: 'Singapore',
      status: 'online',
      dataPoints: 1247,
      downloads: 156,
      views: 892,
      lastUpdate: new Date(Date.now() - 15000).toISOString(), // 15 seconds ago
      qualityScore: 95
    },
    {
      id: 'MP_002',
      name: 'Environmental Monitor Beta',
      type: 'climate',
      sensorType: 'CO2 & Air Quality',
      location: 'Kuala Lumpur',
      status: 'online',
      dataPoints: 892,
      downloads: 98,
      views: 567,
      lastUpdate: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
      qualityScore: 88
    }
  ];

  // Use the new API hook for user sensors
  // const { data: sensorsData, loading: sensorsLoading, error: sensorsError, refetch: refetchSensors } = useUserSensors(account || undefined);

  // Fetch user's sensors from backend
  useEffect(() => {
    console.log('🔄 Dashboard useEffect triggered, account:', account, 'isConnected:', isConnected);
    
    const fetchUserSensors = async () => {
      if (!account || !isConnected) {
        console.log('❌ No account connected or wallet not connected, using mock data');
        setSensorStats(mockSensors);
        return;
      }
      
      // Prevent multiple simultaneous requests
      if (loading) {
        console.log('⚠️  Already loading, skipping duplicate request');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log(`🔄 Fetching sensors for account: ${account}`);
        
        const response = await apiService.getUserSensors(account);
        console.log('📊 API response:', response);
        
        if (response.success && response.data) {
          // Transform backend data to match our interface
          const transformedSensors = (response.data.sensors || []).map((device: any) => ({
            id: device.sensorId || device.id,
            name: device.name || `Sensor ${device.sensorId || device.id}`,
            type: device.type || 'climate',
            sensorType: device.sensorType || device.type,
            location: device.location || 'Unknown',
            status: device.isActive ? 'online' : 'offline',
            dataPoints: device.totalSubmissions || 0,
            downloads: Math.floor(Math.random() * 500) + 50, // Mock downloads for now
            views: Math.floor(Math.random() * 1000) + 100, // Mock views for now
            lastUpdate: device.lastSubmission ? new Date(device.lastSubmission * 1000).toISOString() : new Date().toISOString(),
            qualityScore: device.reputationScore || 85
          }));
          
          setSensorStats(transformedSensors);
          console.log(`✅ Found ${transformedSensors.length} sensors`);
        } else {
          console.error('❌ API response not successful:', response);
          setError(response.message || 'Failed to fetch sensors');
          // Fallback to mock data
          setSensorStats(mockSensors);
        }
      } catch (error) {
        console.error('❌ Failed to fetch user sensors:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch sensors');
        // Fallback to mock data
        setSensorStats(mockSensors);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSensors();
  }, [account, isConnected]); // Only depend on account and isConnected

  // Fetch rewards data
  useEffect(() => {
    const fetchRewards = async () => {
      if (!account) return;

      try {
        console.log('💰 Fetching rewards for account:', account);
        
        // Get claimable rewards
        const claimableResponse = await apiService.getClaimableRewards(account);
        
        if (claimableResponse.success && claimableResponse.data) {
          const rewards = claimableResponse.data.rewards || [];
          setRewardData(rewards);
          console.log(`✅ Found ${rewards.length} claimable rewards`);
        }

        // Get reward history for each sensor
        const allRewards: RewardData[] = [];
        for (const sensor of sensorStats) {
          try {
            const historyResponse = await apiService.getRewardHistory(sensor.id);
            if (historyResponse.success && historyResponse.data) {
              const history = historyResponse.data.rewards || [];
              allRewards.push(...history);
            }
          } catch (error) {
            console.warn(`Failed to fetch reward history for sensor ${sensor.id}:`, error);
          }
        }
        
        setRewardData(prev => [...prev, ...allRewards]);

      } catch (error) {
        console.error('❌ Failed to fetch rewards:', error);
      }
    };

    if (account && sensorStats.length > 0) {
      fetchRewards();
    }
  }, [account, sensorStats]);

  // Force refresh for wallet connection timing
  useEffect(() => {
    if (account && isConnected) {
      console.log('💫 Wallet fully connected, forcing sensor refresh in 1 second...');
      const timer = setTimeout(async () => {
        try {
          const response = await apiService.getUserSensors(account);
          if (response.success && response.data) {
            console.log('🔄 Force refresh - found sensors:', response.data.sensors?.length || 0);
            
            const transformedSensors = (response.data.sensors || []).map((device: any) => ({
              id: device.sensorId || device.id,
              name: device.name || `Sensor ${device.sensorId || device.id}`,
              type: device.type || 'climate',
              sensorType: device.sensorType || device.type,
              location: device.location || 'Unknown',
              status: device.isActive ? 'online' : 'offline',
              dataPoints: device.totalSubmissions || 0,
              downloads: Math.floor(Math.random() * 500) + 50,
              views: Math.floor(Math.random() * 1000) + 100,
              lastUpdate: device.lastSubmission ? new Date(device.lastSubmission * 1000).toISOString() : new Date().toISOString(),
              qualityScore: device.reputationScore || 85
            }));
            
            setSensorStats(transformedSensors);
          }
        } catch (error) {
          console.error('❌ Force refresh failed:', error);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [account, isConnected]);

  const totalDataPoints = sensorStats.reduce((sum, sensor) => sum + sensor.dataPoints, 0);
  const totalDownloads = sensorStats.reduce((sum, sensor) => sum + sensor.downloads, 0);
  const totalViews = sensorStats.reduce((sum, sensor) => sum + sensor.views, 0);
  const activeSensors = sensorStats.filter(s => s.status === 'online').length;
  const totalRewards = rewardData.reduce((sum, reward) => sum + reward.amount, 0);
  const claimableRewards = rewardData.filter(reward => !reward.claimed && (!reward.claimableAfter || Date.now() >= reward.claimableAfter));

  // Claim rewards function
  const claimRewards = async () => {
    if (!account || claimableRewards.length === 0) return;

    setClaimingRewards(true);
    try {
      console.log('🎯 Claiming rewards for account:', account);
      
      const claims = claimableRewards.map(reward => ({
        sensorId: reward.sensorId,
        earnedDate: reward.earnedDate
      }));

      const response = await apiService.claimRewards({
        sensorId: claims[0].sensorId,
        earnedDate: claims[0].earnedDate
      });

      if (response.success) {
        console.log('✅ Rewards claimed successfully:', response.data);
        // Refresh rewards data
        const claimableResponse = await apiService.getClaimableRewards(account);
        if (claimableResponse.success && claimableResponse.data) {
          setRewardData(claimableResponse.data.rewards || []);
        }
      } else {
        setError(response.message || 'Failed to claim rewards');
      }
    } catch (error) {
      console.error('❌ Failed to claim rewards:', error);
      setError(error instanceof Error ? error.message : 'Failed to claim rewards');
    } finally {
      setClaimingRewards(false);
    }
  };

  const getStatusDot = (status: string) => {
    const color = status === 'online' ? 'bg-custom-green' : status === 'maintenance' ? 'bg-custom-yellow' : 'bg-red-400';
    return <div className={`w-2 h-2 rounded-full ${color} animate-pulse`} />;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-custom-green mx-auto mb-4" />
            <h1 className="text-3xl font-cyber font-bold text-custom-green mb-4">
              CONNECT WALLET
            </h1>
            <p className="text-gray-300 font-tech">
              Please connect your wallet to view your dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-4xl font-cyber font-bold text-custom-green">
              DASHBOARD
            </h1>
            <p className="text-gray-300 font-tech">
              Monitor your climate sensors and earn ROSE rewards
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="tech-panel p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 font-tech text-sm">ACTIVE SENSORS</p>
                <p className="text-3xl font-cyber font-bold text-custom-green">{activeSensors}</p>
              </div>
              <Activity className="w-8 h-8 text-custom-green" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="tech-panel p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 font-tech text-sm">TOTAL DATA POINTS</p>
                <p className="text-3xl font-cyber font-bold text-custom-green">{totalDataPoints.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-custom-green" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="tech-panel p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 font-tech text-sm">TOTAL REWARDS</p>
                <p className="text-3xl font-cyber font-bold text-custom-green">{totalRewards.toFixed(2)} ROSE</p>
              </div>
              <Coins className="w-8 h-8 text-custom-green" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="tech-panel p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 font-tech text-sm">CLAIMABLE REWARDS</p>
                <p className="text-3xl font-cyber font-bold text-custom-green">
                  {claimableRewards.reduce((sum, reward) => sum + reward.amount, 0).toFixed(2)} ROSE
                </p>
              </div>
              <Award className="w-8 h-8 text-custom-green" />
            </div>
          </motion.div>
        </div>

        {/* Rewards Section */}
        {claimableRewards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="tech-panel p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-cyber font-bold text-custom-green">
                🎯 CLAIMABLE REWARDS
              </h2>
              <button
                onClick={claimRewards}
                disabled={claimingRewards}
                className={`cyber-btn-primary flex items-center space-x-2 ${claimingRewards ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {claimingRewards ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>CLAIMING...</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4" />
                    <span>CLAIM REWARDS</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {claimableRewards.slice(0, 6).map((reward, index) => (
                <div key={index} className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-custom-green border-opacity-30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-tech text-sm text-gray-300">Sensor {reward.sensorId.slice(-8)}</span>
                    <CheckCircle className="w-4 h-4 text-custom-green" />
                  </div>
                  <p className="text-xl font-cyber font-bold text-custom-green">
                    {reward.amount.toFixed(2)} ROSE
                  </p>
                  <p className="font-tech text-xs text-gray-400">
                    Earned: {new Date(reward.earnedDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Sensors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="tech-panel p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-700 rounded mb-4"></div>
                <div className="h-6 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded"></div>
              </motion.div>
            ))
          ) : sensorStats.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-cyber font-bold text-gray-400 mb-2">
                NO SENSORS FOUND
              </h3>
              <p className="text-gray-500 font-tech">
                {error || 'No sensors found for this wallet address'}
              </p>
            </div>
          ) : (
            sensorStats.map((sensor, index) => (
              <motion.div
                key={sensor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="tech-panel p-6 hover:bg-gray-800 bg-opacity-50 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusDot(sensor.status)}
                    <div>
                      <h3 className="font-cyber font-bold text-white">{sensor.name}</h3>
                      <p className="font-tech text-sm text-gray-400">{sensor.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-tech text-sm text-gray-400">QUALITY SCORE</p>
                    <p className="font-cyber font-bold text-custom-green">{sensor.qualityScore}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-tech text-xs text-gray-400">DATA POINTS</p>
                    <p className="font-cyber font-bold text-white">{sensor.dataPoints.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-tech text-xs text-gray-400">LAST UPDATE</p>
                    <p className="font-tech text-xs text-gray-300">
                      {new Date(sensor.lastUpdate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="font-tech text-xs text-gray-400">{sensor.type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-custom-yellow" />
                    <span className="font-tech text-xs text-custom-yellow">
                      {sensor.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
