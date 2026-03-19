const { DeviceToken, Notification } = require('../models');
const notificationService = require('../services/notificationService');

exports.registerDevice = async (req, res) => {
  try {
    const { token, platform, browser } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({ error: 'Device token is required' });
    }

    const existingToken = await DeviceToken.findOne({ where: { token, userId } });

    if (existingToken) {
      existingToken.lastUsedAt = new Date();
      if (browser) existingToken.browser = browser;
      await existingToken.save();
      return res.json({ message: 'Device token updated', id: existingToken.id });
    }

    const deviceToken = await DeviceToken.create({
      userId,
      token,
      platform: platform || 'web',
      browser,
      lastUsedAt: new Date()
    });

    res.status(201).json({ message: 'Device registered successfully', id: deviceToken.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.unregisterDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await DeviceToken.destroy({ where: { id, userId } });
    res.json({ message: 'Device unregistered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDevices = async (req, res) => {
  try {
    const userId = req.user.id;
    const devices = await DeviceToken.findAll({ 
      where: { userId },
      order: [['lastUsedAt', 'DESC']]
    });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;

    const where = { userId };
    if (unreadOnly === 'true') {
      where.read = false;
    }

    const notifications = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const unreadCount = await Notification.count({ where: { userId, read: false } });

    res.json({
      notifications: notifications.rows,
      total: notifications.count,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await Notification.update({ read: true }, { where: { id, userId } });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.update({ read: true }, { where: { userId, read: false } });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await Notification.destroy({ where: { id, userId } });
    
    if (deleted) {
      res.json({ message: 'Notification deleted' });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { read } = req.query;

    const where = { userId };
    if (read === 'true') {
      where.read = true;
    }

    const deleted = await Notification.destroy({ where });
    res.json({ message: `${deleted} notification(s) deleted` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.count({ where: { userId, read: false } });
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preference = await notificationService.getNotificationPreference(userId);
    res.json(preference);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pushEnabled, emailEnabled, dueTaskReminder, taskAssignment, mentions, dueTaskAdvance } = req.body;

    const preference = await notificationService.updateNotificationPreference(userId, {
      pushEnabled,
      emailEnabled,
      dueTaskReminder,
      taskAssignment,
      mentions,
      dueTaskAdvance
    });

    res.json(preference);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getVapidPublicKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};
