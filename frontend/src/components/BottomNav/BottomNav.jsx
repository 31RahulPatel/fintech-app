import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiTrendingUp, FiPercent, FiFileText, 
  FiBookOpen, FiMessageSquare 
} from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import './BottomNav.css';

const BottomNav = () => {
  const location = useLocation();
  const { theme } = useTheme();

  const navItems = [
    { path: '/market', label: 'Market', icon: <FiTrendingUp /> },
    { path: '/calculators', label: 'Calculators', icon: <FiPercent /> },
    { path: '/news', label: 'News', icon: <FiFileText /> },
    { path: '/blog', label: 'Blog', icon: <FiBookOpen /> },
    { path: '/chatbot', label: 'Bazar.ai', icon: <FiMessageSquare /> }
  ];

  return (
    <nav className={`bottom-nav ${theme === 'dark' ? 'bottom-nav-dark' : ''}`}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`bottom-nav-item ${location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;
