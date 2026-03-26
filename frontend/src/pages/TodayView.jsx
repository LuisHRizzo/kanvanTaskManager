import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import TaskModal from '../components/TaskModal';
import useSocket from '../hooks/useSocket';
import { motion } from 'framer-motion';

const statusConfig = {
  pendiente: { label: 'Pendiente', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
  en_progreso: { label: 'En Progreso', bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-700 dark:text-blue-300' },
  en_revision: { label: 'En Revisión', bg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-700 dark:text-amber-300' },
  completada: { label: 'Completada', bg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-700 dark:text-emerald-300' }
};

// Get today's date in Argentina timezone (consistent with backend)
function getArgentinaToday() {
  const dateStr = new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' });
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getPriorityColor(dueDate) {
  if (!dueDate) return 'text-muted-foreground';
  const argentinaToday = getArgentinaToday();
  const due = new Date(dueDate + 'T00:00:00');
  const diffDays = Math.ceil((due - argentinaToday) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'text-destructive font-medium';
  if (diffDays === 0) return 'text-orange-500 font-medium';
  if (diffDays <= 2) return 'text-amber-500';
  return 'text-muted-foreground';
}

function getDaysUntilDue(dueDate) {
  if (!dueDate) return { text: 'Sin fecha', icon: '📅' };
  const argentinaToday = getArgentinaToday();
  const due = new Date(dueDate + 'T00:00:00');
  const diffDays = Math.ceil((due - argentinaToday) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `Venció hace ${Math.abs(diffDays)} días`, icon: '🔴', color: 'text-destructive' };
  if (diffDays === 0) return { text: 'Vence hoy', icon: '🟠', color: 'text-orange-500' };
  if (diffDays === 1) return { text: 'Vence mañana', icon: '🟡', color: 'text-amber-500' };
  return { text: `Vence en ${diffDays} días`, icon: '🟢', color: 'text-muted-foreground' };
}

function TaskSection({ title, tasks, onTaskClick, onTaskComplete, emptyMessage, icon, color }) {
  if (!tasks || tasks.length === 0) {
    return (
      <motion.div
        className="bg-card rounded-xl border border-border p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center text-xl">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-card rounded-xl border border-border overflow-hidden shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`px-6 py-4 border-b border-border ${color} flex items-center justify-between`}>
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          {title}
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-background/80 text-muted-foreground">
            {tasks.length}
          </span>
        </h3>
      </div>
      <div className="divide-y divide-border">
        {tasks.map((task) => {
          const dueInfo = getDaysUntilDue(task.dueDate);
          return (
            <div key={task.id} className="p-4 hover:bg-muted/30 transition-base group">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  onChange={() => onTaskComplete(task.id)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary/20 focus:ring-2 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      onClick={() => onTaskClick(task)}
                      className="font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                    >
                      {task.title}
                    </span>
                    {task.project && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {task.project.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`flex items-center gap-1 ${dueInfo.color || ''}`}>
                      <span>{dueInfo.icon}</span>
                      <span>{dueInfo.text}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[task.status]?.bg || ''} ${statusConfig[task.status]?.text || ''}`}>
                      {statusConfig[task.status]?.label || task.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onTaskClick(task)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-base opacity-0 group-hover:opacity-100"
                >
                  Ver detalles
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function TodayView() {
  const [tasksData, setTasksData] = useState({ overdue: [], today: [], upcoming: [] });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();
  const { on } = useSocket();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await api.get('/tasks/today', { params });
      setTasksData(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  useEffect(() => {
    const unsubscribe = on('task_updated', () => {
      fetchTasks();
    });
    return unsubscribe;
  }, [on]);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleTaskComplete = async (taskId) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: 'completada' });
      await fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
    fetchTasks();
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
        <div className="max-w-7xl mx-auto py-4 px-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Volver
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Gestión de Tareas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Tus tareas organizadas por fecha de vencimiento</p>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Filter */}
        <motion.div
          className="mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="text-sm font-medium text-foreground">Filtrar por estado:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-base"
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En Progreso</option>
            <option value="en_revision">En Revisión</option>
            <option value="completada">Completada</option>
          </select>
        </motion.div>

        {loading ? (
          <motion.div
            className="flex flex-col items-center justify-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Cargando tareas...</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <TaskSection
              title="Atrasadas"
              tasks={tasksData.overdue}
              onTaskClick={handleTaskClick}
              onTaskComplete={handleTaskComplete}
              emptyMessage="¡Bien! No tenés tareas atrasadas"
              icon="🔴"
              color="bg-red-500/10"
            />

            <TaskSection
              title="Para Hoy"
              tasks={tasksData.today}
              onTaskClick={handleTaskClick}
              onTaskComplete={handleTaskComplete}
              emptyMessage="No tenés tareas para hoy"
              icon="🟠"
              color="bg-orange-500/10"
            />

            <TaskSection
              title="Próximas (7 días)"
              tasks={tasksData.upcoming}
              onTaskClick={handleTaskClick}
              onTaskComplete={handleTaskComplete}
              emptyMessage="No tenés tareas próximas"
              icon="🟡"
              color="bg-yellow-500/10"
            />
          </div>
        )}
      </main>

      {/* Task Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
