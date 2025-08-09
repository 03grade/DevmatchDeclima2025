import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import SensorSetup from './pages/SensorSetup';
import Explore from './pages/Explore';
import NFADetail from './pages/NFADetail';
import DataAnalytics from './pages/DataAnalytics';
import DataSensor from './pages/DataSensor';
import DAO from './pages/DAO';
import { useWeb3Store } from './store/web3Store';

function App() {
  const initializeConnection = useWeb3Store((state) => state.initializeConnection);

  useEffect(() => {
    // Initialize wallet connection on app load
    initializeConnection();
  }, [initializeConnection]);
  
  return (
    <Router>
      <div className="min-h-screen bg-black">
        <Navbar />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="pt-16"
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sensor-setup" element={<SensorSetup />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/nfa/:sensorId" element={<NFADetail />} />
            <Route path="/analytics" element={<DataAnalytics />} />
            <Route path="/sensor/:id" element={<DataSensor />} />
            <Route path="/dao" element={<DAO />} />
          </Routes>
        </motion.main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
