import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useProjectStore, useAuthStore } from '../store';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

export function useSocket(projectId) {
  const socketRef = useRef(null);
  const token = useAuthStore((state) => state.token);
  const setTasks = useProjectStore((state) => state.setTasks);
  const tasks = useProjectStore((state) => state.tasks);

  useEffect(() => {
    if (!token || !projectId) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
      socket.emit('join_project', projectId);
    });

    socket.on('task_moved', (updatedTask) => {
      const currentTasks = useProjectStore.getState().tasks;
      setTasks(currentTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    });

    socket.on('task_created', (newTask) => {
      const currentTasks = useProjectStore.getState().tasks;
      if (currentTasks.some(t => t.id === newTask.id)) return;
      setTasks([...currentTasks, newTask]);
    });

    socket.on('task_updated', (updatedTask) => {
      const currentTasks = useProjectStore.getState().tasks;
      setTasks(currentTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
    });

    return () => {
      socket.emit('leave_project', projectId);
      socket.disconnect();
    };
  }, [token, projectId]);

  return socketRef.current;
}