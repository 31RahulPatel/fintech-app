const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');

// Get all blogs
router.get('/', blogController.getAllBlogs);

// Get blog categories
router.get('/categories', blogController.getCategories);

// Search blogs
router.get('/search', blogController.searchBlogs);

// Get featured blogs
router.get('/featured', blogController.getFeaturedBlogs);

// Get blogs by category
router.get('/category/:category', blogController.getBlogsByCategory);

// Get single blog
router.get('/:slug', blogController.getBlogBySlug);

// Like/Unlike blog
router.post('/:id/like', blogController.likeBlog);

// Add comment
router.post('/:id/comment', blogController.addComment);

// Get comments
router.get('/:id/comments', blogController.getComments);

module.exports = router;
