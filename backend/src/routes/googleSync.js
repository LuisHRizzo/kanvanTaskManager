const express = require('express');
const router = express.Router();
const taskSyncController = require('../controllers/taskSyncController');
const auth = require('../middleware/auth');

router.post('/tasks/:taskId/sync/google', auth, taskSyncController.syncTaskToGoogle);
router.delete('/tasks/:taskId/sync/google', auth, taskSyncController.unsyncTaskFromGoogle);
router.get('/tasks/:taskId/sync/google', auth, taskSyncController.getTaskSyncStatus);
router.post('/tasks/sync/google', auth, taskSyncController.syncAllTasks);

router.get('/google/tasks', auth, taskSyncController.getGoogleTasks);
router.post('/google/tasks/:googleTaskId/import', auth, taskSyncController.importGoogleTask);

module.exports = router;
