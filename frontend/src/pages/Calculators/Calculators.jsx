import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiSearch, FiLock, FiTrendingUp, FiDollarSign, FiPercent,
  FiHome, FiCreditCard, FiBookOpen, FiTarget, FiPieChart,
  FiBarChart2, FiCalendar, FiShield, FiAward
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './Calculators.css';

const Calculators = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();

  const isPremium = user?.subscription?.plan === 'premium';

  const categories = [
    { id: 'all', label: 'All Calculators' },
    { id: 'investment', label: 'Investment' },
    { id: 'loan', label: 'Loan' },
    { id: 'savings', label: 'Savings' },
    { id: 'retirement', label: 'Retirement' },
    { id: 'tax', label: 'Tax' }
  ];

  const calculators = [
    { 
      id: 'sip', 
      name: 'SIP Calculator', 
      description: 'Calculate returns on your systematic investment plan',
      icon: <FiBarChart2 />,
      category: 'investment',
      free: true 
    },
    { 
      id: 'compound-interest', 
      name: 'Compound Interest', 
      description: 'Calculate compound interest on your investments',
      icon: <FiPercent />,
      category: 'investment',
      free: true 
    },
    { 
      id: 'lumpsum', 
      name: 'Lumpsum Calculator', 
      description: 'Calculate returns on one-time investments',
      icon: <FiDollarSign />,
      category: 'investment',
      free: true 
    },
    { 
      id: 'emi', 
      name: 'EMI Calculator', 
      description: 'Calculate your monthly loan EMI payments',
      icon: <FiCreditCard />,
      category: 'loan',
      free: false 
    },
    { 
      id: 'fd', 
      name: 'FD Calculator', 
      description: 'Fixed deposit maturity and interest calculator',
      icon: <FiShield />,
      category: 'savings',
      free: false 
    },
    { 
      id: 'rd', 
      name: 'RD Calculator', 
      description: 'Recurring deposit maturity calculator',
      icon: <FiCalendar />,
      category: 'savings',
      free: false 
    },
    { 
      id: 'ppf', 
      name: 'PPF Calculator', 
      description: 'Public Provident Fund returns calculator',
      icon: <FiAward />,
      category: 'savings',
      free: false 
    },
    { 
      id: 'nps', 
      name: 'NPS Calculator', 
      description: 'National Pension System calculator',
      icon: <FiPieChart />,
      category: 'retirement',
      free: false 
    },
    { 
      id: 'epf', 
      name: 'EPF Calculator', 
      description: 'Employee Provident Fund calculator',
      icon: <FiTarget />,
      category: 'retirement',
      free: false 
    },
    { 
      id: 'gratuity', 
      name: 'Gratuity Calculator', 
      description: 'Calculate your gratuity amount',
      icon: <FiDollarSign />,
      category: 'retirement',
      free: false 
    },
    { 
      id: 'inflation', 
      name: 'Inflation Calculator', 
      description: 'Calculate future value adjusted for inflation',
      icon: <FiTrendingUp />,
      category: 'investment',
      free: false 
    },
    { 
      id: 'retirement', 
      name: 'Retirement Planner', 
      description: 'Plan your retirement corpus',
      icon: <FiPieChart />,
      category: 'retirement',
      free: false 
    },
    { 
      id: 'home-loan', 
      name: 'Home Loan EMI', 
      description: 'Calculate your home loan EMI and total interest',
      icon: <FiHome />,
      category: 'loan',
      free: false 
    },
    { 
      id: 'car-loan', 
      name: 'Car Loan EMI', 
      description: 'Calculate your car loan EMI',
      icon: <FiCreditCard />,
      category: 'loan',
      free: false 
    },
    { 
      id: 'personal-loan', 
      name: 'Personal Loan EMI', 
      description: 'Calculate personal loan EMI and interest',
      icon: <FiCreditCard />,
      category: 'loan',
      free: false 
    },
    { 
      id: 'education-loan', 
      name: 'Education Loan', 
      description: 'Calculate education loan EMI',
      icon: <FiBookOpen />,
      category: 'loan',
      free: false 
    },
    { 
      id: 'swp', 
      name: 'SWP Calculator', 
      description: 'Systematic Withdrawal Plan calculator',
      icon: <FiBarChart2 />,
      category: 'investment',
      free: false 
    },
    { 
      id: 'goal-planning', 
      name: 'Goal Planning', 
      description: 'Plan and track your financial goals',
      icon: <FiTarget />,
      category: 'investment',
      free: false 
    },
    { 
      id: 'cagr', 
      name: 'CAGR Calculator', 
      description: 'Calculate Compound Annual Growth Rate',
      icon: <FiTrendingUp />,
      category: 'investment',
      free: false 
    },
    { 
      id: 'tax', 
      name: 'Income Tax Calculator', 
      description: 'Calculate your income tax liability',
      icon: <FiPercent />,
      category: 'tax',
      free: false 
    }
  ];

  const filteredCalculators = calculators.filter(calc => {
    const matchesSearch = calc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         calc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || calc.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className={`calculators-page ${theme === 'dark' ? 'calculators-dark' : ''}`}>
      <div className="calculators-header">
        <div className="calculators-header-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1>Financial Calculators</h1>
            <p>20+ powerful calculators to help you make informed financial decisions</p>
          </motion.div>
        </div>
      </div>

      <div className="calculators-container">
        <div className="calculators-filters">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search calculators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="category-tabs">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {!isPremium && (
          <motion.div 
            className="premium-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="premium-banner-content">
              <FiLock />
              <div>
                <h3>Unlock All 20 Calculators</h3>
                <p>Get access to premium calculators like EMI, Tax, Retirement Planning, and more</p>
              </div>
            </div>
            <Link to="/pricing" className="btn btn-primary">
              Upgrade to Premium
            </Link>
          </motion.div>
        )}

        <motion.div 
          className="calculators-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredCalculators.map(calc => {
            const isLocked = !calc.free && !isPremium;
            
            return (
              <motion.div key={calc.id} variants={itemVariants}>
                {isLocked ? (
                  <div className="calculator-card locked">
                    <div className="calculator-icon">{calc.icon}</div>
                    <div className="calculator-info">
                      <h3>{calc.name}</h3>
                      <p>{calc.description}</p>
                    </div>
                    <div className="locked-overlay">
                      <FiLock />
                      <span>Premium</span>
                    </div>
                  </div>
                ) : (
                  <Link to={`/calculators/${calc.id}`} className="calculator-card">
                    <div className="calculator-icon">{calc.icon}</div>
                    <div className="calculator-info">
                      <h3>{calc.name}</h3>
                      <p>{calc.description}</p>
                    </div>
                    {calc.free && <span className="free-badge">Free</span>}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {filteredCalculators.length === 0 && (
          <div className="no-results">
            <p>No calculators found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calculators;
