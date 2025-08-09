import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

const ApiTest: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<string>('Loading...');
  const [explorerData, setExplorerData] = useState<any>(null);
  const [roflData, setRoflData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  useEffect(() => {
    const testApi = async () => {
      setIsLoading(true);
      setError(null);
      setTestResults([]);
      
      try {
        // Test 1: Health endpoint (includes ROFL status)
        addTestResult('🔍 Testing API health...');
        console.log('🔍 Testing API health...');
        const healthResponse = await apiService.getHealth();
        console.log('✅ Health response:', healthResponse);
        
        if (healthResponse.success || healthResponse.status === 'healthy') {
          setHealthStatus('Healthy');
          addTestResult('✅ Health check passed');
          
          // Check ROFL status
          if (healthResponse.rofl?.available) {
            addTestResult(`✅ ROFL available - App ID: ${healthResponse.rofl.appId || 'Unknown'}`);
            setRoflData(healthResponse.rofl);
          } else {
            addTestResult('⚠️ ROFL not available (running in development mode)');
          }
        } else {
          setHealthStatus('Unhealthy');
          addTestResult('❌ Health check failed');
        }

        // Test 2: Public explorer endpoint (public - no auth required)
        addTestResult('🔍 Testing public explorer...');
        console.log('🔍 Testing public explorer...');
        const explorerResponse = await apiService.getPublicExplorer();
        console.log('✅ Explorer response:', explorerResponse);
        
        if (explorerResponse.success) {
          setExplorerData(explorerResponse.data);
          addTestResult(`✅ Public explorer passed - Found ${explorerResponse.data?.sensors?.length || 0} sensors`);
        } else {
          setError(`Explorer API failed: ${explorerResponse.message || 'Unknown error'}`);
          addTestResult(`❌ Public explorer failed: ${explorerResponse.message || 'Unknown error'}`);
        }

        // Test 3: ROFL-specific endpoints (if available)
        if (healthResponse.rofl?.available) {
          addTestResult('🔍 Testing ROFL-specific endpoints...');
          
          // Test ROFL app ID
          try {
            const roflAppIdResponse = await apiService.getROFLAppId();
            addTestResult(`✅ ROFL app ID test passed: ${roflAppIdResponse.data || roflAppIdResponse}`);
          } catch (roflError) {
            addTestResult(`⚠️ ROFL app ID test failed: ${roflError instanceof Error ? roflError.message : 'Unknown error'}`);
          }
        }

      } catch (err) {
        console.error('❌ API test failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setHealthStatus('Error');
        addTestResult(`❌ Test failed: ${errorMessage}`);
      } finally {
        setIsLoading(false);
        addTestResult('🏁 API testing completed');
      }
    };

    // Only run the test once when component mounts
    testApi();
  }, []); // Empty dependency array - only run once

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
      <h2 className="text-xl font-bold text-custom-green mb-4">API Integration Test</h2>
      
      {isLoading && (
        <div className="text-yellow-400 mb-4">
          🔄 Testing API endpoints...
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Health Check</h3>
          <p className={`text-sm ${healthStatus === 'Healthy' ? 'text-green-400' : healthStatus === 'Error' ? 'text-red-400' : 'text-yellow-400'}`}>
            Status: {healthStatus}
          </p>
        </div>

        {roflData && (
          <div>
            <h3 className="text-lg font-semibold text-white">ROFL Status</h3>
            <div className="text-sm text-gray-300">
              <p>Available: {roflData.available ? '✅ Yes' : '❌ No'}</p>
              {roflData.appId && <p>App ID: {roflData.appId}</p>}
            </div>
          </div>
        )}

        {explorerData && (
          <div>
            <h3 className="text-lg font-semibold text-white">Public Explorer Data</h3>
            <div className="text-sm text-gray-300 mb-2">
              Found {explorerData.sensors?.length || 0} sensors, {explorerData.metrics?.dataPoints || 0} data points
            </div>
            <pre className="text-xs text-gray-300 bg-gray-800 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(explorerData, null, 2)}
            </pre>
          </div>
        )}

        {error && (
          <div>
            <h3 className="text-lg font-semibold text-red-400">Error</h3>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {testResults.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white">Test Log</h3>
            <div className="text-xs text-gray-300 bg-gray-800 p-2 rounded overflow-auto max-h-32">
              {testResults.map((result, index) => (
                <div key={index} className="mb-1">{result}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiTest; 