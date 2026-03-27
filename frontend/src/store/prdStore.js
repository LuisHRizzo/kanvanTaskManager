import { create } from 'zustand';
import api from '../lib/api';

export const usePRDStore = create((set, get) => ({
  currentSession: null,
  projectSessions: [],
  loading: false,
  error: null,

  createSession: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/prd/session', { projectId });
      set({ currentSession: response.data.session, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.error || 'Error al crear la sesión', loading: false });
      throw error;
    }
  },

  loadSession: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/prd/session/${id}`);
      set({ currentSession: response.data, loading: false });
    } catch (error) {
      set({ error: 'Error al cargar la sesión', loading: false });
    }
  },

  fetchProjectSessions: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/prd/project/${projectId}`);
      set({ projectSessions: response.data, loading: false });
    } catch (error) {
      set({ error: 'Error al cargar los documentos', loading: false });
    }
  },

  sendMessage: async (id, message) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/prd/session/${id}/chat`, { message });
      // Update contextHistory inside the session
      set((state) => ({
        currentSession: {
          ...state.currentSession,
          contextHistory: response.data.history
        },
        loading: false
      }));
      return response.data.reply;
    } catch (error) {
      set({ error: 'Error enviando mensaje', loading: false });
      throw error;
    }
  },

  advanceStage: async (id, summary) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/prd/session/${id}/stage`, { summary });
      // response.data contains { session, nextQuestion }
      set({ currentSession: response.data.session, loading: false });
      return response.data;
    } catch (error) {
      set({ error: 'Error al avanzar de etapa', loading: false });
      throw error;
    }
  },

  generateDocument: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/prd/session/${id}/generate`);
      set((state) => ({
        currentSession: {
          ...state.currentSession,
          finalDocument: response.data.document
        },
        loading: false
      }));
      return response.data.document;
    } catch (error) {
      set({ error: 'Error al generar documento', loading: false });
      throw error;
    }
  },

  clearSession: () => set({ currentSession: null, error: null })
}));
