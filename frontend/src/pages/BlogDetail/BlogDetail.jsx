import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiHeart, FiMessageCircle, FiShare2, FiBookmark, FiArrowLeft } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import './BlogDetail.css';

const BlogDetail = () => {
  const { id } = useParams();
  const { theme } = useTheme();

  const blog = {
    id: 1,
    title: 'The Ultimate Guide to SIP Investing in 2024',
    content: `
      <p>Systematic Investment Plans (SIPs) have revolutionized the way Indians invest in mutual funds. By allowing investors to invest small amounts regularly, SIPs have made wealth creation accessible to everyone, regardless of their income level.</p>

      <h3>What is a SIP?</h3>
      <p>A SIP is an investment strategy where you invest a fixed amount in mutual funds at regular intervals—typically monthly. This approach leverages the power of rupee cost averaging and compounding to build wealth over time.</p>

      <h3>Benefits of SIP Investing</h3>
      <ul>
        <li><strong>Rupee Cost Averaging:</strong> When markets are down, you buy more units; when they're up, you buy fewer. This averages out your cost over time.</li>
        <li><strong>Power of Compounding:</strong> Your returns generate more returns, creating exponential growth over the long term.</li>
        <li><strong>Disciplined Investing:</strong> Automated investments remove emotions from the equation.</li>
        <li><strong>Flexibility:</strong> Start with as little as ₹500/month and increase as your income grows.</li>
        <li><strong>No Need to Time the Market:</strong> Regular investing eliminates the stress of market timing.</li>
      </ul>

      <h3>Choosing the Right SIP</h3>
      <p>When selecting a mutual fund for SIP, consider these factors:</p>
      <ol>
        <li>Your investment horizon (short, medium, or long-term)</li>
        <li>Risk tolerance (conservative, moderate, or aggressive)</li>
        <li>Fund's historical performance and consistency</li>
        <li>Expense ratio and exit load</li>
        <li>Fund manager's track record</li>
      </ol>

      <h3>SIP vs. Lump Sum</h3>
      <p>While lump sum investments can be powerful in rising markets, SIPs provide better risk-adjusted returns over time. For most investors, especially beginners, SIP is the recommended approach due to its built-in risk mitigation.</p>

      <h3>How Much Should You Invest?</h3>
      <p>A general rule is to invest at least 20% of your income. Use the 50-30-20 rule: 50% for needs, 30% for wants, and 20% for savings and investments. Start small if needed—the key is to start.</p>

      <blockquote>
        "The best time to start investing was 20 years ago. The second best time is now."
      </blockquote>

      <h3>Conclusion</h3>
      <p>SIP investing is one of the most effective ways to build wealth for long-term goals like retirement, children's education, or buying a home. The key is to start early, stay consistent, and increase your contributions as your income grows.</p>
    `,
    category: 'Investing',
    image: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=1200',
    author: 'Priya Sharma',
    authorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    authorBio: 'Financial advisor with 10+ years of experience helping individuals build wealth through smart investing.',
    date: 'March 10, 2024',
    readTime: '8 min read',
    likes: 234,
    comments: 45
  };

  const relatedPosts = [
    { id: 2, title: 'Tax Saving Strategies for Salaried Employees', date: 'Mar 8, 2024' },
    { id: 3, title: 'Building an Emergency Fund: A Complete Guide', date: 'Mar 5, 2024' },
    { id: 4, title: 'Retirement Planning in Your 30s', date: 'Mar 2, 2024' }
  ];

  return (
    <div className={`blog-detail-page ${theme === 'dark' ? 'blog-detail-dark' : ''}`}>
      <div className="blog-detail-header">
        <div className="blog-detail-header-content">
          <Link to="/blog" className="back-link">
            <FiArrowLeft /> Back to Blog
          </Link>
          <motion.span 
            className="blog-detail-category"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {blog.category}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {blog.title}
          </motion.h1>
          <motion.div 
            className="blog-detail-meta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="author-info">
              <img src={blog.authorImage} alt={blog.author} />
              <span>{blog.author}</span>
            </div>
            <span><FiClock /> {blog.date}</span>
            <span>{blog.readTime}</span>
          </motion.div>
        </div>
      </div>

      <div className="blog-detail-container">
        <div className="blog-detail-content">
          <motion.div 
            className="blog-detail-image"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <img src={blog.image} alt={blog.title} />
          </motion.div>

          <motion.article 
            className="blog-article"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          <div className="blog-stats">
            <button className="stat-btn">
              <FiHeart /> {blog.likes} Likes
            </button>
            <button className="stat-btn">
              <FiMessageCircle /> {blog.comments} Comments
            </button>
            <button className="stat-btn">
              <FiBookmark /> Save
            </button>
            <button className="stat-btn">
              <FiShare2 /> Share
            </button>
          </div>

          <div className="author-card">
            <img src={blog.authorImage} alt={blog.author} />
            <div>
              <h4>{blog.author}</h4>
              <p>{blog.authorBio}</p>
            </div>
          </div>
        </div>

        <aside className="blog-sidebar">
          <div className="sidebar-section">
            <h3>Related Posts</h3>
            <div className="related-list">
              {relatedPosts.map(post => (
                <Link key={post.id} to={`/blog/${post.id}`} className="related-item">
                  <h4>{post.title}</h4>
                  <span><FiClock /> {post.date}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BlogDetail;
