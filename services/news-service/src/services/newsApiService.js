const axios = require('axios');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Cache for 15 minutes to avoid hitting rate limits
const newsCache = new NodeCache({ stdTTL: 900 });

// Free RSS/API endpoints (no API key required)
const RSS_FEEDS = {
  india: [
    'https://economictimes.indiatimes.com/rssfeedstopstories.cms',
    'https://www.moneycontrol.com/rss/latestnews.xml'
  ],
  global: [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml'
  ],
  market: [
    'https://www.moneycontrol.com/rss/marketreports.xml',
    'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms'
  ]
};

// Alpha Vantage free API for market news (no key needed for some endpoints)
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY || 'demo';

/**
 * Parse RSS XML to JSON
 */
function parseRSSItem(item, category, source) {
  const title = extractContent(item, 'title') || extractContent(item, 'headline');
  const description = extractContent(item, 'description') || extractContent(item, 'summary') || extractContent(item, 'content');
  const link = extractContent(item, 'link') || extractContent(item, 'guid');
  const pubDate = extractContent(item, 'pubDate') || extractContent(item, 'published') || extractContent(item, 'dc:date');
  
  // Try multiple image patterns
  let image = null;
  const imagePatterns = [
    /<media:content[^>]*url="([^"]+)"/i,
    /<media:thumbnail[^>]*url="([^"]+)"/i,
    /<enclosure[^>]*url="([^"]+)"/i,
    /<image>.*?<url>([^<]+)<\/url>/is,
    /src="(https?:\/\/[^"]+\.(jpg|jpeg|png|gif|webp)[^"]*)"/i
  ];
  
  for (const pattern of imagePatterns) {
    const match = item.match(pattern);
    if (match) {
      image = match[1];
      break;
    }
  }

  // Skip items without title
  if (!title || title === 'No title') {
    return null;
  }

  return {
    id: `${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: title,
    summary: cleanHTML(description || title).substring(0, 200),
    content: cleanHTML(description || title),
    category,
    source: source || 'News',
    author: 'News Desk',
    imageUrl: image || `https://picsum.photos/seed/${Math.random().toString(36).substr(2, 9)}/400/200`,
    publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
    url: link,
    tags: [category.charAt(0).toUpperCase() + category.slice(1), 'Finance', 'Business'],
    readTime: Math.ceil((description?.length || 500) / 200)
  };
}

function extractContent(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? (match[1] || match[2] || '').trim() : '';
}

function cleanHTML(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Fetch RSS feed and parse items
 */
async function fetchRSSFeed(url, category, source) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FintechOps/1.0)'
      }
    });

    const items = response.data.match(/<item>([\s\S]*?)<\/item>/gi) || [];
    const parsed = items
      .slice(0, 8)
      .map(item => parseRSSItem(item, category, source))
      .filter(item => item !== null); // Filter out failed parses
    
    return parsed;
  } catch (error) {
    logger.error(`Failed to fetch RSS from ${url}: ${error.message}`);
    return [];
  }
}

/**
 * Fetch India business/finance news
 */
async function fetchIndiaNews() {
  const cacheKey = 'india_news';
  const cached = newsCache.get(cacheKey);
  if (cached) {
    logger.info('Returning cached India news');
    return cached;
  }

  try {
    const feeds = await Promise.all([
      fetchRSSFeed('https://economictimes.indiatimes.com/rssfeedstopstories.cms', 'india', 'Economic Times'),
      fetchRSSFeed('https://www.livemint.com/rss/news', 'india', 'Livemint')
    ]);

    const news = feeds.flat().slice(0, 10);
    
    if (news.length > 0) {
      newsCache.set(cacheKey, news);
      logger.info(`Fetched ${news.length} India news articles from RSS`);
    }
    return news;
  } catch (error) {
    logger.error(`Failed to fetch India news: ${error.message}`);
    return null;
  }
}

/**
 * Fetch global business news
 */
