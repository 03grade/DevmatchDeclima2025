/*
 * Arduino Climate Sensor - C++
 * Devmatch Climate Data Marketplace
 * Compatible with ESP32/ESP8266 and DHT22/MQ-135 sensors
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// Configuration
const char* WIFI_SSID = "Your_WiFi_SSID";
const char* WIFI_PASSWORD = "Your_WiFi_Password";
const char* BACKEND_URL = "https://your-backend-domain.com";
const char* DEVICE_SECRET = "your_device_secret_key";
const char* DEVICE_ID = "ESP32_CLIMATE_001";

// Pin Configuration
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define MQ135_PIN A0
#define LED_PIN 2

// Initialize sensors
DHT dht(DHT_PIN, DHT_TYPE);

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Initialize DHT sensor
  dht.begin();
  
  // Connect to WiFi
  connectWiFi();
  
  Serial.println("Arduino Climate Sensor initialized");
}

void loop() {
  // Read sensor data
  SensorData data = readSensors();
  
  if (data.valid) {
    // Print readings
    Serial.println("=== Sensor Readings ===");
    Serial.printf("Temperature: %.2f°C\n", data.temperature);
    Serial.printf("Humidity: %.2f%%\n", data.humidity);
    Serial.printf("CO2: %.2f ppm\n", data.co2);
    Serial.printf("Air Quality: %s\n", data.airQuality.c_str());
    
    // Send to backend
    sendData(data);
  } else {
    Serial.println("Failed to read sensors");
  }
  
  // Wait 60 seconds
  delay(60000);
}

struct SensorData {
  bool valid;
  float temperature;
  float humidity;
  float co2;
  String airQuality;
  int rawMQ135;
};

void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  Serial.print("Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("WiFi connection failed!");
  }
}

SensorData readSensors() {
  SensorData data;
  data.valid = false;
  
  // Read DHT22
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  
  if (isnan(temp) || isnan(hum)) {
    Serial.println("Failed to read from DHT sensor!");
    return data;
  }
  
  // Read MQ-135
  int mq135Raw = analogRead(MQ135_PIN);
  float co2Ppm = (mq135Raw / 4095.0) * 1000; // Simplified calculation
  
  String airQuality;
  if (co2Ppm < 400) {
    airQuality = "Good";
  } else if (co2Ppm < 1000) {
    airQuality = "Moderate";
  } else {
    airQuality = "Poor";
  }
  
  data.valid = true;
  data.temperature = temp;
  data.humidity = hum;
  data.co2 = co2Ppm;
  data.airQuality = airQuality;
  data.rawMQ135 = mq135Raw;
  
  return data;
}

void sendData(SensorData sensorData) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, cannot send data");
    return;
  }
  
  HTTPClient http;
  http.begin(String(BACKEND_URL) + "/api/data/submit");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + DEVICE_SECRET);
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["deviceId"] = DEVICE_ID;
  doc["timestamp"] = WiFi.getTime();
  
  JsonObject location = doc.createNestedObject("location");
  location["latitude"] = 3.1390;  // Update with actual location
  location["longitude"] = 101.6869;
  
  JsonObject data = doc.createNestedObject("data");
  data["temperature"] = sensorData.temperature;
  data["humidity"] = sensorData.humidity;
  data["co2"] = sensorData.co2;
  data["air_quality"] = sensorData.airQuality;
  data["raw_mq135"] = sensorData.rawMQ135;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode == 200) {
    Serial.println("Data sent successfully");
    // Blink LED to indicate success
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
  } else {
    Serial.printf("Failed to send data: %d\n", httpResponseCode);
    String response = http.getString();
    Serial.println("Response: " + response);
  }
  
  http.end();
}
