import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import TaskModal from '../components/TaskModal';
import useSocket from '../hooks/useSocket';

const statusConfig = {
  pendiente: { label: 'Pendiente', color: 'bg-gray-100 text-gray-700' },
  en_progreso: { label: 'En Progreso', color: 'bg-blue-100 text-blue-700' },
  en_revision: { label: 'En Revisión', color: 'bg-yellow-100 text-yellow-700' },
  completada: { label: 'Completada', color: 'bg-green-100 text-green-700' }
};

// Get today's date in Argentina timezone (consistent with backend)
function getArgentinaToday() {
  const dateStr = new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' });
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getPriorityColor(dueDate) {
  if (!dueDate) return 'text-gray-500';
  const argentinaToday = getArgentinaToday();
  const due = new Date(dueDate + 'T00:00:00');
  const diffDays = Math.ceil((due - argentinaToday) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'text-red-600 font-semibold';
  if (diffDays === 0) return 'text-orange-600 font-semibold';
  if (diffDays <= 2) return 'text-yellow-600';
  return 'text-gray-500';
}

function getDaysUntilDue(dueDate) {
  if (!dueDate) return '';
  const argentinaToday = getArgentinaToday();
  const due = new Date(dueDate + 'T00:00:00');
  const diffDays = Math.ceil((due - argentinaToday) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Venció hace ${Math.abs(diffDays)} días`;
  if (diffDays === 0) return 'Vence hoy';
  if (diffDays === 1) return 'Vence mañana';
  return `Vence en ${diffDays} días`;
}

function TaskSection({ title, tasks, onTaskClick, onTaskComplete, emptyMessage, color }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <h3 className={`text-lg font-semibold mb-2 ${color}`}>{title}</h3>
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className={`px-6 py-3 ${color}`}>
        <h3 className="text-lg font-semibold text-white">
          {title} ({tasks.length})
        </h3>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarea</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyecto</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-gray-50 transition">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    onChange={() => onTaskComplete(task.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                  />
                  <span
                    onClick={() => onTaskClick(task)}
                    className="cursor-pointer text-gray-900 font-medium hover:text-blue-600"
                  >
                    {task.title}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                  {task.project?.name || 'Sin proyecto'}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[task.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                  {statusConfig[task.status]?.label || task.status}
                </span>
              </td>
              <td className={`px-6 py-4 text-sm ${getPriorityColor(task.dueDate)}`}>
                {getDaysUntilDue(task.dueDate)}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onTaskClick(task)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

  // Listen for task updates via WebSocket and refresh
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Volver al Dashboard
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-800">📅 Gestión de Tareas</h1>
        <p className="text-gray-600">Tus tareas organizadas por fecha de vencimiento</p>
      </div>

      <div className="mb-6 flex gap-4 items-center">
        <label className="text-sm font-medium text-gray-700">Filtrar por estado:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_progreso">En Progreso</option>
          <option value="en_revision">En Revisión</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tareas...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <TaskSection
            title="🔴 Atrasadas"
            tasks={tasksData.overdue}
            onTaskClick={handleTaskClick}
            onTaskComplete={handleTaskComplete}
            emptyMessage="¡Bien! No tienes tareas atrasadas"
            color="bg-red-500"
          />

          <TaskSection
            title="🟠 Para Hoy"
            tasks={tasksData.today}
            onTaskClick={handleTaskClick}
            onTaskComplete={handleTaskComplete}
            emptyMessage="No tienes tareas para hoy"
            color="bg-orange-500"
          />

          <TaskSection
            title="🟡 Próximas (7 días)"
            tasks={tasksData.upcoming}
            onTaskClick={handleTaskClick}
            onTaskComplete={handleTaskComplete}
            emptyMessage="No tienes tareas próximas"
            color="bg-yellow-500"
          />
        </div>
      )}

      {selectedTask && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          task={selectedTask}
          projectId={selectedTask.projectId}
        />
      )}
    </div>
  );
}
