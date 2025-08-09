import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SensorDetector from '../components/SensorDetector';
import SensorValidator from '../components/SensorValidator';
import SensorConfiguration from '../components/SensorConfiguration';
import NFADeployment from '../components/NFADeployment';

const SensorSetup: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [sensorData, setSensorData] = useState<any>(null);
  const [configurationData, setConfigurationData] = useState<any>(null);

  const steps = [
    { id: 1, name: 'DOWNLOAD', description: 'Download firmware and connect sensor' },
    { id: 2, name: 'VALIDATE', description: 'Validate sensor data quality' },
    { id: 3, name: 'CONFIGURE', description: 'Configure sensor parameters' },
    { id: 4, name: 'DEPLOY', description: 'Deploy sensor to blockchain' }
  ];

  const handleSensorDetected = (detectedSensorData: any) => {
    console.log('Sensor detected:', detectedSensorData);
    setSensorData(detectedSensorData);
  };

  const handleNextStep = () => {
    console.log('Moving to next step, current:', currentStep);
    setCurrentStep(prev => prev + 1);
  };

  const handleValidation = (isValid: boolean, score: number) => {
    console.log('Validation complete:', isValid, score);
    if (isValid) {
      setTimeout(() => setCurrentStep(3), 1000);
    }
  };

  const handleConfiguration = (configData: any) => {
    console.log('Configuration complete:', configData);
    setConfigurationData(configData);
    setCurrentStep(4);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-cyber font-bold holo-text mb-4">
                ESTABLISH <span className="text-custom-green">NEURAL LINK</span>
              </h2>
              <p className="text-lg font-tech text-gray-300">
                <span className="text-custom-green">[SCANNING...]</span> Connect to your environmental sensor device for validation
              </p>
            </div>
            <SensorDetector 
              onSensorDetected={handleSensorDetected} 
              onNextStep={handleNextStep}
            />
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-cyber font-bold holo-text mb-4">
                DATA <span className="text-custom-green">VALIDATION</span>
              </h2>
              <p className="text-lg font-tech text-gray-300">
                <span className="text-custom-green">[PROCESSING...]</span> Validating sensor data integrity and quality
              </p>
            </div>
            <SensorValidator onValidationComplete={handleValidation} />
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-cyber font-bold holo-text mb-4">
                SENSOR <span className="text-custom-green">CONFIGURATION</span>
              </h2>
              <p className="text-lg font-tech text-gray-300">
                <span className="text-custom-green">[CONFIGURING...]</span> Configure sensor details and review metadata
              </p>
            </div>
            <SensorConfiguration 
              sensorData={sensorData}
              onConfigurationComplete={handleConfiguration}
            />
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-cyber font-bold holo-text mb-4">
                SENSOR <span className="text-custom-green">DEPLOYMENT</span>
              </h2>
              <p className="text-lg font-tech text-gray-300">
                <span className="text-custom-green">[DEPLOYING...]</span> Minting your sensor
              </p>
            </div>
            <NFADeployment 
              sensorSpecs={sensorData}
              configurationData={configurationData}
              deviceId={sensorData?.deviceId}
              qualityScore={95}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/dashboard"
              className="flex items-center text-gray-400 hover:text-custom-green transition-colors font-tech"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              RETURN TO DASHBOARD
            </Link>
            
            <div className="text-right">
              <div className="text-sm font-tech text-gray-400">OASIS SAPPHIRE</div>
              <div className="text-xs font-tech text-custom-green">TESTNET</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ 
                      scale: currentStep === step.id ? 1.1 : 1,
                      backgroundColor: currentStep > step.id ? '#00ff88' : 
                                     currentStep === step.id ? '#00ff88' : '#1f2937'
                    }}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-cyber font-bold border-2 ${
                      currentStep > step.id ? 'border-custom-green bg-custom-green text-black cyber-glow' :
                      currentStep === step.id ? 'border-custom-green bg-custom-green text-black cyber-glow' :
                      'border-gray-600 bg-gray-800 text-gray-400'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      step.id
                    )}
                  </motion.div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-cyber font-bold tracking-wider ${
                      currentStep >= step.id ? 'text-custom-green' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </div>
                    <div className="text-xs font-tech text-gray-400 max-w-20">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ 
                      scaleX: currentStep > step.id ? 1 : 0,
                      backgroundColor: currentStep > step.id ? '#00ff88' : '#374151'
                    }}
                    transition={{ duration: 0.5 }}
                    className="w-16 h-0.5 bg-gray-600"
                    style={{ transformOrigin: 'left' }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          {renderStepContent()}
        </motion.div>
      </div>
    </div>
  );
};

export default SensorSetup;
