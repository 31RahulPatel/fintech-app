import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiArrowRight, FiTrendingUp, FiPercent, FiFileText, 
  FiMessageSquare, FiShield, FiZap, FiUsers, FiAward,
  FiBarChart2, FiDollarSign, FiPieChart
} from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import './Home.css';

const Home = () => {
  const { theme } = useTheme();

  const features = [
    {
      icon: <FiTrendingUp />,
      title: 'Live Market Data',
      description: 'Real-time Indian stock market data, indices, ETFs, and global market insights like Moneycontrol.',
      link: '/market'
    },
    {
      icon: <FiPercent />,
      title: '20+ Calculators',
      description: 'SIP, EMI, FD, PPF, NPS, Tax calculators and more. 3 free for everyone, unlock all with Premium.',
      link: '/calculators'
    },
    {
      icon: <FiFileText />,
      title: 'News & Insights',
      description: 'Latest financial news from India and global markets. Stay informed with curated content.',
      link: '/news'
    },
    {
      icon: <FiMessageSquare />,
      title: 'Bazar.ai Chatbot',
      description: 'AI-powered financial assistant with scheduled prompts. Get personalized insights delivered daily.',
      link: '/chatbot'
    }
  ];

  const stats = [
    { value: '50K+', label: 'Active Users' },
    { value: '20+', label: 'Financial Calculators' },
    { value: '99.9%', label: 'Uptime' },
    { value: '4.9/5', label: 'User Rating' }
  ];

  const calculatorsList = [
    { name: 'SIP Calculator', icon: <FiBarChart2 />, free: true },
    { name: 'Compound Interest', icon: <FiDollarSign />, free: true },
    { name: 'Lumpsum Calculator', icon: <FiPieChart />, free: true },
    { name: 'EMI Calculator', icon: <FiPercent />, free: false },
    { name: 'FD Calculator', icon: <FiBarChart2 />, free: false },
    { name: 'Tax Calculator', icon: <FiDollarSign />, free: false }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className={`home ${theme === 'dark' ? 'home-dark' : ''}`}>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>
        <div className="hero-container">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="hero-badge">
              <FiZap /> New: Bazar.ai with Scheduled Prompts
            </span>
            <h1 className="hero-title">
              Your Trusted <span className="gradient-text">Financial</span> Companion
            </h1>
            <p className="hero-description">
              Make smarter financial decisions with real-time market data, powerful calculators, 
              and AI-powered insights. Everything you need to manage your finances in one place.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary btn-large">
                Get Started Free
                <FiArrowRight />
              </Link>
              <Link to="/market" className="btn btn-outline btn-large">
                Explore Market
              </Link>
            </div>
            <div className="hero-trust">
              <div className="trust-avatars">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="trust-avatar">
                    <span>{String.fromCharCode(64 + i)}</span>
                  </div>
                ))}
              </div>
              <p>Join <strong>50,000+</strong> users making smarter financial decisions</p>
            </div>
          </motion.div>
          <motion.div 
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="hero-card">
              <div className="hero-card-header">
                <span className="card-dot red"></span>
                <span className="card-dot yellow"></span>
                <span className="card-dot green"></span>
              </div>
              <div className="hero-card-content">
                <div className="market-preview">
                  <div className="market-item">
                    <span className="market-name">NIFTY 50</span>
                    <span className="market-value positive">22,456.80</span>
                    <span className="market-change positive">+1.24%</span>
                  </div>
                  <div className="market-item">
                    <span className="market-name">SENSEX</span>
                    <span className="market-value positive">74,085.60</span>
                    <span className="market-change positive">+0.98%</span>
                  </div>
                  <div className="market-item">
                    <span className="market-name">BANK NIFTY</span>
                    <span className="market-value negative">47,234.50</span>
                    <span className="market-change negative">-0.45%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stats-container">
          <motion.div 
            className="stats-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => (
              <motion.div key={index} className="stat-item" variants={itemVariants}>
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-badge">Features</span>
            <h2>Everything You Need for Financial Success</h2>
            <p>Comprehensive tools and insights to help you make informed financial decisions</p>
          </motion.div>
          <motion.div 
            className="features-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Link to={feature.link} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <span className="feature-link">
                    Learn more <FiArrowRight />
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Calculators Preview */}
      <section className="calculators-preview">
        <div className="calculators-container">
          <div className="calculators-content">
            <motion.div 
              className="section-header left"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="section-badge">Calculators</span>
              <h2>20+ Financial Calculators</h2>
              <p>From simple SIP calculations to complex retirement planning. Get accurate results instantly.</p>
              <ul className="calculator-benefits">
                <li><FiShield /> Bank-grade accuracy</li>
                <li><FiZap /> Instant results</li>
                <li><FiUsers /> Used by 50K+ people</li>
              </ul>
              <Link to="/calculators" className="btn btn-primary">
                Try Calculators <FiArrowRight />
              </Link>
            </motion.div>
            <motion.div 
              className="calculators-list"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {calculatorsList.map((calc, index) => (
                <motion.div key={index} className="calculator-item" variants={itemVariants}>
                  <div className="calculator-icon">{calc.icon}</div>
                  <span className="calculator-name">{calc.name}</span>
                  <span className={`calculator-badge ${calc.free ? 'free' : 'premium'}`}>
                    {calc.free ? 'Free' : 'Premium'}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Chatbot Section */}
      <section className="chatbot-section">
        <div className="chatbot-container">
          <motion.div 
            className="chatbot-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-badge">AI Powered</span>
            <h2>Meet Bazar.ai</h2>
            <p>Your personal AI financial assistant. Ask anything about markets, investments, or financial planning.</p>
            <div className="chatbot-features">
              <div className="chatbot-feature">
                <FiMessageSquare />
                <span>Natural conversations</span>
              </div>
              <div className="chatbot-feature">
                <FiZap />
                <span>Scheduled prompts</span>
              </div>
              <div className="chatbot-feature">
                <FiAward />
                <span>Powered by Groq</span>
              </div>
            </div>
            <Link to="/chatbot" className="btn btn-primary">
              Chat with Bazar.ai <FiArrowRight />
            </Link>
          </motion.div>
          <motion.div 
            className="chatbot-preview"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="chat-window">
              <div className="chat-header">
                <div className="chat-avatar">🤖</div>
                <div className="chat-info">
                  <span className="chat-name">Bazar.ai</span>
                  <span className="chat-status">Online</span>
                </div>
              </div>
              <div className="chat-messages">
                <div className="chat-message user">
                  What's a good SIP strategy for beginners?
                </div>
                <div className="chat-message bot">
                  Great question! For beginners, I recommend starting with index funds like 
                  Nifty 50 or Sensex. Start with ₹5,000/month and increase by 10% annually. 
                  This approach leverages rupee cost averaging...
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-container">
          <motion.div 
            className="cta-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Ready to Take Control of Your Finances?</h2>
            <p>Join thousands of users who trust FintechOps for their financial journey.</p>
            <div className="cta-actions">
              <Link to="/signup" className="btn btn-white btn-large">
                Get Started Free <FiArrowRight />
              </Link>
              <Link to="/pricing" className="btn btn-ghost-white btn-large">
                View Pricing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
