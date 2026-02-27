import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiTrendingUp, FiBookmark, FiShare2, FiRefreshCw } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { API_CONFIG } from '../../config/api';
import './News.css';

const News = () => {
  const { theme } = useTheme();
  const [activeCategory, setActiveCategory] = useState('all');
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = [
    { id: 'all', label: 'All News' },
    { id: 'markets', label: 'Markets' },
    { id: 'economy', label: 'Economy' },
    { id: 'banking', label: 'Banking' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'global', label: 'Global' }
  ];

  // Helper function to calculate relative time
  const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  // Map API categories to our categories
  const mapCategory = (source, title) => {
    const titleLower = (title || '').toLowerCase();
    if (titleLower.includes('bitcoin') || titleLower.includes('crypto') || titleLower.includes('ethereum')) return 'crypto';
    if (titleLower.includes('bank') || titleLower.includes('rbi') || titleLower.includes('fed')) return 'banking';
    if (titleLower.includes('gdp') || titleLower.includes('inflation') || titleLower.includes('economy')) return 'economy';
    if (titleLower.includes('nifty') || titleLower.includes('sensex') || titleLower.includes('stock') || titleLower.includes('market')) return 'markets';
    return 'global';
  };

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.NEWS_API}/`);
      if (!response.ok) throw new Error('Failed to fetch news');
      const data = await response.json();
      
      const mappedNews = (data.news || []).map((item, index) => ({
        id: index + 1,
        title: item.title,
        excerpt: item.description || item.title,
        category: mapCategory(item.source, item.title),
        image: item.image || `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800`,
        author: item.source || 'Financial News',
        date: getRelativeTime(item.publishedAt),
        url: item.url,
        featured: index < 2
      }));
      
      setNewsData(mappedNews);
      setError(null);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const filteredNews = activeCategory === 'all' 
    ? newsData 
    : newsData.filter(n => n.category === activeCategory);

  const featuredNews = newsData.filter(n => n.featured);

  if (loading && newsData.length === 0) {
    return (
      <div className={`news-page ${theme === 'dark' ? 'news-dark' : ''}`}>
        <div className="news-header">
          <div className="news-header-content">
            <h1>Financial News</h1>
            <p>Loading latest news...</p>
          </div>
        </div>
        <div className="news-container">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`news-page ${theme === 'dark' ? 'news-dark' : ''}`}>
      <div className="news-header">
        <div className="news-header-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1>Financial News</h1>
            <p>Stay updated with the latest market news and insights</p>
            <button 
              className="refresh-btn" 
              onClick={fetchNews} 
              disabled={loading}
              style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}
            >
              <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
            </button>
          </motion.div>
        </div>
      </div>

      {error && (
        <div className="news-error" style={{ textAlign: 'center', padding: '20px', color: '#e74c3c' }}>
          {error}
        </div>
      )}

      <div className="news-container">
        {/* Featured Section */}
        <section className="featured-section">
          <div className="featured-grid">
            {featuredNews.map((news, index) => (
              <motion.div
                key={news.id}
                className={`featured-card ${index === 0 ? 'featured-main' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/news/${news.id}`}>
                  <div className="featured-image">
                    <img src={news.image} alt={news.title} />
                    <span className="featured-category">{news.category}</span>
                  </div>
                  <div className="featured-content">
                    <h2>{news.title}</h2>
                    <p>{news.excerpt}</p>
                    <div className="featured-meta">
                      <span>{news.author}</span>
                      <span><FiClock /> {news.date}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <div className="news-categories">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* News Grid */}
        <motion.div 
          className="news-grid"
          key={activeCategory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filteredNews.map((news, index) => (
            <motion.article
              key={news.id}
              className="news-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
            >
              <Link to={`/news/${news.id}`}>
                <div className="news-card-image">
                  <img src={news.image} alt={news.title} />
                  <span className="news-category">{news.category}</span>
                </div>
                <div className="news-card-content">
                  <h3>{news.title}</h3>
                  <p>{news.excerpt}</p>
                  <div className="news-card-meta">
                    <span className="news-author">{news.author}</span>
                    <span className="news-date"><FiClock /> {news.date}</span>
                  </div>
                </div>
              </Link>
              <div className="news-card-actions">
                <button><FiBookmark /></button>
                <button><FiShare2 /></button>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default News;
