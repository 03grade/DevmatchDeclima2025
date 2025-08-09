import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  Calendar,
  Globe,
  Thermometer,
  Droplets,
  Wind,
  Zap,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const DataAnalytics: React.FC = () => {
  const [timeframe, setTimeframe] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('all');

  // Mock data for various charts
  const temperatureData = [
    { time: '00:00', temperature: 24.5, humidity: 65, co2: 410 },
    { time: '04:00', temperature: 22.1, humidity: 72, co2: 405 },
    { time: '08:00', temperature: 26.8, humidity: 58, co2: 425 },
    { time: '12:00', temperature: 31.2, humidity: 45, co2: 440 },
    { time: '16:00', temperature: 33.5, humidity: 42, co2: 455 },
    { time: '20:00', temperature: 28.9, humidity: 55, co2: 435 },
    { time: '24:00', temperature: 25.3, humidity: 63, co2: 415 }
  ];

  const regionData = [
    { region: 'Singapore', sensors: 45, avgTemp: 28.5, avgHumidity: 75 },
    { region: 'Kuala Lumpur', sensors: 32, avgTemp: 30.2, avgHumidity: 80 },
    { region: 'Jakarta', sensors: 28, avgTemp: 29.8, avgHumidity: 78 },
    { region: 'Bangkok', sensors: 38, avgTemp: 31.5, avgHumidity: 70 },
    { region: 'Manila', sensors: 25, avgTemp: 29.1, avgHumidity: 82 }
  ];

  const sensorTypeDistribution = [
    { name: 'Temperature', value: 35, color: '#68F757' },
    { name: 'Humidity', value: 25, color: '#FFFF00' },
    { name: 'Air Quality', value: 25, color: '#00FFFF' },
    { name: 'CO2 Levels', value: 15, color: '#FF6B6B' }
  ];

  const dataQualityTrends = [
    { month: 'Jan', high: 85, medium: 12, low: 3 },
    { month: 'Feb', high: 88, medium: 10, low: 2 },
    { month: 'Mar', high: 92, medium: 7, low: 1 },
    { month: 'Apr', high: 89, medium: 9, low: 2 },
    { month: 'May', high: 94, medium: 5, low: 1 },
    { month: 'Jun', high: 91, medium: 8, low: 1 }
  ];

  const metrics = [
    {
      title: 'Total Data Points',
      value: '2.8M',
      change: '+15.3%',
      icon: BarChart3,
      color: 'custom-green'
    },
    {
      title: 'Active Sensors',
      value: '168',
      change: '+8.2%',
      icon: MapPin,
      color: 'custom-yellow'
    },
    {
      title: 'Data Quality Score',
      value: '94.2%',
      change: '+2.1%',
      icon: TrendingUp,
      color: 'custom-green'
    },
    {
      title: 'Global Coverage',
      value: '45 Cities',
      change: '+5 new',
      icon: Globe,
      color: 'custom-yellow'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white cyber-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
        >
          <div>
            <h1 className="text-4xl font-cyber text-custom-green mb-2 holo-text">Climate Data Analytics</h1>
            <p className="text-gray-400 font-tech">Comprehensive insights from global sensor network</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="cyber-input"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 3 Months</option>
            </select>
            
            <button className="cyber-btn flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="tech-panel p-6 hover:cyber-glow transition-all duration-300 scan-line"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-gray-800 border border-${metric.color}/30`}>
                    <Icon className={`w-6 h-6 text-${metric.color}`} />
                  </div>
                  <span className="text-sm font-medium text-custom-green font-cyber">{metric.change}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1 font-cyber">{metric.value}</h3>
                <p className="text-gray-400 text-sm font-tech">{metric.title}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Environmental Trends */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="tech-panel p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-custom-green font-cyber">Environmental Trends</h2>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="cyber-input text-sm"
                >
                  <option value="all">All Metrics</option>
                  <option value="temperature">Temperature</option>
                  <option value="humidity">Humidity</option>
                  <option value="co2">CO2 Levels</option>
                </select>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={temperatureData}>
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
                <Line type="monotone" dataKey="temperature" stroke="#68F757" strokeWidth={2} name="Temperature (°C)" dot={{ fill: '#68F757', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="humidity" stroke="#FFFF00" strokeWidth={2} name="Humidity (%)" dot={{ fill: '#FFFF00', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="co2" stroke="#00FFFF" strokeWidth={2} name="CO2 (ppm)" dot={{ fill: '#00FFFF', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Regional Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="tech-panel p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-custom-green font-cyber">Regional Sensor Distribution</h2>
              <MapPin className="w-5 h-5 text-custom-yellow" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="region" 
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
                <Bar dataKey="sensors" fill="#68F757" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sensor Type Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="tech-panel p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-custom-green font-cyber">Sensor Type Distribution</h2>
              <BarChart3 className="w-5 h-5 text-custom-yellow" />
            </div>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sensorTypeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sensorTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#000', 
                      border: '1px solid #68F757',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      boxShadow: '0 0 20px rgba(104, 247, 87, 0.3)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {sensorTypeDistribution.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full cyber-glow" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-300 font-tech">{item.name}</span>
                  <span className="text-sm font-medium text-white font-cyber">{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Data Quality Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="tech-panel p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-custom-green font-cyber">Data Quality Trends</h2>
              <TrendingUp className="w-5 h-5 text-custom-yellow" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dataQualityTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
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
                <Area type="monotone" dataKey="high" stackId="1" stroke="#68F757" fill="#68F757" fillOpacity={0.8} />
                <Area type="monotone" dataKey="medium" stackId="1" stroke="#FFFF00" fill="#FFFF00" fillOpacity={0.8} />
                <Area type="monotone" dataKey="low" stackId="1" stroke="#FF6B6B" fill="#FF6B6B" fillOpacity={0.8} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-custom-green rounded-full cyber-glow" />
                <span className="text-sm text-gray-300 font-tech">High Quality</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-custom-yellow rounded-full cyber-glow-yellow" />
                <span className="text-sm text-gray-300 font-tech">Medium Quality</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full cyber-glow-red" />
                <span className="text-sm text-gray-300 font-tech">Low Quality</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Regional Details Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="tech-panel p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-custom-green font-cyber">Regional Climate Overview</h2>
            <button className="flex items-center space-x-2 text-custom-yellow hover:text-custom-green transition-colors">
              <RefreshCw className="w-4 h-4" />
              <span className="font-tech">Refresh Data</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-custom-green/30">
                  <th className="text-left py-3 px-4 font-medium text-custom-green font-cyber">Region</th>
                  <th className="text-left py-3 px-4 font-medium text-custom-green font-cyber">Active Sensors</th>
                  <th className="text-left py-3 px-4 font-medium text-custom-green font-cyber">Avg Temperature</th>
                  <th className="text-left py-3 px-4 font-medium text-custom-green font-cyber">Avg Humidity</th>
                  <th className="text-left py-3 px-4 font-medium text-custom-green font-cyber">Status</th>
                </tr>
              </thead>
              <tbody>
                {regionData.map((region, index) => (
                  <tr key={region.region} className="border-b border-gray-700 hover:bg-gray-900/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-custom-yellow" />
                        <span className="font-medium text-white font-tech">{region.region}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-300 font-tech">{region.sensors}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Thermometer className="w-4 h-4 text-red-400" />
                        <span className="text-white font-tech">{region.avgTemp}°C</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Droplets className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-tech">{region.avgHumidity}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-custom-green/20 text-custom-green rounded-full text-xs font-medium font-cyber border border-custom-green/30">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DataAnalytics;
