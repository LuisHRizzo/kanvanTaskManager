import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { motion } from 'framer-motion';
import { useProjectStore } from '../store';
import { useSocket } from '../hooks/useSocket';
import { useTimeTracking } from '../hooks/useTimeTracking';
import KanbanColumn from '../components/KanbanColumn';
import TaskModal from '../components/TaskModal';

const statuses = ['pendiente', 'en_progreso', 'en_revision', 'completada'];

export default function ProjectView() {
  const { id } = useParams();
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <motion.header 
        className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard" 
              className="text-primary hover:underline text-sm font-medium"
            >
              ← Volver
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {currentProject.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {currentProject.description || 'Sin descripción'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeEntry && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                <span>⏱️</span>
                <span>{formatTime(elapsedTime)}</span>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {statuses.map((status, index) => (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <KanbanColumn
                  status={status}
                  tasks={tasksByStatus[status]}
                  onTaskClick={setSelectedTask}
                  onAddTask={(status) => {
                    setNewTaskStatus(status);
                    setShowCreateModal(true);
                  }}
                />
              </motion.div>
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="bg-card p-3.5 rounded-xl border border-border shadow-soft w-72">
                <h4 className="font-medium text-foreground text-sm mb-2">{activeTask.title}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>📋</span>
                  <span>{activeTask.status.replace('_', ' ')}</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Create Task Modal - Modern Design */}
      {showCreateModal && (
        <motion.div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="bg-card rounded-2xl p-6 w-full max-w-md border border-border/60 shadow-soft"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
          >
            <h2 className="text-xl font-bold text-foreground mb-4">Nueva Tarea</h2>
            <form onSubmit={handleCreateTask}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-1">Título</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-1">Descripción</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-1">Fecha límite</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
