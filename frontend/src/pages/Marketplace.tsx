import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Wind, 
  Zap,
  Star,
  Clock,
  TrendingUp,
  Shield,
  Coins,
  Eye,
  Download
} from 'lucide-react';
import { useWeb3Store } from '../store/web3Store';

interface SensorData {
  id: string;
  name: string;
  type: 'temperature' | 'humidity' | 'air_quality' | 'pressure';
  location: string;
  coordinates: [number, number];
  pricePerHour: number;
  currency: string;
  rating: number;
  dataPoints: number;
  lastUpdate: string;
  owner: string;
  description: string;
  tags: string[];
  qualityScore: number;
  isVerified: boolean;
}

const Marketplace: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const { isConnected, roseBalance } = useWeb3Store();

  // Mock sensor data with ROSE pricing
  const mockSensors: SensorData[] = [
    {
      id: '1',
      name: 'Downtown Temperature Monitor',
      type: 'temperature',
      location: 'Singapore CBD, Singapore',
      coordinates: [1.2966, 103.8558],
      pricePerHour: 2.5,
      currency: 'ROSE',
      rating: 4.8,
      dataPoints: 15420,
      lastUpdate: '2 minutes ago',
      owner: '0x1234...5678',
      description: 'High-precision temperature sensor in Singapore\'s business district',
      tags: ['urban', 'commercial', 'high-frequency'],
      qualityScore: 95,
      isVerified: true
    },
    {
      id: '2',
      name: 'Marina Bay Humidity Sensor',
      type: 'humidity',
      location: 'Marina Bay, Singapore',
      coordinates: [1.2830, 103.8607],
      pricePerHour: 1.8,
      currency: 'ROSE',
      rating: 4.6,
      dataPoints: 12890,
      lastUpdate: '5 minutes ago',
      owner: '0x2345...6789',
      description: 'Waterfront humidity monitoring with marine-grade sensors',
      tags: ['waterfront', 'marine', 'weather'],
      qualityScore: 92,
      isVerified: true
    },
    {
      id: '3',
      name: 'Industrial Air Quality Monitor',
      type: 'air_quality',
      location: 'Jurong Industrial Estate, Singapore',
      coordinates: [1.3162, 103.7065],
      pricePerHour: 4.2,
      currency: 'ROSE',
      rating: 4.9,
      dataPoints: 8750,
      lastUpdate: '1 minute ago',
      owner: '0x3456...7890',
      description: 'Multi-parameter air quality monitoring in industrial zone',
      tags: ['industrial', 'pollution', 'multi-sensor'],
      qualityScore: 98,
      isVerified: true
    },
    {
      id: '4',
      name: 'Changi Airport Weather Station',
      type: 'pressure',
      location: 'Changi Airport, Singapore',
      coordinates: [1.3644, 103.9915],
      pricePerHour: 3.1,
      currency: 'ROSE',
      rating: 4.7,
      dataPoints: 22100,
      lastUpdate: '30 seconds ago',
      owner: '0x4567...8901',
      description: 'Aviation-grade atmospheric pressure monitoring',
      tags: ['aviation', 'weather', 'precision'],
      qualityScore: 96,
      isVerified: true
    },
    {
      id: '5',
      name: 'Orchard Road Climate Monitor',
      type: 'temperature',
      location: 'Orchard Road, Singapore',
      coordinates: [1.3048, 103.8318],
      pricePerHour: 2.0,
      currency: 'ROSE',
      rating: 4.4,
      dataPoints: 9650,
      lastUpdate: '3 minutes ago',
      owner: '0x5678...9012',
      description: 'Urban microclimate monitoring in shopping district',
      tags: ['retail', 'urban', 'microclimate'],
      qualityScore: 89,
      isVerified: false
    },
    {
      id: '6',
      name: 'Sentosa Beach Weather Hub',
      type: 'humidity',
      location: 'Sentosa Island, Singapore',
      coordinates: [1.2494, 103.8303],
      pricePerHour: 1.5,
      currency: 'ROSE',
      rating: 4.3,
      dataPoints: 7320,
      lastUpdate: '7 minutes ago',
      owner: '0x6789...0123',
      description: 'Coastal weather monitoring for tourism and recreation',
      tags: ['coastal', 'tourism', 'recreation'],
      qualityScore: 87,
      isVerified: false
    }
  ];

  useEffect(() => {
    setSensors(mockSensors);
  }, []);

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature': return Thermometer;
      case 'humidity': return Droplets;
      case 'air_quality': return Wind;
      case 'pressure': return Zap;
      default: return Thermometer;
    }
  };

  const filteredSensors = sensors.filter(sensor => {
    const matchesSearch = sensor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sensor.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sensor.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === 'all' || sensor.type === selectedType;
    const matchesPrice = sensor.pricePerHour >= priceRange[0] && sensor.pricePerHour <= priceRange[1];
    
    return matchesSearch && matchesType && matchesPrice;
  });

  const sortedSensors = [...filteredSensors].sort((a, b) => {
    switch (sortBy) {
      case 'price_low': return a.pricePerHour - b.pricePerHour;
      case 'price_high': return b.pricePerHour - a.pricePerHour;
      case 'rating': return b.rating - a.rating;
      case 'recent': return new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime();
      case 'quality': return b.qualityScore - a.qualityScore;
      default: return b.rating - a.rating;
    }
  });

  const handlePurchaseData = (sensorId: string) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    
    const sensor = sensors.find(s => s.id === sensorId);
    if (sensor) {
      alert(`Purchasing data from ${sensor.name} for ${sensor.pricePerHour} ROSE/hour`);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-cyber font-bold holo-text mb-4">
            DATA MARKETPLACE
          </h1>
          <p className="text-xl text-gray-400 font-tech">
            Discover and purchase real-time sensor data powered by ROSE tokens
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="tech-panel p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sensors, locations, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="cyber-input w-full pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="cyber-input w-full"
              >
                <option value="all">All Types</option>
                <option value="temperature">Temperature</option>
                <option value="humidity">Humidity</option>
                <option value="air_quality">Air Quality</option>
                <option value="pressure">Pressure</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="cyber-input w-full"
              >
                <option value="rating">Highest Rated</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="recent">Most Recent</option>
                <option value="quality">Quality Score</option>
              </select>
            </div>
          </div>

          {/* Price Range */}
          <div className="mt-6">
            <label className="block text-sm font-tech font-medium text-gray-300 mb-2">
              Price Range (ROSE per hour): {priceRange[0]} - {priceRange[1]}
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseFloat(e.target.value), priceRange[1]])}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value)])}
                className="flex-1"
              />
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <p className="text-gray-400 font-tech">
            Found {sortedSensors.length} sensor{sortedSensors.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        {/* Sensor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSensors.map((sensor, index) => {
            const SensorIcon = getSensorIcon(sensor.type);
            
            return (
              <motion.div
                key={sensor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="tech-panel p-6 hover:border-custom-green/50 transition-all duration-300 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-custom-gradient rounded-lg flex items-center justify-center">
                      <SensorIcon className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h3 className="font-cyber font-bold text-white group-hover:text-custom-green transition-colors">
                        {sensor.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {sensor.isVerified && (
                          <Shield className="w-4 h-4 text-custom-green" />
                        )}
                        <span className="text-sm text-gray-400 font-tech capitalize">
                          {sensor.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-tech text-white">{sensor.rating}</span>
                    </div>
                    <div className="text-xs text-gray-400 font-tech mt-1">
                      Quality: {sensor.qualityScore}%
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300 font-tech">{sensor.location}</span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 font-tech mb-4 line-clamp-2">
                  {sensor.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {sensor.tags.slice(0, 3).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-custom-green/20 text-custom-green text-xs font-tech rounded border border-custom-green/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm font-tech">
                  <div>
                    <div className="flex items-center space-x-1 text-gray-400">
                      <TrendingUp className="w-4 h-4" />
                      <span>Data Points</span>
                    </div>
                    <span className="text-white font-mono">{sensor.dataPoints.toLocaleString()}</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Last Update</span>
                    </div>
                    <span className="text-white font-mono">{sensor.lastUpdate}</span>
                  </div>
                </div>

                {/* Price and Actions */}
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Coins className="w-5 h-5 text-custom-green" />
                      <span className="text-lg font-cyber font-bold text-custom-green">
                        {sensor.pricePerHour} ROSE
                      </span>
                      <span className="text-sm text-gray-400 font-tech">/hour</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 cyber-btn-secondary text-sm py-2 flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>PREVIEW</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePurchaseData(sensor.id)}
                      disabled={!isConnected}
                      className="flex-1 cyber-btn text-sm py-2 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      <span>BUY DATA</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {sortedSensors.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-cyber font-bold text-gray-400 mb-2">
              No sensors found
            </h3>
            <p className="text-gray-500 font-tech">
              Try adjusting your search criteria or filters
            </p>
          </motion.div>
        )}

        {/* Wallet Connection Notice */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 tech-panel p-4 border-yellow-500/50 bg-yellow-900/20"
          >
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm font-tech font-bold text-yellow-400">
                  Connect Wallet
                </p>
                <p className="text-xs text-gray-400 font-tech">
                  Connect to purchase sensor data
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