async function fetchGlobalNews() {
  const cacheKey = 'global_news';
  const cached = newsCache.get(cacheKey);
  if (cached) {
    logger.info('Returning cached global news');
    return cached;
  }

  try {
    const feeds = await Promise.all([
      fetchRSSFeed('https://feeds.bbci.co.uk/news/business/rss.xml', 'global', 'BBC'),
      fetchRSSFeed('https://www.cnbc.com/id/10001147/device/rss/rss.html', 'global', 'CNBC')
    ]);

    const news = feeds.flat().slice(0, 10);
    
    if (news.length > 0) {
      newsCache.set(cacheKey, news);
      logger.info(`Fetched ${news.length} global news articles from RSS`);
    }
    return news;
  } catch (error) {
    logger.error(`Failed to fetch global news: ${error.message}`);
    return null;
  }
}

/**
 * Fetch market news
 */
async function fetchMarketNews() {
  const cacheKey = 'market_news';
  const cached = newsCache.get(cacheKey);
  if (cached) {
    logger.info('Returning cached market news');
    return cached;
  }

  try {
    const feeds = await Promise.all([
      fetchRSSFeed('https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', 'market', 'ET Markets'),
      fetchRSSFeed('https://www.moneycontrol.com/rss/marketreports.xml', 'market', 'Moneycontrol')
    ]);

    const news = feeds.flat().slice(0, 10);
    
    if (news.length > 0) {
      newsCache.set(cacheKey, news);
      logger.info(`Fetched ${news.length} market news articles from RSS`);
    }
    return news;
  } catch (error) {
    logger.error(`Failed to fetch market news: ${error.message}`);
    return null;
  }
}

/**
 * Fetch global market news
 */
async function fetchGlobalMarketNews() {
  const cacheKey = 'global_market_news';
  const cached = newsCache.get(cacheKey);
  if (cached) {
    logger.info('Returning cached global market news');
    return cached;
  }

  try {
    const feeds = await Promise.all([
      fetchRSSFeed('https://www.investing.com/rss/news.rss', 'global-market', 'Investing.com'),
      fetchRSSFeed('https://feeds.finance.yahoo.com/rss/2.0/headline', 'global-market', 'Yahoo Finance')
    ]);

    const news = feeds.flat().slice(0, 10);
    
    if (news.length > 0) {
      newsCache.set(cacheKey, news);
      logger.info(`Fetched ${news.length} global market news articles from RSS`);
    }
    return news;
  } catch (error) {
    logger.error(`Failed to fetch global market news: ${error.message}`);
    return null;
  }
}

/**
 * Search news (uses Google News RSS)
 */
async function searchNews(query) {
  const cacheKey = `search_${query.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = newsCache.get(cacheKey);
  if (cached) {
    logger.info(`Returning cached search results for: ${query}`);
    return cached;
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${encodedQuery}+finance&hl=en-IN&gl=IN&ceid=IN:en`;
    
    const news = await fetchRSSFeed(url, 'search', 'Google News');
    
    if (news.length > 0) {
      newsCache.set(cacheKey, news, 300); // Cache search for 5 minutes
      logger.info(`Fetched ${news.length} search results for: ${query}`);
    }
    return news;
  } catch (error) {
    logger.error(`Failed to search news: ${error.message}`);
    return null;
  }
}

/**
 * Get all news combined
 */
async function fetchAllNews() {
  const cacheKey = 'all_news';
  const cached = newsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const [india, global, market, globalMarket] = await Promise.all([
      fetchIndiaNews(),
      fetchGlobalNews(),
      fetchMarketNews(),
      fetchGlobalMarketNews()
    ]);

    const allNews = [
      ...(india || []),
      ...(global || []),
      ...(market || []),
      ...(globalMarket || [])
    ].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    if (allNews.length > 0) {
      newsCache.set(cacheKey, allNews);
    }
    return allNews;
  } catch (error) {
    logger.error(`Failed to fetch all news: ${error.message}`);
    return null;
  }
}

/**
 * Clear news cache
 */
function clearCache() {
  newsCache.flushAll();
  logger.info('News cache cleared');
}

module.exports = {
  fetchIndiaNews,
  fetchGlobalNews,
  fetchMarketNews,
  fetchGlobalMarketNews,
  searchNews,
  fetchAllNews,
  clearCache
};
