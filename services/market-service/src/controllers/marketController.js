const NodeCache = require('node-cache');
const Watchlist = require('../models/Watchlist');
const logger = require('../utils/logger');
const marketDataService = require('../services/marketDataService');

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

// Search stocks (now via Yahoo Finance)
exports.searchStocks = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const results = await marketDataService.searchStock(q);
    logger.info(`Stock search performed: ${q}`);
    res.json({ results, count: results.length });
  } catch (error) {
    logger.error(`Search error: ${error.message}`);
    res.status(500).json({ error: 'Search failed' });
  }
};

// Get indices (real data)
exports.getIndices = async (req, res) => {
  try {
    const cached = cache.get('indices');
    if (cached) return res.json(cached);

    const indices = await marketDataService.fetchIndianIndices();
    const payload = {
      indices: indices.map(idx => ({
        symbol: idx.symbol,
        name: idx.name,
        value: idx.price,
        change: idx.changeAbsolute || idx.change,
        changePercent: idx.change
      })),
      lastUpdated: new Date().toISOString()
    };

    cache.set('indices', payload);
    res.json(payload);
  } catch (error) {
    logger.error(`Get indices error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch indices' });
  }
};

// Get Nifty 50 (real data)
exports.getNifty50 = async (req, res) => {
  try {
    const cached = cache.get('nifty50');
    if (cached) return res.json(cached);

    const stocks = await marketDataService.fetchNSEStocks();
    const data = { stocks, lastUpdated: new Date().toISOString() };
    cache.set('nifty50', data);
    res.json(data);
  } catch (error) {
    logger.error(`Get Nifty50 error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch Nifty 50' });
  }
};

// Get top gainers (real data)
exports.getTopGainers = async (req, res) => {
  try {
    const movers = await marketDataService.fetchTopMovers();
    res.json({ gainers: movers.gainers, lastUpdated: new Date().toISOString() });
  } catch (error) {
    logger.error(`Get gainers error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch gainers' });
  }
};

// Get top losers (real data)
exports.getTopLosers = async (req, res) => {
  try {
    const movers = await marketDataService.fetchTopMovers();
    res.json({ losers: movers.losers, lastUpdated: new Date().toISOString() });
  } catch (error) {
    logger.error(`Get losers error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch losers' });
  }
};

// Get top ETFs (real data)
exports.getTopETFs = async (req, res) => {
  try {
    const etfs = await marketDataService.fetchETFs();
    res.json({ etfs, lastUpdated: new Date().toISOString() });
  } catch (error) {
    logger.error(`Get ETFs error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch ETFs' });
  }
};

// Get top mutual funds (real data)
exports.getTopMutualFunds = async (req, res) => {
  try {
    const mutualFunds = await marketDataService.fetchMutualFunds();
    res.json({ mutualFunds, lastUpdated: new Date().toISOString() });
  } catch (error) {
    logger.error(`Get mutual funds error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch mutual funds' });
  }
};

// Get prostocks (Premium only – kept as curated picks)
exports.getProStocks = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'premium' && userRole !== 'admin') {
      return res.status(403).json({
        error: 'Premium subscription required',
        message: 'Upgrade to premium to access ProStocks recommendations'
      });
    }

    // ProStocks are curated premium picks – fetch real prices for them
    const proSymbols = ['RELIANCE.NS', 'SUNPHARMA.NS', 'LT.NS', 'SBIN.NS', 'BHARTIARTL.NS'];
    const stocks = await Promise.all(proSymbols.map(s => marketDataService.fetchStockDetails(s)));
    const proStocks = stocks.filter(Boolean).map((s, i) => ({
      ...s,
      recommendation: i % 2 === 0 ? 'Strong Buy' : 'Buy',
      target: parseFloat((s.price * (1 + (15 + Math.random() * 15) / 100)).toFixed(2)),
      upside: parseFloat((15 + Math.random() * 15).toFixed(1))
    }));

    res.json({ proStocks, lastUpdated: new Date().toISOString() });
  } catch (error) {
    logger.error(`Get prostocks error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch prostocks' });
  }
};

// Get commodities (real data)
exports.getCommodities = async (req, res) => {
  try {
    const commodities = await marketDataService.fetchCommodities();
    res.json({ commodities, lastUpdated: new Date().toISOString() });
  } catch (error) {
    logger.error(`Get commodities error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch commodities' });
  }
};

// Get global markets (real data)
exports.getGlobalMarkets = async (req, res) => {
  try {
    const markets = await marketDataService.fetchGlobalIndices();
    res.json({ markets, lastUpdated: new Date().toISOString() });
  } catch (error) {
    logger.error(`Get global markets error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch global markets' });
  }
};

// Get stock details (real data)
exports.getStockDetails = async (req, res) => {
  try {
    const { symbol } = req.params;
    const stock = await marketDataService.fetchStockDetails(symbol);

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    res.json({ stock });
  } catch (error) {
    logger.error(`Get stock details error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch stock details' });
  }
};

// Get stock history (real data)
exports.getStockHistory = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '1M' } = req.query;

    const history = await marketDataService.fetchStockHistory(symbol, period);

    if (!history || history.length === 0) {
      return res.status(404).json({ error: 'No historical data found' });
    }

    res.json({ symbol, period, history });
  } catch (error) {
    logger.error(`Get stock history error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch stock history' });
  }
};

// Get user watchlist (real prices)
exports.getWatchlist = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const watchlist = await Watchlist.findOne({ userId });

    if (!watchlist || watchlist.stocks.length === 0) {
      return res.json({ watchlist: [], count: 0 });
    }

    // Fetch current prices for watchlist symbols
    const yahooSymbols = watchlist.stocks.map(s => `${s}.NS`);
    const items = await Promise.all(
      yahooSymbols.map(s => marketDataService.fetchStockDetails(s))
    );

    const watchlistItems = items
      .filter(Boolean)
      .map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        change: stock.changeAbsolute,
        changePercent: stock.change
      }));

    res.json({ watchlist: watchlistItems, count: watchlistItems.length });
  } catch (error) {
    logger.error(`Get watchlist error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
};

// Add to watchlist
exports.addToWatchlist = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { symbol } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let watchlist = await Watchlist.findOne({ userId });

    if (!watchlist) {
      watchlist = new Watchlist({ userId, stocks: [] });
    }

    if (watchlist.stocks.includes(symbol.toUpperCase())) {
      return res.status(400).json({ error: 'Stock already in watchlist' });
    }

    if (watchlist.stocks.length >= 50) {
      return res.status(400).json({ error: 'Watchlist limit reached (50 stocks)' });
    }

    watchlist.stocks.push(symbol.toUpperCase());
    await watchlist.save();

    logger.info(`Added to watchlist: ${symbol} for user ${userId}`);
    res.json({ message: 'Added to watchlist', symbol: symbol.toUpperCase() });
  } catch (error) {
    logger.error(`Add to watchlist error: ${error.message}`);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
};

