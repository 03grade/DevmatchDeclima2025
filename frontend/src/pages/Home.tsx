import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Database, 
  Shield, 
  Globe, 
  ArrowRight,
  Thermometer,
  Wind,
  Droplets,
  Zap,
  Activity,
  Cpu,
  Wifi,
  Search,
  BarChart3,
  Download,
  Vote,
  Coins,
  Users,
  Settings
} from 'lucide-react';
import Globe3D from '../components/Globe3D';

const Home: React.FC = () => {
  const features = [
    {
      icon: Database,
      title: 'OPEN DATA GRID',
      description: 'Free access to real-time climate intelligence from distributed sensor networks worldwide',
      color: 'cyber-glow'
    },
    {
      icon: Search,
      title: 'DATA EXPLORATION',
      description: 'Interactive tools to discover, visualize, and analyze environmental data from global sensors',
      color: 'cyber-glow-yellow'
    },
    {
      icon: Vote,
      title: 'DAO GOVERNANCE',
      description: 'Stake-based decentralized governance - stake 10+ ROSE to vote on proposals',
      color: 'cyber-glow'
    },
    {
      icon: Shield,
      title: 'VERIFIED QUALITY',
      description: 'AI-powered data validation ensuring high-quality, reliable environmental measurements',
      color: 'cyber-glow-yellow'
    }
  ];

  const stats = [
    { label: 'ACTIVE SENSORS', value: '12,450+', icon: Cpu, prefix: 'AS_' },
    { label: 'DAO MEMBERS', value: '1,240+', icon: Users, prefix: 'DM_' },
    { label: 'DOWNLOADS', value: '450K+', icon: Download, prefix: 'DL_' },
    { label: 'COUNTRIES', value: '45+', icon: Wifi, prefix: 'CO_' }
  ];

  const sensorTypes = [
    { icon: Thermometer, name: 'TEMPERATURE', color: 'bg-custom-red', code: 'TH_001' },
    { icon: Droplets, name: 'HUMIDITY', color: 'bg-blue-500', code: 'HU_002' },
    { icon: Wind, name: 'AIR QUALITY', color: 'bg-custom-green', code: 'AQ_003' },
    { icon: Zap, name: 'CARBON', color: 'bg-purple-500', code: 'CO_004' }
  ];

  return (
    <div className="overflow-hidden bg-black relative">
      {/* Animated Background */}
      <div className="fixed inset-0 cyber-grid opacity-10"></div>
      <div className="fixed inset-0 hex-pattern opacity-5"></div>
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="mb-8"
          >
            <div className="inline-block mb-6">
              <span className="font-cyber text-sm tracking-[0.3em] text-custom-green border border-custom-green px-4 py-2 neon-border">
                DECENTRALIZED // DAO GOVERNANCE
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-cyber font-bold mb-8 leading-tight">
              <span className="holo-text block mb-2">DECENTRALISED</span>
              <span className="text-white block mb-2">CLIMATE</span>
              <span className="holo-text glitch">DATA</span>
            </h1>
            
            <div className="max-w-4xl mx-auto mb-8">
              <p className="text-xl md:text-2xl font-tech text-gray-300 leading-relaxed mb-4">
                <span className="text-custom-green">[ACCESSING...]</span> Decentralized climate intelligence governed by stakers
              </p>
              <p className="text-lg font-tech text-gray-400">
                STAKE → VOTE → ACCESS → REWARD
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <Link
              to="/sensor-setup"
              className="cyber-btn px-8 py-4 text-lg font-bold tracking-wider relative group"
            >
              <span className="flex items-center space-x-3">
                <Vote className="w-5 h-5" />
                <span>MINT SENSOR</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            
            <Link
              to="/explore"
              className="px-8 py-4 bg-black border-2 border-custom-green text-custom-green font-cyber font-bold text-lg tracking-wider neon-border hover:bg-custom-green hover:text-black transition-all duration-300 relative overflow-hidden scan-line"
            >
              <span className="flex items-center space-x-3">
                <Search className="w-5 h-5" />
                <span>EXPLORE DATA</span>
              </span>
            </Link>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="tech-panel p-6 text-center relative group hover:cyber-glow transition-all duration-300"
                >
                  <div className="absolute top-2 left-2 text-xs font-mono text-custom-green opacity-50">
                    {stat.prefix}{String(index + 1).padStart(2, '0')}
                  </div>
                  
                  <div className="w-12 h-12 bg-custom-gradient rounded-lg flex items-center justify-center mx-auto mb-4 cyber-glow">
                    <Icon className="w-6 h-6 text-black" />
                  </div>
                  
                  <div className="text-3xl font-cyber font-bold text-white mb-1 holo-text">{stat.value}</div>
                  <div className="text-sm font-tech text-gray-400 tracking-wide">{stat.label}</div>
                  
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-custom-gradient opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 3D Globe Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-6">
              <span className="font-cyber text-sm tracking-[0.3em] text-custom-green border border-custom-green px-4 py-2 neon-border">
                GLOBAL NETWORK // REAL-TIME
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-cyber font-bold text-white mb-6">
              PLANETARY <span className="holo-text">INTELLIGENCE</span>
            </h2>
            <p className="text-xl font-tech text-gray-300 max-w-3xl mx-auto mb-12">
              Interactive 3D visualization of our global sensor network. Each light represents an active climate monitoring station contributing data to the DAO-governed ecosystem.
            </p>
          </motion.div>

          {/* 3D Globe Component */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
          >
            <Globe3D />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-6">
              <span className="font-cyber text-sm tracking-[0.3em] text-custom-green border border-custom-green px-4 py-2 neon-border">
                CORE FEATURES // DAO POWERED
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-cyber font-bold text-white mb-6">
              DECENTRALIZED <span className="holo-text">PLATFORM</span>
            </h2>
            <p className="text-xl font-tech text-gray-300 max-w-3xl mx-auto">
              Stake-governed climate data platform with advanced tools for accessing, exploring, and governing environmental intelligence
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className={`tech-panel p-8 group hover:${feature.color} transition-all duration-500 relative overflow-hidden`}
                >
                  <div className="absolute top-4 right-4 text-xs font-mono text-custom-green opacity-30">
                    SYS_{String(index + 1).padStart(3, '0')}
                  </div>
                  
                  <div className="flex items-start space-x-6">
                    <div className="w-16 h-16 bg-custom-gradient rounded-xl flex items-center justify-center cyber-glow flex-shrink-0">
                      <Icon className="w-8 h-8 text-black" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-cyber font-bold text-white mb-3 tracking-wide">
                        {feature.title}
                      </h3>
                      <p className="font-tech text-gray-300 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-custom-gradient transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DAO Governance Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-6">
              <span className="font-cyber text-sm tracking-[0.3em] text-custom-green border border-custom-green px-4 py-2 neon-border">
                GOVERNANCE // STAKE TO PARTICIPATE
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-cyber font-bold text-white mb-6">
              DAO <span className="holo-text">GOVERNANCE</span>
            </h2>
            <p className="text-xl font-tech text-gray-300 max-w-3xl mx-auto">
              Decentralized governance powered by ROSE staking. Stake tokens to vote on proposals, influence network parameters, and shape the future of climate data.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="tech-panel p-8 text-center group hover:cyber-glow transition-all duration-300"
            >
              <div className="w-16 h-16 bg-custom-gradient rounded-xl flex items-center justify-center mx-auto mb-6 cyber-glow">
                <Coins className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-cyber font-bold text-white mb-4">STAKE TO ACCESS</h3>
              <p className="font-tech text-gray-300 mb-4">
                Minimum 10 ROSE stake required for DAO access.
              </p>
              <div className="text-sm font-tech text-custom-green">MIN: 10 ROSE</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="tech-panel p-8 text-center group hover:cyber-glow transition-all duration-300"
            >
              <div className="w-16 h-16 bg-custom-gradient rounded-xl flex items-center justify-center mx-auto mb-6 cyber-glow">
                <Vote className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-cyber font-bold text-white mb-4">VOTE ON PROPOSALS</h3>
              <p className="font-tech text-gray-300 mb-4">
                Vote on governance proposals, network parameters, and configuration changes. Your voting power equals your stake.
              </p>
              <div className="text-sm font-tech text-custom-green">VOTING POWER = STAKE</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="tech-panel p-8 text-center group hover:cyber-glow transition-all duration-300"
            >
              <div className="w-16 h-16 bg-custom-gradient rounded-xl flex items-center justify-center mx-auto mb-6 cyber-glow">
                <Settings className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-cyber font-bold text-white mb-4">CREATE PROPOSALS</h3>
              <p className="font-tech text-gray-300 mb-4">
                Stake 50+ ROSE to create governance proposals and influence network direction. Shape the future of climate data.
              </p>
              <div className="text-sm font-tech text-custom-green">MIN: 50 ROSE</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Sensor Types Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-6">
              <span className="font-cyber text-sm tracking-[0.3em] text-custom-green border border-custom-green px-4 py-2 neon-border">
                SENSOR ARRAY // MULTI-SPECTRUM
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-cyber font-bold text-white mb-6">
              DATA <span className="holo-text">TYPES</span>
            </h2>
            <p className="text-xl font-tech text-gray-300 max-w-3xl mx-auto">
              Comprehensive environmental monitoring across multiple measurement categories, governed by DAO consensus
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {sensorTypes.map((sensor, index) => {
              const Icon = sensor.icon;
              return (
                <motion.div
                  key={sensor.name}
                  initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                  whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="tech-panel p-6 text-center group hover:cyber-glow transition-all duration-300 relative"
                >
                  <div className="absolute top-2 left-2 text-xs font-mono text-custom-green opacity-50">
                    {sensor.code}
                  </div>
                  
                  <div className={`w-16 h-16 ${sensor.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 cyber-glow`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="font-cyber font-bold text-white text-sm tracking-wider">
                    {sensor.name}
                  </h3>
                  
                  <div className="mt-2 w-full h-1 bg-black rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '100%' }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                      className="h-full bg-custom-gradient"
                    ></motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-custom-gradient opacity-10"></div>
        <div className="absolute inset-0 cyber-grid"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block mb-6">
              <span className="font-cyber text-sm tracking-[0.3em] text-custom-green border border-custom-green px-4 py-2 neon-border">
                JOIN THE DAO // STAKE & GOVERN
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-cyber font-bold text-white mb-6">
              BECOME A <span className="holo-text glitch">GOVERNOR</span>
            </h2>
            
            <p className="text-xl font-tech text-gray-300 mb-12 max-w-2xl mx-auto">
              <span className="text-custom-green">[READY...]</span> Stake ROSE tokens to join the DAO and govern the future of decentralized climate intelligence. 
              Vote on proposals, earn rewards, and shape network parameters.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                to="/dao"
                className="cyber-btn px-8 py-4 text-lg font-bold tracking-wider relative group"
              >
                <span className="flex items-center justify-center space-x-3">
                  <Vote className="w-5 h-5" />
                  <span>JOIN DAO</span>
                </span>
              </Link>
              
              <Link
                to="/explore"
                className="px-8 py-4 bg-black border-2 border-custom-green text-custom-green font-cyber font-bold text-lg tracking-wider neon-border hover:bg-custom-green hover:text-black transition-all duration-300 relative overflow-hidden scan-line"
              >
                <span className="flex items-center justify-center space-x-3">
                  <BarChart3 className="w-5 h-5" />
                  <span>EXPLORE DATA</span>
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
