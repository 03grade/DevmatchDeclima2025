import React, { useState } from 'react';
import { ArrowLeft, Cpu, Zap, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import SensorConnection from '../components/SensorConnection';

const ConnectSensor: React.FC = () => {
  const [connectedSensor, setConnectedSensor] = useState<any>(null);

  const handleSensorConnect = (sensorData: any) => {
    setConnectedSensor(sensorData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">Connect New Sensor</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!connectedSensor ? (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Connect Your Climate Sensor
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Download the appropriate firmware for your hardware and connect your sensor to start earning ROSE tokens from climate data collection.
              </p>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Cpu className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Multiple Hardware Support
                </h3>
                <p className="text-gray-600">
                  Compatible with ESP32, Arduino, and Raspberry Pi. Download the right firmware for your setup.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Automatic Data Collection
                </h3>
                <p className="text-gray-600">
                  Once connected, your sensor automatically collects and transmits data every minute.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Secure & Encrypted
                </h3>
                <p className="text-gray-600">
                  All data is encrypted with AES-256 and stored securely on IPFS and Oasis Sapphire.
                </p>
              </div>
            </div>

            {/* Connection Component */}
            <SensorConnection onConnect={handleSensorConnect} />
          </>
        ) : (
          /* Success State */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Cpu className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Sensor Connected Successfully!
              </h2>
              
              <p className="text-gray-600 mb-6">
                Your {connectedSensor.deviceType} sensor is now connected and will start collecting climate data automatically.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Device ID:</span>
                    <p className="font-medium text-gray-900">{connectedSensor.deviceId}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Device Type:</span>
                    <p className="font-medium text-gray-900">{connectedSensor.deviceType}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Sensors:</span>
                    <p className="font-medium text-gray-900">{connectedSensor.sensorTypes.length} sensors</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className="font-medium text-green-600 capitalize">{connectedSensor.status}</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <Link
                  to="/dashboard"
                  className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => setConnectedSensor(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Connect Another Sensor
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectSensor;
