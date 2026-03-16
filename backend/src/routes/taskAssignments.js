const express = require('express');
const router = express.Router();
const taskAssignmentController = require('../controllers/taskAssignmentController');
const auth = require('../middleware/auth');

router.post('/tasks/:taskId/assignments', auth, taskAssignmentController.addAssignee);
router.get('/tasks/:taskId/assignments', auth, taskAssignmentController.getAssignees);
router.delete('/tasks/:taskId/assignments/:userId', auth, taskAssignmentController.removeAssignee);
router.patch('/tasks/:taskId/assignments/:userId', auth, taskAssignmentController.updateAssigneeRole);
router.post('/tasks/:taskId/assignments/bulk', auth, taskAssignmentController.addMultipleAssignees);

module.exports = router;
