const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/project/:projectId', taskController.getTasks);
router.post('/project/:projectId', taskController.createTask);
router.get('/:taskId', taskController.getTask);
router.put('/:taskId', taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);
router.patch('/:taskId/status', taskController.updateTaskStatus);
router.post('/:taskId/calendar-url', taskController.generateCalendarUrl);

module.exports = router;