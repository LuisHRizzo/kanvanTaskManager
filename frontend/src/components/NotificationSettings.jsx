import { useState, useEffect } from 'react';
import useNotifications from '../hooks/useNotifications';

export default function NotificationSettings() {
  const { preferences, updatePreferences, requestPermission, subscribeToPush, permission } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    pushEnabled: true,
    emailEnabled: false,
    dueTaskReminder: true,
    taskAssignment: true,
    mentions: true,
    dueTaskAdvance: 60
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        pushEnabled: preferences.pushEnabled ?? true,
        emailEnabled: preferences.emailEnabled ?? false,
        dueTaskReminder: preferences.dueTaskReminder ?? true,
        taskAssignment: preferences.taskAssignment ?? true,
        mentions: preferences.mentions ?? true,
        dueTaskAdvance: preferences.dueTaskAdvance ?? 60
      });
    }
  }, [preferences]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await updatePreferences(formData);
      setMessage({ type: 'success', text: 'Preferencias guardadas correctamente' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar preferencias' });
    } finally {
      setLoading(false);
    }
  };

  const handleEnablePush = async () => {
    try {
      const granted = await requestPermission();
      if (granted) {
        await subscribeToPush();
        setMessage({ type: 'success', text: 'Notificaciones push activadas' });
        setFormData(prev => ({ ...prev, pushEnabled: true }));
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al activar notificaciones push' });
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Configuración de Notificaciones</h2>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {permission !== 'granted' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Activar notificaciones del navegador</h3>
          <p className="text-sm text-blue-700 mb-3">Permite las notificaciones push para recibir alertas en tiempo real.</p>
          <button
            onClick={handleEnablePush}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {permission === 'denied' ? 'Permiso denegado - verifica la configuración del navegador' : 'Activar notificaciones'}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Canales de notificación</h3>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-gray-700">Notificaciones Push</span>
              <input
                type="checkbox"
                checked={formData.pushEnabled}
                onChange={(e) => handleChange('pushEnabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-gray-700">Notificaciones por Email</span>
              <input
                type="checkbox"
                checked={formData.emailEnabled}
                onChange={(e) => handleChange('emailEnabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tipos de notificación</h3>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-gray-700">Asignación de tareas</span>
              <input
                type="checkbox"
                checked={formData.taskAssignment}
                onChange={(e) => handleChange('taskAssignment', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-gray-700">Recordatorio de tareas por vencer</span>
              <input
                type="checkbox"
                checked={formData.dueTaskReminder}
                onChange={(e) => handleChange('dueTaskReminder', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-gray-700">Menciones en comentarios</span>
              <input
                type="checkbox"
                checked={formData.mentions}
                onChange={(e) => handleChange('mentions', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Anticipación de recordatorio</h3>
          
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={formData.dueTaskAdvance}
              onChange={(e) => handleChange('dueTaskAdvance', parseInt(e.target.value) || 0)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              step="15"
            />
            <span className="text-gray-600">minutos antes del vencimiento</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Las notificaciones se enviarán con esta anticipación al vencimiento de la tarea.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
        >
          {loading ? 'Guardando...' : 'Guardar preferencias'}
        </button>
      </form>
    </div>
  );
}
