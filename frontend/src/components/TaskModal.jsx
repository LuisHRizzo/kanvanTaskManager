import { useState, useEffect } from 'react';
import { useProjectStore, useAuthStore } from '../store';
import { useTimeTracking } from '../hooks/useTimeTracking';
import api from '../lib/api';
import Timer from './Timer';

// Helpers para Google Calendar
const toLocalDatetimeValue = (date) => {
  const d = date || new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getDefaultStart = (dueDate) => {
  const base = dueDate ? new Date(dueDate + 'T09:00:00') : new Date();
  return toLocalDatetimeValue(base);
};

const getDefaultEnd = (dueDate) => {
  const base = dueDate ? new Date(dueDate + 'T10:00:00') : new Date(Date.now() + 3600000);
  return toLocalDatetimeValue(base);
};

export default function TaskModal({ task, onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    dueDate: task.dueDate || ''
  });
  const { updateTask, deleteTask } = useProjectStore();
  const [loading, setLoading] = useState(false);
  const { activeEntry, elapsedTime, loading: timerLoading, startTimer, stopTimer, formatTime } = useTimeTracking();
  const [timeSummary, setTimeSummary] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);

  const [assignees, setAssignees] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingAssignees, setLoadingAssignees] = useState(false);
  
  const [googleSyncStatus, setGoogleSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Google Calendar state
  const [calendarUrl, setCalendarUrl] = useState(task.calendarUrl || null);
  const [calendarForm, setCalendarForm] = useState({
    startDateTime: getDefaultStart(task.dueDate),
    endDateTime: getDefaultEnd(task.dueDate),
    attendees: '',
    timezone: 'America/Argentina/Buenos_Aires'
  });
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState(null);
  const [showCalendarForm, setShowCalendarForm] = useState(false);

  useEffect(() => {
    const fetchTimeData = async () => {
      try {
        const summaryRes = await api.get(`/time/${task.id}/summary`);
        setTimeSummary(summaryRes.data);
        const entriesRes = await api.get(`/time/${task.id}/entries`);
        setTimeEntries(entriesRes.data);
      } catch (error) {
        console.error('Error fetching time data:', error);
      }
    };
    fetchTimeData();
  }, [task.id]);

  useEffect(() => {
    const fetchAssignees = async () => {
      setLoadingAssignees(true);
      try {
        const res = await api.get(`/tasks/${task.id}/assignments`);
        setAssignees(res.data);
      } catch (error) {
        console.error('Error fetching assignees:', error);
      } finally {
        setLoadingAssignees(false);
      }
    };
    fetchAssignees();
  }, [task.id]);

  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!task.projectId) return;
      try {
        const res = await api.get(`/projects/${task.projectId}`);
        setProjectMembers(res.data.members || []);
      } catch (error) {
        console.error('Error fetching project members:', error);
      }
    };
    fetchProjectMembers();
  }, [task.projectId]);

  useEffect(() => {
    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const res = await api.get(`/tasks/${task.id}/comments`);
        setComments(res.data);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoadingComments(false);
      }
    };
    fetchComments();
  }, [task.id]);

  useEffect(() => {
    const fetchGoogleSyncStatus = async () => {
      try {
        const res = await api.get(`/settings/tasks/${task.id}/sync/google`);
        setGoogleSyncStatus(res.data);
      } catch (error) {
        setGoogleSyncStatus(null);
      }
    };
    fetchGoogleSyncStatus();
  }, [task.id]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateTask(task.id, form);
      onClose();
    } catch (error) {
      alert('Error al actualizar tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;
    setLoading(true);
    try {
      await deleteTask(task.id);
      onClose();
    } catch (error) {
      alert('Error al eliminar tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCalendarUrl = async () => {
    setCalendarLoading(true);
    setCalendarError(null);
    try {
      const attendeesList = calendarForm.attendees
        .split(',')
        .map(e => e.trim())
        .filter(e => e.includes('@'));

      const res = await api.post(`/tasks/${task.id}/calendar-url`, {
        startDateTime: new Date(calendarForm.startDateTime).toISOString(),
        endDateTime: new Date(calendarForm.endDateTime).toISOString(),
        attendees: attendeesList,
        timezone: calendarForm.timezone
      });

      setCalendarUrl(res.data.calendarUrl);
      setShowCalendarForm(false);
    } catch (err) {
      setCalendarError(err.response?.data?.error || 'Error al generar el enlace');
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleAddAssignee = async (userId) => {
    try {
      await api.post(`/tasks/${task.id}/assignments`, { userId, role: 'member' });
      const res = await api.get(`/tasks/${task.id}/assignments`);
      setAssignees(res.data);
    } catch (error) {
      alert('Error al agregar asignatario');
    }
  };

  const handleRemoveAssignee = async (userId) => {
    try {
      await api.delete(`/tasks/${task.id}/assignments/${userId}`);
      setAssignees(prev => prev.filter(a => a.userId !== userId));
    } catch (error) {
      alert('Error al eliminar asignatario');
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/tasks/${task.id}/comments`, { content: newComment });
      setComments(prev => [...prev, res.data]);
      setNewComment('');
    } catch (error) {
      alert('Error al agregar comentario');
    }
  };

  const handleSyncToGoogle = async () => {
    setSyncing(true);
    try {
      const res = await api.post(`/settings/tasks/${task.id}/sync/google`);
      setGoogleSyncStatus(res.data);
    } catch (error) {
      alert('Error al sincronizar con Google Tasks');
    } finally {
      setSyncing(false);
    }
  };

  const handleUnsyncFromGoogle = async () => {
    try {
      await api.delete(`/settings/tasks/${task.id}/sync/google`);
      setGoogleSyncStatus(null);
    } catch (error) {
      alert('Error al desvincular de Google Tasks');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          {isEditing ? (
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="text-xl font-bold border rounded px-2 py-1 w-full"
            />
          ) : (
            <h2 className="text-xl font-bold">{task.title}</h2>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          {isEditing ? (
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={4}
            />
          ) : (
            <p className="text-gray-600">{task.description || 'Sin descripción'}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <span className={`px-2 py-1 rounded text-sm ${
              task.status === 'completada' ? 'bg-green-100 text-green-800' :
              task.status === 'en_progreso' ? 'bg-blue-100 text-blue-800' :
              task.status === 'en_revision' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {task.status.replace('_', ' ')}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
            {isEditing ? (
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            ) : (
              <span className="text-gray-600">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Sin fecha'}
              </span>
            )}
          </div>
        </div>

        {assignees.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Asignados a</label>
            <div className="flex flex-wrap gap-2">
              {assignees.map(assignee => (
                <div key={assignee.userId} className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                    {assignee.user?.name?.charAt(0) || '?'}
                  </div>
                  <span className="text-sm">{assignee.user?.name || 'Usuario'}</span>
                  <button
                    onClick={() => handleRemoveAssignee(assignee.userId)}
                    className="text-gray-400 hover:text-red-500 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {task.assignee && !task.assignees && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Asignado a</label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {task.assignee.name.charAt(0)}
              </div>
              <span>{task.assignee.name}</span>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Agregar asignados</label>
          {loadingAssignees ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : (
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddAssignee(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              defaultValue=""
            >
              <option value="">Seleccionar usuario...</option>
              {projectMembers
                .filter(m => !assignees.some(a => a.userId === m.id))
                .map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
            </select>
          )}
        </div>

        {/* ── Google Calendar ────────────────────────────────── */}
        <div className="border-t pt-4 mt-4">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span>📅</span> Google Calendar
          </h3>

          {calendarUrl && !showCalendarForm ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                <span>✅</span>
                <span>Evento configurado</span>
              </div>
              <div className="flex gap-2">
                <a
                  href={calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  📅 Abrir en Google Calendar
                </a>
                <button
                  onClick={() => setShowCalendarForm(true)}
                  className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 text-gray-600"
                  title="Modificar reunión"
                >
                  ✏️
                </button>
              </div>
            </div>
          ) : (
            <>
              {!showCalendarForm ? (
                <button
                  onClick={() => setShowCalendarForm(true)}
                  className="w-full px-4 py-2 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 text-sm transition-colors"
                >
                  + Agendar reunión en Google Calendar
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Inicio
                      </label>
                      <input
                        type="datetime-local"
                        value={calendarForm.startDateTime}
                        onChange={(e) => setCalendarForm({ ...calendarForm, startDateTime: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Fin
                      </label>
                      <input
                        type="datetime-local"
                        value={calendarForm.endDateTime}
                        onChange={(e) => setCalendarForm({ ...calendarForm, endDateTime: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Zona horaria
                    </label>
                    <select
                      value={calendarForm.timezone}
                      onChange={(e) => setCalendarForm({ ...calendarForm, timezone: e.target.value })}
                      className="w-full px-2 py-1.5 border rounded text-sm"
                    >
                      <option value="America/Argentina/Buenos_Aires">Buenos Aires (ART)</option>
                      <option value="America/Santiago">Santiago (CLT)</option>
                      <option value="America/Bogota">Bogotá (COT)</option>
                      <option value="America/Lima">Lima (PET)</option>
                      <option value="America/Mexico_City">Ciudad de México (CST)</option>
                      <option value="America/New_York">Nueva York (ET)</option>
                      <option value="Europe/Madrid">Madrid (CET)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Invitados <span className="text-gray-400">(emails separados por coma)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="igor@empresa.com, equipo@visuallatina.com"
                      value={calendarForm.attendees}
                      onChange={(e) => setCalendarForm({ ...calendarForm, attendees: e.target.value })}
                      className="w-full px-2 py-1.5 border rounded text-sm"
                    />
                  </div>

                  {calendarError && (
                    <p className="text-xs text-red-600 bg-red-50 rounded p-2">{calendarError}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowCalendarForm(false); setCalendarError(null); }}
                      className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleGenerateCalendarUrl}
                      disabled={calendarLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
                    >
                      {calendarLoading ? 'Generando...' : '🔗 Generar enlace'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Google Tasks ───────────────────────────────────── */}
        <div className="border-t pt-4 mt-4">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span>☑️</span> Google Tasks
          </h3>
          
          {googleSyncStatus?.googleTaskId ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                <span>✅</span>
                <span>Sincronizada con Google Tasks</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleUnsyncFromGoogle}
                  className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 text-gray-600"
                >
                  Desvincular
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSyncToGoogle}
              disabled={syncing}
              className="w-full px-4 py-2 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 text-sm transition-colors disabled:opacity-50"
            >
              {syncing ? 'Sincronizando...' : '+ Sincronizar con Google Tasks'}
            </button>
          )}
        </div>

        {/* ── Comentarios ────────────────────────────────────── */}
        <div className="border-t pt-4 mt-4">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span>💬</span> Comentarios ({comments.length})
          </h3>
          
          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
            {loadingComments ? (
              <p className="text-sm text-gray-500">Cargando comentarios...</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-gray-500">No hay comentarios aún</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                      {comment.user?.name?.charAt(0) || '?'}
                    </div>
                    <span className="font-medium text-sm">{comment.user?.name || 'Usuario'}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              ))
            )}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
              placeholder="Escribir un comentario..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
            <button
              onClick={handlePostComment}
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              Enviar
            </button>
          </div>
        </div>

        {/* ── Seguimiento de Tiempo ──────────────────────────── */}
        <div className="border-t pt-4 mt-4">
          <h3 className="font-medium text-gray-700 mb-2">Seguimiento de Tiempo</h3>
          <div className="flex items-center justify-between mb-4">
            <Timer 
              taskId={task.id}
              activeEntry={activeEntry}
              elapsedTime={elapsedTime}
              loading={timerLoading}
              onStart={startTimer}
              onStop={stopTimer}
              formatTime={formatTime}
            />
          </div>
          {activeEntry?.taskId === task.id && (
            <div className="bg-green-50 border border-green-200 rounded p-2 mb-2">
              <span className="text-sm text-green-700">
                ⏱ Cronómetro activo desde {new Date(activeEntry.startTime).toLocaleTimeString()}
              </span>
            </div>
          )}
          
          {timeSummary && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Tiempo total:</span>
                <span className="text-lg font-bold text-blue-600">{timeSummary.totalFormatted}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {timeSummary.entriesCount} registro(s) de tiempo
              </div>
              {Object.keys(timeSummary.byUser).length > 0 && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-600">Por usuario:</span>
                  {Object.entries(timeSummary.byUser).map(([user, seconds]) => (
                    <div key={user} className="flex justify-between text-gray-600">
                      <span>{user}</span>
                      <span>{formatTime(seconds)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {timeEntries.length > 0 && (
            <div className="max-h-40 overflow-y-auto text-sm">
              <h4 className="font-medium text-gray-600 mb-2">Registros:</h4>
              {timeEntries.map(entry => (
                <div key={entry.id} className="flex justify-between py-1 border-b text-gray-600">
                  <span>{entry.user?.name || 'Usuario'}</span>
                  <span>
                    {entry.endTime 
                      ? `${new Date(entry.startTime).toLocaleDateString()} - ${formatTime(Math.floor((new Date(entry.endTime) - new Date(entry.startTime)) / 1000))}`
                      : 'En progreso...'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Documentos adjuntos ───────────────────────────── */}
        <div className="border-t pt-4 mt-4">
          <h3 className="font-medium text-gray-700 mb-2">Documentos adjuntos</h3>
          <p className="text-sm text-gray-500">Próximamente en Fase 5</p>
        </div>

        <div className="flex gap-2 mt-6">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Guardar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Eliminar
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Editar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}