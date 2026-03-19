const NodeCache = require('node-cache');
const Bookmark = require('../models/Bookmark');
const logger = require('../utils/logger');
const newsApiService = require('../services/newsApiService');

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes cache

// Feature flag to use real API
const USE_REAL_API = process.env.USE_REAL_NEWS_API !== 'false';

// Mock news data (fallback)
const mockNews = [
  // India News
  {
    id: '1',
    title: 'RBI Maintains Repo Rate at 6.5%, Focus on Inflation Control',
    summary: 'The Reserve Bank of India kept the repo rate unchanged at 6.5% for the eighth consecutive time, prioritizing inflation management.',
    content: 'The Reserve Bank of India (RBI) on Friday kept the repo rate unchanged at 6.5 percent for the eighth consecutive time as the central bank continues to focus on bringing inflation within its target range of 4 percent...',
    category: 'india',
    source: 'Economic Times',
    author: 'Business Desk',
    imageUrl: 'https://example.com/rbi-news.jpg',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tags: ['RBI', 'Repo Rate', 'Inflation', 'Monetary Policy'],
    readTime: 5
  },
  {
    id: '2',
    title: 'Sensex Hits All-Time High Crossing 75,000 Mark',
    summary: 'Indian stock market achieves historic milestone as Sensex crosses 75,000 for the first time.',
    content: 'The BSE Sensex breached the historic 75,000 mark for the first time on Thursday, driven by strong buying in banking, IT, and auto stocks...',
    category: 'market',
    source: 'Moneycontrol',
    author: 'Markets Team',
    imageUrl: 'https://example.com/sensex-high.jpg',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    tags: ['Sensex', 'BSE', 'Stock Market', 'All-Time High'],
    readTime: 4
  },
  {
    id: '3',
    title: 'Government Announces New Tax Incentives for Startups',
    summary: 'Finance Ministry unveils new tax benefits for eligible startups under the Startup India initiative.',
    content: 'The government has announced new tax incentives for startups registered under the Startup India initiative, including a 3-year tax holiday...',
    category: 'india',
    source: 'Business Standard',
    author: 'Policy Desk',
    imageUrl: 'https://example.com/startup-tax.jpg',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    tags: ['Startups', 'Tax', 'Government', 'Policy'],
    readTime: 6
  },
  // Global News
  {
    id: '4',
    title: 'Federal Reserve Signals Potential Rate Cuts in 2024',
    summary: 'Fed Chair Powell hints at possible interest rate reductions later this year if inflation continues to cool.',
    content: 'Federal Reserve Chair Jerome Powell indicated that the central bank could begin cutting interest rates later in 2024 if inflation continues its downward trend...',
    category: 'global',
    source: 'Reuters',
    author: 'Finance Editor',
    imageUrl: 'https://example.com/fed-rates.jpg',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    tags: ['Federal Reserve', 'Interest Rates', 'US Economy', 'Inflation'],
    readTime: 5
  },
  {
    id: '5',
    title: 'Apple Reports Record Revenue in Services Segment',
    summary: 'Tech giant Apple posts strong quarterly results with services revenue hitting all-time high.',
    content: 'Apple Inc. reported record revenue in its services segment during the latest quarter, with strong growth in App Store sales, cloud services, and Apple Music subscriptions...',
    category: 'global-market',
    source: 'Bloomberg',
    author: 'Tech Reporter',
    imageUrl: 'https://example.com/apple-earnings.jpg',
    publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    tags: ['Apple', 'Tech Stocks', 'Earnings', 'Services'],
    readTime: 4
  },
  {
    id: '6',
    title: 'European Markets Rally on ECB Rate Decision',
    summary: 'European stocks surge as ECB maintains interest rates, boosting investor confidence.',
    content: 'European equity markets rallied on Thursday after the European Central Bank decided to keep interest rates unchanged, signaling a potential pause in the tightening cycle...',
    category: 'global-market',
    source: 'Financial Times',
    author: 'Europe Editor',
    imageUrl: 'https://example.com/ecb-markets.jpg',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    tags: ['ECB', 'Europe', 'Interest Rates', 'Markets'],
    readTime: 5
  },
  // Market News
  {
    id: '7',
    title: 'Reliance Industries Plans Major Expansion in Renewable Energy',
    summary: 'Reliance announces Rs 75,000 crore investment in green energy over the next 5 years.',
    content: 'Reliance Industries Limited has unveiled plans to invest Rs 75,000 crore in renewable energy projects over the next five years, focusing on solar, hydrogen, and battery storage...',
    category: 'market',
    source: 'Livemint',
    author: 'Industry Reporter',
    imageUrl: 'https://example.com/reliance-green.jpg',
    publishedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    tags: ['Reliance', 'Green Energy', 'Investment', 'Renewable'],
    readTime: 6
  },
  {
    id: '8',
    title: 'IT Sector Faces Headwinds Amid Global Slowdown',
    summary: 'Indian IT companies brace for challenging quarter as global tech spending slows.',
    content: 'India\'s IT sector is facing headwinds as global technology spending shows signs of slowdown, with major companies revising growth guidance downward...',
    category: 'market',
    source: 'NDTV Profit',
    author: 'Tech Analyst',
    imageUrl: 'https://example.com/it-sector.jpg',
    publishedAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    tags: ['IT Sector', 'Tech', 'Global Slowdown', 'TCS', 'Infosys'],
    readTime: 5
  },
  {
    id: '9',
    title: 'Gold Prices Surge to New Highs on Safe-Haven Demand',
    summary: 'Gold prices reach record levels as investors seek safe-haven assets amid geopolitical tensions.',
    content: 'Gold prices surged to fresh record highs on Monday as investors flocked to safe-haven assets amid rising geopolitical tensions and concerns about global economic growth...',
    category: 'market',
    source: 'Economic Times',
    author: 'Commodities Desk',
    imageUrl: 'https://example.com/gold-prices.jpg',
    publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    tags: ['Gold', 'Commodities', 'Safe Haven', 'Investment'],
    readTime: 4
  },
  {
    id: '10',
    title: 'Cryptocurrency Market Rebounds After Recent Correction',
    summary: 'Bitcoin and Ethereum recover losses as institutional buying returns to crypto markets.',
    content: 'The cryptocurrency market staged a strong recovery on Wednesday, with Bitcoin rising above $60,000 and Ethereum gaining 8% as institutional investors returned to the market...',
    category: 'global-market',
    source: 'CoinDesk',
    author: 'Crypto Editor',
    imageUrl: 'https://example.com/crypto-rebound.jpg',
    publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    tags: ['Bitcoin', 'Ethereum', 'Cryptocurrency', 'Blockchain'],
    readTime: 5
  }
];

