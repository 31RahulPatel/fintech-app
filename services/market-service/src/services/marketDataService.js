const YahooFinance = require('yahoo-finance2').default;
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Initialize yahoo-finance2 v3 instance
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Cache: 2 minutes for live data
const marketCache = new NodeCache({ stdTTL: 120 });

// ── Symbol Maps ────────────────────────────────────────────────────────────────

const INDIAN_INDEX_SYMBOLS = {
  '^NSEI':      'NIFTY 50',
  '^BSESN':    'SENSEX',
  '^NSEBANK':  'BANK NIFTY',
  '^CNXIT':    'NIFTY IT'
};

const GLOBAL_INDEX_SYMBOLS = {
  '^DJI':      { name: 'DOW JONES',     region: 'US' },
  '^IXIC':     { name: 'NASDAQ',        region: 'US' },
  '^GSPC':     { name: 'S&P 500',       region: 'US' },
  '^FTSE':     { name: 'FTSE 100',      region: 'UK' },
  '^N225':     { name: 'NIKKEI 225',    region: 'Japan' },
  '^HSI':      { name: 'HANG SENG',     region: 'Hong Kong' },
  '^GDAXI':    { name: 'DAX',           region: 'Germany' },
  '000001.SS': { name: 'SSE COMPOSITE', region: 'China' },
  '^KS11':     { name: 'KOSPI',         region: 'South Korea' },
  '^AXJO':     { name: 'S&P/ASX 200',   region: 'Australia' }
};

