import React, { useState } from 'react';
import { Download, Wifi, Settings, CheckCircle, AlertCircle, Code, FileText, Cpu } from 'lucide-react';

interface SensorConnectionProps {
  onConnect: (sensorData: any) => void;
}

const SensorConnection: React.FC<SensorConnectionProps> = ({ onConnect }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [selectedFirmware, setSelectedFirmware] = useState<string>('');

  const firmwareOptions = [
    {
      id: 'esp32',
      name: 'ESP32 (MicroPython)',
      description: 'For ESP32 boards with DHT22 and MQ-135 sensors',
      filename: 'esp32_climate_sensor.py',
      icon: <Cpu className="w-6 h-6" />,
      requirements: ['ESP32 board', 'DHT22 sensor', 'MQ-135 sensor', 'MicroPython firmware']
    },
    {
      id: 'arduino',
      name: 'Arduino (C++)',
      description: 'Compatible with ESP32, ESP8266, and Arduino with WiFi',
      filename: 'arduino_climate_sensor.ino',
      icon: <Code className="w-6 h-6" />,
      requirements: ['Arduino IDE', 'ESP32/ESP8266 board', 'DHT22 library', 'ArduinoJson library']
    },
    {
      id: 'raspberry-pi',
      name: 'Raspberry Pi (Python)',
      description: 'For Raspberry Pi with GPIO sensors',
      filename: 'raspberry_pi_climate_sensor.py',
      icon: <FileText className="w-6 h-6" />,
      requirements: ['Raspberry Pi', 'Python 3.7+', 'GPIO sensors', 'Required Python packages']
    }
  ];

  const downloadFirmware = async (firmwareId: string) => {
    try {
      const firmware = firmwareOptions.find(f => f.id === firmwareId);
      if (!firmware) return;

      // Mock firmware content for hackathon demo
      const firmwareContent = `// Mock firmware for ${firmware.name}\n// This would be downloaded from the backend in production\nconsole.log('Sensor firmware initialized');`;
      
      const blob = new Blob([firmwareContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = firmware.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const downloadAllFirmware = async () => {
    for (const firmware of firmwareOptions) {
      await downloadFirmware(firmware.id);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const simulateConnection = () => {
    setConnectionStatus('connecting');
    
    setTimeout(() => {
      setConnectionStatus('connected');
      onConnect({
        deviceId: 'ESP32_CLIMATE_001',
        deviceType: 'ESP32',
        sensorTypes: ['temperature', 'humidity', 'CO2', 'air_quality'],
        location: {
          latitude: 3.1390,
          longitude: 101.6869
        },
        status: 'connected'
      });
    }, 3000);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Download className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Download Firmware</h3>
        <p className="text-gray-600">
          Choose and download the appropriate firmware for your sensor hardware
        </p>
      </div>

      <div className="grid gap-4">
        {firmwareOptions.map((firmware) => (
          <div
            key={firmware.id}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedFirmware === firmware.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedFirmware(firmware.id)}
          >
            <div className="flex items-start space-x-4">
              <div className="text-blue-500 mt-1">
                {firmware.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{firmware.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{firmware.description}</p>
                
                <div className="mb-3">
                  <h5 className="text-xs font-medium text-gray-700 mb-1">Requirements:</h5>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {firmware.requirements.map((req, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadFirmware(firmware.id);
                  }}
                  className="inline-flex items-center px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download {firmware.filename}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <button
          onClick={downloadAllFirmware}
          className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Download All Firmware Files
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Setup Instructions:</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Download the appropriate firmware for your hardware</li>
          <li>2. Update the WiFi credentials and backend URL in the code</li>
          <li>3. Flash the firmware to your device</li>
          <li>4. Connect your sensors according to the pin configuration</li>
          <li>5. Power on your device and proceed to the next step</li>
        </ol>
      </div>

      <button
        onClick={() => setCurrentStep(2)}
        disabled={!selectedFirmware}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          selectedFirmware
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        Continue to Connection
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Wifi className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Sensor</h3>
        <p className="text-gray-600">
          Make sure your sensor device is powered on and connected to WiFi
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Selected Firmware:</h4>
        <div className="flex items-center space-x-3">
          {firmwareOptions.find(f => f.id === selectedFirmware)?.icon}
          <span className="text-gray-700">
            {firmwareOptions.find(f => f.id === selectedFirmware)?.name}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
          <span className="text-gray-700">Device Status</span>
          <div className="flex items-center space-x-2">
            {connectionStatus === 'idle' && (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-gray-500">Not Connected</span>
              </>
            )}
            {connectionStatus === 'connecting' && (
              <>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-yellow-600">Connecting...</span>
              </>
            )}
            {connectionStatus === 'connected' && (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Connected</span>
              </>
            )}
            {connectionStatus === 'error' && (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-600">Connection Failed</span>
              </>
            )}
          </div>
        </div>

        {connectionStatus === 'connecting' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-blue-700">Searching for sensor device...</span>
            </div>
          </div>
        )}

        {connectionStatus === 'connected' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-green-800 font-medium">Sensor Connected Successfully!</p>
                <p className="text-green-700 text-sm">Device ID: ESP32_CLIMATE_001</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => setCurrentStep(1)}
          className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Download
        </button>
        
        {connectionStatus !== 'connected' ? (
          <button
            onClick={simulateConnection}
            disabled={connectionStatus === 'connecting'}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              connectionStatus === 'connecting'
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect Sensor'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentStep(3)}
            className="flex-1 py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Continue to Setup
          </button>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Settings className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Sensor Configuration</h3>
        <p className="text-gray-600">
          Your sensor is connected and ready to start collecting data
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-green-900 mb-2">Device Information</h4>
            <div className="space-y-1 text-sm text-green-800">
              <p>Device ID: ESP32_CLIMATE_001</p>
              <p>Type: ESP32</p>
              <p>Firmware: {firmwareOptions.find(f => f.id === selectedFirmware)?.name}</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-green-900 mb-2">Sensors Detected</h4>
            <div className="space-y-1 text-sm text-green-800">
              <p>✓ Temperature (DHT22)</p>
              <p>✓ Humidity (DHT22)</p>
              <p>✓ CO2 (MQ-135)</p>
              <p>✓ Air Quality (MQ-135)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Your sensor will automatically start sending data every 60 seconds</li>
          <li>• Data will be encrypted and stored on IPFS</li>
          <li>• Metadata will be recorded on Oasis Sapphire blockchain</li>
          <li>• You can monitor your sensor's performance in the dashboard</li>
        </ul>
      </div>

      <button
        onClick={() => {
          // Reset for demo purposes
          setCurrentStep(1);
          setConnectionStatus('idle');
          setSelectedFirmware('');
        }}
        className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Complete Setup
      </button>
    </div>
  );

  const stepLabels = ['Download', 'Connect', 'Configure'];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === currentStep
                      ? 'bg-blue-500 text-white'
                      : step < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
                </div>
                <span className={`text-xs mt-1 ${
                  step === currentStep ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}>
                  {stepLabels[step - 1]}
                </span>
              </div>
              {step < 3 && (
                <div
                  className={`w-12 h-0.5 ${
                    step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default SensorConnection;
