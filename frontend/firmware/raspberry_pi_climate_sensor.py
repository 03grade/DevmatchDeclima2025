#!/usr/bin/env python3
"""
Raspberry Pi Climate Sensor - Python
Devmatch Climate Data Marketplace
Compatible with DHT22 and MQ-135 sensors via GPIO
"""

import time
import json
import requests
import RPi.GPIO as GPIO
import Adafruit_DHT
from datetime import datetime
import logging

# Configuration
WIFI_SSID = "Your_WiFi_SSID"  # Not used directly, ensure Pi is connected
WIFI_PASSWORD = "Your_WiFi_Password"  # Not used directly
BACKEND_URL = "https://your-backend-domain.com"
DEVICE_SECRET = "your_device_secret_key"
DEVICE_ID = "RPI_CLIMATE_001"

# Pin Configuration
DHT_PIN = 4
MQ135_PIN = 18  # For ADC via MCP3008
LED_PIN = 18

# Sensor Configuration
DHT_SENSOR = Adafruit_DHT.DHT22

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ClimateSensor:
    def __init__(self):
        self.setup_gpio()
        logger.info("Raspberry Pi Climate Sensor initialized")
    
    def setup_gpio(self):
        """Initialize GPIO pins"""
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(LED_PIN, GPIO.OUT)
        GPIO.output(LED_PIN, GPIO.LOW)
    
    def read_sensors(self):
        """Read all sensor data"""
        try:
            # Read DHT22
            humidity, temperature = Adafruit_DHT.read_retry(DHT_SENSOR, DHT_PIN)
            
            if humidity is None or temperature is None:
                logger.error("Failed to read DHT22 sensor")
                return None
            
            # Read MQ-135 (simplified - would need ADC like MCP3008 for real implementation)
            # For demo purposes, we'll simulate the reading
            import random
            mq135_raw = random.randint(100, 1000)
            co2_ppm = (mq135_raw / 1024.0) * 1000  # Simplified calculation
            
            air_quality = "Good" if co2_ppm < 400 else "Moderate" if co2_ppm < 1000 else "Poor"
            
            return {
                "temperature": round(temperature, 2),
                "humidity": round(humidity, 2),
                "co2": round(co2_ppm, 2),
                "air_quality": air_quality,
                "raw_mq135": mq135_raw
            }
            
        except Exception as e:
            logger.error(f"Sensor read error: {e}")
            return None
    
    def send_data(self, sensor_data):
        """Send sensor data to backend"""
        try:
            payload = {
                "deviceId": DEVICE_ID,
                "timestamp": int(time.time()),
                "location": {
                    "latitude": 3.1390,  # Update with actual location
                    "longitude": 101.6869
                },
                "data": sensor_data
            }
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {DEVICE_SECRET}"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/api/data/submit",
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                logger.info("Data sent successfully")
                self.blink_led()
                return True
            else:
                logger.error(f"Failed to send data: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error: {e}")
            return False
        except Exception as e:
            logger.error(f"Send data error: {e}")
            return False
    
    def blink_led(self):
        """Blink LED to indicate successful data transmission"""
        GPIO.output(LED_PIN, GPIO.HIGH)
        time.sleep(0.1)
        GPIO.output(LED_PIN, GPIO.LOW)
    
    def run(self):
        """Main sensor loop"""
        logger.info("Starting climate data collection...")
        
        try:
            while True:
                # Read sensor data
                sensor_data = self.read_sensors()
                
                if sensor_data:
                    logger.info("=== Sensor Readings ===")
                    logger.info(f"Temperature: {sensor_data['temperature']}°C")
                    logger.info(f"Humidity: {sensor_data['humidity']}%")
                    logger.info(f"CO2: {sensor_data['co2']} ppm")
                    logger.info(f"Air Quality: {sensor_data['air_quality']}")
                    
                    # Send to backend
                    self.send_data(sensor_data)
                else:
                    logger.warning("Failed to read sensors")
                
                # Wait 60 seconds before next reading
                time.sleep(60)
                
        except KeyboardInterrupt:
            logger.info("Stopping sensor...")
        except Exception as e:
            logger.error(f"Main loop error: {e}")
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Clean up GPIO resources"""
        GPIO.cleanup()
        logger.info("GPIO cleanup completed")

def main():
    """Main function"""
    sensor = ClimateSensor()
    sensor.run()

if __name__ == "__main__":
    main()
