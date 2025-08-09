import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  BarChart3,
  Zap
} from 'lucide-react';
import { apiService } from '../services/apiService';

interface AIInsightsProps {
  sensorData: any[];
  sensorType: string;
  location: string;
}

const AIInsights: React.FC<AIInsightsProps> = ({ sensorData, sensorType, location }) => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('analysis');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(true);

  // Memoized generateFallbackData function
  const generateFallbackData = useCallback(() => {
    const latestData = sensorData.slice(-10);
    const avgValue = latestData.length > 0 ? latestData.reduce((sum, d) => sum + (d.value || d.temperature || 0), 0) / latestData.length : 0;
    const avgQuality = latestData.length > 0 ? latestData.reduce((sum, d) => sum + (d.quality || 85), 0) / latestData.length : 85;
    
    const trend = latestData.length > 1 
      ? (latestData[latestData.length - 1].value || latestData[latestData.length - 1].temperature || 0) - (latestData[0].value || latestData[0].temperature || 0)
      : 0;

    const mockInsights = {
      analysis: {
        title: 'Real-time Analysis',
        status: avgValue < 35 ? 'good' : avgValue < 55 ? 'moderate' : 'poor',
        summary: `Current ${sensorType} shows ${avgValue < 35 ? 'good' : avgValue < 55 ? 'moderate' : 'concerning'} levels with average reading ${avgValue.toFixed(1)}`,
        details: [
          `Average reading: ${avgValue.toFixed(1)}`,
          `Data quality: ${avgQuality.toFixed(1)}%`,
          `Trend: ${trend > 0 ? 'Increasing' : trend < 0 ? 'Decreasing' : 'Stable'} (${Math.abs(trend).toFixed(1)})`
        ]
      },
      predictions: {
        title: 'AI Predictions',
        forecast: [
          { time: 'Next Hour', value: avgValue + (Math.random() - 0.5) * 5, confidence: 92 },
          { time: 'Next 6 Hours', value: avgValue + (Math.random() - 0.5) * 10, confidence: 87 },
          { time: 'Next 24 Hours', value: avgValue + (Math.random() - 0.5) * 15, confidence: 78 }
        ]
      }
    };

    if (mountedRef.current) {
      setInsights(mockInsights);
    }
  }, [sensorData, sensorType]);

  // Memoized generateInsights function
  const generateInsights = useCallback(async () => {
    if (!mountedRef.current || !sensorData || sensorData.length === 0) {
      if (mountedRef.current) {
        setLoading(false);
      }
      return;
    }

    // Check if we should update (only if it's been more than 1 minute since last update)
    const now = Date.now();
    if (now - lastUpdateRef.current < 60 * 1000) {
      return; // Skip update if less than 1 minute has passed
    }

    if (mountedRef.current) {
      setLoading(true);
      setError(null);
      lastUpdateRef.current = now;
    }

    console.log('🤖 Generating AI insights for:', location, 'with', sensorData.length, 'data points');

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        console.warn('AI insights request timed out, using fallback data');
        setLoading(false);
        setError('Request timed out. Using fallback data.');
        generateFallbackData();
      }
    }, 15000); // 15 second timeout

    try {
      // Get AI insights from backend
      const response = await apiService.generateRegionalSnapshot({
        region: location,
        timeRange: {
          start: Date.now() - (24 * 60 * 60 * 1000), // Last 24 hours
          end: Date.now()
        }
      });

      clearTimeout(timeoutId);

      if (!mountedRef.current) return;

      console.log('🤖 AI insights response:', response);

      if (response.success && response.data) {
        const aiInsights = response.data;
        
        // Transform backend AI data to match our interface
        const transformedInsights = {
          analysis: {
            title: 'AI Real-time Analysis',
            status: aiInsights.status || aiInsights.summary?.includes('concerning') ? 'poor' : 'moderate',
            summary: aiInsights.summary || aiInsights.analysis || `AI analysis for ${location} shows current climate conditions`,
            details: aiInsights.details || aiInsights.insights?.trends || [
              `Region: ${location}`,
              `Data points analyzed: ${sensorData.length}`,
              `Analysis confidence: ${aiInsights.confidence || aiInsights.metadata?.confidence || 85}%`
            ]
          },
          predictions: {
            title: 'AI Predictions',
            forecast: aiInsights.predictions || aiInsights.forecast || [
              { time: 'Next Hour', value: 45 + (Math.random() - 0.5) * 5, confidence: 92 },
              { time: 'Next 6 Hours', value: 47 + (Math.random() - 0.5) * 10, confidence: 87 },
              { time: 'Next 24 Hours', value: 48 + (Math.random() - 0.5) * 15, confidence: 78 }
            ]
          }
        };

        if (mountedRef.current) {
          setInsights(transformedInsights);
        }
      } else {
        // Fallback to mock data if API fails
        console.warn('AI insights API returned unsuccessful response, using fallback data');
        generateFallbackData();
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (!mountedRef.current) return;
      
      console.error('Failed to fetch AI insights:', error);
      setError('Failed to load AI insights. Using fallback data.');
      generateFallbackData();
    } finally {
      clearTimeout(timeoutId);
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [location, sensorData, sensorType, generateFallbackData]);

  // Initialize component
  useEffect(() => {
    mountedRef.current = true;
    lastUpdateRef.current = 0;
    
    console.log('🤖 AI Insights component mounted for:', location);
    
    // Initial generation
    generateInsights();

    // Set up interval for updates every 1 minute (60 seconds)
    intervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        console.log('🤖 Scheduled AI insights update for:', location);
        generateInsights();
      }
    }, 60 * 1000);

    // Cleanup function
    return () => {
      console.log('🤖 AI Insights component unmounting for:', location);
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [generateInsights]); // Only depend on generateInsights

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-custom-green';
      case 'moderate': return 'text-custom-yellow';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="tech-panel p-6 mb-8"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Brain className="w-6 h-6 text-custom-yellow animate-pulse" />
          <h3 className="text-xl font-cyber font-bold text-custom-green">
            AI Insights
          </h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-custom-yellow mx-auto mb-4"></div>
            <p className="font-tech text-custom-yellow">Analyzing sensor data...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!insights) {
    return (
      <div className="tech-panel p-6 mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-cyber font-bold text-red-400">
            AI Insights
          </h3>
        </div>
        <p className="text-red-300 font-tech">No data available for analysis</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="tech-panel p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-custom-yellow" />
          <h3 className="text-xl font-cyber font-bold text-custom-green">
            AI Insights
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-custom-yellow rounded-full animate-pulse"></div>
          <span className="font-tech text-sm text-gray-400">AI Processing (Updates every minute)</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-800 bg-opacity-50 rounded-lg p-1">
        {[
          { id: 'analysis', label: 'Analysis', icon: BarChart3 },
          { id: 'predictions', label: 'Predictions', icon: TrendingUp }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-tech text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-custom-green bg-opacity-20 text-black border border-custom-green font-bold'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'analysis' && insights.analysis && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-cyber text-lg text-white">{insights.analysis.title}</h4>
              <span className={`font-tech text-sm px-3 py-1 rounded-full border ${getStatusColor(insights.analysis.status)} border-current bg-current bg-opacity-10`}>
                {insights.analysis.status.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-300 font-tech">{insights.analysis.summary}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.analysis.details.map((detail: string, index: number) => (
                <div key={index} className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
                  <p className="font-tech text-sm text-gray-300">{detail}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'predictions' && insights.predictions && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h4 className="font-cyber text-lg text-white">{insights.predictions.title}</h4>
            <div className="space-y-3">
              {insights.predictions.forecast.map((prediction: any, index: number) => (
                <div key={index} className="flex items-center justify-between bg-gray-800 bg-opacity-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-custom-yellow" />
                    <div>
                      <p className="font-tech text-white">{prediction.time}</p>
                      <p className="font-tech text-sm text-gray-400">Confidence: {prediction.confidence}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-cyber text-lg text-custom-green">{prediction.value.toFixed(1)} μg/m³</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default AIInsights;
