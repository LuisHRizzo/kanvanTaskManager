import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import useSocket from './useSocket';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState(null);
  const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default');
  const { on, isConnected } = useSocket();

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get('/notifications');
      console.log('Notifications fetched:', response.data);
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      console.error('Response:', error.response?.data);
    }
  }, []);

  const fetchPreferences = useCallback(async () => {
    try {
      const response = await api.get('/notifications/preferences');
      setPreferences(response.data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteAllNotifications = async (read = false) => {
    try {
      const params = read ? { read: 'true' } : {};
      const response = await api.delete('/notifications/all', { params });
      
      if (read) {
        setNotifications(prev => prev.filter(n => !n.read));
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  };

  const updatePreferences = async (data) => {
    try {
      const response = await api.put('/notifications/preferences', data);
      setPreferences(response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') {
      return false;
    }
    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm === 'granted';
  };

  const subscribeToPush = async () => {
    try {
      const vapidResponse = await api.get('/notifications/vapid-key');
      const vapidPublicKey = vapidResponse.data.publicKey;

      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      const subscriptionJson = JSON.parse(JSON.stringify(subscription));

      await api.post('/notifications/register-device', {
        token: subscriptionJson.keys.p256dh,
        platform: 'web',
        browser: navigator.userAgent
      });

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      throw error;
    }
  };

  // Listen for real-time notifications via WebSocket
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = on('notification_received', (notification) => {
      // Show browser notification if permission granted
      if (permission === 'granted' && Notification) {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/icon.png',
          badge: '/badge.png',
          data: notification.data
        });
      }

      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return unsubscribe;
  }, [isConnected, on, permission]);

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchPreferences, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    preferences,
    permission,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    updatePreferences,
    requestPermission,
    subscribeToPush
  };
};

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default useNotifications;
