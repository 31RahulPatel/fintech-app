import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiTrendingUp, FiTrendingDown, FiSearch, FiStar, FiRefreshCw,
  FiGlobe, FiDollarSign, FiBarChart2
} from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { API_CONFIG } from '../../config/api';
import './Market.css';

const Market = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('indices');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Market data state
  const [indices, setIndices] = useState([]);
  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  const [globalMarkets, setGlobalMarkets] = useState([]);

  const tabs = [
    { id: 'indices', label: 'Indices', icon: <FiBarChart2 /> },
    { id: 'gainers', label: 'Top Gainers', icon: <FiTrendingUp /> },
    { id: 'losers', label: 'Top Losers', icon: <FiTrendingDown /> },
    { id: 'global', label: 'Global', icon: <FiGlobe /> }
  ];

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.MARKET_API}/market-data`);
      if (!response.ok) throw new Error('Failed to fetch market data');
      
      const result = await response.json();
      const data = result.data;
      
      // Map indices data
      setIndices(data.indianIndices.map(idx => ({
        name: idx.name,
        value: idx.price,
        change: idx.change,
        volume: formatVolume(idx.volume)
      })));
      
      // Map gainers
      setTopGainers(data.topGainers.map(stock => ({
        name: stock.name,
        price: stock.price,
        change: stock.change,
        volume: formatVolume(stock.volume)
      })));
      
      // Map losers
      setTopLosers(data.topLosers.map(stock => ({
        name: stock.name,
        price: stock.price,
        change: stock.change,
        volume: formatVolume(stock.volume)
      })));
      
      // Map global indices
      setGlobalMarkets(data.globalIndices.map(idx => ({
        name: idx.name,
        value: idx.price,
        change: idx.change,
        region: idx.region
      })));
      
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatVolume = (vol) => {
    if (!vol) return 'N/A';
    if (vol >= 10000000) return `${(vol / 10000000).toFixed(1)}Cr`;
    if (vol >= 100000) return `${(vol / 100000).toFixed(1)}L`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toString();
  };

  useEffect(() => {
    fetchMarketData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getActiveData = () => {
    switch (activeTab) {
      case 'indices': return indices;
      case 'gainers': return topGainers;
      case 'losers': return topLosers;
      case 'global': return globalMarkets;
      default: return indices;
    }
  };

  return (
    <div className={`market-page ${theme === 'dark' ? 'market-dark' : ''}`}>
      <div className="market-header">
        <div className="market-header-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1>Market Data</h1>
            <p>Real-time market data from Yahoo Finance</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
              <button 
                onClick={fetchMarketData} 
                disabled={loading}
                style={{ 
                  padding: '8px 16px', 
                  cursor: loading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
              </button>
              {lastUpdated && (
                <span style={{ fontSize: '12px', opacity: 0.7 }}>
                  Last updated: {lastUpdated}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="market-container">
        <div className="market-summary">
          {loading && indices.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
              Loading market data...
            </div>
          ) : (
            indices.slice(0, 4).map((index, i) => (
              <motion.div 
                key={index.name} 
                className="summary-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="summary-name">{index.name}</span>
                <span className={`summary-value ${index.change >= 0 ? 'positive' : 'negative'}`}>
                  {index.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className={`summary-change ${index.change >= 0 ? 'positive' : 'negative'}`}>
                  {index.change >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                  {index.change >= 0 ? '+' : ''}{index.change}%
                </span>
              </motion.div>
            ))
          )}
        </div>

        <div className="market-content">
          <div className="market-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`market-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="market-search">
            <FiSearch />
            <input
              type="text"
              placeholder="Search stocks, indices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <motion.div 
            className="market-table"
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="text-right">{activeTab === 'indices' || activeTab === 'global' ? 'Value' : 'Price'}</th>
                  <th className="text-right">Change %</th>
                  <th className="text-right">{activeTab === 'global' ? 'Region' : 'Volume'}</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {getActiveData().map((item, index) => (
                  <motion.tr 
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td>
                      <span className="stock-name">{item.name}</span>
                    </td>
                    <td className="text-right">
                      <span className="stock-price">
                        {(item.value || item.price).toLocaleString('en-IN', { 
                          minimumFractionDigits: 2 
                        })}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={`stock-change ${item.change >= 0 ? 'positive' : 'negative'}`}>
                        {item.change >= 0 ? '+' : ''}{item.change}%
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="stock-volume">{item.volume || item.region}</span>
                    </td>
                    <td className="text-center">
                      <button className="action-btn" title="Add to Watchlist">
                        <FiStar />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Market;
