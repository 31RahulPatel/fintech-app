import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiSearch, FiArrowRight } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import './NotFound.css';

const NotFound = () => {
  const { theme } = useTheme();

  return (
    <div className={`notfound-page ${theme === 'dark' ? 'notfound-dark' : ''}`}>
      <div className="notfound-container">
        <motion.div
          className="notfound-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="notfound-code">
            <span>4</span>
            <motion.div 
              className="notfound-icon"
              animate={{ 
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <FiSearch />
            </motion.div>
            <span>4</span>
          </div>
          
          <h1>Page Not Found</h1>
          <p>Oops! The page you're looking for doesn't exist or has been moved.</p>

          <div className="notfound-actions">
            <Link to="/" className="home-btn">
              <FiHome /> Go Home
            </Link>
            <Link to="/calculators" className="explore-btn">
              Explore Calculators <FiArrowRight />
            </Link>
          </div>

          <div className="quick-links">
            <span>Quick Links:</span>
            <Link to="/market">Market Data</Link>
            <Link to="/news">News</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/chatbot">Bazar.ai</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
