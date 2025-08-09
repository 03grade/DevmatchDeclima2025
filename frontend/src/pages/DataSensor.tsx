import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Download, 
  Share2, 
  Heart,
  Wifi,
  Battery,
  Signal,
  Filter,
  RefreshCw,
  Play,
  Pause,
  BarChart3,
  Brain,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Zap,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DataSensor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sensor, setSensor] = useState<any>(null);
  const [sensorData, setSensorData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Mock sensor data - in real app this would come from API
  const mockSensor = {
    id: 'AIR_QUALITY_SG_001',
    name: 'Urban Air Quality Monitor',
    type: 'Air Quality',
    location: 'Singapore CBD, Marina Bay',
    coordinates: { latitude: 1.2966, longitude: 103.8547 },
    owner: '0x742d35Cc6634C0532925a3b8D5c0B7c7C8F6D4E8',
    pricePerHour: 0.5,
    qualityScore: 94,
    status: 'online',
    lastUpdated: new Date().toISOString(),
    description: 'High-precision air quality monitoring station measuring PM2.5, PM10, AQI, and atmospheric conditions in Singapore\'s central business district.',
    capabilities: ['PM2.5', 'PM10', 'AQI', 'Temperature', 'Humidity', 'CO2'],
    dataPoints: 15847,
    signalStrength: 92,
    batteryLevel: 87
  };

  // Generate mock real-time data
  const generateMockData = (hours: number) => {
    const data = [];
    const now = new Date();
    const interval = hours <= 1 ? 5 : hours <= 6 ? 10 : hours <= 24 ? 15 : 60; // minutes
    const points = Math.floor((hours * 60) / interval);

    for (let i = points; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * interval * 60 * 1000));
      const baseValue = 45; // PM2.5 baseline
      const variation = Math.sin(i * 0.1) * 15 + Math.random() * 10 - 5;
      const value = Math.max(10, baseValue + variation);
      const quality = Math.max(70, 100 - Math.abs(variation) * 2);

      data.push({
        timestamp: timestamp.toISOString(),
        time: timestamp.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        value: Math.round(value * 10) / 10,
        quality: Math.round(quality * 10) / 10
      });
    }
    return data;
  };

  useEffect(() => {
    const loadSensorData = async () => {
      setLoading(true);
      try {
        // In real app, fetch sensor details from API
        setSensor(mockSensor);
        
        // Generate mock data based on time range
        const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
        const data = generateMockData(hours);
        setSensorData(data);
        
      } catch (error) {
        console.error('Failed to load sensor data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSensorData();
  }, [id, timeRange]);

  // Real-time data updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const newDataPoint = {
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        value: Math.round((45 + Math.random() * 20 - 10) * 10) / 10,
        quality: Math.round((85 + Math.random() * 15) * 10) / 10
      };

      setSensorData(prev => [...prev.slice(-100), newDataPoint]);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isLive]);

  const handleExport = () => {
    const csvContent = [
      'Timestamp,Value,Quality',
      ...sensorData.map(d => `${d.timestamp},${d.value},${d.quality}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sensor?.name || 'sensor'}_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white cyber-grid flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-green mx-auto mb-4"></div>
          <p className="font-tech text-custom-green">Loading sensor data...</p>
        </div>
      </div>
    );
  }

  if (!sensor) {
    return (
      <div className="min-h-screen bg-black text-white cyber-grid flex items-center justify-center">
        <div className="text-center">
          <p className="font-tech text-red-400 mb-4">Sensor not found</p>
          <button 
            onClick={() => navigate('/explore')}
            className="cyber-btn"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  const currentValue = sensorData[sensorData.length - 1]?.value || 0;
  const currentQuality = sensorData[sensorData.length - 1]?.quality || 0;

  return (
    <div className="min-h-screen bg-black text-white cyber-grid pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/explore')}
              className="p-2 rounded-lg border border-gray-700 hover:border-custom-green transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-cyber font-bold text-custom-green holo-text">
                {sensor.name}
              </h1>
              <div className="flex items-center space-x-4 mt-2 text-gray-400">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span className="font-tech text-sm">{sensor.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span className="font-tech text-sm">
                    Updated {new Date(sensor.lastUpdated).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="p-2 rounded-lg border border-gray-700 hover:border-custom-green transition-colors">
              <Heart className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg border border-gray-700 hover:border-custom-green transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="cyber-btn px-6 py-2">
              Purchase Data
            </button>
          </div>
        </motion.div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="tech-panel p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-tech text-gray-400 text-sm">Current Reading</span>
              <TrendingUp className="w-4 h-4 text-custom-green" />
            </div>
            <div className="text-2xl font-cyber font-bold text-white">
              {currentValue} <span className="text-sm text-gray-400">μg/m³</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="tech-panel p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-tech text-gray-400 text-sm">Data Quality</span>
              <BarChart3 className="w-4 h-4 text-custom-yellow" />
            </div>
            <div className="text-2xl font-cyber font-bold text-white">
              {currentQuality}%
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="tech-panel p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-tech text-gray-400 text-sm">Signal Strength</span>
              <Signal className="w-4 h-4 text-custom-green" />
            </div>
            <div className="text-2xl font-cyber font-bold text-white">
              {sensor.signalStrength}%
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="tech-panel p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-tech text-gray-400 text-sm">Battery Level</span>
              <Battery className="w-4 h-4 text-custom-yellow" />
            </div>
            <div className="text-2xl font-cyber font-bold text-white">
              {sensor.batteryLevel}%
            </div>
          </motion.div>
        </div>

        {/* Real-time Data Stream */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="tech-panel p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-custom-green rounded-full animate-pulse"></div>
              <h3 className="text-xl font-cyber font-bold text-custom-green">
                Real-time Data Stream
              </h3>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="cyber-input"
              >
                <option value="1h">Last Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              
              <button
                onClick={() => setIsLive(!isLive)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  isLive 
                    ? 'border-custom-green text-custom-green bg-custom-green bg-opacity-10' 
                    : 'border-gray-700 text-gray-400'
                }`}
              >
                {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span className="font-tech text-sm">{isLive ? 'Live' : 'Paused'}</span>
              </button>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#000', 
                    border: '1px solid #68F757',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    boxShadow: '0 0 20px rgba(104, 247, 87, 0.3)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#68F757" 
                  strokeWidth={2} 
                  name="Sensor Reading (μg/m³)"
                  dot={{ fill: '#68F757', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: '#68F757', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="quality" 
                  stroke="#FFFF00" 
                  strokeWidth={2} 
                  name="Data Quality (%)"
                  dot={{ fill: '#FFFF00', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: '#FFFF00', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-custom-green rounded-full"></div>
                <span className="font-tech text-sm text-gray-300">Sensor Reading (μg/m³)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-custom-yellow rounded-full"></div>
                <span className="font-tech text-sm text-gray-300">Data Quality (%)</span>
              </div>
            </div>
            <span className="font-tech text-sm text-gray-400">
              {sensorData.length} data points
            </span>
          </div>
        </motion.div>

        {/* SYSTEM RESET TEST - MAXIMUM VISIBILITY */}
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80vw',
          height: '60vh',
          backgroundColor: '#FF0000',
          border: '10px solid #FFFF00',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#FFFFFF',
          textAlign: 'center',
          boxShadow: '0 0 50px rgba(255, 0, 0, 0.8)'
        }}>
          <div>🚨 SYSTEM RESET TEST 🚨</div>
          <div style={{ fontSize: '24px', marginTop: '20px' }}>
            Time: {new Date().toLocaleTimeString()}
          </div>
          <div style={{ fontSize: '18px', marginTop: '20px' }}>
            If you see this, the reset worked!
          </div>
        </div>

        {/* Download Historical Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="tech-panel p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Download className="w-6 h-6 text-custom-yellow" />
              <h3 className="text-xl font-cyber font-bold text-custom-green">
                Download Historical Data
              </h3>
            </div>
            <span className="font-tech text-sm text-gray-400">
              Export sensor data with custom filters
            </span>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-4">
              <Filter className="w-5 h-5 text-custom-yellow" />
              <h4 className="font-cyber text-custom-green">Filter Options</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-tech text-sm text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="cyber-input w-full"
                />
              </div>

              <div>
                <label className="block font-tech text-sm text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="cyber-input w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-tech text-sm text-gray-300 mb-2">
                  Data Format
                </label>
                <select className="cyber-input w-full">
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="xlsx">Excel</option>
                </select>
              </div>

              <div>
                <label className="block font-tech text-sm text-gray-300 mb-2">
                  Time Interval
                </label>
                <select className="cyber-input w-full">
                  <option value="raw">Raw Data</option>
                  <option value="1min">1 Minute</option>
                  <option value="5min">5 Minutes</option>
                  <option value="1hour">1 Hour</option>
                </select>
              </div>

              <div>
                <label className="block font-tech text-sm text-gray-300 mb-2">
                  Quality Filter
                </label>
                <select className="cyber-input w-full">
                  <option value="all">All Data</option>
                  <option value="high">High Quality (90%+)</option>
                  <option value="medium">Medium+ Quality (70%+)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-400 font-tech">
                Estimated file size: ~2.5 MB • ~15,000 data points
              </div>
              <button
                onClick={handleExport}
                className="cyber-btn flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DataSensor;