// Remove from watchlist
exports.removeFromWatchlist = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { symbol } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const watchlist = await Watchlist.findOne({ userId });

    if (!watchlist) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    const index = watchlist.stocks.indexOf(symbol.toUpperCase());
    if (index === -1) {
      return res.status(404).json({ error: 'Stock not in watchlist' });
    }

    watchlist.stocks.splice(index, 1);
    await watchlist.save();

    logger.info(`Removed from watchlist: ${symbol} for user ${userId}`);
    res.json({ message: 'Removed from watchlist', symbol: symbol.toUpperCase() });
  } catch (error) {
    logger.error(`Remove from watchlist error: ${error.message}`);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
};

// ===== LIVE MARKET DATA AGGREGATE ENDPOINTS =====

// Get all live market data
exports.getAllMarketData = async (req, res) => {
  try {
    const data = await marketDataService.fetchAllMarketData();
    res.json({
      success: true,
      data,
      source: 'Yahoo Finance'
    });
  } catch (error) {
    logger.error('Error fetching live market data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market data'
    });
  }
};

// Get live Indian indices
exports.getLiveIndices = async (req, res) => {
  try {
    const indices = await marketDataService.fetchIndianIndices();
    res.json({
      success: true,
      data: indices,
      source: 'Yahoo Finance'
    });
  } catch (error) {
    logger.error('Error fetching live indices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch indices' });
  }
};

// Get live global indices
exports.getLiveGlobalIndices = async (req, res) => {
  try {
    const indices = await marketDataService.fetchGlobalIndices();
    res.json({
      success: true,
      data: indices,
      source: 'Yahoo Finance'
    });
  } catch (error) {
    logger.error('Error fetching global indices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch global indices' });
  }
};

// Get live top movers
exports.getLiveMovers = async (req, res) => {
  try {
    const movers = await marketDataService.fetchTopMovers();
    res.json({
      success: true,
      data: movers,
      source: 'Yahoo Finance'
    });
  } catch (error) {
    logger.error('Error fetching top movers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch top movers' });
  }
};

// Refresh live data cache
exports.refreshLiveData = async (req, res) => {
  try {
    marketDataService.clearCache();
    cache.flushAll();
    const data = await marketDataService.fetchAllMarketData();
    res.json({
      success: true,
      message: 'Cache refreshed',
      data
    });
  } catch (error) {
    logger.error('Error refreshing cache:', error);
    res.status(500).json({ success: false, error: 'Failed to refresh cache' });
  }
};
