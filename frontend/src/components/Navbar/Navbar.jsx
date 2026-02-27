import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMenu, FiX, FiChevronDown, FiUser, FiLogOut, 
  FiSettings, FiMoon, FiSun, FiPercent, FiTrendingUp,
  FiFileText, FiBookOpen, FiMessageSquare
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setDropdownOpen(null);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { path: '/market', label: 'Market', icon: <FiTrendingUp /> },
    { path: '/calculators', label: 'Calculators', icon: <FiPercent /> },
    { path: '/news', label: 'News', icon: <FiFileText /> },
    { path: '/blog', label: 'Blog', icon: <FiBookOpen /> },
    { path: '/chatbot', label: 'Bazar.ai', icon: <FiMessageSquare />, premium: true }
  ];

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''} ${theme === 'dark' ? 'navbar-dark' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">₹</span>
          <span className="logo-text">FintechOps</span>
        </Link>

        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              className={`nav-link ${location.pathname === link.path ? 'active' : ''} ${link.premium ? 'premium-link' : ''}`}
            >
              {link.icon}
              <span>{link.label}</span>
              {link.premium && <span className="premium-badge">AI</span>}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <motion.div
              key={theme}
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 180, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
            </motion.div>
          </button>

          {isAuthenticated ? (
            <div className="user-menu">
              <button 
                className="user-menu-trigger"
                onClick={() => setDropdownOpen(dropdownOpen === 'user' ? null : 'user')}
              >
                <div className="user-avatar">
                  {user?.profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="user-name">{user?.profile?.firstName || 'User'}</span>
                <FiChevronDown className={`dropdown-arrow ${dropdownOpen === 'user' ? 'open' : ''}`} />
              </button>
              
              <AnimatePresence>
                {dropdownOpen === 'user' && (
                  <motion.div
                    className="user-dropdown"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="dropdown-header">
                      <p className="dropdown-email">{user?.email}</p>
                      <span className={`subscription-badge ${user?.subscription?.plan === 'premium' ? 'premium' : 'free'}`}>
                        {user?.subscription?.plan === 'premium' ? 'Premium' : 'Free'}
                      </span>
                    </div>
                    <div className="dropdown-divider" />
                    <Link to="/dashboard" className="dropdown-item">
                      <FiTrendingUp />
                      <span>Dashboard</span>
                    </Link>
                    <Link to="/profile" className="dropdown-item">
                      <FiUser />
                      <span>Profile</span>
                    </Link>
                    <Link to="/profile?tab=settings" className="dropdown-item">
                      <FiSettings />
                      <span>Settings</span>
                    </Link>
                    <div className="dropdown-divider" />
                    <button onClick={handleLogout} className="dropdown-item logout">
                      <FiLogOut />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/signup" className="btn btn-primary">Get Started</Link>
            </div>
          )}

          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mobile-menu-links">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={`mobile-nav-link ${location.pathname === link.path ? 'active' : ''}`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                  {link.premium && <span className="premium-badge">AI</span>}
                </Link>
              ))}
            </div>
            
            {!isAuthenticated && (
              <div className="mobile-auth">
                <Link to="/login" className="btn btn-ghost full-width">Login</Link>
                <Link to="/signup" className="btn btn-primary full-width">Get Started</Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
