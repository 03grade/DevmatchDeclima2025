import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Activity, Zap, Shield, TrendingUp, BarChart3, Eye } from 'lucide-react';

interface SensorValidatorProps {
  onValidationComplete: (isValid: boolean, score: number) => void;
}

const SensorValidator: React.FC<SensorValidatorProps> = ({ onValidationComplete }) => {
  const [dataPointsCollected, setDataPointsCollected] = useState(0);
  const [isCollecting, setIsCollecting] = useState(true);
  const [showValidationButton, setShowValidationButton] = useState(false);
  const [validationStarted, setValidationStarted] = useState(false);
  const [validationStep, setValidationStep] = useState(0);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  const validationSteps = [
    { name: 'Data Integrity Check', icon: <Shield className="w-5 h-5" />, duration: 2000 },
    { name: 'Signal Quality Analysis', icon: <Activity className="w-5 h-5" />, duration: 1500 },
    { name: 'Accuracy Verification', icon: <TrendingUp className="w-5 h-5" />, duration: 2500 },
  ];

  // Simulate data collection
  useEffect(() => {
    if (isCollecting && dataPointsCollected < 5) {
      const timer = setTimeout(() => {
        setDataPointsCollected(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (dataPointsCollected >= 5) {
      setIsCollecting(false);
      setShowValidationButton(true);
    }
  }, [dataPointsCollected, isCollecting]);

  // Handle validation process
  useEffect(() => {
    if (validationStarted && validationStep < validationSteps.length) {
      const timer = setTimeout(() => {
        const stepResult = {
          step: validationSteps[validationStep].name,
          score: Math.floor(Math.random() * 20) + 80,
          status: 'passed',
          details: generateStepDetails(validationStep)
        };

        setValidationResults(prev => [...prev, stepResult]);
        setValidationStep(prev => prev + 1);
      }, validationSteps[validationStep].duration);

      return () => clearTimeout(timer);
    } else if (validationStarted && validationStep === validationSteps.length && validationResults.length > 0) {
      const avgScore = validationResults.reduce((sum, result) => sum + result.score, 0) / validationResults.length;
      setOverallScore(Math.round(avgScore));
      
      setTimeout(() => {
        onValidationComplete(avgScore >= 85, Math.round(avgScore));
      }, 2000);
    }
  }, [validationStarted, validationStep, validationResults, onValidationComplete]);

  const generateStepDetails = (step: number) => {
    const details = [
      ['Checksum verification: PASSED', 'Data consistency: 98.5%', 'Timestamp accuracy: VERIFIED'],
      ['Signal strength: 92%', 'Noise ratio: 0.02%', 'Connection stability: EXCELLENT'],
      ['Calibration status: VALID', 'Measurement precision: ±0.1°C', 'Range compliance: CONFIRMED'],
    ];
    return details[step] || [];
  };

  const startValidation = () => {
    setValidationStarted(true);
  };

  if (!validationStarted) {
    return (
      <div className="space-y-6">
        {/* DATA Validation Engine Header */}
        <div className="tech-panel p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 border-2 border-custom-green rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-custom-green" />
            </div>
            <div>
              <h2 className="text-2xl font-cyber font-bold text-white tracking-wider">
                DATA VALIDATION ENGINE
              </h2>
            </div>
          </div>

          {/* Ready for ROFL Validation Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 className="w-6 h-6 text-custom-green" />
              <h3 className="text-xl font-cyber font-bold text-white tracking-wide">
                READY FOR DATA VALIDATION
              </h3>
            </div>
            <p className="text-sm font-tech text-gray-400 mb-6">
              Minimum 5 readings required for validation
            </p>

            {/* Data Points Collection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="font-tech text-gray-300">DATA POINTS COLLECTED:</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-cyber text-custom-green font-bold text-lg">
                    {dataPointsCollected}/5
                  </span>
                  <span className="font-tech text-gray-400 text-sm">minimum</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-800 border border-gray-700 h-2 relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(dataPointsCollected / 5) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-custom-green to-yellow-400"
                />
                {isCollecting && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
                )}
              </div>

              {/* Collection Status */}
              {isCollecting && (
                <div className="flex items-center space-x-2 text-sm font-tech text-gray-400">
                  <div className="w-2 h-2 bg-custom-green rounded-full animate-pulse"></div>
                  <span>Collecting sensor data...</span>
                </div>
              )}
            </div>
          </div>

          {/* Start Validation Button */}
          {showValidationButton && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <button
                onClick={startValidation}
                className="w-full h-16 bg-gradient-to-r from-custom-green to-yellow-400 text-black font-cyber font-bold text-xl tracking-wider hover:shadow-lg hover:shadow-custom-green/30 transition-all duration-300 flex items-center justify-center space-x-3"
                style={{
                  clipPath: 'polygon(20px 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%)'
                }}
              >
                <Shield className="w-6 h-6" />
                <span>START DATA VALIDATION</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // Validation in progress
  return (
    <div className="space-y-6">
      <div className="tech-panel p-6">
        <h3 className="font-cyber font-bold text-custom-green text-xl mb-6 tracking-wide">
          VALIDATION PROTOCOL ACTIVE
        </h3>

        <div className="space-y-4">
          {validationSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center justify-between p-4 border rounded ${
                index < validationStep 
                  ? 'border-custom-green bg-custom-green bg-opacity-10' 
                  : index === validationStep
                  ? 'border-yellow-500 bg-yellow-500 bg-opacity-10'
                  : 'border-gray-700 bg-gray-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`${
                  index < validationStep 
                    ? 'text-custom-green' 
                    : index === validationStep
                    ? 'text-yellow-500'
                    : 'text-gray-500'
                }`}>
                  {step.icon}
                </div>
                <span className={`font-tech ${
                  index < validationStep 
                    ? 'text-white' 
                    : index === validationStep
                    ? 'text-yellow-400'
                    : 'text-gray-400'
                }`}>
                  {step.name}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {index < validationStep && (
                  <>
                    <span className="font-cyber text-custom-green font-bold">
                      {validationResults[index]?.score}%
                    </span>
                    <CheckCircle className="w-5 h-5 text-custom-green" />
                  </>
                )}
                {index === validationStep && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                    <span className="font-tech text-yellow-400 text-sm">PROCESSING...</span>
                  </div>
                )}
                {index > validationStep && (
                  <span className="font-tech text-gray-500 text-sm">PENDING</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {validationResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <h4 className="font-cyber text-white font-bold">VALIDATION DETAILS</h4>
            {validationResults.map((result, index) => (
              <div key={index} className="p-4 bg-black border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-cyber text-custom-green text-sm">{result.step}</h5>
                  <span className="font-cyber text-custom-green font-bold">{result.score}%</span>
                </div>
                <div className="space-y-1">
                  {result.details.map((detail: string, detailIndex: number) => (
                    <p key={detailIndex} className="font-tech text-xs text-gray-400">
                      • {detail}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {overallScore > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-6 bg-custom-green bg-opacity-20 border border-custom-green rounded"
          >
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-black mx-auto mb-4" />
              <h3 className="font-cyber font-bold text-black text-2xl mb-2">
                VALIDATION COMPLETE
              </h3>
              <p className="font-tech text-black mb-4">
                Sensor has passed all validation tests with an overall score of
              </p>
              <div className="text-4xl font-cyber font-bold text-black mb-4 cyber-glow">
                {overallScore}%
              </div>
              
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SensorValidator;
