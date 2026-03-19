import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import api from '../lib/api';

const kanbanColumns = [
  { id: 'backlog', title: 'Backlog', gradient: 'from-gray-500 to-gray-600' },
  { id: 'en_proceso', title: 'En Proceso', gradient: 'from-blue-500 to-blue-600' },
  { id: 'esperando', title: 'Esperando', gradient: 'from-yellow-500 to-yellow-600' },
  { id: 'completados', title: 'Completados', gradient: 'from-green-500 to-green-600' }
];

function DraggableProject({ project, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useDraggable({
    id: project.id,
    data: { project }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onClick && onClick(project.id)}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-soft-hover)' }}
      whileTap={{ scale: 0.98 }}
      className={`
        group relative p-4 rounded-xl border shadow-soft cursor-pointer
        bg-card dark:bg-card border-border/60
        hover:border-primary/50 dark:hover:border-primary/30
        transition-all duration-200
        ${isDragging ? 'opacity-50 ring-2 ring-primary/20' : ''}
      `}
    >
      <h4 className="font-semibold text-foreground mb-2">{project.name}</h4>
      {project.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {project.description}
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{new Date(project.createdAt).toLocaleDateString('es-AR')}</span>
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
          {project.owner?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </motion.div>
  );
}

function DroppableColumn({ column, projects, onProjectClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <motion.div
      className={`
        flex-shrink-0 w-80 min-w-[20rem] rounded-2xl
        border backdrop-blur-sm
        bg-gray-50/80 dark:bg-gray-950/50
        border-gray-200/60 dark:border-gray-800/60
        transition-all duration-300
        ${isOver ? 'ring-2 ring-primary/30 bg-primary/5 dark:bg-primary/10' : ''}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${column.gradient}`} />
            <h3 className="font-semibold text-sm text-foreground">
              {column.title}
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-background/80 dark:bg-background/20 text-muted-foreground">
            {projects.length}
          </span>
        </div>
      </div>

      {/* Projects List */}
      <div ref={setNodeRef} className="p-3 space-y-2.5 min-h-[12rem] overflow-y-auto scrollbar-thin">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <DraggableProject
              project={project}
              onClick={onProjectClick}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function ProjectKanbanBoard({ onProjectClick }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await api.get('/projects/kanban', { params });
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter]);

  const handleDragStart = (event) => {
    const project = projects.find(p => p.id === event.active.id);
    setActiveProject(project);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveProject(null);

    if (!over) return;

    const newStatus = over.id;
    const projectId = active.id;

    if (!['backlog', 'en_proceso', 'esperando', 'completados'].includes(newStatus)) {
      return;
    }

    const currentProject = projects.find(p => p.id === projectId);
    if (!currentProject) return;

    if (newStatus !== currentProject.kanbanStatus) {
      try {
        await api.patch(`/projects/${projectId}/kanban-status`, { kanbanStatus: newStatus });
        setProjects(prev =>
          prev.map(p => (p.id === projectId ? { ...p, kanbanStatus: newStatus } : p))
        );
      } catch (error) {
        console.error('Error updating kanban status:', error);
      }
    }
  };

  const getProjectsByStatus = (status) => {
    return projects.filter(p => p.kanbanStatus === status);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header 
        className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="flex items-center gap-4 mb-2">
            <Link to="/dashboard" className="text-primary hover:underline text-sm font-medium">
              ← Volver al Dashboard
            </Link>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tablero Kanban de Proyectos</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Arrastrá los proyectos entre columnas para cambiar su estado
              </p>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todos los estados</option>
              <option value="backlog">Backlog</option>
              <option value="en_proceso">En Proceso</option>
              <option value="esperando">Esperando</option>
              <option value="completados">Completados</option>
            </select>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando proyectos...</p>
          </div>
        ) : (
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
              {kanbanColumns.map((column) => (
                <DroppableColumn
                  key={column.id}
                  column={column}
                  projects={getProjectsByStatus(column.id)}
                  onProjectClick={(id) => navigate(`/project/${id}`)}
                />
              ))}
            </div>
          </DndContext>
        )}

        <DragOverlay>
          {activeProject && (
            <div className="w-80 p-4 rounded-xl bg-card border border-border shadow-soft">
              <h4 className="font-semibold text-foreground mb-2">{activeProject.name}</h4>
              {activeProject.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{activeProject.description}</p>
              )}
            </div>
          )}
        </DragOverlay>
      </main>
    </div>
  );
}
