import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore, useProjectStore } from '../store';
import { useNotifications } from '../hooks/useNotifications';
import api from '../lib/api';
import NotificationSettings from '../components/NotificationSettings';

export default function Settings() {
  const { user, googleStatus, fetchGoogleStatus, connectGoogle, disconnectGoogle } = useAuthStore();
  const { preferences, loading: prefsLoading, updatePreferences, requestPermission } = useNotifications();
  const { projects, fetchProjects } = useProjectStore();
  const [googleTasks, setGoogleTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [importing, setImporting] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        if (searchParams.get('google') === 'connected') {
          window.history.replaceState({}, '', '/settings');
          window.location.reload();
          return;
        }

        const status = await fetchGoogleStatus();
        console.log('Google status:', status);

        if (searchParams.get('error')) {
          setMessage({ type: 'error', text: 'Error al conectar con Google: ' + searchParams.get('error') });
        }
      } catch (err) {
        console.error('Error fetching Google status:', err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGoogleStatus();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (googleStatus.isConnected) {
      fetchGoogleTasks();
    }
  }, [googleStatus.isConnected]);

  const fetchGoogleTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await api.get('/settings/google/tasks?_t=' + Date.now());
      console.log('Google Tasks response:', res.data);
      setGoogleTasks(res.data.tasks || []);
    } catch (error) {
      console.error('Error fetching Google Tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleImportTask = async (googleTaskId) => {
    if (!selectedProject) {
      setMessage({ type: 'error', text: 'Selecciona un proyecto primero' });
      return;
    }
    setImporting(googleTaskId);
    try {
      const res = await api.post(`/settings/google/tasks/${googleTaskId}/import`, {
        projectId: selectedProject
      });
      setMessage({ type: 'success', text: 'Tarea importada correctamente' });
      setGoogleTasks(prev => prev.filter(t => t.id !== googleTaskId));
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Error al importar tarea' });
    } finally {
      setImporting(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSyncAllTasks = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/settings/tasks/sync/google');
      setMessage({ type: 'success', text: `${res.data.syncedCount} tareas sincronizadas` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al sincronizar tareas' });
    } finally {
      setSyncing(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleTogglePreference = async (key) => {
    if (!preferences) return;
    await updatePreferences({ [key]: !preferences[key] });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <motion.header 
        className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-4xl mx-auto py-4 px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-primary hover:underline text-sm font-medium"
            >
              ← Volver
            </button>
            <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        {message && (
          <motion.div 
            className={`mb-6 p-4 rounded-xl border ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-400' 
                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {message.text}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          {['general', 'notifications', 'google'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === tab
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              {tab === 'general' && '👤 General'}
              {tab === 'notifications' && '🔔 Notificaciones'}
              {tab === 'google' && '📅 Google Tasks'}
            </button>
          ))}
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border/60 shadow-soft p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span>👤</span> Cuenta
            </h2>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/60">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-lg font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-foreground">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <NotificationSettings />
          </motion.div>
        )}

        {/* Google Tasks Tab */}
        {activeTab === 'google' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border/60 shadow-soft p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span>📅</span> Google Tasks
            </h2>

            {!googleStatus.isConnected ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center text-3xl">
                  📅
                </div>
                <p className="text-muted-foreground mb-4">Conecta tu cuenta de Google para sincronizar tareas</p>
                <button
                  onClick={connectGoogle}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-soft"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Conectar con Google
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                    <span className="text-green-800 dark:text-green-400 font-medium">Cuenta conectada: {googleStatus.email}</span>
                  </div>
                  <button
                    onClick={disconnectGoogle}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                  >
                    Desconectar
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSyncAllTasks}
                    disabled={syncing}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    {syncing ? 'Sincronizando...' : '🔄 Sincronizar todas las tareas'}
                  </button>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-3">Importar tareas</h3>

                  <div className="mb-4">
                    <label className="block text-sm text-muted-foreground mb-2">Seleccionar proyecto:</label>
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">Seleccionar proyecto...</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {loadingTasks ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Cargando tareas...</p>
                    </div>
                  ) : !Array.isArray(googleTasks) || googleTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay tareas en Google Tasks</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin">
                      {googleTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{task.title}</p>
                            {task.due && (
                              <p className="text-xs text-muted-foreground">
                                📅 {new Date(task.due).toLocaleDateString('es-AR')}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleImportTask(task.id)}
                            disabled={importing === task.id || !selectedProject}
                            className="ml-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            {importing === task.id ? 'Importando...' : 'Importar'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