const NSE_STOCKS = [
  { yahoo: 'RELIANCE.NS',   name: 'Reliance Industries' },
  { yahoo: 'TCS.NS',        name: 'Tata Consultancy Services' },
  { yahoo: 'HDFCBANK.NS',   name: 'HDFC Bank' },
  { yahoo: 'INFY.NS',       name: 'Infosys' },
  { yahoo: 'ICICIBANK.NS',  name: 'ICICI Bank' },
  { yahoo: 'HINDUNILVR.NS', name: 'Hindustan Unilever' },
  { yahoo: 'ITC.NS',        name: 'ITC Ltd' },
  { yahoo: 'SBIN.NS',       name: 'State Bank of India' },
  { yahoo: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
  { yahoo: 'KOTAKBANK.NS',  name: 'Kotak Mahindra Bank' },
  { yahoo: 'LT.NS',         name: 'Larsen & Toubro' },
  { yahoo: 'AXISBANK.NS',   name: 'Axis Bank' },
  { yahoo: 'ASIANPAINT.NS', name: 'Asian Paints' },
  { yahoo: 'MARUTI.NS',     name: 'Maruti Suzuki' },
  { yahoo: 'TATAMOTORS.NS', name: 'Tata Motors' },
  { yahoo: 'WIPRO.NS',      name: 'Wipro' },
  { yahoo: 'SUNPHARMA.NS',  name: 'Sun Pharma' },
  { yahoo: 'TITAN.NS',      name: 'Titan Company' },
  { yahoo: 'BAJFINANCE.NS', name: 'Bajaj Finance' },
  { yahoo: 'ADANIENT.NS',   name: 'Adani Enterprises' }
];

const ETF_SYMBOLS = [
  { yahoo: 'NIFTYBEES.NS',  name: 'Nippon India ETF Nifty BeES' },
  { yahoo: 'BANKBEES.NS',   name: 'Nippon India ETF Bank BeES' },
  { yahoo: 'GOLDBEES.NS',   name: 'Nippon India ETF Gold BeES' },
  { yahoo: 'ITBEES.NS',     name: 'Nippon India ETF IT' },
  { yahoo: 'JUNIORBEES.NS', name: 'Nippon India ETF Junior BeES' }
];

const MF_SYMBOLS = [
  { yahoo: '0P0000XVAA.BO', name: 'Axis Bluechip Fund' },
  { yahoo: '0P0001BAL5.BO', name: 'Mirae Asset Emerging Bluechip' },
  { yahoo: '0P00009VDB.BO', name: 'SBI Small Cap Fund' },
  { yahoo: '0P0000XVAB.BO', name: 'HDFC Flexi Cap Fund' },
  { yahoo: '0P0000XVLV.BO', name: 'ICICI Pru Balanced Advantage' }
];

const COMMODITY_SYMBOLS = {
  'GC=F':  { name: 'Gold',        unit: 'per oz (USD)' },
  'SI=F':  { name: 'Silver',      unit: 'per oz (USD)' },
  'CL=F':  { name: 'Crude Oil',   unit: 'per barrel (USD)' },
  'NG=F':  { name: 'Natural Gas', unit: 'per mmBtu (USD)' },
  'HG=F':  { name: 'Copper',      unit: 'per lb (USD)' }
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Safe bulk quote fetch – returns an array of quote objects.
 */
async function safeQuote(symbols) {
  try {
    const results = await yahooFinance.quote(symbols);
    return Array.isArray(results) ? results : [results];
  } catch (err) {
    logger.error(`Yahoo Finance quote error: ${err.message}`);
    return [];
  }
}

// ── Indian Indices ─────────────────────────────────────────────────────────────

async function fetchIndianIndices() {
  const cacheKey = 'indian_indices';
  const cached = marketCache.get(cacheKey);
  if (cached) return cached;

  try {
    const symbols = Object.keys(INDIAN_INDEX_SYMBOLS);
    const quotes = await safeQuote(symbols);

    const indices = quotes
      .filter(q => q && q.regularMarketPrice)
      .map(q => ({
        symbol: q.symbol.replace('^', ''),
        name: INDIAN_INDEX_SYMBOLS[q.symbol] || q.shortName || q.symbol,
        price: q.regularMarketPrice,
        change: parseFloat((q.regularMarketChangePercent || 0).toFixed(2)),
        changeAbsolute: parseFloat((q.regularMarketChange || 0).toFixed(2)),
        prevClose: q.regularMarketPreviousClose || 0,
        volume: q.regularMarketVolume || 0,
        timestamp: new Date().toISOString(),
        exchange: q.exchange || 'NSE',
        type: 'index'
      }));

    if (indices.length > 0) {
      marketCache.set(cacheKey, indices);
      logger.info(`Fetched ${indices.length} Indian indices from Yahoo Finance`);
    }
    return indices;
  } catch (error) {
    logger.error(`Failed to fetch Indian indices: ${error.message}`);
    return [];
  }
}

// ── Global Indices ─────────────────────────────────────────────────────────────

async function fetchGlobalIndices() {
  const cacheKey = 'global_indices';
  const cached = marketCache.get(cacheKey);
  if (cached) return cached;

  try {
    const symbols = Object.keys(GLOBAL_INDEX_SYMBOLS);
    const quotes = await safeQuote(symbols);

    const indices = quotes
      .filter(q => q && q.regularMarketPrice)
      .map(q => {
        const meta = GLOBAL_INDEX_SYMBOLS[q.symbol] || {};
        return {
          symbol: q.symbol.replace('^', ''),
          name: meta.name || q.shortName || q.symbol,
          price: q.regularMarketPrice,
          change: parseFloat((q.regularMarketChangePercent || 0).toFixed(2)),
          changeAbsolute: parseFloat((q.regularMarketChange || 0).toFixed(2)),
          volume: q.regularMarketVolume || 0,
          timestamp: new Date().toISOString(),
          region: meta.region || 'Global',
          type: 'index'
        };
      });

    if (indices.length > 0) {
      marketCache.set(cacheKey, indices);
      logger.info(`Fetched ${indices.length} global indices from Yahoo Finance`);
    }
    return indices;
  } catch (error) {
    logger.error(`Failed to fetch global indices: ${error.message}`);
    return [];
  }
}

// ── NSE Stocks ─────────────────────────────────────────────────────────────────

async function fetchNSEStocks() {
  const cacheKey = 'nse_stocks';
  const cached = marketCache.get(cacheKey);
  if (cached) return cached;

  try {
    const symbols = NSE_STOCKS.map(s => s.yahoo);
    const quotes = await safeQuote(symbols);

    const stocks = quotes
      .filter(q => q && q.regularMarketPrice)
      .map(q => {
        const meta = NSE_STOCKS.find(s => s.yahoo === q.symbol) || {};
        return {
          symbol: q.symbol.replace('.NS', ''),
          name: meta.name || q.shortName || q.symbol,
          price: q.regularMarketPrice,
          change: parseFloat((q.regularMarketChangePercent || 0).toFixed(2)),
          changeAbsolute: parseFloat((q.regularMarketChange || 0).toFixed(2)),
          prevClose: q.regularMarketPreviousClose || 0,
          volume: q.regularMarketVolume || 0,
          marketCap: q.marketCap || 0,
          pe: q.trailingPE || 0,
          week52High: q.fiftyTwoWeekHigh || 0,
          week52Low: q.fiftyTwoWeekLow || 0,
          timestamp: new Date().toISOString(),
          exchange: 'NSE',
          type: 'stock'
        };
      });

    if (stocks.length > 0) {
      marketCache.set(cacheKey, stocks);
      logger.info(`Fetched ${stocks.length} NSE stocks from Yahoo Finance`);
    }
    return stocks;
  } catch (error) {
    logger.error(`Failed to fetch NSE stocks: ${error.message}`);
    return [];
  }
}

// ── Top Movers ─────────────────────────────────────────────────────────────────

async function fetchTopMovers() {
  const cacheKey = 'top_movers';
  const cached = marketCache.get(cacheKey);
  if (cached) return cached;

  try {
    const stocks = await fetchNSEStocks();
    const sorted = [...stocks].sort((a, b) => b.change - a.change);

    const result = {
      gainers: sorted.filter(s => s.change > 0).slice(0, 10),
      losers:  sorted.filter(s => s.change < 0).sort((a, b) => a.change - b.change).slice(0, 10)
    };

    marketCache.set(cacheKey, result);
    logger.info(`Top movers: ${result.gainers.length} gainers, ${result.losers.length} losers`);
    return result;
  } catch (error) {
    logger.error(`Failed to fetch top movers: ${error.message}`);
    return { gainers: [], losers: [] };
  }
}

// ── ETFs ───────────────────────────────────────────────────────────────────────

async function fetchETFs() {
  const cacheKey = 'etfs';
  const cached = marketCache.get(cacheKey);
  if (cached) return cached;

  try {
    const symbols = ETF_SYMBOLS.map(e => e.yahoo);
    const quotes = await safeQuote(symbols);

    const etfs = quotes
      .filter(q => q && q.regularMarketPrice)
      .map(q => {
        const meta = ETF_SYMBOLS.find(e => e.yahoo === q.symbol) || {};
        return {
          symbol: q.symbol.replace('.NS', ''),
          name: meta.name || q.shortName || q.symbol,
          price: q.regularMarketPrice,
          change: parseFloat((q.regularMarketChangePercent || 0).toFixed(2)),
          changeAbsolute: parseFloat((q.regularMarketChange || 0).toFixed(2)),
          volume: q.regularMarketVolume || 0,
          timestamp: new Date().toISOString(),
          type: 'etf'
        };
      });

    if (etfs.length > 0) {
      marketCache.set(cacheKey, etfs);
      logger.info(`Fetched ${etfs.length} ETFs from Yahoo Finance`);
    }
    return etfs;
  } catch (error) {
    logger.error(`Failed to fetch ETFs: ${error.message}`);
    return [];
  }
}

// ── Mutual Funds ───────────────────────────────────────────────────────────────

async function fetchMutualFunds() {
  const cacheKey = 'mutual_funds';
  const cached = marketCache.get(cacheKey);
  if (cached) return cached;

  try {
    const symbols = MF_SYMBOLS.map(m => m.yahoo);
    const quotes = await safeQuote(symbols);

    const funds = quotes
      .filter(q => q && q.regularMarketPrice)
      .map(q => {
        const meta = MF_SYMBOLS.find(m => m.yahoo === q.symbol) || {};
        return {
          symbol: q.symbol,
          name: meta.name || q.shortName || q.symbol,
          nav: q.regularMarketPrice,
          change: parseFloat((q.regularMarketChangePercent || 0).toFixed(2)),
          prevClose: q.regularMarketPreviousClose || 0,
          timestamp: new Date().toISOString(),
          type: 'mutualfund'
        };
      });

    if (funds.length > 0) {
      marketCache.set(cacheKey, funds);
      logger.info(`Fetched ${funds.length} mutual funds from Yahoo Finance`);
    }
    return funds;
  } catch (error) {
    logger.error(`Failed to fetch mutual funds: ${error.message}`);
    return [];
  }
}

// ── Commodities ────────────────────────────────────────────────────────────────

async function fetchCommodities() {
  const cacheKey = 'commodities';
  const cached = marketCache.get(cacheKey);
  if (cached) return cached;

  try {
    const symbols = Object.keys(COMMODITY_SYMBOLS);
    const quotes = await safeQuote(symbols);

    const commodities = quotes
      .filter(q => q && q.regularMarketPrice)
      .map(q => {
        const meta = COMMODITY_SYMBOLS[q.symbol] || {};
        return {
          symbol: q.symbol.replace('=F', ''),
          name: meta.name || q.shortName || q.symbol,
          price: q.regularMarketPrice,
          change: parseFloat((q.regularMarketChangePercent || 0).toFixed(2)),
          changeAbsolute: parseFloat((q.regularMarketChange || 0).toFixed(2)),
          unit: meta.unit || '',
          timestamp: new Date().toISOString(),
          type: 'commodity'
        };
      });

    if (commodities.length > 0) {
      marketCache.set(cacheKey, commodities);
      logger.info(`Fetched ${commodities.length} commodities from Yahoo Finance`);
    }
    return commodities;
  } catch (error) {
    logger.error(`Failed to fetch commodities: ${error.message}`);
    return [];
  }
}

// ── Stock Details ──────────────────────────────────────────────────────────────

async function fetchStockDetails(symbol) {
  try {
    const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
    const quotes = await safeQuote([yahooSymbol]);
    const q = quotes[0];
    if (!q || !q.regularMarketPrice) return null;

    return {
      symbol: symbol.replace('.NS', '').replace('.BO', ''),
      name: q.shortName || q.longName || symbol,
      price: q.regularMarketPrice,
      change: parseFloat((q.regularMarketChangePercent || 0).toFixed(2)),
      changeAbsolute: parseFloat((q.regularMarketChange || 0).toFixed(2)),
      open: q.regularMarketOpen || 0,
      high: q.regularMarketDayHigh || 0,
      low: q.regularMarketDayLow || 0,
      prevClose: q.regularMarketPreviousClose || 0,
      volume: q.regularMarketVolume || 0,
      marketCap: q.marketCap || 0,
      pe: q.trailingPE || 0,
      eps: q.epsTrailingTwelveMonths || 0,
      week52High: q.fiftyTwoWeekHigh || 0,
      week52Low: q.fiftyTwoWeekLow || 0,
      avgVolume: q.averageDailyVolume3Month || 0,
      timestamp: new Date().toISOString(),
      exchange: q.exchange || 'NSE'
    };
  } catch (error) {
    logger.error(`Failed to fetch stock details for ${symbol}: ${error.message}`);
    return null;
  }
}

// ── Historical Data ────────────────────────────────────────────────────────────

async function fetchStockHistory(symbol, period = '1M') {
  try {
    const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
    const periodMap = { '1W': '5d', '1M': '1mo', '3M': '3mo', '6M': '6mo', '1Y': '1y', '5Y': '5y' };
    const yPeriod = periodMap[period] || '1mo';

    const now = new Date();
    const start = new Date(now);
    switch (yPeriod) {
      case '5d':  start.setDate(start.getDate() - 7); break;
      case '1mo': start.setMonth(start.getMonth() - 1); break;
      case '3mo': start.setMonth(start.getMonth() - 3); break;
      case '6mo': start.setMonth(start.getMonth() - 6); break;
      case '1y':  start.setFullYear(start.getFullYear() - 1); break;
      case '5y':  start.setFullYear(start.getFullYear() - 5); break;
      default:    start.setMonth(start.getMonth() - 1);
    }

    const result = await yahooFinance.chart(yahooSymbol, {
      period1: start,
      interval: yPeriod === '5d' ? '15m' : '1d'
    });

    if (!result || !result.quotes) return [];

    return result.quotes
      .filter(q => q.date)
      .map(q => ({
        date: new Date(q.date).toISOString().split('T')[0],
        open:  q.open  ? parseFloat(q.open.toFixed(2))  : 0,
        high:  q.high  ? parseFloat(q.high.toFixed(2))  : 0,
        low:   q.low   ? parseFloat(q.low.toFixed(2))   : 0,
        close: q.close ? parseFloat(q.close.toFixed(2)) : 0,
        volume: q.volume || 0
      }));
  } catch (error) {
    logger.error(`Failed to fetch history for ${symbol}: ${error.message}`);
    return [];
  }
}

// ── Search ─────────────────────────────────────────────────────────────────────

async function searchStock(query) {
  try {
    const result = await yahooFinance.search(query, { quotesCount: 10 });
    return (result.quotes || []).map(q => ({
      symbol: q.symbol,
      name: q.shortname || q.longname || q.symbol,
      exchange: q.exchange || '',
      type: q.quoteType || ''
    }));
  } catch (error) {
    logger.error(`Search failed for "${query}": ${error.message}`);
    return [];
  }
}

// ── All Market Data (aggregated) ───────────────────────────────────────────────

async function fetchAllMarketData() {
  const cacheKey = 'all_market_data';
  const cached = marketCache.get(cacheKey);
  if (cached) return cached;

  try {
    const [indianIndices, globalIndices, movers] = await Promise.all([
      fetchIndianIndices(),
      fetchGlobalIndices(),
      fetchTopMovers()
    ]);

    const result = {
      indianIndices,
      globalIndices,
      topGainers: movers.gainers,
      topLosers: movers.losers,
      lastUpdated: new Date().toISOString(),
      source: 'Yahoo Finance (Real-time)'
    };

    marketCache.set(cacheKey, result);
    return result;
  } catch (error) {
    logger.error(`Failed to fetch all market data: ${error.message}`);
    return {
      indianIndices: [],
      globalIndices: [],
      topGainers: [],
      topLosers: [],
      lastUpdated: new Date().toISOString(),
      source: 'Error – no data available'
    };
  }
}

// ── Cache Control ──────────────────────────────────────────────────────────────

function clearCache() {
  marketCache.flushAll();
  logger.info('Market data cache cleared');
}

module.exports = {
  fetchIndianIndices,
  fetchGlobalIndices,
  fetchNSEStocks,
  fetchTopMovers,
  fetchETFs,
  fetchMutualFunds,
  fetchCommodities,
  fetchStockDetails,
  fetchStockHistory,
  fetchAllMarketData,
  searchStock,
  clearCache
};
