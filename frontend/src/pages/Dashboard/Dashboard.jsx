import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiTrendingUp, FiDollarSign, FiPieChart, FiActivity,
  FiCalendar, FiArrowUpRight, FiArrowDownRight, FiPlus
} from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const stats = [
    { label: 'Total Investment', value: '₹12,45,000', change: '+12.5%', positive: true, icon: <FiDollarSign /> },
    { label: 'Current Value', value: '₹15,78,340', change: '+26.3%', positive: true, icon: <FiTrendingUp /> },
    { label: 'Today\'s Change', value: '₹2,450', change: '+0.15%', positive: true, icon: <FiActivity /> },
    { label: 'Total SIPs', value: '8 Active', change: '₹25,000/mo', positive: true, icon: <FiCalendar /> }
  ];

  const portfolioData = [
    { name: 'Jan', value: 1000000 },
    { name: 'Feb', value: 1050000 },
    { name: 'Mar', value: 1120000 },
    { name: 'Apr', value: 1080000 },
    { name: 'May', value: 1200000 },
    { name: 'Jun', value: 1350000 },
    { name: 'Jul', value: 1420000 },
    { name: 'Aug', value: 1578340 }
  ];

  const allocationData = [
    { name: 'Equity', value: 60, color: '#fb8500' },
    { name: 'Debt', value: 25, color: '#219ebc' },
    { name: 'Gold', value: 10, color: '#ffd60a' },
    { name: 'Others', value: 5, color: '#8ecae6' }
  ];

  const holdings = [
    { name: 'Axis Bluechip Fund', type: 'Equity', value: '₹4,50,000', change: '+18.2%', positive: true },
    { name: 'HDFC Mid-Cap Fund', type: 'Equity', value: '₹3,20,000', change: '+24.5%', positive: true },
    { name: 'ICICI Prudential Bond', type: 'Debt', value: '₹2,80,000', change: '+7.8%', positive: true },
    { name: 'SBI Small Cap Fund', type: 'Equity', value: '₹2,50,000', change: '-2.3%', positive: false },
    { name: 'Kotak Gold Fund', type: 'Gold', value: '₹1,50,000', change: '+12.1%', positive: true }
  ];

  const recentActivity = [
    { type: 'SIP', name: 'Axis Bluechip Fund', amount: '₹5,000', date: 'Today' },
    { type: 'Redemption', name: 'HDFC Liquid Fund', amount: '₹25,000', date: 'Yesterday' },
    { type: 'SIP', name: 'ICICI Prudential Bond', amount: '₹3,000', date: '2 days ago' },
    { type: 'Purchase', name: 'SBI Small Cap Fund', amount: '₹10,000', date: '5 days ago' }
  ];

  return (
    <div className={`dashboard-page ${theme === 'dark' ? 'dashboard-dark' : ''}`}>
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1>Welcome back, {user?.name || 'Investor'}!</h1>
            <p>Here's your portfolio overview</p>
          </motion.div>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-content">
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value">{stat.value}</span>
                <span className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                  {stat.positive ? <FiArrowUpRight /> : <FiArrowDownRight />}
                  {stat.change}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="dashboard-grid">
          {/* Portfolio Chart */}
          <motion.div 
            className="chart-card portfolio-chart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="card-header">
              <h3>Portfolio Growth</h3>
              <div className="time-filters">
                <button className="active">1M</button>
                <button>3M</button>
                <button>6M</button>
                <button>1Y</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={portfolioData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#eee'} />
                <XAxis dataKey="name" stroke={theme === 'dark' ? '#888' : '#666'} />
                <YAxis stroke={theme === 'dark' ? '#888' : '#666'} tickFormatter={(v) => `₹${v/100000}L`} />
                <Tooltip 
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Value']}
                  contentStyle={{ 
                    background: theme === 'dark' ? '#1a1a1a' : '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#fb8500" 
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#fb8500' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Allocation Chart */}
          <motion.div 
            className="chart-card allocation-chart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="card-header">
              <h3>Asset Allocation</h3>
            </div>
            <div className="allocation-content">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="allocation-legend">
                {allocationData.map((item) => (
                  <div key={item.name} className="legend-item">
                    <span className="legend-color" style={{ background: item.color }}></span>
                    <span className="legend-label">{item.name}</span>
                    <span className="legend-value">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Holdings */}
          <motion.div 
            className="holdings-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="card-header">
              <h3>Top Holdings</h3>
              <button className="view-all">View All</button>
            </div>
            <div className="holdings-list">
              {holdings.map((holding, index) => (
                <div key={index} className="holding-item">
                  <div className="holding-info">
                    <span className="holding-name">{holding.name}</span>
                    <span className="holding-type">{holding.type}</span>
                  </div>
                  <div className="holding-values">
                    <span className="holding-value">{holding.value}</span>
                    <span className={`holding-change ${holding.positive ? 'positive' : 'negative'}`}>
                      {holding.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div 
            className="activity-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="card-header">
              <h3>Recent Activity</h3>
            </div>
            <div className="activity-list">
              {recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className={`activity-icon ${activity.type.toLowerCase()}`}>
                    {activity.type === 'SIP' || activity.type === 'Purchase' ? <FiArrowUpRight /> : <FiArrowDownRight />}
                  </div>
                  <div className="activity-info">
                    <span className="activity-type">{activity.type}</span>
                    <span className="activity-name">{activity.name}</span>
                  </div>
                  <div className="activity-details">
                    <span className="activity-amount">{activity.amount}</span>
                    <span className="activity-date">{activity.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
