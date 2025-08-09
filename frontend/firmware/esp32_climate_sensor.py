# ESP32 Climate Sensor - MicroPython
# Devmatch Climate Data Marketplace
# Compatible with DHT22 and MQ-135 sensors

import network
import urequests
import ujson
import time
import machine
from machine import Pin, ADC
import dht

# Configuration
WIFI_SSID = "Your_WiFi_SSID"
WIFI_PASSWORD = "Your_WiFi_Password"
BACKEND_URL = "https://your-backend-domain.com"
DEVICE_SECRET = "your_device_secret_key"
DEVICE_ID = "ESP32_CLIMATE_001"

# Pin Configuration
DHT_PIN = 4
MQ135_PIN = 34
LED_PIN = 2

# Initialize sensors
dht_sensor = dht.DHT22(Pin(DHT_PIN))
mq135_adc = ADC(Pin(MQ135_PIN))
mq135_adc.atten(ADC.ATTN_11DB)
led = Pin(LED_PIN, Pin.OUT)

# WiFi connection
def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    
    if not wlan.isconnected():
        print('Connecting to WiFi...')
        wlan.connect(WIFI_SSID, WIFI_PASSWORD)
        
        timeout = 0
        while not wlan.isconnected() and timeout < 30:
            time.sleep(1)
            timeout += 1
            
        if wlan.isconnected():
            print('WiFi connected:', wlan.ifconfig())
            return True
        else:
            print('WiFi connection failed')
            return False
    return True

# Read sensors
def read_sensors():
    try:
        # Read DHT22
        dht_sensor.measure()
        temperature = dht_sensor.temperature()
        humidity = dht_sensor.humidity()
        
        # Read MQ-135 (Air Quality)
        mq135_raw = mq135_adc.read()
        # Convert to ppm (simplified calculation)
        co2_ppm = (mq135_raw / 4095.0) * 1000
        air_quality = "Good" if co2_ppm < 400 else "Moderate" if co2_ppm < 1000 else "Poor"
        
        return {
            "temperature": temperature,
            "humidity": humidity,
            "co2": co2_ppm,
            "air_quality": air_quality,
            "raw_mq135": mq135_raw
        }
    except Exception as e:
        print("Sensor read error:", e)
        return None

# Send data to backend
def send_data(sensor_data):
    try:
        payload = {
            "deviceId": DEVICE_ID,
            "timestamp": time.time(),
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
        
        response = urequests.post(
            f"{BACKEND_URL}/api/data/submit",
            data=ujson.dumps(payload),
            headers=headers
        )
        
        if response.status_code == 200:
            print("Data sent successfully")
            led.on()
            time.sleep(0.1)
            led.off()
            return True
        else:
            print(f"Failed to send data: {response.status_code}")
            return False
            
    except Exception as e:
        print("Send data error:", e)
        return False

# Main loop
def main():
    print("Starting ESP32 Climate Sensor...")
    
    # Connect to WiFi
    if not connect_wifi():
        print("Cannot continue without WiFi")
        return
    
    print("Sensor initialized. Starting data collection...")
    
    while True:
        try:
            # Read sensor data
            sensor_data = read_sensors()
            
            if sensor_data:
                print(f"Temperature: {sensor_data['temperature']}°C")
                print(f"Humidity: {sensor_data['humidity']}%")
                print(f"CO2: {sensor_data['co2']} ppm")
                print(f"Air Quality: {sensor_data['air_quality']}")
                
                # Send to backend
                send_data(sensor_data)
            else:
                print("Failed to read sensors")
            
            # Wait 60 seconds before next reading
            time.sleep(60)
            
        except KeyboardInterrupt:
            print("Stopping sensor...")
            break
        except Exception as e:
            print("Main loop error:", e)
            time.sleep(10)

if __name__ == "__main__":
    main()
