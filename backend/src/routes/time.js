const express = require('express');
const router = express.Router();
const timeController = require('../controllers/timeController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/active', timeController.getActiveTimer);
router.post('/active/stop', timeController.forceStopActiveTimer);
router.get('/:taskId/entries', timeController.getTimeEntries);
router.get('/:taskId/summary', timeController.getTaskTimeSummary);
router.post('/:taskId/start', timeController.startTimer);
router.post('/:taskId/stop', timeController.stopTimer);
router.post('/:taskId/manual', timeController.addManualEntry);

router.get('/report/user', timeController.getUserTimeReport);
router.get('/report/project/:projectId', timeController.getProjectTimeReport);

module.exports = router;