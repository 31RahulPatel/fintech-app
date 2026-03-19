const ChatHistory = require('../models/ChatHistory');
const groqService = require('../services/groqService');
const logger = require('../utils/logger');

// Send message to Bazar.ai chatbot
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { message, context = [] } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create chat history for user
    let chatHistory = await ChatHistory.findOne({ userId });
    if (!chatHistory) {
      chatHistory = new ChatHistory({ userId, messages: [] });
    }

    // Add user message to history
    chatHistory.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Get response from Groq
    const response = await groqService.chat(message, chatHistory.messages.slice(-10));

    // Add assistant response to history
    chatHistory.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });

    // Keep only last 100 messages
    if (chatHistory.messages.length > 100) {
      chatHistory.messages = chatHistory.messages.slice(-100);
    }

    await chatHistory.save();

    logger.info(`Chat message processed for user: ${userId}`);

    res.json({
      response,
      messageId: chatHistory.messages[chatHistory.messages.length - 1]._id
    });
  } catch (error) {
    logger.error(`Chat error: ${error.message}`);
    res.status(500).json({ error: 'Failed to process message' });
  }
};

// Get chat history
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { limit = 50 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const chatHistory = await ChatHistory.findOne({ userId });

    if (!chatHistory) {
      return res.json({ messages: [], count: 0 });
    }

    const messages = chatHistory.messages.slice(-parseInt(limit));

    res.json({
      messages,
      count: messages.length,
      total: chatHistory.messages.length
    });
  } catch (error) {
    logger.error(`Get chat history error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

// Clear chat history
exports.clearHistory = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await ChatHistory.findOneAndUpdate(
      { userId },
      { messages: [], updatedAt: new Date() }
    );

    logger.info(`Chat history cleared for user: ${userId}`);
    res.json({ message: 'Chat history cleared' });
  } catch (error) {
    logger.error(`Clear history error: ${error.message}`);
    res.status(500).json({ error: 'Failed to clear history' });
  }
};
