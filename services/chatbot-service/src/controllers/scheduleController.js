const ScheduledPrompt = require('../models/ScheduledPrompt');
const PromptResult = require('../models/PromptResult');
const schedulerService = require('../services/schedulerService');
const logger = require('../utils/logger');

// Create a scheduled prompt
exports.createSchedule = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userEmail = req.headers['x-user-email'];
    const { prompt, frequency, time, days, endDate, emailResults = true } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!frequency || !['daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({ error: 'Valid frequency required (daily, weekly, monthly)' });
    }

    // Check if user has reached schedule limit
    const existingCount = await ScheduledPrompt.countDocuments({ userId, isActive: true });
    if (existingCount >= 10) {
      return res.status(400).json({ error: 'Maximum 10 active schedules allowed' });
    }

    const schedule = await ScheduledPrompt.create({
      userId,
      email: userEmail,
      prompt: prompt.trim(),
      frequency,
      time: time || '09:00',
      days: days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      endDate: endDate ? new Date(endDate) : null,
      emailResults,
      isActive: true
    });

    // Register with scheduler
    schedulerService.addSchedule(schedule);

    logger.info(`Schedule created for user: ${userId}`);

    res.status(201).json({
      message: 'Schedule created successfully',
      schedule
    });
  } catch (error) {
    logger.error(`Create schedule error: ${error.message}`);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
};

// Get all schedules for user
exports.getSchedules = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const schedules = await ScheduledPrompt.find({ userId })
      .sort({ createdAt: -1 });

    res.json({ schedules, count: schedules.length });
  } catch (error) {
    logger.error(`Get schedules error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

// Get schedule by ID
exports.getScheduleById = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const schedule = await ScheduledPrompt.findOne({ _id: id, userId });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({ schedule });
  } catch (error) {
    logger.error(`Get schedule error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
};

// Update schedule
exports.updateSchedule = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { id } = req.params;
    const { prompt, frequency, time, days, endDate, emailResults } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const schedule = await ScheduledPrompt.findOne({ _id: id, userId });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Update fields
    if (prompt) schedule.prompt = prompt.trim();
    if (frequency) schedule.frequency = frequency;
    if (time) schedule.time = time;
    if (days) schedule.days = days;
    if (endDate !== undefined) schedule.endDate = endDate ? new Date(endDate) : null;
    if (emailResults !== undefined) schedule.emailResults = emailResults;

    await schedule.save();

    // Update scheduler
    schedulerService.updateSchedule(schedule);

    logger.info(`Schedule updated: ${id} for user ${userId}`);

    res.json({ message: 'Schedule updated', schedule });
  } catch (error) {
    logger.error(`Update schedule error: ${error.message}`);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
};

// Delete schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const schedule = await ScheduledPrompt.findOneAndDelete({ _id: id, userId });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Remove from scheduler
    schedulerService.removeSchedule(id);

    logger.info(`Schedule deleted: ${id} for user ${userId}`);

    res.json({ message: 'Schedule deleted' });
  } catch (error) {
    logger.error(`Delete schedule error: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
};

// Toggle schedule active state
exports.toggleSchedule = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const schedule = await ScheduledPrompt.findOne({ _id: id, userId });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    schedule.isActive = !schedule.isActive;
    await schedule.save();

    if (schedule.isActive) {
      schedulerService.addSchedule(schedule);
    } else {
      schedulerService.removeSchedule(id);
    }

    logger.info(`Schedule toggled: ${id} - Active: ${schedule.isActive}`);

    res.json({ 
      message: `Schedule ${schedule.isActive ? 'activated' : 'deactivated'}`,
      isActive: schedule.isActive
    });
  } catch (error) {
    logger.error(`Toggle schedule error: ${error.message}`);
    res.status(500).json({ error: 'Failed to toggle schedule' });
  }
};

// Get schedule results
exports.getScheduleResults = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const schedule = await ScheduledPrompt.findOne({ _id: id, userId });
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const results = await PromptResult.find({ scheduleId: id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await PromptResult.countDocuments({ scheduleId: id });

    res.json({
      results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error(`Get results error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
};
