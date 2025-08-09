import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';

// Expanded sensor location data with coordinates across all continents
const sensorLocations = [
  // North America - Major Cities
  { id: 1, lat: 40.7128, lng: -74.0060, name: 'New York', type: 'thermal' },
  { id: 2, lat: 37.7749, lng: -122.4194, name: 'San Francisco', type: 'thermal' },
  { id: 3, lat: 34.0522, lng: -118.2437, name: 'Los Angeles', type: 'hydro' },
  { id: 4, lat: 41.8781, lng: -87.6298, name: 'Chicago', type: 'atmo' },
  { id: 5, lat: 25.7617, lng: -80.1918, name: 'Miami', type: 'carbon' },
  { id: 6, lat: 45.5017, lng: -73.5673, name: 'Montreal', type: 'thermal' },
  { id: 7, lat: 49.2827, lng: -123.1207, name: 'Vancouver', type: 'hydro' },
  { id: 8, lat: 19.4326, lng: -99.1332, name: 'Mexico City', type: 'atmo' },
  { id: 9, lat: 39.7392, lng: -104.9903, name: 'Denver', type: 'carbon' },
  { id: 10, lat: 47.6062, lng: -122.3321, name: 'Seattle', type: 'hydro' },
  { id: 11, lat: 32.7767, lng: -96.7970, name: 'Dallas', type: 'thermal' },
  { id: 12, lat: 29.7604, lng: -95.3698, name: 'Houston', type: 'carbon' },
  { id: 13, lat: 33.4484, lng: -112.0740, name: 'Phoenix', type: 'thermal' },
  { id: 14, lat: 39.2904, lng: -76.6122, name: 'Baltimore', type: 'atmo' },
  { id: 15, lat: 42.3601, lng: -71.0589, name: 'Boston', type: 'hydro' },
  { id: 16, lat: 43.6532, lng: -79.3832, name: 'Toronto', type: 'thermal' },
  { id: 17, lat: 53.5461, lng: -113.4938, name: 'Edmonton', type: 'carbon' },
  { id: 18, lat: 20.6597, lng: -103.3496, name: 'Guadalajara', type: 'atmo' },
  { id: 19, lat: 23.6345, lng: -102.5528, name: 'Zacatecas', type: 'hydro' },
  { id: 20, lat: 18.5204, lng: -88.3026, name: 'Cancun', type: 'thermal' },
  
  // Europe - Major Cities
  { id: 21, lat: 51.5074, lng: -0.1278, name: 'London', type: 'hydro' },
  { id: 22, lat: 52.5200, lng: 13.4050, name: 'Berlin', type: 'thermal' },
  { id: 23, lat: 48.8566, lng: 2.3522, name: 'Paris', type: 'carbon' },
  { id: 24, lat: 41.9028, lng: 12.4964, name: 'Rome', type: 'atmo' },
  { id: 25, lat: 40.4168, lng: -3.7038, name: 'Madrid', type: 'thermal' },
  { id: 26, lat: 59.9139, lng: 10.7522, name: 'Oslo', type: 'hydro' },
  { id: 27, lat: 55.7558, lng: 37.6176, name: 'Moscow', type: 'hydro' },
  { id: 28, lat: 50.0755, lng: 14.4378, name: 'Prague', type: 'carbon' },
  { id: 29, lat: 47.4979, lng: 19.0402, name: 'Budapest', type: 'atmo' },
  { id: 30, lat: 59.3293, lng: 18.0686, name: 'Stockholm', type: 'thermal' },
  { id: 31, lat: 52.3676, lng: 4.9041, name: 'Amsterdam', type: 'hydro' },
  { id: 32, lat: 50.8503, lng: 4.3517, name: 'Brussels', type: 'carbon' },
  { id: 33, lat: 55.6761, lng: 12.5683, name: 'Copenhagen', type: 'atmo' },
  { id: 34, lat: 60.1699, lng: 24.9384, name: 'Helsinki', type: 'thermal' },
  { id: 35, lat: 47.0379, lng: 15.4340, name: 'Graz', type: 'hydro' },
  { id: 36, lat: 46.9480, lng: 7.4474, name: 'Bern', type: 'carbon' },
  { id: 37, lat: 38.7223, lng: -9.1393, name: 'Lisbon', type: 'atmo' },
  { id: 38, lat: 41.3851, lng: 2.1734, name: 'Barcelona', type: 'thermal' },
  { id: 39, lat: 45.4642, lng: 9.1900, name: 'Milan', type: 'hydro' },
  { id: 40, lat: 50.4501, lng: 30.5234, name: 'Kiev', type: 'carbon' },
  { id: 41, lat: 44.4268, lng: 26.1025, name: 'Bucharest', type: 'atmo' },
  { id: 42, lat: 42.6977, lng: 23.3219, name: 'Sofia', type: 'thermal' },
  { id: 43, lat: 37.9838, lng: 23.7275, name: 'Athens', type: 'hydro' },
  { id: 44, lat: 45.8150, lng: 15.9819, name: 'Zagreb', type: 'carbon' },
  
  // Asia - Major Cities
  { id: 45, lat: 35.6762, lng: 139.6503, name: 'Tokyo', type: 'atmo' },
  { id: 46, lat: 39.9042, lng: 116.4074, name: 'Beijing', type: 'carbon' },
  { id: 47, lat: 31.2304, lng: 121.4737, name: 'Shanghai', type: 'thermal' },
  { id: 48, lat: 19.0760, lng: 72.8777, name: 'Mumbai', type: 'carbon' },
  { id: 49, lat: 28.6139, lng: 77.2090, name: 'New Delhi', type: 'atmo' },
  { id: 50, lat: 1.3521, lng: 103.8198, name: 'Singapore', type: 'hydro' },
  { id: 51, lat: 13.7563, lng: 100.5018, name: 'Bangkok', type: 'thermal' },
  { id: 52, lat: 21.0285, lng: 105.8542, name: 'Hanoi', type: 'hydro' },
  { id: 53, lat: 14.5995, lng: 120.9842, name: 'Manila', type: 'atmo' },
  { id: 54, lat: -6.2088, lng: 106.8456, name: 'Jakarta', type: 'carbon' },
  { id: 55, lat: 3.1390, lng: 101.6869, name: 'Kuala Lumpur', type: 'thermal' },
  { id: 56, lat: 37.5665, lng: 126.9780, name: 'Seoul', type: 'hydro' },
  { id: 57, lat: 22.3193, lng: 114.1694, name: 'Hong Kong', type: 'atmo' },
  { id: 58, lat: 25.2048, lng: 55.2708, name: 'Dubai', type: 'carbon' },
  { id: 59, lat: 41.0082, lng: 28.9784, name: 'Istanbul', type: 'thermal' },
  { id: 60, lat: 34.6937, lng: 135.5023, name: 'Osaka', type: 'hydro' },
  { id: 61, lat: 23.1291, lng: 113.2644, name: 'Guangzhou', type: 'carbon' },
  { id: 62, lat: 30.5728, lng: 104.0668, name: 'Chengdu', type: 'atmo' },
  { id: 63, lat: 22.5431, lng: 114.0579, name: 'Shenzhen', type: 'thermal' },
  { id: 64, lat: 12.9716, lng: 77.5946, name: 'Bangalore', type: 'hydro' },
  { id: 65, lat: 17.3850, lng: 78.4867, name: 'Hyderabad', type: 'carbon' },
  { id: 66, lat: 26.9124, lng: 75.7873, name: 'Jaipur', type: 'atmo' },
  { id: 67, lat: 18.5204, lng: 73.8567, name: 'Pune', type: 'thermal' },
  { id: 68, lat: 33.6844, lng: 73.0479, name: 'Islamabad', type: 'hydro' },
  { id: 69, lat: 24.8607, lng: 67.0011, name: 'Karachi', type: 'carbon' },
  { id: 70, lat: 27.7172, lng: 85.3240, name: 'Kathmandu', type: 'atmo' },
  { id: 71, lat: 23.8103, lng: 90.4125, name: 'Dhaka', type: 'thermal' },
  { id: 72, lat: 6.9271, lng: 79.8612, name: 'Colombo', type: 'hydro' },
  { id: 73, lat: 16.7665, lng: 96.1951, name: 'Yangon', type: 'carbon' },
  { id: 74, lat: 11.5564, lng: 104.9282, name: 'Phnom Penh', type: 'atmo' },
  { id: 75, lat: 17.9757, lng: 102.6331, name: 'Vientiane', type: 'thermal' },
  { id: 76, lat: 4.2105, lng: 101.9758, name: 'Ipoh', type: 'hydro' },
  { id: 77, lat: 5.9804, lng: 116.0735, name: 'Kota Kinabalu', type: 'carbon' },
  { id: 78, lat: 35.1796, lng: 129.0756, name: 'Busan', type: 'atmo' },
  { id: 79, lat: 43.0642, lng: 141.3469, name: 'Sapporo', type: 'thermal' },
  { id: 80, lat: 26.2041, lng: 127.6792, name: 'Okinawa', type: 'hydro' },
  
  // Africa - Major Cities
  { id: 81, lat: 30.0444, lng: 31.2357, name: 'Cairo', type: 'thermal' },
  { id: 82, lat: -26.2041, lng: 28.0473, name: 'Johannesburg', type: 'carbon' },
  { id: 83, lat: -33.9249, lng: 18.4241, name: 'Cape Town', type: 'hydro' },
  { id: 84, lat: 6.5244, lng: 3.3792, name: 'Lagos', type: 'atmo' },
  { id: 85, lat: -1.2921, lng: 36.8219, name: 'Nairobi', type: 'thermal' },
  { id: 86, lat: 33.9391, lng: -6.8430, name: 'Casablanca', type: 'hydro' },
  { id: 87, lat: 15.5007, lng: 32.5599, name: 'Khartoum', type: 'carbon' },
  { id: 88, lat: 9.0579, lng: 7.4951, name: 'Abuja', type: 'atmo' },
  { id: 89, lat: -4.4419, lng: 15.2663, name: 'Kinshasa', type: 'thermal' },
  { id: 90, lat: 31.7917, lng: -7.0926, name: 'Marrakech', type: 'hydro' },
  { id: 91, lat: 36.8065, lng: 10.1815, name: 'Tunis', type: 'carbon' },
  { id: 92, lat: 36.7538, lng: 3.0588, name: 'Algiers', type: 'atmo' },
  { id: 93, lat: 32.6297, lng: 13.0890, name: 'Tripoli', type: 'thermal' },
  { id: 94, lat: 11.8251, lng: 42.5903, name: 'Djibouti', type: 'hydro' },
  { id: 95, lat: 15.3229, lng: 38.9251, name: 'Asmara', type: 'carbon' },
  { id: 96, lat: 9.1450, lng: 40.4897, name: 'Addis Ababa', type: 'atmo' },
  { id: 97, lat: 0.3476, lng: 32.5825, name: 'Kampala', type: 'thermal' },
  { id: 98, lat: -2.0469, lng: 29.9189, name: 'Kigali', type: 'hydro' },
  { id: 99, lat: -3.3731, lng: 29.9189, name: 'Bujumbura', type: 'carbon' },
  { id: 100, lat: -15.3875, lng: 28.3228, name: 'Lusaka', type: 'atmo' },
  { id: 101, lat: -17.8292, lng: 31.0522, name: 'Harare', type: 'thermal' },
  { id: 102, lat: -25.7479, lng: 28.2293, name: 'Pretoria', type: 'hydro' },
  { id: 103, lat: -29.8587, lng: 31.0218, name: 'Durban', type: 'carbon' },
  { id: 104, lat: -22.5597, lng: 17.0832, name: 'Windhoek', type: 'atmo' },
  { id: 105, lat: -24.6282, lng: 25.9231, name: 'Gaborone', type: 'thermal' },
  
  // South America - Major Cities
  { id: 106, lat: -23.5505, lng: -46.6333, name: 'São Paulo', type: 'atmo' },
  { id: 107, lat: -22.9068, lng: -43.1729, name: 'Rio de Janeiro', type: 'hydro' },
  { id: 108, lat: -34.6037, lng: -58.3816, name: 'Buenos Aires', type: 'atmo' },
  { id: 109, lat: -33.4489, lng: -70.6693, name: 'Santiago', type: 'carbon' },
  { id: 110, lat: 4.7110, lng: -74.0721, name: 'Bogotá', type: 'thermal' },
  { id: 111, lat: -12.0464, lng: -77.0428, name: 'Lima', type: 'hydro' },
  { id: 112, lat: 10.4806, lng: -66.9036, name: 'Caracas', type: 'atmo' },
  { id: 113, lat: -25.2637, lng: -57.5759, name: 'Asunción', type: 'carbon' },
  { id: 114, lat: -34.9011, lng: -56.1645, name: 'Montevideo', type: 'thermal' },
  { id: 115, lat: -15.7975, lng: -47.8919, name: 'Brasília', type: 'hydro' },
  { id: 116, lat: -8.0476, lng: -34.8770, name: 'Recife', type: 'carbon' },
  { id: 117, lat: -12.9714, lng: -38.5014, name: 'Salvador', type: 'atmo' },
  { id: 118, lat: -19.9167, lng: -43.9345, name: 'Belo Horizonte', type: 'thermal' },
  { id: 119, lat: -25.4284, lng: -49.2733, name: 'Curitiba', type: 'hydro' },
  { id: 120, lat: -30.0346, lng: -51.2177, name: 'Porto Alegre', type: 'carbon' },
  { id: 121, lat: -3.1190, lng: -60.0217, name: 'Manaus', type: 'atmo' },
  { id: 122, lat: -1.4558, lng: -48.4902, name: 'Belém', type: 'thermal' },
  { id: 123, lat: -5.7945, lng: -35.2110, name: 'Natal', type: 'hydro' },
  { id: 124, lat: -7.1195, lng: -34.8450, name: 'João Pessoa', type: 'carbon' },
  { id: 125, lat: 6.2442, lng: -75.5812, name: 'Medellín', type: 'atmo' },
  { id: 126, lat: 3.4516, lng: -76.5320, name: 'Cali', type: 'thermal' },
  { id: 127, lat: 7.8939, lng: -72.5078, name: 'Cúcuta', type: 'hydro' },
  { id: 128, lat: -16.2902, lng: -63.5887, name: 'Santa Cruz', type: 'carbon' },
  { id: 129, lat: -16.5000, lng: -68.1500, name: 'La Paz', type: 'atmo' },
  { id: 130, lat: -13.5320, lng: -71.9675, name: 'Cusco', type: 'thermal' },
  { id: 131, lat: -8.1116, lng: -79.0287, name: 'Trujillo', type: 'hydro' },
  { id: 132, lat: -16.4090, lng: -71.5375, name: 'Arequipa', type: 'carbon' },
  { id: 133, lat: -0.1807, lng: -78.4678, name: 'Quito', type: 'atmo' },
  { id: 134, lat: -2.1894, lng: -79.8890, name: 'Guayaquil', type: 'thermal' },
  { id: 135, lat: 8.9824, lng: -79.5199, name: 'Panama City', type: 'hydro' },
  
  // Oceania - Major Cities
  { id: 136, lat: -33.8688, lng: 151.2093, name: 'Sydney', type: 'carbon' },
  { id: 137, lat: -37.8136, lng: 144.9631, name: 'Melbourne', type: 'hydro' },
  { id: 138, lat: -27.4698, lng: 153.0251, name: 'Brisbane', type: 'thermal' },
  { id: 139, lat: -31.9505, lng: 115.8605, name: 'Perth', type: 'atmo' },
  { id: 140, lat: -36.8485, lng: 174.7633, name: 'Auckland', type: 'carbon' },
  { id: 141, lat: -41.2865, lng: 174.7762, name: 'Wellington', type: 'hydro' },
  { id: 142, lat: -35.2809, lng: 149.1300, name: 'Canberra', type: 'thermal' },
  { id: 143, lat: -34.9285, lng: 138.6007, name: 'Adelaide', type: 'atmo' },
  { id: 144, lat: -42.8821, lng: 147.3272, name: 'Hobart', type: 'carbon' },
  { id: 145, lat: -12.4634, lng: 130.8456, name: 'Darwin', type: 'hydro' },
  { id: 146, lat: -23.6980, lng: 133.8807, name: 'Alice Springs', type: 'thermal' },
  { id: 147, lat: -20.7256, lng: 139.4927, name: 'Mount Isa', type: 'atmo' },
  { id: 148, lat: -37.5622, lng: 143.8503, name: 'Ballarat', type: 'carbon' },
  { id: 149, lat: -38.1499, lng: 146.3186, name: 'Traralgon', type: 'hydro' },
  { id: 150, lat: -43.5321, lng: 172.6362, name: 'Christchurch', type: 'thermal' },
  { id: 151, lat: -45.8788, lng: 170.5028, name: 'Dunedin', type: 'atmo' },
  { id: 152, lat: -39.0579, lng: 174.0806, name: 'New Plymouth', type: 'carbon' },
  { id: 153, lat: -37.7870, lng: 175.2793, name: 'Hamilton', type: 'hydro' },
  { id: 154, lat: -38.1368, lng: 176.2497, name: 'Rotorua', type: 'thermal' },
  
  // Arctic/Remote locations
  { id: 155, lat: 64.1466, lng: -21.9426, name: 'Reykjavik', type: 'thermal' },
  { id: 156, lat: 71.0486, lng: -8.0751, name: 'Svalbard', type: 'hydro' },
  { id: 157, lat: -54.8019, lng: -68.3030, name: 'Ushuaia', type: 'atmo' },
  { id: 158, lat: 70.2676, lng: 31.1107, name: 'Murmansk', type: 'carbon' },
  { id: 159, lat: 69.3451, lng: 88.2027, name: 'Norilsk', type: 'thermal' },
  { id: 160, lat: 68.9585, lng: 33.0827, name: 'Kirkenes', type: 'hydro' },
  { id: 161, lat: -77.8419, lng: 166.6863, name: 'McMurdo Station', type: 'atmo' },
  { id: 162, lat: -70.6693, lng: -8.2500, name: 'Troll Station', type: 'carbon' },
  { id: 163, lat: 82.5018, lng: -82.1198, name: 'Alert', type: 'thermal' },
  { id: 164, lat: 78.9230, lng: 11.9289, name: 'Ny-Ålesund', type: 'hydro' },
  { id: 165, lat: -68.5767, lng: 77.9674, name: 'Davis Station', type: 'atmo' },
  
  // Island Nations & Remote Islands
  { id: 166, lat: 21.3099, lng: -157.8581, name: 'Honolulu', type: 'carbon' },
  { id: 167, lat: 13.4443, lng: 144.7937, name: 'Guam', type: 'thermal' },
  { id: 168, lat: -17.7134, lng: -149.4069, name: 'Tahiti', type: 'hydro' },
  { id: 169, lat: -25.0662, lng: -130.1017, name: 'Pitcairn Island', type: 'atmo' },
  { id: 170, lat: -37.1061, lng: -12.2777, name: 'Tristan da Cunha', type: 'carbon' },
  { id: 171, lat: -15.9626, lng: -5.7417, name: 'Saint Helena', type: 'thermal' },
  { id: 172, lat: 7.3069, lng: 134.4827, name: 'Palau', type: 'hydro' },
  { id: 173, lat: 1.3733, lng: 103.8000, name: 'Sentosa', type: 'atmo' },
  { id: 174, lat: -8.5069, lng: 179.1970, name: 'Tuvalu', type: 'carbon' },
  { id: 175, lat: -21.1351, lng: -175.2204, name: 'Tonga', type: 'thermal' },
  { id: 176, lat: -13.7590, lng: -172.1046, name: 'Samoa', type: 'hydro' },
  { id: 177, lat: -18.1248, lng: 178.4501, name: 'Fiji', type: 'atmo' },
  { id: 178, lat: -22.2758, lng: 166.4581, name: 'New Caledonia', type: 'carbon' },
  { id: 179, lat: -17.5385, lng: 168.3219, name: 'Vanuatu', type: 'thermal' },
  { id: 180, lat: -9.4280, lng: 159.9540, name: 'Solomon Islands', type: 'hydro' },
];

