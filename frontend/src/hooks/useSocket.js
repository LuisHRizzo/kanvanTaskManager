import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store';

let socketInstance = null;

export function useSocket() {
  const token = useAuthStore((state) => state.token);
  const isConnected = useRef(false);

  useEffect(() => {
    if (!token) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        isConnected.current = false;
      }
      return;
    }

    if (!socketInstance) {
      // Determine socket URL from environment or fallback
      let socketUrl = import.meta.env.VITE_SOCKET_URL;
      
      if (!socketUrl) {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (apiUrl) {
          // Remove /api suffix if present
          socketUrl = apiUrl.replace(/\/api$/, '');
        } else {
          // Fallback: use current window location for API URL
          const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
          socketUrl = `${protocol}//${window.location.hostname}:3000`;
        }
      }

      // Validate URL format
      try {
        new URL(socketUrl);
      } catch (error) {
        console.error('Invalid socket URL configuration:', socketUrl);
        return;
      }

      socketInstance = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socketInstance.on('connect', () => {
        console.log('✅ Socket connected:', socketInstance.id);
        isConnected.current = true;
      });

      socketInstance.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        isConnected.current = false;
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        isConnected.current = false;
      });
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
    };
  }, [token]);

  const on = (event, callback) => {
    if (socketInstance) {
      socketInstance.on(event, callback);
      return () => socketInstance.off(event, callback);
    }
  };

  const emit = (event, data) => {
    if (socketInstance && isConnected.current) {
      socketInstance.emit(event, data);
    }
  };

  const joinProject = (projectId) => {
    emit('join_project', projectId);
  };

  const leaveProject = (projectId) => {
    emit('leave_project', projectId);
  };

  return {
    socket: socketInstance,
    isConnected: isConnected.current,
    on,
    emit,
    joinProject,
    leaveProject
  };
}

export default useSocket;
