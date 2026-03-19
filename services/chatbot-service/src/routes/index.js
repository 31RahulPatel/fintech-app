const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const scheduleController = require('../controllers/scheduleController');

// Chat endpoints
router.post('/chat', chatController.sendMessage);
router.get('/chat/history', chatController.getChatHistory);
router.delete('/chat/history', chatController.clearHistory);

// Schedule prompt endpoints
router.post('/schedule', scheduleController.createSchedule);
router.get('/schedules', scheduleController.getSchedules);
router.get('/schedule/:id', scheduleController.getScheduleById);
router.put('/schedule/:id', scheduleController.updateSchedule);
router.delete('/schedule/:id', scheduleController.deleteSchedule);
router.post('/schedule/:id/toggle', scheduleController.toggleSchedule);

// Get scheduled prompt results
router.get('/schedule/:id/results', scheduleController.getScheduleResults);

module.exports = router;