// Get all news
exports.getAllNews = async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    
    let news = [];
    
    // Try real API first
    if (USE_REAL_API) {
      const realNews = await newsApiService.fetchAllNews();
      if (realNews && realNews.length > 0) {
        news = realNews;
        logger.info('Using real news API data');
      }
    }
    
    // Fallback to mock data
    if (news.length === 0) {
      news = [...mockNews];
      logger.info('Using mock news data (fallback)');
    }
    
    if (category) {
      news = news.filter(n => n.category === category);
    }
    
    const startIndex = (page - 1) * limit;
    const paginatedNews = news.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      news: paginatedNews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: news.length,
        pages: Math.ceil(news.length / limit)
      },
      source: news.length > 0 && news[0].url ? 'live' : 'mock'
    });
  } catch (error) {
    logger.error(`Get all news error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
};

// Search news
exports.searchNews = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    let results = [];
    
    // Try real API search first
    if (USE_REAL_API) {
      const realResults = await newsApiService.searchNews(q);
      if (realResults && realResults.length > 0) {
        results = realResults;
        logger.info(`Real API search for: ${q}`);
      }
    }
    
    // Fallback to mock data search
    if (results.length === 0) {
      const searchLower = q.toLowerCase();
      results = mockNews.filter(n => 
        n.title.toLowerCase().includes(searchLower) ||
        n.summary.toLowerCase().includes(searchLower) ||
        n.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
      logger.info(`Mock data search for: ${q}`);
    }
    
    const startIndex = (page - 1) * limit;
    const paginatedNews = results.slice(startIndex, startIndex + parseInt(limit));
    
    logger.info(`News search performed: ${q}`);
    
    res.json({
      news: paginatedNews,
      query: q,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: results.length,
        pages: Math.ceil(results.length / limit)
      },
      source: results.length > 0 && results[0].url ? 'live' : 'mock'
    });
  } catch (error) {
    logger.error(`Search news error: ${error.message}`);
    res.status(500).json({ error: 'Search failed' });
  }
};

// Get India news
exports.getIndiaNews = async (req, res) => {
  try {
    let news = [];
    
    if (USE_REAL_API) {
      const realNews = await newsApiService.fetchIndiaNews();
      if (realNews && realNews.length > 0) {
        news = realNews;
      }
    }
    
    if (news.length === 0) {
      news = mockNews.filter(n => n.category === 'india');
    }
    
    res.json({ news, count: news.length, source: news.length > 0 && news[0].url ? 'live' : 'mock' });
  } catch (error) {
    logger.error(`Get India news error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch India news' });
  }
};

