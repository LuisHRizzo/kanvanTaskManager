import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export function useTimeTracking() {
  const [activeEntry, setActiveEntry] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchActiveTimer = useCallback(async () => {
    try {
      const response = await api.get('/time/active');
      if (response.data) {
        setActiveEntry(response.data);
        const startTime = new Date(response.data.startTime).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }
    } catch (error) {
      console.error('Error fetching active timer:', error);
    }
  }, []);

  useEffect(() => {
    fetchActiveTimer();
  }, [fetchActiveTimer]);

  useEffect(() => {
    let interval;
    if (activeEntry) {
      interval = setInterval(() => {
        const startTime = new Date(activeEntry.startTime).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeEntry]);

  const startTimer = async (taskId) => {
    setLoading(true);
    try {
      const response = await api.post(`/time/${taskId}/start`);
      setActiveEntry(response.data);
      const startTime = new Date(response.data.startTime).getTime();
      const now = Date.now();
      setElapsedTime(Math.floor((now - startTime) / 1000));
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const stopTimer = async (taskId) => {
    setLoading(true);
    try {
      const response = await api.post(`/time/${taskId}/stop`);
      setActiveEntry(null);
      setElapsedTime(0);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addManualEntry = async (taskId, data) => {
    setLoading(true);
    try {
      const response = await api.post(`/time/${taskId}/manual`, data);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    activeEntry,
    elapsedTime,
    loading,
    startTimer,
    stopTimer,
    addManualEntry,
    formatTime,
    refreshActiveTimer: fetchActiveTimer
  };
}