// Convert lat/lng to 3D coordinates
const latLngToVector3 = (lat: number, lng: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
};

// Sensor marker component
const SensorMarker: React.FC<{
  position: THREE.Vector3;
  sensor: typeof sensorLocations[0];
  onClick: () => void;
  globeRotation: number;
}> = ({ position, sensor, onClick, globeRotation }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.scale.setScalar(1 + Math.sin(time * 3) * 0.1);
    }
    
    // Rotate the sensor group to match globe rotation
    if (groupRef.current) {
      groupRef.current.rotation.y = globeRotation;
    }
  });

  const getColor = (type: string) => {
    switch (type) {
      case 'thermal': return '#D54D4D';
      case 'hydro': return '#0EA5E9';
      case 'atmo': return '#68F757';
      case 'carbon': return '#A855F7';
      default: return '#68F757';
    }
  };

  return (
    <group ref={groupRef}>
      <group position={position}>
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
            document.body.style.cursor = 'default';
          }}
          scale={hovered ? 1.5 : 1}
        >
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial 
            color={getColor(sensor.type)} 
            transparent 
            opacity={0.8}
          />
        </mesh>
        
        {/* Glowing ring effect */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.03, 0.05, 16]} />
          <meshBasicMaterial 
            color={getColor(sensor.type)} 
            transparent 
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Tooltip on hover */}
        {hovered && (
          <Html distanceFactor={10}>
            <div className="bg-black border border-custom-green px-3 py-2 rounded text-white font-cyber text-xs whitespace-nowrap neon-border">
              <div className="text-custom-green font-bold">{sensor.name}</div>
              <div className="text-gray-300 capitalize">{sensor.type} sensor</div>
              <div className="text-custom-yellow text-xs mt-1">Click to explore data</div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

// Main globe component
const Globe: React.FC = () => {
  const globeRef = useRef<THREE.Mesh>(null);
  const [globeRotation, setGlobeRotation] = useState(0);
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const { camera } = useThree();

  // Auto-rotate the globe slower and track rotation
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.002; // Reduced from 0.005 to 0.002 for slower rotation
      setGlobeRotation(globeRef.current.rotation.y);
    }
  });

  // Create globe texture with grid lines
  const globeTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Dark background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid lines
    ctx.strokeStyle = 'rgba(104, 247, 87, 0.2)';
    ctx.lineWidth = 1;
    
    // Longitude lines
    for (let i = 0; i <= 36; i++) {
      const x = (i / 36) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Latitude lines
    for (let i = 0; i <= 18; i++) {
      const y = (i / 18) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    return new THREE.CanvasTexture(canvas);
  }, []);

  const handleSensorClick = (sensor: typeof sensorLocations[0]) => {
    navigate('/explore', { state: { selectedSensor: sensor } });
  };

  const handleGlobeClick = (e: any) => {
    e.stopPropagation();
    navigate('/explore');
  };

  return (
    <group>
      {/* Main globe */}
      <Sphere 
        ref={globeRef} 
        args={[2, 64, 64]} 
        onClick={handleGlobeClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <meshBasicMaterial 
          map={globeTexture} 
          transparent 
          opacity={hovered ? 0.9 : 0.8}
          wireframe={false}
        />
      </Sphere>

      {/* Glowing atmosphere */}
      <Sphere args={[2.1, 64, 64]}>
        <meshBasicMaterial 
          color="#68F757" 
          transparent 
          opacity={hovered ? 0.15 : 0.1}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Sensor markers */}
      {sensorLocations.map((sensor) => {
        const position = latLngToVector3(sensor.lat, sensor.lng, 2.05);
        return (
          <SensorMarker
            key={sensor.id}
            position={position}
            sensor={sensor}
            onClick={() => handleSensorClick(sensor)}
            globeRotation={globeRotation}
          />
        );
      })}

      {/* Orbital rings */}
      <group>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.5, 2.52, 64]} />
          <meshBasicMaterial 
            color="#68F757" 
            transparent 
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[Math.PI / 3, 0, Math.PI / 4]}>
          <ringGeometry args={[2.8, 2.82, 64]} />
          <meshBasicMaterial 
            color="#FFFF00" 
            transparent 
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
};

// Main Globe3D component
const Globe3D: React.FC = () => {
  return (
    <div className="w-full h-[600px] relative">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        
        {/* Stars background */}
        <Stars 
          radius={100} 
          depth={50} 
          count={5000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={1}
        />
        
        <Globe />
      </Canvas>
            
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-black/80 border border-custom-green p-4 rounded neon-border">
        
        {/* Sensor count */}
        <div className="pt-2 border-custom-green/30">
          <div className="text-custom-green font-cyber text-xs">
            ACTIVE SENSORS: {sensorLocations.length}
          </div>
        </div>
        
        {/* Interactive hint */}
        <div className="mt-2 pt-2 border-t border-custom-green/30">
          <div className="text-custom-yellow font-cyber text-xs animate-pulse">
            CLICK TO EXPLORE DATA
          </div>
        </div>
      </div>
    </div>
  );
};

export default Globe3D;
