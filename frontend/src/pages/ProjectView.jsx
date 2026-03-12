import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useProjectStore } from '../store';
import { useSocket } from '../hooks/useSocket';
import { useTimeTracking } from '../hooks/useTimeTracking';
import KanbanColumn from '../components/KanbanColumn';
import TaskModal from '../components/TaskModal';
import Timer from '../components/Timer';

const statuses = ['pendiente', 'en_progreso', 'en_revision', 'completada'];

export default function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState('pendiente');
  const [newTask, setNewTask] = useState({ title: '', description: '', assigneeId: '', dueDate: '' });
  const [loading, setLoading] = useState(false);

  const { currentProject, tasks, fetchProject, fetchTasks, updateTaskStatus, createTask, setTasks } = useProjectStore();
  useSocket(id);
  const { activeEntry, elapsedTime, loading: timerLoading, startTimer, stopTimer, formatTime } = useTimeTracking();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchProject(id);
    fetchTasks(id);
  }, [id]);

  const tasksByStatus = statuses.reduce((acc, status) => {
    acc[status] = tasks.filter(t => t.status === status).sort((a, b) => a.order - b.order);
    return acc;
  }, {});

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id;
    const task = tasks.find(t => t.id === taskId);
    
    let newStatus;
    let newOrder;

    if (statuses.includes(over.id)) {
      newStatus = over.id;
      const tasksInColumn = tasksByStatus[newStatus];
      newOrder = tasksInColumn.length;
    } else {
      const overTask = tasks.find(t => t.id === over.id);
      newStatus = overTask.status;
      newOrder = overTask.order;
    }

    if (task.status !== newStatus || task.order !== newOrder) {
      const oldTasks = [...tasks];
      const updatedTasks = tasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus, order: newOrder } : t
      );
      setTasks(updatedTasks);

      try {
        await updateTaskStatus(taskId, newStatus, newOrder);
      } catch (error) {
        setTasks(oldTasks);
      }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createTask(id, {
        ...newTask,
        assigneeId: newTask.assigneeId || null,
        dueDate: newTask.dueDate || null
      });
      setShowCreateModal(false);
      setNewTask({ title: '', description: '', assigneeId: '', dueDate: '' });
    } catch (error) {
      alert('Error al crear tarea');
    } finally {
      setLoading(false);
    }
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  if (!currentProject) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
              ← Volver
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentProject.name}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {statuses.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status]}
                onTaskClick={setSelectedTask}
                onAddTask={(status) => {
                  setNewTaskStatus(status);
                  setShowCreateModal(true);
                }}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="bg-white p-3 rounded-lg shadow-lg border border-blue-500 w-72">
                <h4 className="font-medium text-gray-900 text-sm">{activeTask.title}</h4>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nueva Tarea</h2>
            <form onSubmit={handleCreateTask}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}