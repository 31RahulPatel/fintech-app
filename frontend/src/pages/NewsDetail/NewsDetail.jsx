import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiUser, FiShare2, FiBookmark, FiArrowLeft } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import './NewsDetail.css';

const NewsDetail = () => {
  const { id } = useParams();
  const { theme } = useTheme();

  // Mock data - in real app, fetch based on id
  const news = {
    id: 1,
    title: 'RBI Keeps Repo Rate Unchanged at 6.5% for Eighth Consecutive Time',
    content: `
      <p>The Reserve Bank of India's Monetary Policy Committee (MPC) on Friday decided to keep the benchmark repo rate unchanged at 6.5% for the eighth consecutive time, maintaining its stance of "withdrawal of accommodation" to ensure inflation progressively aligns with the target.</p>

      <p>RBI Governor Shaktikanta Das announced the decision following the three-day MPC meeting. The central bank also revised its GDP growth forecast for FY25 to 7% from the earlier estimate of 6.5%, citing robust economic activity.</p>

      <h3>Key Highlights:</h3>
      <ul>
        <li>Repo rate unchanged at 6.5%</li>
        <li>Standing deposit facility (SDF) rate remains at 6.25%</li>
        <li>Marginal standing facility (MSF) rate at 6.75%</li>
        <li>GDP growth forecast revised upward to 7%</li>
        <li>Inflation projection maintained at 4.5% for FY25</li>
      </ul>

      <p>"The domestic economy continues to be resilient with strong momentum. Real GDP growth for 2024-25 is projected at 7.0%," Governor Das said during the announcement.</p>

      <h3>Market Reaction</h3>
      <p>Following the announcement, the Indian rupee remained stable against the US dollar while benchmark indices showed mixed reactions. Banking stocks saw modest gains as the status quo on rates provides relief to borrowers.</p>

      <p>Analysts expect the RBI to maintain this stance for the near term as it balances growth objectives with inflation management. The next MPC meeting is scheduled for October 2024.</p>
    `,
    category: 'Economy',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200',
    author: 'Financial Desk',
    authorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    date: 'March 15, 2024',
    readTime: '5 min read'
  };

  const relatedNews = [
    { id: 2, title: 'Nifty 50 Hits Record High Amid FII Buying', date: '4 hours ago' },
    { id: 3, title: 'HDFC Bank Reports 20% Growth in Q3 Profits', date: '6 hours ago' },
    { id: 4, title: 'Bitcoin Surges Past $65,000 on ETF Optimism', date: '8 hours ago' }
  ];

  return (
    <div className={`news-detail-page ${theme === 'dark' ? 'news-detail-dark' : ''}`}>
      <div className="news-detail-header">
        <div className="news-detail-header-content">
          <Link to="/news" className="back-link">
            <FiArrowLeft /> Back to News
          </Link>
          <motion.span 
            className="news-detail-category"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {news.category}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {news.title}
          </motion.h1>
          <motion.div 
            className="news-detail-meta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="author-info">
              <img src={news.authorImage} alt={news.author} />
              <span>{news.author}</span>
            </div>
            <span><FiClock /> {news.date}</span>
            <span>{news.readTime}</span>
          </motion.div>
        </div>
      </div>

      <div className="news-detail-container">
        <div className="news-detail-content">
          <motion.div 
            className="news-detail-image"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <img src={news.image} alt={news.title} />
          </motion.div>

          <motion.article 
            className="news-article"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            dangerouslySetInnerHTML={{ __html: news.content }}
          />

          <div className="news-actions">
            <button className="action-btn">
              <FiBookmark /> Save Article
            </button>
            <button className="action-btn">
              <FiShare2 /> Share
            </button>
          </div>
        </div>

        <aside className="news-sidebar">
          <div className="sidebar-section">
            <h3>Related News</h3>
            <div className="related-list">
              {relatedNews.map(item => (
                <Link key={item.id} to={`/news/${item.id}`} className="related-item">
                  <h4>{item.title}</h4>
                  <span><FiClock /> {item.date}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default NewsDetail;
