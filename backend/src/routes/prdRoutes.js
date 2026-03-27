const express = require('express');
const router = express.Router();
const prdController = require('../controllers/prdController');
const auth = require('../middleware/auth');

router.post('/session', auth, prdController.createSession);
router.get('/session/:id', auth, prdController.getSession);
router.get('/project/:projectId', auth, prdController.getSessionsByProject);
router.post('/session/:id/chat', auth, prdController.chat);
router.post('/session/:id/stage', auth, prdController.advanceStage);
router.post('/session/:id/generate', auth, prdController.generateDocument);

module.exports = router;
