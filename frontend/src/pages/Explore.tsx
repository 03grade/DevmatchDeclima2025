import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar,
  TrendingUp,
  Star,
  Eye,
  Download,
  Globe,
  Thermometer,
  Droplets,
  Wind,
  Zap,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePublicExplorer } from '../hooks/useApi';
import { apiService } from '../services/apiService';

interface NFAData {
  sensorId: string;
  sensorName: string;
  location: string;
  country: string;
  continent: string;
  sensorType: 'CO2' | 'TEMP' | 'HUMIDITY' | 'AIR_QUALITY';
  reputationScore: number;
  lastSubmission: string;
  totalBatches: number;
  roseEarned: number;
  isActive: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
}

const Explore: React.FC = () => {
  const [nfaData, setNfaData] = useState<NFAData[]>([]);
  const [filteredData, setFilteredData] = useState<NFAData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedSensorType, setSelectedSensorType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [minReputation, setMinReputation] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Use the new API hook for public explorer data
  const { data: explorerData, loading: explorerLoading, error: explorerError, refetch: refetchExplorer } = usePublicExplorer();

  // Fetch public explorer data
  useEffect(() => {
    const fetchExplorerData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔄 Fetching public explorer data...');
        
        const response = await apiService.getPublicExplorer();
        console.log('📊 Explorer API response:', response);
        
        if (response.success && response.data) {
          // Transform backend data to match our interface
          const transformedData: NFAData[] = [];
          
          // Handle sensors from the response
          if (response.data.sensors && response.data.sensors.length > 0) {
            response.data.sensors.forEach((sensor: any) => {
              transformedData.push({
                sensorId: sensor.sensorId || sensor.id,
                sensorName: sensor.name || `Sensor ${sensor.sensorId || sensor.id}`,
                location: sensor.location || 'Unknown',
                country: sensor.country || 'Unknown',
                continent: sensor.continent || 'Asia',
                sensorType: sensor.sensorType || 'TEMP',
                reputationScore: sensor.reputationScore || 4.5,
                lastSubmission: sensor.lastSubmission || new Date().toISOString(),
                totalBatches: sensor.totalBatches || 0,
                roseEarned: sensor.roseEarned || 0,
                isActive: sensor.isActive || true,
                coordinates: sensor.coordinates || { lat: 0, lng: 0 }
              });
            });
          }
          
          // If no sensors found in response, create some mock sensors for demo
          if (transformedData.length === 0) {
            console.log('No sensors found in response, creating demo sensors...');
            const mockSensors: NFAData[] = [
              {
                sensorId: 'CLI12345678-550e8400-e29b-41d4-a716-446655440001',
                sensorName: 'Malaysia Climate Station 1',
                location: 'Petaling Jaya, Selangor',
                country: 'Malaysia',
                continent: 'Asia',
                sensorType: 'AIR_QUALITY',
                reputationScore: 4.8,
                lastSubmission: new Date().toISOString(),
                totalBatches: 1247,
                roseEarned: 2847.5,
                isActive: true,
                coordinates: { lat: 3.0738, lng: 101.5183 }
              },
              {
                sensorId: 'CLI12345678-550e8400-e29b-41d4-a716-446655440002',
                sensorName: 'Malaysia Climate Station 2',
                location: 'Shah Alam, Selangor',
                country: 'Malaysia',
                continent: 'Asia',
                sensorType: 'TEMP',
                reputationScore: 4.9,
                lastSubmission: new Date().toISOString(),
                totalBatches: 2156,
                roseEarned: 4923.2,
                isActive: true,
                coordinates: { lat: 3.0738, lng: 101.5183 }
              }
            ];
            transformedData.push(...mockSensors);
          }
          
          setNfaData(transformedData);
          setFilteredData(transformedData);
          console.log(`✅ Found ${transformedData.length} sensors in explorer`);
        } else {
          console.error('❌ Explorer API response not successful:', response);
          setError(response.message || 'Failed to fetch explorer data');
          
          // Fallback to mock data for demo
          const mockNFAData: NFAData[] = [
            {
              sensorId: 'CLI12345678-550e8400-e29b-41d4-a716-446655440001',
              sensorName: 'Malaysia Climate Station 1',
              location: 'Petaling Jaya, Selangor',
              country: 'Malaysia',
              continent: 'Asia',
              sensorType: 'AIR_QUALITY',
              reputationScore: 4.8,
              lastSubmission: new Date().toISOString(),
              totalBatches: 1247,
              roseEarned: 2847.5,
              isActive: true,
              coordinates: { lat: 3.0738, lng: 101.5183 }
            }
          ];
          
          setNfaData(mockNFAData);
          setFilteredData(mockNFAData);
        }
      } catch (error) {
        console.error('❌ Failed to fetch explorer data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch explorer data');
        
        // Fallback to mock data for demo
        const mockNFAData: NFAData[] = [
          {
            sensorId: 'CLI12345678-550e8400-e29b-41d4-a716-446655440001',
            sensorName: 'Malaysia Climate Station 1',
            location: 'Petaling Jaya, Selangor',
            country: 'Malaysia',
            continent: 'Asia',
            sensorType: 'AIR_QUALITY',
            reputationScore: 4.8,
            lastSubmission: new Date().toISOString(),
            totalBatches: 1247,
            roseEarned: 2847.5,
            isActive: true,
            coordinates: { lat: 3.0738, lng: 101.5183 }
          }
        ];
        
        setNfaData(mockNFAData);
        setFilteredData(mockNFAData);
      } finally {
        setLoading(false);
      }
    };

    fetchExplorerData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...nfaData];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(nfa => 
        nfa.sensorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nfa.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nfa.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Region filter
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(nfa => nfa.continent === selectedRegion);
    }

    // Sensor type filter
    if (selectedSensorType !== 'all') {
      filtered = filtered.filter(nfa => nfa.sensorType === selectedSensorType);
    }

    // Date range filter (simplified for demo)
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      switch (dateRange) {
        case '24h':
          cutoff.setHours(now.getHours() - 24);
          break;
        case '7d':
          cutoff.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoff.setDate(now.getDate() - 30);
          break;
      }
      
      filtered = filtered.filter(nfa => new Date(nfa.lastSubmission) >= cutoff);
    }

    // Reputation filter
    filtered = filtered.filter(nfa => nfa.reputationScore >= minReputation);

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.lastSubmission).getTime() - new Date(a.lastSubmission).getTime());
        break;
      case 'reputation':
        filtered.sort((a, b) => b.reputationScore - a.reputationScore);
        break;
      case 'active':
        filtered.sort((a, b) => b.totalBatches - a.totalBatches);
        break;
    }

    setFilteredData(filtered);
  }, [nfaData, searchTerm, selectedRegion, selectedSensorType, dateRange, minReputation, sortBy]);

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'CO2': return <Wind className="w-5 h-5" />;
      case 'TEMP': return <Thermometer className="w-5 h-5" />;
      case 'HUMIDITY': return <Droplets className="w-5 h-5" />;
      case 'AIR_QUALITY': return <Zap className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  const getSensorColor = (type: string) => {
    switch (type) {
      case 'CO2': return 'text-purple-400 bg-purple-500/20';
      case 'TEMP': return 'text-red-400 bg-red-500/20';
      case 'HUMIDITY': return 'text-blue-400 bg-blue-500/20';
      case 'AIR_QUALITY': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
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
            className={`w-4 h-4 ${
              i < fullStars 
                ? 'text-yellow-400 fill-current' 
                : i === fullStars && hasHalfStar
                ? 'text-yellow-400 fill-current opacity-50'
                : 'text-gray-600'
            }`}
          />
        ))}
        <span className="text-sm text-gray-400 ml-1">({score.toFixed(1)})</span>
      </div>
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-custom-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-custom-green font-cyber">Loading climate data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-custom-green/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-cyber text-custom-green mb-4">
              SENSOR EXPLORER
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Access climate data from our global sensor network. All data is freely available 
              to researchers, activists, and the public. Knowledge should be open.
            </p>
            <div className="flex items-center justify-center space-x-8 mt-6 text-sm">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-custom-green" />
                <span className="text-gray-400">180 Active Sensors</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-custom-yellow" />
                <span className="text-gray-400">Real-time Data</span>
              </div>
              <div className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-blue-400" />
                <span className="text-gray-400">Open Access</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search sensors by name, location, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:border-custom-green focus:ring-1 focus:ring-custom-green"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg hover:border-custom-green transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <div className="text-sm text-gray-400">
              Showing {filteredData.length} of {nfaData.length} sensors
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Region Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-custom-green focus:ring-1 focus:ring-custom-green"
                  >
                    <option value="all">All Regions</option>
                    <option value="Asia">Asia</option>
                    <option value="Europe">Europe</option>
                    <option value="North America">North America</option>
                    <option value="South America">South America</option>
                    <option value="Africa">Africa</option>
                    <option value="Oceania">Oceania</option>
                  </select>
                </div>

                {/* Sensor Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sensor Type</label>
                  <select
                    value={selectedSensorType}
                    onChange={(e) => setSelectedSensorType(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-custom-green focus:ring-1 focus:ring-custom-green"
                  >
                    <option value="all">All Types</option>
                    <option value="CO2">CO2 Sensors</option>
                    <option value="TEMP">Temperature</option>
                    <option value="HUMIDITY">Humidity</option>
                    <option value="AIR_QUALITY">Air Quality</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-custom-green focus:ring-1 focus:ring-custom-green"
                  >
                    <option value="all">All Time</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>

                {/* Reputation Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Min Reputation: {minReputation.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={minReputation}
                    onChange={(e) => setMinReputation(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                <div className="flex space-x-4">
                  {[
                    { value: 'newest', label: 'Newest' },
                    { value: 'reputation', label: 'Highest Reputation' },
                    { value: 'active', label: 'Most Active' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        sortBy === option.value
                          ? 'bg-custom-green text-black border-custom-green'
                          : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-custom-green'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* NFA Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((nfa, index) => (
            <motion.div
              key={nfa.sensorId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-custom-green transition-all duration-300 group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getSensorColor(nfa.sensorType)}`}>
                    {getSensorIcon(nfa.sensorType)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-custom-green transition-colors">
                      {nfa.sensorName}
                    </h3>
                    <Link
                      to={`/nfa/${nfa.sensorId}`}
                      className="text-sm text-custom-green hover:text-custom-yellow transition-colors"
                    >
                      {nfa.sensorId}
                    </Link>
                  </div>
                </div>
                {nfa.isActive && (
                  <div className="w-3 h-3 bg-custom-green rounded-full animate-pulse"></div>
                )}
              </div>

              {/* Location */}
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{nfa.location}</span>
              </div>

              {/* Sensor Type */}
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm text-gray-400">Type:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getSensorColor(nfa.sensorType)}`}>
                  {nfa.sensorType.replace('_', ' ')}
                </span>
              </div>

              {/* Reputation */}
              <div className="mb-4">
                {getReputationStars(nfa.reputationScore)}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-400">Batches:</span>
                  <div className="font-medium text-white">{nfa.totalBatches.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-400">ROSE Earned:</span>
                  <div className="font-medium text-custom-yellow">{nfa.roseEarned.toLocaleString()}</div>
                </div>
              </div>

              {/* Last Submission */}
              <div className="flex items-center space-x-2 mb-4 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">Last data:</span>
                <span className="text-white">{formatTimeAgo(nfa.lastSubmission)}</span>
              </div>

              {/* Action Button */}
              <Link
                to={`/nfa/${nfa.sensorId}`}
                className="w-full bg-gradient-to-r from-custom-green to-teal-500 text-black font-medium py-2 px-4 rounded-lg hover:from-custom-green/90 hover:to-teal-500/90 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>View Data</span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {filteredData.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No sensors found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Explore;
