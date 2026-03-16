const { Task, NotificationPreference } = require('../models');
const notificationService = require('./notificationService');

const scheduleTaskReminders = async () => {
  try {
    const preferences = await NotificationPreference.findAll({
      where: {
        pushEnabled: true,
        dueTaskReminder: true
      }
    });

    for (const pref of preferences) {
      const userId = pref.userId;
      const advanceMinutes = pref.dueTaskAdvance || 60;

      const tasks = await Task.findAll({
        where: {
          assigneeId: userId,
          dueDate: {
            [require('sequelize').Op.ne]: null
          },
          status: {
            [require('sequelize').Op.notIn]: ['completada']
          }
        }
      });

      for (const task of tasks) {
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const timeDiff = dueDate.getTime() - now.getTime();
        const minutesDiff = Math.floor(timeDiff / 60000);

        if (minutesDiff > 0 && minutesDiff <= advanceMinutes) {
          if (task.lastNotifiedAt) {
            const lastNotified = new Date(task.lastNotifiedAt);
            const hoursSinceNotification = (now - lastNotified) / 3600000;
            
            if (hoursSinceNotification >= 1) {
              await notificationService.notifyTaskDue(userId, task, minutesDiff);
              task.lastNotifiedAt = now;
              await task.save();
            }
          } else {
            await notificationService.notifyTaskDue(userId, task, minutesDiff);
            task.lastNotifiedAt = now;
            await task.save();
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking task reminders:', error);
  }
};

const startNotificationScheduler = () => {
  scheduleTaskReminders();
  
  setInterval(() => {
    scheduleTaskReminders();
  }, 60000);
};

module.exports = {
  startNotificationScheduler,
  scheduleTaskReminders
};
