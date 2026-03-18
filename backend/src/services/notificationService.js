const webpush = require('web-push');
const { DeviceToken, Notification, NotificationPreference, User } = require('../models');
const { emitToUser } = require('../socket');

if (process.env.VAPID_SUBJECT && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('⚠️ VAPID keys not configured. Push notifications disabled.');
}

const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    if (!process.env.VAPID_PUBLIC_KEY) {
      return;
    }

    const preference = await NotificationPreference.findOne({ where: { userId } });

    if (!preference || !preference.pushEnabled) {
      return;
    }

    const deviceTokens = await DeviceToken.findAll({ where: { userId } });

    if (deviceTokens.length === 0) {
      return;
    }

    const notificationPayload = {
      title,
      body,
      data,
      icon: '/icon.png',
      badge: '/badge.png'
    };

    await Promise.allSettled(
      deviceTokens.map(token =>
        webpush.sendNotification(token.token, JSON.stringify(notificationPayload))
          .catch(err => {
            if (err.statusCode === 410) {
              return DeviceToken.destroy({ where: { id: token.id } });
            }
            return null;
          })
      )
    );
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

const createNotification = async (userId, type, title, body, data = {}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      body,
      data,
      sentAt: new Date()
    });

    // Emit WebSocket event for real-time notification
    emitToUser(userId, 'notification_received', {
      id: notification.id,
      type,
      title,
      body,
      data,
      read: false,
      createdAt: notification.createdAt
    });

    await sendPushNotification(userId, title, body, data);

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

const notifyTaskAssigned = async (userId, task, assignedBy) => {
  const preference = await NotificationPreference.findOne({ where: { userId } });
  
  if (!preference || !preference.taskAssignment) {
    return;
  }

  await createNotification(
    userId,
    'task_assigned',
    'Nueva tarea asignada',
    `Te han asignado la tarea "${task.title}"`,
    { taskId: task.id, projectId: task.projectId }
  );
};

const notifyTaskDue = async (userId, task, minutesBefore) => {
  const preference = await NotificationPreference.findOne({ where: { userId } });
  
  if (!preference || !preference.dueTaskReminder) {
    return;
  }

  const advanceText = minutesBefore >= 60 
    ? `${minutesBefore / 60} hora(s)` 
    : `${minutesBefore} minutos`;

  await createNotification(
    userId,
    'task_due',
    'Tarea por vencer',
    `La tarea "${task.title}" vence en ${advanceText}`,
    { taskId: task.id, projectId: task.projectId }
  );
};

const notifyTaskMention = async (userId, task, mentionedBy) => {
  const preference = await NotificationPreference.findOne({ where: { userId } });
  
  if (!preference || !preference.mentions) {
    return;
  }

  await createNotification(
    userId,
    'task_mention',
    'Te mencionaron en una tarea',
    `${mentionedBy.name} te mencionó en "${task.title}"`,
    { taskId: task.id, projectId: task.projectId }
  );
};

const getNotificationPreference = async (userId) => {
  let preference = await NotificationPreference.findOne({ where: { userId } });
  
  if (!preference) {
    preference = await NotificationPreference.create({ userId });
  }
  
  return preference;
};

const updateNotificationPreference = async (userId, data) => {
  let preference = await NotificationPreference.findOne({ where: { userId } });
  
  if (!preference) {
    preference = await NotificationPreference.create({ userId, ...data });
  } else {
    await preference.update(data);
  }
  
  return preference;
};

module.exports = {
  webpush,
  sendPushNotification,
  createNotification,
  notifyTaskAssigned,
  notifyTaskDue,
  notifyTaskMention,
  getNotificationPreference,
  updateNotificationPreference
};
