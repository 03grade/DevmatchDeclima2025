import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Github, Twitter, Globe, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-custom-gradient rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-black font-bold" />
              </div>
              <span className="text-xl font-bold">Devmatch</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Democratizing climate data through decentralized technology. 
              Empowering communities to contribute to environmental monitoring while earning rewards.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Platform</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link to="/marketplace" className="hover:text-white transition-colors">Sensor Explorer</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Provider Dashboard</Link></li>
              <li><Link to="/sensor-setup" className="hover:text-white transition-colors">Sensor Setup</Link></li>
              <li><Link to="/analytics" className="hover:text-white transition-colors">Analytics</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Resources</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Developer Guide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community Forum</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Support</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 Devmatch. Building a sustainable future through decentralized climate data.
          </p>
          <p className="text-gray-300 text-sm mt-2 md:mt-0">
            Powered by Oasis Protocol & ROSE Token
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
