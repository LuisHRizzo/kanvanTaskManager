import { useState, useEffect } from 'react';
import { useAuthStore } from '../store';
import { useNotifications } from '../hooks/useNotifications';
import api from '../lib/api';

export default function Settings() {
  const { user, googleStatus, fetchGoogleStatus, connectGoogle, disconnectGoogle } = useAuthStore();
  const { preferences, loading: prefsLoading, updatePreferences, requestPermission } = useNotifications();
  const [googleTasks, setGoogleTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [importing, setImporting] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchGoogleStatus();
  }, []);

  useEffect(() => {
    if (googleStatus.isConnected) {
      fetchGoogleTasks();
    }
  }, [googleStatus.isConnected]);

  const fetchGoogleTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await api.get('/google-sync/google/tasks');
      setGoogleTasks(res.data);
    } catch (error) {
      console.error('Error fetching Google Tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleImportTask = async (googleTaskId) => {
    setImporting(googleTaskId);
    try {
      const res = await api.post(`/google-sync/google/tasks/${googleTaskId}/import`);
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
      const res = await api.post('/google-sync/tasks/sync/google');
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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>👤</span> Cuenta
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📅</span> Google Tasks
          </h2>
          
          {!googleStatus.isConnected ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">Conecta tu cuenta de Google para sincronizar tareas</p>
              <button
                onClick={connectGoogle}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-green-800">Cuenta conectada: {googleStatus.email}</span>
                </div>
                <button
                  onClick={disconnectGoogle}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Desconectar
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSyncAllTasks}
                  disabled={syncing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {syncing ? 'Sincronizando...' : '🔄 Sincronizar todas las tareas'}
                </button>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Tareas de Google Tasks</h3>
                {loadingTasks ? (
                  <p className="text-gray-500 text-sm">Cargando tareas...</p>
                ) : googleTasks.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay tareas en Google Tasks</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {googleTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{task.title}</p>
                          {task.due && (
                            <p className="text-xs text-gray-500">
                              📅 {new Date(task.due).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleImportTask(task.id)}
                          disabled={importing === task.id}
                          className="ml-2 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm disabled:opacity-50"
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
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🔔</span> Notificaciones
          </h2>

          <div className="mb-4">
            <button
              onClick={requestPermission}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
            >
              🔔 Habilitar notificaciones push
            </button>
          </div>

          {prefsLoading ? (
            <p className="text-gray-500">Cargando preferencias...</p>
          ) : preferences && (
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <span>Notificaciones de tareas asignadas</span>
                <input
                  type="checkbox"
                  checked={preferences.taskAssigned ?? true}
                  onChange={() => handleTogglePreference('taskAssigned')}
                  className="w-5 h-5 rounded text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <span>Notificaciones de comentarios</span>
                <input
                  type="checkbox"
                  checked={preferences.commentAdded ?? true}
                  onChange={() => handleTogglePreference('commentAdded')}
                  className="w-5 h-5 rounded text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <span>Recordatorios de fecha límite</span>
                <input
                  type="checkbox"
                  checked={preferences.dueDateReminder ?? true}
                  onChange={() => handleTogglePreference('dueDateReminder')}
                  className="w-5 h-5 rounded text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <span>Notificaciones de cambios de estado</span>
                <input
                  type="checkbox"
                  checked={preferences.statusChange ?? true}
                  onChange={() => handleTogglePreference('statusChange')}
                  className="w-5 h-5 rounded text-blue-600"
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
