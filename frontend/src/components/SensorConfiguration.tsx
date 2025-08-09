import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Eye, DollarSign, Type, FileText, MapPin, Activity, Shield, CheckCircle } from 'lucide-react';

interface SensorConfigurationProps {
  sensorData: any;
  onConfigurationComplete: (configData: any) => void;
}

interface LocationSuggestion {
  id: string;
  name: string;
  coordinates: [number, number];
}

const SensorConfiguration: React.FC<SensorConfigurationProps> = ({ 
  sensorData, 
  onConfigurationComplete 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: sensorData?.unit || '°C',
    location: '',
    latitude: '',
    longitude: '',
    tags: ''
  });

  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Enhanced location suggestions with more diverse options
  const mockLocationSuggestions: LocationSuggestion[] = [
    // Singapore locations
    { id: '1', name: 'Singapore CBD, Singapore', coordinates: [1.2966, 103.8558] },
    { id: '2', name: 'Marina Bay, Singapore', coordinates: [1.2830, 103.8607] },
    { id: '3', name: 'Orchard Road, Singapore', coordinates: [1.3048, 103.8318] },
    { id: '4', name: 'Sentosa Island, Singapore', coordinates: [1.2494, 103.8303] },
    { id: '5', name: 'Changi Airport, Singapore', coordinates: [1.3644, 103.9915] },
    
    // Malaysia locations
    { id: '6', name: 'Kuala Lumpur City Centre, Malaysia', coordinates: [3.1478, 101.6953] },
    { id: '7', name: 'Petaling Jaya, Malaysia', coordinates: [3.1073, 101.6067] },
    { id: '8', name: 'Johor Bahru, Malaysia', coordinates: [1.4927, 103.7414] },
    { id: '9', name: 'Penang Island, Malaysia', coordinates: [5.4164, 100.3327] },
    { id: '10', name: 'Shah Alam, Malaysia', coordinates: [3.0733, 101.5185] },
    
    // Indonesia locations
    { id: '11', name: 'Jakarta Central, Indonesia', coordinates: [-6.2088, 106.8456] },
    { id: '12', name: 'Surabaya, Indonesia', coordinates: [-7.2575, 112.7521] },
    { id: '13', name: 'Bandung, Indonesia', coordinates: [-6.9175, 107.6191] },
    { id: '14', name: 'Medan, Indonesia', coordinates: [3.5952, 98.6722] },
    { id: '15', name: 'Bali Denpasar, Indonesia', coordinates: [-8.6705, 115.2126] },
    
    // Thailand locations
    { id: '16', name: 'Bangkok Downtown, Thailand', coordinates: [13.7563, 100.5018] },
    { id: '17', name: 'Chiang Mai, Thailand', coordinates: [18.7883, 98.9853] },
    { id: '18', name: 'Phuket, Thailand', coordinates: [7.8804, 98.3923] },
    { id: '19', name: 'Pattaya, Thailand', coordinates: [12.9236, 100.8825] },
    
    // Vietnam locations
    { id: '20', name: 'Ho Chi Minh City, Vietnam', coordinates: [10.8231, 106.6297] },
    { id: '21', name: 'Hanoi, Vietnam', coordinates: [21.0285, 105.8542] },
    { id: '22', name: 'Da Nang, Vietnam', coordinates: [16.0544, 108.2022] },
    
    // Philippines locations
    { id: '23', name: 'Manila, Philippines', coordinates: [14.5995, 120.9842] },
    { id: '24', name: 'Cebu City, Philippines', coordinates: [10.3157, 123.8854] },
    { id: '25', name: 'Davao City, Philippines', coordinates: [7.1907, 125.4553] },
    
    // Other major cities
    { id: '26', name: 'Hong Kong', coordinates: [22.3193, 114.1694] },
    { id: '27', name: 'Macau', coordinates: [22.1987, 113.5439] },
    { id: '28', name: 'Brunei Bandar Seri Begawan', coordinates: [4.9031, 114.9398] },
    { id: '29', name: 'Yangon, Myanmar', coordinates: [16.8661, 96.1951] },
    { id: '30', name: 'Phnom Penh, Cambodia', coordinates: [11.5564, 104.9282] }
  ];

  // Auto-populate some fields based on sensor data
  useEffect(() => {
    if (sensorData) {
      setFormData(prev => ({
        ...prev,
        name: `${sensorData.type?.charAt(0).toUpperCase()}${sensorData.type?.slice(1)} Sensor ${sensorData.deviceId?.slice(-4)}` || '',
        unit: sensorData.unit || '°C',
        latitude: sensorData.location?.latitude?.toFixed(6) || '',
        longitude: sensorData.location?.longitude?.toFixed(6) || ''
      }));
    }
  }, [sensorData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Enhanced location search with better filtering
    if (field === 'location') {
      if (value.length > 1) {
        const searchTerm = value.toLowerCase().trim();
        
        // More flexible filtering - search in any part of the location name
        const filtered = mockLocationSuggestions.filter(suggestion => {
          const locationName = suggestion.name.toLowerCase();
          return locationName.includes(searchTerm) || 
                 locationName.split(',').some(part => part.trim().startsWith(searchTerm));
        });
        
        setLocationSuggestions(filtered.slice(0, 8)); // Limit to 8 suggestions
        setShowSuggestions(filtered.length > 0);
      } else {
        setShowSuggestions(false);
        setLocationSuggestions([]);
      }
    }

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setFormData(prev => ({
      ...prev,
      location: suggestion.name,
      latitude: suggestion.coordinates[0].toString(),
      longitude: suggestion.coordinates[1].toString()
    }));
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Sensor name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.coordinates = 'Valid coordinates are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const configData = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        sensorType: sensorData?.type,
        deviceId: sensorData?.deviceId,
        unit: formData.unit
      };
      
      onConfigurationComplete(configData);
    }
  };

  const previewData = {
    ...formData,
    sensorType: sensorData?.type,
    deviceId: sensorData?.deviceId,
    currentValue: sensorData?.value,
    lastUpdated: new Date().toISOString()
  };

  return (
    <div className="w-full min-h-screen p-4 md:p-6 lg:p-8 tech-panel neon-border cyber-grid">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-black neon-border rounded-lg cyber-glow">
          <Settings className="w-6 h-6 text-gradient-start" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white font-cyber holo-text">Configure Your Sensor</h2>
          <p className="text-gray-300 font-tech">Set up your sensor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Configuration Form */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="tech-panel p-4 md:p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-cyber">
                <Type className="w-5 h-5 text-gradient-start" />
                Basic Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gradient-start mb-2 font-tech">
                    Sensor Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`cyber-input w-full ${
                      errors.name ? 'border-custom-red cyber-glow-red' : ''
                    }`}
                    placeholder="e.g., Temperature Sensor A1B2"
                  />
                  {errors.name && <p className="text-custom-red text-sm mt-1 font-tech">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gradient-start mb-2 font-tech">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className={`cyber-input w-full resize-none ${
                      errors.description ? 'border-custom-red cyber-glow-red' : ''
                    }`}
                    placeholder="Describe your sensor's capabilities and use cases..."
                  />
                  {errors.description && <p className="text-custom-red text-sm mt-1 font-tech">{errors.description}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gradient-start mb-2 font-tech">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    className="cyber-input w-full"
                    placeholder="e.g., outdoor, weather, industrial"
                  />
                </div>
              </div>
            </div>

            {/* Unit */}
            <div className="tech-panel p-4 md:p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-cyber">
                <DollarSign className="w-5 h-5 text-gradient-start" />
                Unit
              </h3>

              <div>
                <label className="block text-sm font-medium text-gradient-start mb-2 font-tech">
                  Unit
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  className="cyber-input w-full"
                  placeholder="°C"
                />
              </div>
            </div>

            {/* Location */}
            <div className="tech-panel p-4 md:p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-cyber">
                <MapPin className="w-5 h-5 text-gradient-start" />
                Location
              </h3>
              
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gradient-start mb-2 font-tech">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className={`cyber-input w-full ${
                      errors.location ? 'border-custom-red cyber-glow-red' : ''
                    }`}
                    placeholder="Start typing a location..."
                  />
                  {errors.location && <p className="text-custom-red text-sm mt-1 font-tech">{errors.location}</p>}
                  
                  {/* Location Suggestions */}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 tech-panel neon-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {locationSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onClick={() => handleLocationSelect(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-gradient-start hover:bg-opacity-10 focus:bg-gradient-start focus:bg-opacity-10 focus:outline-none border-b border-gradient-start border-opacity-20 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gradient-start" />
                            <span className="text-sm text-white font-tech">{suggestion.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gradient-start mb-2 font-tech">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                      className="cyber-input w-full"
                      placeholder="1.3521"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gradient-start mb-2 font-tech">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                      className="cyber-input w-full"
                      placeholder="103.8198"
                    />
                  </div>
                </div>
                {errors.coordinates && <p className="text-custom-red text-sm font-tech">{errors.coordinates}</p>}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="cyber-btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>

              <button
                type="submit"
                className="cyber-btn flex-1 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Complete Configuration
              </button>
            </div>
          </form>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="tech-panel p-4 md:p-6 rounded-lg neon-border cyber-glow"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-cyber">
              <Eye className="w-5 h-5 text-gradient-start" />
              Sensor Preview
            </h3>

            <div className="bg-black bg-opacity-50 p-4 md:p-6 rounded-lg neon-border">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-white font-cyber">
                    {previewData.name || 'Sensor Name'}
                  </h4>
                  <p className="text-sm text-gray-300 flex items-center gap-1 mt-1 font-tech">
                    <Activity className="w-4 h-4" />
                    {previewData.sensorType || 'Unknown'} • {previewData.deviceId || 'N/A'}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                </div>
              </div>

              <p className="text-gray-300 mb-4 font-tech">
                {previewData.description || 'No description provided'}
              </p>

              <div className="flex items-center gap-2 text-sm text-gray-300 mb-4 font-tech">
                <MapPin className="w-4 h-4 text-gradient-start" />
                {previewData.location || 'Location not set'}
              </div>

              {previewData.tags && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {previewData.tags.split(',').map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gradient-start bg-opacity-20 text-gradient-start text-xs rounded-full neon-border font-tech"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="border-t border-gradient-start border-opacity-30 pt-4">
                <div className="flex items-center justify-between text-sm font-tech">
                  <span className="text-gray-300">Current Reading:</span>
                  <span className="font-semibold text-white">
                    {previewData.currentValue || '--'} {previewData.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2 font-tech">
                  <span className="text-gray-300">Status:</span>
                  <span className="flex items-center gap-1 text-gradient-start">
                    <div className="w-2 h-2 bg-gradient-start rounded-full status-online"></div>
                    Active
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SensorConfiguration;
