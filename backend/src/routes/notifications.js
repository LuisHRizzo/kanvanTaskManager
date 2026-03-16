const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.post('/register-device', auth, notificationController.registerDevice);
router.delete('/device/:id', auth, notificationController.unregisterDevice);
router.get('/devices', auth, notificationController.getDevices);

router.get('/', auth, notificationController.getNotifications);
router.patch('/:id/read', auth, notificationController.markAsRead);
router.patch('/read-all', auth, notificationController.markAllAsRead);
router.get('/unread-count', auth, notificationController.getUnreadCount);

router.get('/preferences', auth, notificationController.getPreferences);
router.put('/preferences', auth, notificationController.updatePreferences);

router.get('/vapid-key', notificationController.getVapidPublicKey);

module.exports = router;
