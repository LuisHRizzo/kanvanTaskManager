import { useState, useEffect } from 'react';
import api from '../lib/api';
import TaskModal from '../components/TaskModal';

const statusConfig = {
  pendiente: { label: 'Pendiente', color: 'bg-gray-100 text-gray-700' },
  en_progreso: { label: 'En Progreso', color: 'bg-blue-100 text-blue-700' },
  en_revision: { label: 'En Revisión', color: 'bg-yellow-100 text-yellow-700' },
  completada: { label: 'Completada', color: 'bg-green-100 text-green-700' }
};

export default function TodayView() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTodayTasks = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await api.get('/tasks/today', { params });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching today tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayTasks();
  }, [statusFilter]);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleTaskComplete = async (taskId) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: 'completada' });
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
    fetchTodayTasks();
  };

  const getPriorityColor = (dueDate) => {
    if (!dueDate) return 'text-gray-500';
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600 font-semibold';
    if (diffDays === 0) return 'text-orange-600 font-semibold';
    if (diffDays <= 2) return 'text-yellow-600';
    return 'text-gray-500';
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return '';
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Venció hace ${Math.abs(diffDays)} días`;
    if (diffDays === 0) return 'Vence hoy';
    if (diffDays === 1) return 'Vence mañana';
    return `Vence en ${diffDays} días`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📅 Para Hoy</h1>
        <p className="text-gray-600">Tus tareas asignadas con fecha de vencimiento hoy o anterior</p>
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
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-4 text-gray-600">No hay tareas para hoy</p>
          <p className="text-sm text-gray-500 mt-2">¡Disfruta tu día o ponete al día con tus tareas!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                        onChange={() => handleTaskComplete(task.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                      />
                      <span
                        onClick={() => handleTaskClick(task)}
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
                      onClick={() => handleTaskClick(task)}
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
