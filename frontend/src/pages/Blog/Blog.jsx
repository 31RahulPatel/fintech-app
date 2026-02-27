import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiUser, FiHeart, FiMessageCircle, FiSearch } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import './Blog.css';

const Blog = () => {
  const { theme } = useTheme();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All Posts' },
    { id: 'investing', label: 'Investing' },
    { id: 'savings', label: 'Savings' },
    { id: 'retirement', label: 'Retirement' },
    { id: 'taxes', label: 'Taxes' },
    { id: 'budgeting', label: 'Budgeting' }
  ];

  const blogs = [
    {
      id: 1,
      title: 'The Ultimate Guide to SIP Investing in 2024',
      excerpt: 'Learn how systematic investment plans can help you build wealth over time with disciplined investing...',
      category: 'investing',
      image: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=800',
      author: 'Priya Sharma',
      authorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      date: 'Mar 10, 2024',
      readTime: '8 min read',
      likes: 234,
      comments: 45,
      featured: true
    },
    {
      id: 2,
      title: 'Tax Saving Strategies for Salaried Employees',
      excerpt: 'Maximize your tax savings with these proven strategies under the new tax regime...',
      category: 'taxes',
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
      author: 'Rahul Verma',
      authorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      date: 'Mar 8, 2024',
      readTime: '6 min read',
      likes: 189,
      comments: 32
    },
    {
      id: 3,
      title: 'Building an Emergency Fund: A Complete Guide',
      excerpt: 'Why everyone needs an emergency fund and how to build one effectively...',
      category: 'savings',
      image: 'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=800',
      author: 'Anita Desai',
      authorImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      date: 'Mar 5, 2024',
      readTime: '5 min read',
      likes: 156,
      comments: 28
    },
    {
      id: 4,
      title: 'Retirement Planning in Your 30s: Start Early',
      excerpt: 'The power of compound interest and why starting retirement planning early matters...',
      category: 'retirement',
      image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800',
      author: 'Vikram Singh',
      authorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      date: 'Mar 2, 2024',
      readTime: '7 min read',
      likes: 203,
      comments: 41
    },
    {
      id: 5,
      title: '50-30-20 Rule: Simplify Your Budget',
      excerpt: 'A simple yet effective budgeting strategy that actually works for modern lifestyles...',
      category: 'budgeting',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
      author: 'Neha Kapoor',
      authorImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100',
      date: 'Feb 28, 2024',
      readTime: '4 min read',
      likes: 178,
      comments: 23
    },
    {
      id: 6,
      title: 'Understanding Mutual Fund Categories',
      excerpt: 'A comprehensive breakdown of different mutual fund types and which ones suit your goals...',
      category: 'investing',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      author: 'Amit Patel',
      authorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      date: 'Feb 25, 2024',
      readTime: '10 min read',
      likes: 267,
      comments: 56
    }
  ];

  const filteredBlogs = blogs.filter(blog => {
    const matchesCategory = activeCategory === 'all' || blog.category === activeCategory;
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredBlog = blogs.find(b => b.featured);

  return (
    <div className={`blog-page ${theme === 'dark' ? 'blog-dark' : ''}`}>
      <div className="blog-header">
        <div className="blog-header-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1>Financial Blog</h1>
            <p>Expert insights, tips, and guides for your financial journey</p>
          </motion.div>
        </div>
      </div>

      <div className="blog-container">
        {/* Featured Post */}
        {featuredBlog && (
          <motion.div 
            className="featured-post"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link to={`/blog/${featuredBlog.id}`}>
              <div className="featured-post-image">
                <img src={featuredBlog.image} alt={featuredBlog.title} />
                <span className="featured-badge">Featured</span>
              </div>
              <div className="featured-post-content">
                <span className="post-category">{featuredBlog.category}</span>
                <h2>{featuredBlog.title}</h2>
                <p>{featuredBlog.excerpt}</p>
                <div className="post-meta">
                  <div className="author-info">
                    <img src={featuredBlog.authorImage} alt={featuredBlog.author} />
                    <span>{featuredBlog.author}</span>
                  </div>
                  <span><FiClock /> {featuredBlog.readTime}</span>
                  <span><FiHeart /> {featuredBlog.likes}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Search & Filter */}
        <div className="blog-controls">
          <div className="blog-search">
            <FiSearch />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="blog-categories">
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
        </div>

        {/* Blog Grid */}
        <motion.div 
          className="blog-grid"
          key={activeCategory + searchQuery}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filteredBlogs.filter(b => !b.featured).map((blog, index) => (
            <motion.article
              key={blog.id}
              className="blog-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
            >
              <Link to={`/blog/${blog.id}`}>
                <div className="blog-card-image">
                  <img src={blog.image} alt={blog.title} />
                  <span className="blog-category">{blog.category}</span>
                </div>
                <div className="blog-card-content">
                  <h3>{blog.title}</h3>
                  <p>{blog.excerpt}</p>
                  <div className="blog-card-meta">
                    <div className="author-info">
                      <img src={blog.authorImage} alt={blog.author} />
                      <span>{blog.author}</span>
                    </div>
                    <span className="blog-date">{blog.date}</span>
                  </div>
                  <div className="blog-card-stats">
                    <span><FiClock /> {blog.readTime}</span>
                    <span><FiHeart /> {blog.likes}</span>
                    <span><FiMessageCircle /> {blog.comments}</span>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Blog;
