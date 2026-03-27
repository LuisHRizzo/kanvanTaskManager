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
import { motion } from 'framer-motion';
import { useProjectStore } from '../store';
import { usePRDStore } from '../store/prdStore';
import { useSocket } from '../hooks/useSocket';
import { useTimeTracking } from '../hooks/useTimeTracking';
import KanbanColumn from '../components/KanbanColumn';
import TaskModal from '../components/TaskModal';

const statuses = ['pendiente', 'en_progreso', 'en_revision', 'completada'];

export default function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban' | 'prds'
  const [activeId, setActiveId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState('pendiente');
  const [newTask, setNewTask] = useState({ title: '', description: '', assigneeId: '', dueDate: '' });
  const [loading, setLoading] = useState(false);

  const { currentProject, tasks, fetchProject, fetchTasks, updateTaskStatus, createTask, setTasks } = useProjectStore();
  const { projectSessions, fetchProjectSessions } = usePRDStore();
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
    fetchProjectSessions(id);
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

  const handleCreatePRD = async () => {
    try {
      const { createSession } = usePRDStore.getState();
      const prd = await createSession(id);
      navigate(`/prd/${prd.session.id}`);
    } catch (e) {
      alert("Error iniciando PRD: " + (e.response?.data?.error || e.message));
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

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-4 flex gap-6 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <button 
          onClick={() => setActiveTab('kanban')}
          className={`pb-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'kanban' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          Tablero Kanban
        </button>
        <button 
          onClick={() => setActiveTab('prds')}
          className={`pb-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'prds' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Documentos PRD
        </button>
      </div>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'kanban' ? (
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
        ) : (
          <div className="max-w-7xl mx-auto mt-2">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold text-foreground">Documentos PRD</h2>
                <p className="text-sm text-muted-foreground">Genera requerimientos de producto interactivos con Inteligencia Artificial.</p>
              </div>
              <button 
                className="bg-primary text-primary-foreground font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-primary/90 transition flex items-center gap-2" 
                onClick={handleCreatePRD}
              >
                ✨ Generar Documento
              </button>
            </div>
            {projectSessions && projectSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectSessions.map(session => {
                  const isCompleted = session.stage > 10;
                  const formattedDate = new Date(session.updatedAt || session.createdAt).toLocaleDateString('es-AR', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  });
                  return (
                    <div key={session.id} className="bg-card border border-border shadow-soft rounded-xl p-5 hover:border-primary/50 transition-colors flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-foreground truncate">
                          PRD Generado #{session.id.split('-').pop()}
                        </h3>
                        <div className={`px-2.5 py-1 text-xs font-medium rounded-full ${isCompleted ? 'bg-green-500/20 text-green-600' : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500'}`}>
                          {isCompleted ? 'Completado' : `Borrador (Fase ${session.stage})`}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm flex-1 break-words line-clamp-2">
                        {session.answers?.context || "Ningún avance guardado."}
                      </p>
                      <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Actualizado: {formattedDate}</span>
                        <Link 
                          to={`/prd/${session.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {isCompleted ? 'Ver Documento' : 'Retomar'}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 mt-4 bg-muted/20 border-2 border-dashed border-border rounded-xl">
                 <span className="text-4xl mb-4">📄</span>
                 <h3 className="text-lg font-semibold text-foreground mb-1">Aún no hay documentos PRD</h3>
                 <p className="text-muted-foreground text-sm mb-4">Inicia una sesión interactiva con el Product Manager de inteligencia artificial.</p>
                 <button className="text-primary font-medium hover:underline text-sm" onClick={handleCreatePRD}>Comenzar ahora →</button>
              </div>
            )}
          </div>
        )}
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
