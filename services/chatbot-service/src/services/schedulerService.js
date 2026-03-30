const cron = require('node-cron');
const axios = require('axios');
const ScheduledPrompt = require('../models/ScheduledPrompt');
const PromptResult = require('../models/PromptResult');
const groqService = require('./groqService');
const logger = require('../utils/logger');

class SchedulerService {
  constructor() {
    this.jobs = new Map();
  }

  async initializeScheduler() {
    try {
      // Load all active schedules from database
      const schedules = await ScheduledPrompt.find({ isActive: true });
      
      logger.info(`Initializing scheduler with ${schedules.length} active schedules`);

      for (const schedule of schedules) {
        this.addSchedule(schedule);
      }

      // Run a master job every minute to check for due schedules
      cron.schedule('* * * * *', () => this.checkSchedules());

      logger.info('Scheduler initialized successfully');
    } catch (error) {
      logger.error(`Scheduler initialization error: ${error.message}`);
    }
  }

  getCronExpression(schedule) {
    const [hours, minutes] = schedule.time.split(':');
    
    switch (schedule.frequency) {
      case 'daily':
        return `${minutes} ${hours} * * *`;
      case 'weekly':
        const dayMap = {
          'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
          'thursday': 4, 'friday': 5, 'saturday': 6
        };
        const days = schedule.days.map(d => dayMap[d.toLowerCase()]).join(',');
        return `${minutes} ${hours} * * ${days}`;
      case 'monthly':
        return `${minutes} ${hours} 1 * *`;
      default:
        return `${minutes} ${hours} * * *`;
    }
  }

  addSchedule(schedule) {
    try {
      if (!schedule || !schedule._id) {
        logger.error('Cannot add schedule: schedule or schedule._id is null');
        return;
      }

      const cronExpression = this.getCronExpression(schedule);
      
      // Remove existing job if any
      if (this.jobs.has(schedule._id.toString())) {
        this.jobs.get(schedule._id.toString()).stop();
      }

      const job = cron.schedule(cronExpression, async () => {
        await this.executeSchedule(schedule);
      });

      this.jobs.set(schedule._id.toString(), job);
      
      logger.info(`Schedule added: ${schedule._id} with cron: ${cronExpression}`);
    } catch (error) {
      logger.error(`Add schedule error: ${error.message}`);
    }
  }

  updateSchedule(schedule) {
    this.removeSchedule(schedule._id.toString());
    if (schedule.isActive) {
      this.addSchedule(schedule);
    }
  }

  removeSchedule(scheduleId) {
    try {
      if (this.jobs.has(scheduleId)) {
        this.jobs.get(scheduleId).stop();
        this.jobs.delete(scheduleId);
        logger.info(`Schedule removed: ${scheduleId}`);
      }
    } catch (error) {
      logger.error(`Remove schedule error: ${error.message}`);
    }
  }

  async executeSchedule(schedule) {
    try {
      if (!schedule || !schedule._id) {
        logger.error('Cannot execute schedule: schedule or schedule._id is null');
        return;
      }

      logger.info(`Executing scheduled prompt: ${schedule._id}`);

      // Check if schedule has ended
      if (schedule.endDate && new Date() > schedule.endDate) {
        schedule.isActive = false;
        await schedule.save();
        this.removeSchedule(schedule._id.toString());
        logger.info(`Schedule ended: ${schedule._id}`);
        return;
      }

      // Generate response using Groq
      const response = await groqService.generatePromptResponse(schedule.prompt);

      // Save result
      const result = await PromptResult.create({
        scheduleId: schedule._id,
        userId: schedule.userId,
        prompt: schedule.prompt,
        response,
        executedAt: new Date()
      });

      // Update last run time
      schedule.lastRun = new Date();
      schedule.runCount = (schedule.runCount || 0) + 1;
      await schedule.save();

      // Send email if enabled
      if (schedule.emailResults && schedule.email) {
        await this.sendResultEmail(schedule, response);
      }

      logger.info(`Schedule executed successfully: ${schedule._id}`);
    } catch (error) {
      logger.error(`Execute schedule error: ${error.message}`);
      
      // Save error result
      await PromptResult.create({
        scheduleId: schedule._id,
        userId: schedule.userId,
        prompt: schedule.prompt,
        response: `Error: ${error.message}`,
        error: true,
        executedAt: new Date()
      });
    }
  }

  async sendResultEmail(schedule, response) {
    try {
      // Call email service to send the result
      await axios.post(
        `${process.env.EMAIL_SERVICE_URL || 'http://localhost:3008'}/send-scheduled-result`,
        {
          to: schedule.email,
          subject: `Bazar.ai Scheduled Response - ${new Date().toLocaleDateString()}`,
          prompt: schedule.prompt,
          response
        }
      );
      
      logger.info(`Email sent for schedule: ${schedule._id}`);
    } catch (error) {
      logger.error(`Send email error: ${error.message}`);
    }
  }

  async checkSchedules() {
    // This runs every minute to handle any missed schedules
    // or schedules that need immediate execution
  }
}

module.exports = new SchedulerService();
