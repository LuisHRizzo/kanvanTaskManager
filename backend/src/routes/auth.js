const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.getMe);
router.get('/google', auth, authController.googleAuth);
router.get('/google/callback', authController.googleCallback);
router.post('/google/disconnect', auth, authController.googleDisconnect);
router.get('/google/status', auth, authController.googleStatus);

module.exports = router;