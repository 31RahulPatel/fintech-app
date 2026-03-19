const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

// Get all news
router.get('/', newsController.getAllNews);

// Search news
router.get('/search', newsController.searchNews);

// ===== News Routes =====
// Get news by category
router.get('/india', newsController.getIndiaNews);
router.get('/global', newsController.getGlobalNews);
router.get('/market', newsController.getMarketNews);
router.get('/global-market', newsController.getGlobalMarketNews);

// Get trending news
router.get('/trending', newsController.getTrendingNews);

// Refresh cache (admin endpoint)
router.post('/refresh-cache', newsController.refreshCache);

// Get single news article
router.get('/:id', newsController.getNewsById);

// Bookmark news
router.post('/bookmark', newsController.bookmarkNews);
router.get('/bookmarks/list', newsController.getBookmarks);
router.delete('/bookmark/:id', newsController.removeBookmark);

module.exports = router;
