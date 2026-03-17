import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  googleStatus: {
    isConnected: false,
    email: null,
    taskListId: null
  },
  
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
    return user;
  },
  
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
    return user;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, googleStatus: { isConnected: false, email: null, taskListId: null } });
  },
  
  fetchMe: async () => {
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data.user });
    } catch (error) {
      get().logout();
    }
  },

  fetchGoogleStatus: async () => {
    try {
      const response = await api.get('/auth/google/status?_t=' + Date.now());
      set({ googleStatus: response.data });
      return response.data;
    } catch (error) {
      return { isConnected: false, email: null, taskListId: null };
    }
  },

  connectGoogle: async () => {
    const response = await api.get('/auth/google');
    window.location.href = response.data.authUrl;
  },

  disconnectGoogle: async () => {
    await api.post('/auth/google/disconnect');
    set({ googleStatus: { isConnected: false, email: null, taskListId: null } });
  }
}));

export const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  tasks: [],
  loading: false,
  
  fetchProjects: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/projects');
      set({ projects: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  
  fetchProject: async (id) => {
    set({ loading: true });
    try {
      const response = await api.get(`/projects/${id}`);
      set({ currentProject: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  
  createProject: async (data) => {
    const response = await api.post('/projects', data);
    set((state) => ({ projects: [...state.projects, response.data] }));
    return response.data;
  },
  
  updateProject: async (id, data) => {
    const response = await api.put(`/projects/${id}`, data);
    set((state) => ({
      projects: state.projects.map(p => p.id === id ? response.data : p),
      currentProject: state.currentProject?.id === id ? response.data : state.currentProject
    }));
    return response.data;
  },
  
  deleteProject: async (id) => {
    await api.delete(`/projects/${id}`);
    set((state) => ({
      projects: state.projects.filter(p => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject
    }));
  },
  
  fetchTasks: async (projectId) => {
    set({ loading: true });
    try {
      const response = await api.get(`/tasks/project/${projectId}`);
      set({ tasks: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  
  createTask: async (projectId, data) => {
    const response = await api.post(`/tasks/project/${projectId}`, data);
    set((state) => ({ tasks: [...state.tasks, response.data] }));
    return response.data;
  },
  
  updateTask: async (taskId, data) => {
    const response = await api.put(`/tasks/${taskId}`, data);
    set((state) => ({
      tasks: state.tasks.map(t => t.id === taskId ? response.data : t)
    }));
    return response.data;
  },
  
  updateTaskStatus: async (taskId, status, order) => {
    const response = await api.patch(`/tasks/${taskId}/status`, { status, order });
    set((state) => ({
      tasks: state.tasks.map(t => t.id === taskId ? response.data : t)
    }));
    return response.data;
  },
  
  deleteTask: async (taskId) => {
    await api.delete(`/tasks/${taskId}`);
    set((state) => ({
      tasks: state.tasks.filter(t => t.id !== taskId)
    }));
  },
  
  setTasks: (tasks) => set({ tasks })
}));