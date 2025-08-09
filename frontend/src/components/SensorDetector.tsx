import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Code, Wifi, Play, CheckCircle, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SensorDetectorProps {
  onSensorDetected: (sensorData: any) => void;
  onNextStep?: () => void;
}

const SensorDetector: React.FC<SensorDetectorProps> = ({ onSensorDetected, onNextStep }) => {
  const navigate = useNavigate();
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedSensors, setDetectedSensors] = useState<any[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const firmwareScripts = [
    {
      id: 'esp32-micropython',
      name: 'ESP32 MicroPython',
      description: 'Climate sensor script for ESP32 with DHT22 and MQ-135',
      icon: <Code className="w-6 h-6" />,
      filename: 'esp32_climate_sensor.py',
      language: 'python'
    },
    {
      id: 'arduino-cpp',
      name: 'Arduino C++',
      description: 'Arduino IDE compatible script for ESP32/ESP8266',
      icon: <Code className="w-6 h-6" />,
      filename: 'arduino_climate_sensor.ino',
      language: 'cpp'
    },
    {
      id: 'raspberry-pi',
      name: 'Raspberry Pi Python',
      description: 'Python script for Raspberry Pi with GPIO sensors',
      icon: <Code className="w-6 h-6" />,
      filename: 'raspberry_pi_climate_sensor.py',
      language: 'python'
    }
  ];

  const getScriptContent = (scriptId: string): string => {
    const scripts = {
      'esp32-micropython': `# ESP32 Climate Sensor - MicroPython
# Devmatch Climate Data Marketplace
import network
import urequests
import ujson
import time
from machine import Pin, ADC
import dht

WIFI_SSID = "Your_WiFi_SSID"
WIFI_PASSWORD = "Your_WiFi_Password"
BACKEND_URL = "https://your-backend-domain.com"
DEVICE_SECRET = "your_device_secret_key"
DEVICE_ID = "ESP32_CLIMATE_001"

dht_sensor = dht.DHT22(Pin(4))
mq135_adc = ADC(Pin(34))
led = Pin(2, Pin.OUT)

def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        wlan.connect(WIFI_SSID, WIFI_PASSWORD)
        while not wlan.isconnected():
            time.sleep(1)
    return wlan.isconnected()

def read_sensors():
    try:
        dht_sensor.measure()
        temperature = dht_sensor.temperature()
        humidity = dht_sensor.humidity()
        co2_ppm = (mq135_adc.read() / 4095.0) * 1000
        return {
            "temperature": temperature,
            "humidity": humidity,
            "co2": co2_ppm,
            "air_quality": "Good" if co2_ppm < 400 else "Poor"
        }
    except:
        return None

def main():
    if connect_wifi():
        while True:
            data = read_sensors()
            if data:
                print(f"Temp: {data['temperature']}°C, Humidity: {data['humidity']}%")
            time.sleep(60)

if __name__ == "__main__":
    main()`,

      'arduino-cpp': `/*
 * Arduino Climate Sensor - C++
 * Devmatch Climate Data Marketplace
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

const char* WIFI_SSID = "Your_WiFi_SSID";
const char* WIFI_PASSWORD = "Your_WiFi_Password";
const char* BACKEND_URL = "https://your-backend-domain.com";

#define DHT_PIN 4
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("WiFi connected");
}

void loop() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  
  if (!isnan(temp) && !isnan(hum)) {
    Serial.printf("Temperature: %.2f°C, Humidity: %.2f%%\\n", temp, hum);
  }
  
  delay(60000);
}`,

      'raspberry-pi': `#!/usr/bin/env python3
"""
Raspberry Pi Climate Sensor - Python
Devmatch Climate Data Marketplace
"""
import time
import requests
import logging

BACKEND_URL = "https://your-backend-domain.com"
DEVICE_SECRET = "your_device_secret_key"
DEVICE_ID = "RPI_CLIMATE_001"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ClimateSensor:
    def __init__(self):
        logger.info("Raspberry Pi Climate Sensor initialized")
    
    def read_sensors(self):
        # Simulated sensor readings
        import random
        return {
            "temperature": round(random.uniform(20, 30), 2),
            "humidity": round(random.uniform(40, 80), 2),
            "co2": round(random.uniform(300, 800), 2),
            "air_quality": "Good"
        }
    
    def run(self):
        while True:
            data = self.read_sensors()
            logger.info(f"Temperature: {data['temperature']}°C")
            logger.info(f"Humidity: {data['humidity']}%")
            time.sleep(60)

if __name__ == "__main__":
    sensor = ClimateSensor()
    sensor.run()`
    };

    return scripts[scriptId as keyof typeof scripts] || '';
  };

  const downloadScript = (script: any) => {
    const content = getScriptContent(script.id);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = script.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setDownloadSuccess(script.filename);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleScriptSelect = (script: any) => {
    setSelectedScript(script.id);
  };

  const startScan = () => {
    setIsScanning(true);
    setScanComplete(false);
    setDetectedSensors([]);

    setTimeout(() => {
      const mockSensors = [
        {
          id: 'ESP32_TEMP_001',
          name: 'ESP32 Temperature Sensor',
          type: 'temperature',
          status: 'online',
          signal: 85,
          location: { latitude: 3.1390, longitude: 101.6869 }
        },
        {
          id: 'ESP32_HUMID_002',
          name: 'ESP32 Humidity Sensor',
          type: 'humidity',
          status: 'online',
          signal: 92,
          location: { latitude: 3.1395, longitude: 101.6875 }
        }
      ];

      setDetectedSensors(mockSensors);
      setIsScanning(false);
      setScanComplete(true);
    }, 3000);
  };

  const selectSensor = (sensor: any) => {
    const sensorData = {
      type: sensor.type,
      deviceId: sensor.id,
      location: sensor.location,
      timeGranularity: 'minutes',
      unit: sensor.type === 'temperature' ? '°C' : '%',
      range: sensor.type === 'temperature' ? [-40, 80] : [0, 100],
      name: sensor.name,
      status: sensor.status,
      signal: sensor.signal
    };

    // Call the parent callback to store sensor data
    onSensorDetected(sensorData);

    // Always call onNextStep to proceed to validation step
    if (onNextStep) {
      onNextStep();
    }
  };

  return (
    <div className="space-y-6">
      {downloadSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          <span className="font-tech">Downloaded {downloadSuccess} successfully!</span>
          <button
            onClick={() => setDownloadSuccess(null)}
            className="ml-3 text-white hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <div className="text-center mb-8">
        <h3 className="font-cyber font-bold text-custom-green text-2xl mb-4 holo-text">
          DOWNLOAD FIRMWARE SCRIPTS
        </h3>
        <p className="font-tech text-gray-300">
          Select and download the appropriate firmware script for your sensor device
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {firmwareScripts.map((script) => (
          <motion.div
            key={script.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`tech-panel p-6 cursor-pointer transition-all duration-300 ${
              selectedScript === script.id 
                ? 'border-custom-green bg-custom-green bg-opacity-10' 
                : 'hover:border-gray-600'
            }`}
            onClick={() => handleScriptSelect(script)}
          >
            <div className="flex items-center mb-4">
              <div className="text-custom-green mr-3">
                {script.icon}
              </div>
              <h4 className="font-cyber font-bold text-white">
                {script.name}
              </h4>
            </div>
            
            <p className="font-tech text-gray-400 text-sm mb-4">
              {script.description}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="font-tech text-xs text-gray-500">
                {script.filename}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadScript(script);
                }}
                className="flex items-center text-custom-green hover:text-white transition-colors"
              >
                <Download className="w-4 h-4 mr-1" />
                <span className="font-tech text-xs">DOWNLOAD</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedScript && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="tech-panel p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-cyber text-custom-green">INSTALLATION INSTRUCTIONS</h4>
            <button
              onClick={() => {
                const script = firmwareScripts.find(s => s.id === selectedScript);
                if (script) downloadScript(script);
              }}
              className="cyber-btn px-4 py-2 font-bold tracking-wider flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              <span>DOWNLOAD SCRIPT</span>
            </button>
          </div>
          
          <div className="p-4 bg-opacity-10 border border-custom-green">
            <div className="font-tech text-sm text-gray-300 space-y-1">
              <p>1. Download the script file</p>
              <p>2. Update WiFi credentials and backend URL</p>
              <p>3. Flash to your device using appropriate IDE</p>
              <p>4. Connect sensors according to pin configuration</p>
              <p>5. Power on device and monitor serial output</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="tech-panel p-6">
        <div className="text-center mb-6">
          <h3 className="font-cyber font-bold text-custom-green text-2xl mb-4 holo-text">
            SENSOR DISCOVERY
          </h3>
          <p className="font-tech text-gray-300 mb-6">
            Scan for nearby climate sensors and connect to start collecting data
          </p>
          
          <button
            onClick={startScan}
            disabled={isScanning}
            className={`cyber-btn px-8 py-3 font-bold tracking-wider flex items-center mx-auto ${
              isScanning ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isScanning ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-custom-green mr-3"></div>
                <span>SCANNING...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-3" />
                <span>START SCAN</span>
              </>
            )}
          </button>
        </div>

        {detectedSensors.length > 0 && (
          <div className="mt-6">
            <h4 className="font-cyber text-custom-green mb-4">DETECTED SENSORS</h4>
            <div className="grid gap-4">
              {detectedSensors.map((sensor) => (
                <motion.div
                  key={sensor.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded hover:border-custom-green transition-colors cursor-pointer group"
                  onClick={() => selectSensor(sensor)}
                >
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-custom-green rounded-full mr-3 animate-pulse"></div>
                    <div>
                      <h5 className="font-cyber text-white">{sensor.name}</h5>
                      <p className="font-tech text-sm text-gray-400">{sensor.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center text-custom-green">
                      <Wifi className="w-4 h-4 mr-2" />
                      <span className="font-tech text-sm">{sensor.signal}%</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-custom-green transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-900 bg-opacity-20 border border-blue-600 rounded">
              <p className="font-tech text-blue-400 text-sm text-center">
                Click on a sensor to proceed to validation step
              </p>
            </div>
          </div>
        )}

        {scanComplete && detectedSensors.length === 0 && (
          <div className="text-center mt-6 p-4 bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded">
            <p className="font-tech text-yellow-400">No sensors detected. Make sure your devices are powered on and connected.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorDetector;
