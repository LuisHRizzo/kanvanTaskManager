import { useState, useEffect } from 'react';
import { useProjectStore, useAuthStore } from '../store';
import { useTimeTracking } from '../hooks/useTimeTracking';
import api from '../lib/api';
import Timer from './Timer';
import { motion, AnimatePresence } from 'framer-motion';

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

const colorMap = {
  default: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-300 dark:border-gray-600' },
  red: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700' },
  green: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-700 dark:text-green-300', border: 'border-green-300 dark:border-green-700' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/50', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-300 dark:border-pink-700' },
};

const statusConfig = {
  pendiente: { label: 'Pendiente', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
  en_progreso: { label: 'En Progreso', bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-700 dark:text-blue-300' },
  en_revision: { label: 'En Revisión', bg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-700 dark:text-amber-300' },
  completada: { label: 'Completada', bg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-700 dark:text-emerald-300' },
};

const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function TaskModal({ task, onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    dueDate: task.dueDate || '',
    color: task.color || 'default'
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

  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

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
        const res = await api.get('/projects/users/all');
        setProjectMembers(res.data || []);
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

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoadingDocs(true);
      try {
        const res = await api.get(`/tasks/${task.id}/documents`);
        setDocuments(res.data);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoadingDocs(false);
      }
    };
    fetchDocuments();
  }, [task.id]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = {
        title: form.title,
        description: form.description,
        status: form.status,
        color: form.color,
        dueDate: form.dueDate || null
      };
      await updateTask(task.id, updateData);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Error al actualizar tarea: ' + (error.response?.data?.error || error.message));
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
      await api.post(`/tasks/${task.id}/assignments`, { userId, role: 'assignee' });
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

  const handleUploadDocument = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      return alert('El archivo excede el límite de 10MB.');
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadingDoc(true);
    try {
      const res = await api.post(`/tasks/${task.id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDocuments(prev => [...prev, res.data]);
    } catch (error) {
      alert(error.response?.data?.error || 'Error al subir el documento');
    } finally {
      setUploadingDoc(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!confirm('¿Seguro quieres eliminar este documento?')) return;
    try {
      await api.delete(`/tasks/${task.id}/documents/${docId}`);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (error) {
      alert('Error eliminando el documento');
    }
  };

  const colors = colorMap[form.color || 'default'] || colorMap.default;

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div 
        className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border shadow-soft"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-start z-10">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="text-xl font-semibold text-foreground w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            ) : (
              <h2 className="text-xl font-semibold text-foreground">{task.title}</h2>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="ml-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-base"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Descripción
            </label>
            {isEditing ? (
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                rows={4}
                placeholder="Agregá una descripción..."
              />
            ) : (
              <p className="text-muted-foreground bg-muted/30 rounded-lg p-4">
                {task.description || 'Sin descripción'}
              </p>
            )}
          </div>

          {/* Status & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Estado
              </label>
              <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium ${statusConfig[task.status]?.bg || ''} ${statusConfig[task.status]?.text || ''}`}>
                {statusConfig[task.status]?.label || task.status}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                Fecha límite
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={form.dueDate || ''}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              ) : (
                <span className="text-muted-foreground">
                  {task.dueDate 
                    ? new Date(task.dueDate + 'T00:00:00').toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Sin fecha'
                  }
                </span>
              )}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
              </svg>
              Color
            </label>
            {isEditing ? (
              <div className="flex gap-2 flex-wrap">
                {['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      form.color === c ? 'border-foreground scale-110' : 'border-border hover:scale-105'
                    } ${colorMap[c]?.bg || 'bg-gray-100'}`}
                    title={c.charAt(0).toUpperCase() + c.slice(1)}
                  />
                ))}
              </div>
            ) : (
              <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium ${colors.bg} ${colors.text}`}>
                {task.color === 'default' ? 'Sin color' : task.color.charAt(0).toUpperCase() + task.color.slice(1)}
              </span>
            )}
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              Asignados
            </label>
            {assignees.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {assignees.map(assignee => (
                  <div key={assignee.userId} className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                      {assignee.user?.name?.charAt(0) || '?'}
                    </div>
                    <span className="text-sm font-medium text-foreground">{assignee.user?.name || 'Usuario'}</span>
                    <button
                      onClick={() => handleRemoveAssignee(assignee.userId)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No hay usuarios asignados</p>
            )}
          </div>

          {/* Add Assignee */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Agregar asignado</label>
            {loadingAssignees ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddAssignee(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
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

          {/* Google Calendar */}
          <div className="border-t border-border pt-5">
            <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Google Calendar
            </h3>

            {calendarUrl && !showCalendarForm ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-sm text-emerald-800 dark:text-emerald-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Evento configurado</span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-base text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    Abrir en Google Calendar
                  </a>
                  <button
                    onClick={() => setShowCalendarForm(true)}
                    className="px-3 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-base"
                    title="Modificar reunión"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.75" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {!showCalendarForm ? (
                  <button
                    onClick={() => setShowCalendarForm(true)}
                    className="w-full px-4 py-3 border-2 border-dashed border-primary/30 rounded-lg text-primary hover:bg-primary/5 transition-base text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Agendar reunión en Google Calendar
                  </button>
                ) : (
                  <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Inicio</label>
                        <input
                          type="datetime-local"
                          value={calendarForm.startDateTime}
                          onChange={(e) => setCalendarForm({ ...calendarForm, startDateTime: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Fin</label>
                        <input
                          type="datetime-local"
                          value={calendarForm.endDateTime}
                          onChange={(e) => setCalendarForm({ ...calendarForm, endDateTime: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Zona horaria</label>
                      <select
                        value={calendarForm.timezone}
                        onChange={(e) => setCalendarForm({ ...calendarForm, timezone: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Invitados <span className="text-muted-foreground/60">(emails separados por coma)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="email @empresa.com, equipo @visuallatina.com"
                        value={calendarForm.attendees}
                        onChange={(e) => setCalendarForm({ ...calendarForm, attendees: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    {calendarError && (
                      <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        {calendarError}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowCalendarForm(false); setCalendarError(null); }}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted transition-base text-sm font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleGenerateCalendarUrl}
                        disabled={calendarLoading}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-base text-sm"
                      >
                        {calendarLoading ? 'Generando...' : 'Generar enlace'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Google Tasks */}
          <div className="border-t border-border pt-5">
            <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Google Tasks
            </h3>

            {googleSyncStatus?.googleTaskId ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-sm text-emerald-800 dark:text-emerald-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Sincronizada con Google Tasks</span>
                </div>
                <button
                  onClick={handleUnsyncFromGoogle}
                  className="px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted transition-base text-sm font-medium"
                >
                  Desvincular
                </button>
              </div>
            ) : (
              <button
                onClick={handleSyncToGoogle}
                disabled={syncing}
                className="w-full px-4 py-3 border-2 border-dashed border-primary/30 rounded-lg text-primary hover:bg-primary/5 transition-base text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {syncing ? 'Sincronizando...' : 'Sincronizar con Google Tasks'}
              </button>
            )}
          </div>

          {/* Comments */}
          <div className="border-t border-border pt-5">
            <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              Comentarios ({comments.length})
            </h3>

            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto scrollbar-thin">
              {loadingComments ? (
                <p className="text-sm text-muted-foreground text-center py-4">Cargando comentarios...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay comentarios aún</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                        {comment.user?.name?.charAt(0) || '?'}
                      </div>
                      <span className="font-medium text-sm text-foreground">{comment.user?.name || 'Usuario'}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{comment.content}</p>
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
                className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
              <button
                onClick={handlePostComment}
                disabled={!newComment.trim()}
                className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-base text-sm"
              >
                Enviar
              </button>
            </div>
          </div>

          {/* Time Tracking */}
          <div className="border-t border-border pt-5">
            <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Seguimiento de Tiempo
            </h3>
            <div className="mb-4">
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
              <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                <span className="text-sm text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cronómetro activo desde {new Date(activeEntry.startTime).toLocaleTimeString('es-AR')}
                </span>
              </div>
            )}

            {timeSummary && (
              <div className="bg-muted/30 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Tiempo total:</span>
                  <span className="text-lg font-bold text-primary">{timeSummary.totalFormatted}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {timeSummary.entriesCount} registro(s) de tiempo
                </div>
                {Object.keys(timeSummary.byUser).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border space-y-1">
                    <span className="text-xs text-muted-foreground">Por usuario:</span>
                    {Object.entries(timeSummary.byUser).map(([userName, seconds]) => (
                      <div key={userName} className="flex justify-between text-xs text-muted-foreground">
                        <span>{userName}</span>
                        <span>{formatTime(seconds)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {timeEntries.length > 0 && (
              <div className="max-h-40 overflow-y-auto scrollbar-thin space-y-1">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Registros:</h4>
                {timeEntries.map(entry => (
                  <div key={entry.id} className="flex justify-between py-2 px-3 rounded-lg bg-muted/30 text-sm">
                    <span className="text-muted-foreground">{entry.user?.name || 'Usuario'}</span>
                    <span className="text-foreground">
                      {entry.endTime
                        ? `${new Date(entry.startTime).toLocaleDateString('es-AR')} - ${formatTime(Math.floor((new Date(entry.endTime) - new Date(entry.startTime)) / 1000))}`
                        : 'En progreso...'
                      }
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="border-t border-border pt-5">
            <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
              Documentos adjuntos ({documents.length})
            </h3>
            
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto scrollbar-thin">
              {loadingDocs ? (
                <p className="text-sm text-muted-foreground text-center py-4">Cargando adjuntos...</p>
              ) : documents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 border border-dashed border-border rounded-lg">No hay documentos adjuntos en esta tarea.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card shadow-sm hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <a 
                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/uploads/${doc.filePath}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-primary hover:underline truncate"
                            title={doc.originalName}
                          >
                            {doc.originalName}
                          </a>
                          <span className="text-xs text-muted-foreground">{doc.size ? formatBytes(doc.size) : 'Desconocido'}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Eliminar documento"
                      >
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                         </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                onChange={handleUploadDocument}
                disabled={uploadingDoc}
              />
              <label 
                htmlFor="file-upload" 
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg text-sm font-medium transition-colors ${uploadingDoc ? 'border-primary/50 text-primary/50 cursor-wait bg-primary/5' : 'border-primary/30 text-primary hover:bg-primary/5 cursor-pointer'}`}
              >
                {uploadingDoc ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full border-t-0"></div>
                    Subiendo archivo...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Adjuntar archivo (Máx 10MB)
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted transition-base font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-base"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 border border-destructive/20 transition-base font-medium"
              >
                Eliminar
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-base"
              >
                Editar
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
