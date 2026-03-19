const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');

// ===== Live Market Data (Real-time) =====
router.get('/market-data', marketController.getAllMarketData);
router.get('/live/indices', marketController.getLiveIndices);
router.get('/live/global', marketController.getLiveGlobalIndices);
router.get('/live/movers', marketController.getLiveMovers);
router.post('/live/refresh', marketController.refreshLiveData);

// Search
router.get('/search', marketController.searchStocks);

// Indices
router.get('/indices', marketController.getIndices);
router.get('/nifty50', marketController.getNifty50);

// Top performers
router.get('/gainers', marketController.getTopGainers);
router.get('/losers', marketController.getTopLosers);

// ETFs
router.get('/etfs', marketController.getTopETFs);

// Mutual Funds
router.get('/mutual-funds', marketController.getTopMutualFunds);

// Prostocks (Premium)
router.get('/prostocks', marketController.getProStocks);

// Commodities
router.get('/commodities', marketController.getCommodities);

// Global Markets
router.get('/global', marketController.getGlobalMarkets);

// Stock details
router.get('/stock/:symbol', marketController.getStockDetails);

// Historical data
router.get('/stock/:symbol/history', marketController.getStockHistory);

// Watchlist
router.get('/watchlist', marketController.getWatchlist);
router.post('/watchlist', marketController.addToWatchlist);
router.delete('/watchlist/:symbol', marketController.removeFromWatchlist);

module.exports = router;
