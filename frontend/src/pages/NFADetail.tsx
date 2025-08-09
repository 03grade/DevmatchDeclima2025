import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  Download,
  Star,
  Globe,
  Thermometer,
  Droplets,
  Wind,
  Zap,
  User,
  Clock,
  BarChart3,
  RefreshCw,
  Activity,
  Filter,
  FileText,
  Database
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { dataService, SensorReading } from '../services/dataService';
import { apiService } from '../services/apiService';
import AIInsights from '../components/AIInsights';

interface NFADetails {
  sensorId: string;
  sensorName: string;
  location: string;
  country: string;
  continent: string;
  sensorType: 'CO2' | 'TEMP' | 'HUMIDITY' | 'AIR_QUALITY';
  owner: string;
  startTime: string;
  reputationScore: number;
  roseEarned: number;
  isActive: boolean;
  description: string;
}

interface DownloadFilter {
  startDate: string;
  endDate: string;
  format: 'csv' | 'json';
}

// Helper function to generate mock NFADetails
const getMockNFADetails = (sensorId: string): NFADetails => ({
  sensorId: sensorId || 'NFA-001',
  sensorName: 'Singapore CBD Air Monitor',
  location: 'Marina Bay, Singapore CBD',
  country: 'Singapore',
  continent: 'Asia',
  sensorType: 'AIR_QUALITY',
  owner: '0x742d35Cc6634C0532925a3b8D5c0B7c7C8F6D4E8',
  startTime: '2023-06-15T08:00:00Z',
  reputationScore: 4.8,
  roseEarned: 2847.5,
  isActive: true,
  description: 'High-precision air quality monitoring station deployed in Singapore\'s central business district. Tracks PM2.5, PM10, NO2, and AQI with real-time data submission every 15 minutes.'
});