// Get Global news
exports.getGlobalNews = async (req, res) => {
  try {
    let news = [];
    
    if (USE_REAL_API) {
      const realNews = await newsApiService.fetchGlobalNews();
      if (realNews && realNews.length > 0) {
        news = realNews;
      }
    }
    
    if (news.length === 0) {
      news = mockNews.filter(n => n.category === 'global');
    }
    
    res.json({ news, count: news.length, source: news.length > 0 && news[0].url ? 'live' : 'mock' });
  } catch (error) {
    logger.error(`Get global news error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch global news' });
  }
};

// Get Market news
exports.getMarketNews = async (req, res) => {
  try {
    let news = [];
    
    if (USE_REAL_API) {
      const realNews = await newsApiService.fetchMarketNews();
      if (realNews && realNews.length > 0) {
        news = realNews;
      }
    }
    
    if (news.length === 0) {
      news = mockNews.filter(n => n.category === 'market');
    }
    
    res.json({ news, count: news.length, source: news.length > 0 && news[0].url ? 'live' : 'mock' });
  } catch (error) {
    logger.error(`Get market news error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch market news' });
  }
};

// Get Global Market news
exports.getGlobalMarketNews = async (req, res) => {
  try {
    let news = [];
    
    if (USE_REAL_API) {
      const realNews = await newsApiService.fetchGlobalMarketNews();
      if (realNews && realNews.length > 0) {
        news = realNews;
      }
    }
    
    if (news.length === 0) {
      news = mockNews.filter(n => n.category === 'global-market');
    }
    
    res.json({ news, count: news.length, source: news.length > 0 && news[0].url ? 'live' : 'mock' });
  } catch (error) {
    logger.error(`Get global market news error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch global market news' });
  }
};

// Get trending news
exports.getTrendingNews = async (req, res) => {
  try {
    let news = [];
    
    // Try to get real news first
    if (USE_REAL_API) {
      const allNews = await newsApiService.fetchAllNews();
      if (allNews && allNews.length > 0) {
        // Return top 5 most recent as trending
        news = allNews.slice(0, 5);
      }
    }
    
    if (news.length === 0) {
      news = mockNews.slice(0, 5);
    }
    
    res.json({ news, count: news.length, source: news.length > 0 && news[0].url ? 'live' : 'mock' });
  } catch (error) {
    logger.error(`Get trending news error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch trending news' });
  }
};

// Refresh news cache (admin endpoint)
exports.refreshCache = async (req, res) => {
  try {
    newsApiService.clearCache();
    cache.flushAll();
    logger.info('News cache refreshed');
    res.json({ message: 'Cache refreshed successfully' });
  } catch (error) {
    logger.error(`Refresh cache error: ${error.message}`);
    res.status(500).json({ error: 'Failed to refresh cache' });
  }
};

// Get news by ID
exports.getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    const news = mockNews.find(n => n.id === id);
    
    if (!news) {
      return res.status(404).json({ error: 'News article not found' });
    }
    
    // Get related news
    const related = mockNews
      .filter(n => n.id !== id && n.category === news.category)
      .slice(0, 3);
    
    res.json({ news, related });
  } catch (error) {
    logger.error(`Get news by ID error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch news article' });
  }
};

// Bookmark news
exports.bookmarkNews = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { newsId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const news = mockNews.find(n => n.id === newsId);
    if (!news) {
      return res.status(404).json({ error: 'News article not found' });
    }
    
    let bookmark = await Bookmark.findOne({ userId });
    
    if (!bookmark) {
      bookmark = new Bookmark({ userId, newsIds: [] });
    }
    
    if (bookmark.newsIds.includes(newsId)) {
      return res.status(400).json({ error: 'Already bookmarked' });
    }
    
    bookmark.newsIds.push(newsId);
    await bookmark.save();
    
    logger.info(`News bookmarked: ${newsId} by user ${userId}`);
    res.json({ message: 'News bookmarked successfully' });
  } catch (error) {
    logger.error(`Bookmark news error: ${error.message}`);
    res.status(500).json({ error: 'Failed to bookmark news' });
  }
};

// Get bookmarks
exports.getBookmarks = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const bookmark = await Bookmark.findOne({ userId });
    
    if (!bookmark) {
      return res.json({ bookmarks: [], count: 0 });
    }
    
    const bookmarkedNews = mockNews.filter(n => bookmark.newsIds.includes(n.id));
    
    res.json({ bookmarks: bookmarkedNews, count: bookmarkedNews.length });
  } catch (error) {
    logger.error(`Get bookmarks error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
};

// Remove bookmark
exports.removeBookmark = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const bookmark = await Bookmark.findOne({ userId });
    
    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    
    const index = bookmark.newsIds.indexOf(id);
    if (index === -1) {
      return res.status(404).json({ error: 'News not bookmarked' });
    }
    
    bookmark.newsIds.splice(index, 1);
    await bookmark.save();
    
    logger.info(`Bookmark removed: ${id} by user ${userId}`);
    res.json({ message: 'Bookmark removed successfully' });
  } catch (error) {
    logger.error(`Remove bookmark error: ${error.message}`);
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
};
