const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const News = require('../models/News');
const ActivityLog = require('../models/ActivityLog');
const logger = require('../utils/logger');

// Get all blogs with pagination
exports.getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, search, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const blogs = await Blog.find(query)
      .populate('author', 'email profile.firstName profile.lastName')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Blog.countDocuments(query);

    res.json({
      blogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching blogs:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

// Update blog status
exports.updateBlogStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    if (!['draft', 'published', 'archived', 'flagged'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { status, statusReason: reason, statusUpdatedAt: new Date() },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    await ActivityLog.create({
      adminId: req.user?.id,
      action: 'BLOG_STATUS_CHANGE',
      targetId: blog._id,
      targetType: 'Blog',
      details: { status, reason }
    });

    logger.info(`Blog ${blog._id} status changed to ${status}`);
    res.json(blog);
  } catch (error) {
    logger.error('Error updating blog status:', error);
    res.status(500).json({ error: 'Failed to update blog status' });
  }
};

// Delete blog
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Delete associated comments
    await Comment.deleteMany({ blogId: req.params.id });

    await ActivityLog.create({
      adminId: req.user?.id,
      action: 'BLOG_DELETE',
      targetId: blog._id,
      targetType: 'Blog',
      details: { title: blog.title }
    });

    logger.info(`Blog ${req.params.id} deleted`);
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    logger.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
};

// Get all comments with pagination
exports.getAllComments = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }

    const comments = await Comment.find(query)
      .populate('author', 'email profile.firstName profile.lastName')
      .populate('blogId', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments(query);

    res.json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// Update comment status
exports.updateCommentStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    if (!['approved', 'pending', 'spam', 'deleted'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { status, statusReason: reason, statusUpdatedAt: new Date() },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    await ActivityLog.create({
      adminId: req.user?.id,
      action: 'COMMENT_STATUS_CHANGE',
      targetId: comment._id,
      targetType: 'Comment',
      details: { status, reason }
    });

    logger.info(`Comment ${comment._id} status changed to ${status}`);
    res.json(comment);
  } catch (error) {
    logger.error('Error updating comment status:', error);
    res.status(500).json({ error: 'Failed to update comment status' });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    await ActivityLog.create({
      adminId: req.user?.id,
      action: 'COMMENT_DELETE',
      targetId: comment._id,
      targetType: 'Comment',
      details: { content: comment.content.substring(0, 100) }
    });

    logger.info(`Comment ${req.params.id} deleted`);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    logger.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

// Get all news articles
exports.getAllNews = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, status, search } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const news = await News.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await News.countDocuments(query);

    res.json({
      news,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
};

// Create news article
exports.createNews = async (req, res) => {
  try {
    const { title, content, summary, category, source, imageUrl, tags } = req.body;
    
    const news = await News.create({
      title,
      content,
      summary,
      category,
      source,
      imageUrl,
      tags,
      author: req.user?.id,
      status: 'published'
    });

    await ActivityLog.create({
      adminId: req.user?.id,
      action: 'NEWS_CREATE',
      targetId: news._id,
      targetType: 'News',
      details: { title }
    });

    logger.info(`News article created: ${news.title}`);
    res.status(201).json(news);
  } catch (error) {
    logger.error('Error creating news:', error);
    res.status(500).json({ error: 'Failed to create news' });
  }
};

// Update news article
exports.updateNews = async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!news) {
      return res.status(404).json({ error: 'News article not found' });
    }

    await ActivityLog.create({
      adminId: req.user?.id,
      action: 'NEWS_UPDATE',
      targetId: news._id,
      targetType: 'News',
      details: { updated: Object.keys(req.body) }
    });

    logger.info(`News article ${news._id} updated`);
    res.json(news);
  } catch (error) {
    logger.error('Error updating news:', error);
    res.status(500).json({ error: 'Failed to update news' });
  }
};

// Delete news article
exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) {
      return res.status(404).json({ error: 'News article not found' });
    }

    await ActivityLog.create({
      adminId: req.user?.id,
      action: 'NEWS_DELETE',
      targetId: news._id,
      targetType: 'News',
      details: { title: news.title }
    });

    logger.info(`News article ${req.params.id} deleted`);
    res.json({ message: 'News article deleted successfully' });
  } catch (error) {
    logger.error('Error deleting news:', error);
    res.status(500).json({ error: 'Failed to delete news' });
  }
};