const NFADetail: React.FC = () => {
  const { sensorId } = useParams<{ sensorId: string }>();
  const [nfaDetails, setNfaDetails] = useState<NFADetails | null>(null);
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [downloadLoading, setDownloadLoading] = useState(false);
  
  // Download filter state
  const [downloadFilter, setDownloadFilter] = useState<DownloadFilter>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    endDate: new Date().toISOString().split('T')[0], // today
    format: 'csv'
  });

  // Real-time data fetching
  useEffect(() => {
    const fetchSensorDetails = async () => {
      if (!sensorId) return;

      // Check if we already have details for this sensor
      if (nfaDetails && nfaDetails.sensorId === sensorId) {
        console.log('📊 Using existing sensor details for:', sensorId);
        setLoading(false);
        return;
      }

      try {
        // Try to get real sensor details from backend (only once, not during real-time updates)
        const response = await apiService.getSensorData(sensorId, 1);
        
        if (response.success && response.data && response.data.length > 0) {
          // Transform backend data to match our interface
          const sensorInfo = response.data[0] || {};
          const mockNFADetails: NFADetails = {
            sensorId: sensorId,
            sensorName: sensorInfo.name || `Sensor ${sensorId}`,
            location: sensorInfo.location || 'Unknown Location',
            country: sensorInfo.country || 'Unknown',
            continent: sensorInfo.continent || 'Unknown',
            sensorType: sensorInfo.type || 'AIR_QUALITY',
            owner: sensorInfo.owner || '0x742d35Cc6634C0532925a3b8D5c0B7c7C8F6D4E8',
            startTime: sensorInfo.startTime || '2023-06-15T08:00:00Z',
            reputationScore: sensorInfo.reputationScore || 4.8,
            roseEarned: sensorInfo.roseEarned || 2847.5,
            isActive: sensorInfo.isActive !== false,
            description: sensorInfo.description || 'High-precision environmental monitoring station with real-time data submission every 15 minutes.'
          };
          setNfaDetails(mockNFADetails);
        } else {
          // Fallback to mock data
          setNfaDetails(getMockNFADetails(sensorId));
        }
      } catch (error) {
        console.error('Failed to fetch sensor details:', error);
        // Fallback to mock data
        setNfaDetails(getMockNFADetails(sensorId));
      } finally {
        setLoading(false);
      }
    };

    fetchSensorDetails();
  }, [sensorId]); // Only depend on sensorId, not nfaDetails

  // Fetch real-time sensor data based on time filter
  useEffect(() => {
    const fetchSensorData = async () => {
      if (!sensorId) return;
      
      setDataLoading(true);
      
      try {
        // Use the dataService which handles caching and avoids repeated API calls
        const data = await dataService.getSensorData(sensorId, timeFilter);
        setSensorData(data);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Failed to fetch sensor data:', error);
        // Fallback to mock data
        const mockData = dataService.generateMockReadings(sensorId, timeFilter);
        setSensorData(mockData);
      } finally {
        setDataLoading(false);
      }
    };

    // Only fetch data if we have sensor details and haven't already fetched
    if (nfaDetails && sensorId) {
      fetchSensorData();
    }
  }, [sensorId, timeFilter]); // Remove nfaDetails dependency to avoid repeated calls

  // Start real-time data updates
  useEffect(() => {
    if (!sensorId || !nfaDetails) return;

    console.log('🚀 Starting real-time data updates for sensor:', sensorId);

    // Start real-time data generation (this only uses mock data, no API calls)
    dataService.startRealTimeData(sensorId, (newReading) => {
      setSensorData(prev => {
        const updated = [...prev, newReading];
        // Keep only the data points relevant to current time filter
        const cutoffTime = new Date();
        switch (timeFilter) {
          case '1h':
            cutoffTime.setHours(cutoffTime.getHours() - 1);
            break;
          case '6h':
            cutoffTime.setHours(cutoffTime.getHours() - 6);
            break;
          case '24h':
            cutoffTime.setHours(cutoffTime.getHours() - 24);
            break;
          case '7d':
            cutoffTime.setDate(cutoffTime.getDate() - 7);
            break;
          case '30d':
            cutoffTime.setDate(cutoffTime.getDate() - 30);
            break;
        }
        
        const filtered = updated.filter(reading => new Date(reading.timestamp) >= cutoffTime);
        return filtered;
      });
      
      setLastUpdate(new Date());
    });

    // Cleanup function
    return () => {
      console.log('🛑 Stopping real-time data updates for sensor:', sensorId);
      dataService.stopRealTimeData(sensorId);
    };
  }, [sensorId, nfaDetails, timeFilter]); // Keep dependencies to restart when they change

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'CO2': return <Wind className="w-6 h-6" />;
      case 'TEMP': return <Thermometer className="w-6 h-6" />;
      case 'HUMIDITY': return <Droplets className="w-6 h-6" />;
      case 'AIR_QUALITY': return <Zap className="w-6 h-6" />;
      default: return <Globe className="w-6 h-6" />;
    }
  };

  const getSensorColor = (type: string) => {
    switch (type) {
      case 'CO2': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'TEMP': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'HUMIDITY': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'AIR_QUALITY': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getSensorUnit = (type: string) => {
    switch (type) {
      case 'CO2': return 'ppm';
      case 'TEMP': return '°C';
      case 'HUMIDITY': return '%';
      case 'AIR_QUALITY': return 'μg/m³';
      default: return '';
    }
  };

  const getReputationStars = (score: number) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < fullStars 
                ? 'text-yellow-400 fill-current' 
                : i === fullStars && hasHalfStar
                ? 'text-yellow-400 fill-current opacity-50'
                : 'text-gray-600'
            }`}
          />
        ))}
        <span className="text-lg text-gray-300 ml-2 font-medium">{score.toFixed(1)}</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    switch (timeFilter) {
      case '1h':
      case '6h':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case '24h':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case '7d':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '30d':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const refreshData = () => {
    setDataLoading(true);
    // Trigger data refresh
    setTimeout(() => {
      setDataLoading(false);
      setLastUpdate(new Date());
    }, 500);
  };

  const handleDownload = async () => {
    if (!nfaDetails) return;
    
    setDownloadLoading(true);
    
    try {
      // Simulate API call to get filtered data
      const startDate = new Date(downloadFilter.startDate);
      const endDate = new Date(downloadFilter.endDate);
      endDate.setHours(23, 59, 59, 999); // Include full end date
      
      // Generate mock data for the date range
      const mockData = generateFilteredData(startDate, endDate);
      
      // Create download content
      let content: string;
      let filename: string;
      let mimeType: string;
      
      if (downloadFilter.format === 'csv') {
        const headers = ['timestamp', 'value', 'quality'];
        
        const csvRows = [
          headers.join(','),
          ...mockData.map(reading => {
            const row = [
              reading.timestamp,
              reading.value,
              reading.quality
            ];
            return row.join(',');
          })
        ];
        
        content = csvRows.join('\n');
        filename = `${nfaDetails.sensorId}_${downloadFilter.startDate}_to_${downloadFilter.endDate}.csv`;
        mimeType = 'text/csv';
      } else {
        const jsonData = {
          sensorId: nfaDetails.sensorId,
          sensorName: nfaDetails.sensorName,
          sensorType: nfaDetails.sensorType,
          unit: getSensorUnit(nfaDetails.sensorType),
          dateRange: {
            start: downloadFilter.startDate,
            end: downloadFilter.endDate
          },
          dataPoints: mockData.length,
          data: mockData.map(reading => ({
            timestamp: reading.timestamp,
            value: reading.value,
            quality: reading.quality
          }))
        };
        
        content = JSON.stringify(jsonData, null, 2);
        filename = `${nfaDetails.sensorId}_${downloadFilter.startDate}_to_${downloadFilter.endDate}.json`;
        mimeType = 'application/json';
      }
      
      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloadLoading(false);
    }
  };

  const generateFilteredData = (startDate: Date, endDate: Date): SensorReading[] => {
    const data: SensorReading[] = [];
    const current = new Date(startDate);
    const intervalMinutes = 15; // 15-minute intervals
    
    while (current <= endDate) {
      const baseValue = 45;
      const variation = Math.sin(current.getTime() / 1000000) * 15 + Math.random() * 10 - 5;
      const value = Math.max(10, baseValue + variation);
      const quality = Math.max(70, 100 - (value - 25) * 2 + Math.random() * 10);
      
      data.push({
        timestamp: current.toISOString(),
        value: Math.round(value * 10) / 10,
        quality: Math.round(quality * 10) / 10
      });
      
      current.setMinutes(current.getMinutes() + intervalMinutes);
    }
    
    return data;
  };

  const getEstimatedDataPoints = () => {
    const startDate = new Date(downloadFilter.startDate);
    const endDate = new Date(downloadFilter.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * 96; // 96 data points per day (15-minute intervals)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-custom-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-custom-green font-cyber">Loading sensor details...</p>
        </div>
      </div>
    );
  }

  if (!nfaDetails) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-400 mb-2">Sensor not found</h2>
          <p className="text-gray-500 mb-4">The requested sensor ID could not be found.</p>
          <Link
            to="/explore"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-custom-green text-black rounded-lg hover:bg-custom-green/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Explorer</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentValue = sensorData.length > 0 ? sensorData[sensorData.length - 1].value : 0;
  const currentQuality = sensorData.length > 0 ? sensorData[sensorData.length - 1].quality : 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-custom-green/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4 mb-6">
            <Link
              to="/explore"
              className="flex items-center space-x-2 text-gray-400 hover:text-custom-green transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Explorer</span>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-start lg:justify-between"
          >
            <div className="flex items-start space-x-4 mb-6 lg:mb-0">
              <div className={`p-3 rounded-xl border ${getSensorColor(nfaDetails.sensorType)}`}>
                {getSensorIcon(nfaDetails.sensorType)}
              </div>
              <div>
                <h1 className="text-3xl font-cyber text-custom-green mb-2">
                  {nfaDetails.sensorName}
                </h1>
                <div className="flex items-center space-x-4 text-gray-300 mb-2">
                  <span className="font-mono text-custom-yellow">{nfaDetails.sensorId}</span>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{nfaDetails.location}</span>
                  </div>
                  {nfaDetails.isActive && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-custom-green rounded-full animate-pulse"></div>
                      <span className="text-custom-green text-sm">LIVE</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-400 max-w-2xl">{nfaDetails.description}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="mb-4">
                {getReputationStars(nfaDetails.reputationScore)}
              </div>
              <div className="text-2xl font-bold text-custom-yellow mb-1">
                {nfaDetails.roseEarned.toLocaleString()} ROSE
              </div>
              <div className="text-sm text-gray-400">Total Earned</div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Reading & Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900 border border-gray-700 rounded-lg p-6"
          >
            <div className="flex items-center space-x-3 mb-3">
              <Activity className="w-5 h-5 text-custom-green" />
              <span className="text-gray-400">Current Reading</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {currentValue} {getSensorUnit(nfaDetails.sensorType)}
            </div>
            <div className="text-sm text-gray-400">
              Quality: {currentQuality.toFixed(1)}%
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900 border border-gray-700 rounded-lg p-6"
          >
            <div className="flex items-center space-x-3 mb-3">
              <User className="w-5 h-5 text-custom-green" />
              <span className="text-gray-400">Owner</span>
            </div>
            <div className="font-mono text-sm text-white break-all">
              {nfaDetails.owner}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900 border border-gray-700 rounded-lg p-6"
          >
            <div className="flex items-center space-x-3 mb-3">
              <Clock className="w-5 h-5 text-custom-green" />
              <span className="text-gray-400">Start Time</span>
            </div>
            <div className="text-white">
              {formatDate(nfaDetails.startTime)}
            </div>
          </motion.div>
        </div>

        {/* Real-time Data Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <BarChart3 className="w-6 h-6 text-custom-green" />
              <h2 className="text-xl font-semibold text-white">Real-time Data Stream</h2>
              {dataLoading && (
                <RefreshCw className="w-4 h-4 text-custom-green animate-spin" />
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                Last update: {lastUpdate.toLocaleTimeString()}
              </div>
              <button
                onClick={refreshData}
                className="p-2 bg-gray-800 border border-gray-600 rounded-lg hover:border-custom-green transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4 text-gray-400 hover:text-custom-green" />
              </button>
            </div>
          </div>

          {/* Time Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { value: '1h', label: '1 Hour' },
              { value: '6h', label: '6 Hours' },
              { value: '24h', label: '24 Hours' },
              { value: '7d', label: '7 Days' },
              { value: '30d', label: '30 Days' }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setTimeFilter(filter.value as any)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  timeFilter === filter.value
                    ? 'bg-custom-green text-black border-custom-green'
                    : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-custom-green'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Data Visualization Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sensorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={formatTimestamp}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #68F757',
                    borderRadius: '8px',
                    color: '#FFFFFF'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: number, name: string) => [
                    `${value} ${getSensorUnit(nfaDetails.sensorType)}`, 
                    name === 'value' ? 'Reading' : 'Quality'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#68F757" 
                  fill="#68F757" 
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="quality" 
                  stroke="#FFFF00" 
                  strokeWidth={1}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-custom-green rounded-full"></div>
                <span className="text-gray-400">Sensor Reading ({getSensorUnit(nfaDetails.sensorType)})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-custom-yellow rounded-full"></div>
                <span className="text-gray-400">Data Quality (%)</span>
              </div>
            </div>
            <div className="text-gray-400">
              {sensorData.length} data points
            </div>
          </div>
        </motion.div>

        {/* AI Insights Section */}
        <AIInsights 
          sensorData={sensorData}
          sensorType={nfaDetails?.sensorType || 'AIR_QUALITY'}
          location={nfaDetails?.location || 'Unknown Location'}
        />

        {/* Download Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-900 border border-gray-700 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Download className="w-6 h-6 text-custom-green" />
              <h2 className="text-xl font-semibold text-white">Download Historical Data</h2>
            </div>
            <div className="text-sm text-gray-400">
              Export sensor data with custom filters
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Filter Controls */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <Filter className="w-5 h-5 text-custom-yellow" />
                <h3 className="text-lg font-medium text-white">Filter Options</h3>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={downloadFilter.startDate}
                    onChange={(e) => setDownloadFilter(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-custom-green focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={downloadFilter.endDate}
                    onChange={(e) => setDownloadFilter(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-custom-green focus:outline-none"
                  />
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Export Format
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="csv"
                      checked={downloadFilter.format === 'csv'}
                      onChange={(e) => setDownloadFilter(prev => ({ ...prev, format: e.target.value as 'csv' | 'json' }))}
                      className="text-custom-green focus:ring-custom-green"
                    />
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">CSV</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="json"
                      checked={downloadFilter.format === 'json'}
                      onChange={(e) => setDownloadFilter(prev => ({ ...prev, format: e.target.value as 'csv' | 'json' }))}
                      className="text-custom-green focus:ring-custom-green"
                    />
                    <Database className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">JSON</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Preview & Download */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <BarChart3 className="w-5 h-5 text-custom-yellow" />
                <h3 className="text-lg font-medium text-white">Download Preview</h3>
              </div>

              {/* Data Summary */}
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Date Range:</span>
                    <div className="text-white font-medium">
                      {new Date(downloadFilter.startDate).toLocaleDateString()} - {new Date(downloadFilter.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Format:</span>
                    <div className="text-white font-medium uppercase">
                      {downloadFilter.format}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Est. Data Points:</span>
                    <div className="text-white font-medium">
                      {getEstimatedDataPoints().toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Quality Scores:</span>
                    <div className="text-white font-medium">
                      Included
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Data Preview */}
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Sample Data Structure:</h4>
                <div className="bg-black rounded p-3 font-mono text-xs text-gray-300 overflow-x-auto">
                  {downloadFilter.format === 'csv' ? (
                    <pre>
timestamp,value,quality
2024-01-15T10:00:00Z,42.3,94.2
2024-01-15T10:15:00Z,43.1,92.8
...
                    </pre>
                  ) : (
                    <pre>
{`{
  "sensorId": "${nfaDetails.sensorId}",
  "data": [
    {
      "timestamp": "2024-01-15T10:00:00Z",
      "value": 42.3,
      "quality": 94.2
    }
  ]
}`}
                    </pre>
                  )}
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={downloadLoading}
                className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-custom-green text-black rounded-lg hover:bg-custom-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {downloadLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Preparing Download...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download Data ({downloadFilter.format.toUpperCase()})</span>
                  </>
                )}
              </button>

              <div className="text-xs text-gray-500 text-center">
                Data is exported in UTC timezone. Large date ranges may take longer to process.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NFADetail;
