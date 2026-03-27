import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, useDraggable, useDroppable, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { useAuthStore, useProjectStore } from '../store';
import { usePRDStore } from '../store/prdStore';
import { useTheme } from '../contexts/ThemeContext';
import NotificationBell from '../components/NotificationBell';
import ThemeToggler from '../components/ThemeToggler';
import ProjectModal from '../components/ProjectModal';
import api from '../lib/api';

const kanbanColumns = [
  { id: 'backlog', title: 'Backlog', gradient: 'from-gray-500 to-gray-600' },
  { id: 'en_proceso', title: 'En Proceso', gradient: 'from-blue-500 to-blue-600' },
  { id: 'esperando', title: 'Esperando', gradient: 'from-yellow-500 to-yellow-600' },
  { id: 'completados', title: 'Completados', gradient: 'from-green-500 to-green-600' }
];

const colorMap = {
  default: { bg: 'bg-card', accent: 'bg-blue-500', border: 'hover:border-blue-400 dark:hover:border-blue-500' },
  red: { bg: 'bg-red-50 dark:bg-red-950/70', accent: 'bg-red-500', border: 'hover:border-red-400 dark:hover:border-red-600' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/70', accent: 'bg-orange-500', border: 'hover:border-orange-400 dark:hover:border-orange-600' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-950/70', accent: 'bg-yellow-500', border: 'hover:border-yellow-400 dark:hover:border-yellow-600' },
  green: { bg: 'bg-green-50 dark:bg-green-950/70', accent: 'bg-green-500', border: 'hover:border-green-400 dark:hover:border-green-600' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/70', accent: 'bg-blue-500', border: 'hover:border-blue-400 dark:hover:border-blue-600' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/70', accent: 'bg-purple-500', border: 'hover:border-purple-400 dark:hover:border-purple-600' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-950/70', accent: 'bg-pink-500', border: 'hover:border-pink-400 dark:hover:border-pink-600' },
};

function DraggableProject({ project, onClick, onEdit, onDelete, onCreatePRD }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useDraggable({
    id: project.id,
    data: { project }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const colors = colorMap[project.color || 'default'] || colorMap.default;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        y: isDragging ? -5 : 0,
        scale: isDragging ? 1.02 : 1,
      }}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-soft-hover)' }}
      className={`
        group relative p-4 rounded-xl border shadow-soft cursor-grab active:cursor-grabbing
        transition-all duration-200 ease-out overflow-hidden
        ${colors.bg} ${colors.border} border-border/60
        ${isDragging ? 'ring-2 ring-primary/20 shadow-glow dark:shadow-glow-dark' : ''}
      `}
      onClick={(e) => {
        if (!isDragging && onClick) onClick(project.id);
      }}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 opacity-60 group-hover:opacity-100 transition-opacity ${colors.accent}`} />
      
      <div className="pl-1 relative">
        <h4 className="font-semibold text-foreground mb-2 pr-12 line-clamp-1">{project.name}</h4>
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {project.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border/40">
          <span>{new Date(project.createdAt).toLocaleDateString('es-AR')}</span>
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium" title={project.owner?.name}>
            {project.owner?.name?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Action Buttons */}
        <div 
          className="absolute top-0 right-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag conflict
        >
          <button
            onClick={(e) => { e.stopPropagation(); onCreatePRD(project); }}
            className="p-1.5 text-muted-foreground hover:text-green-500 transition-base"
            title="Crear PRD con IA"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.82 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.496 1.508 1.333 1.508 2.316V18" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(project); }}
            className="p-1.5 text-muted-foreground hover:text-primary transition-base"
            title="Editar proyecto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(project); }}
            className="p-1.5 text-muted-foreground hover:text-destructive transition-base"
            title="Eliminar proyecto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a2.25 2.25 0 00-2.244-2.077L4.772 5.79m-4.788 0L3.253 5.79" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function DroppableColumn({ column, projects, onProjectClick, onEdit, onDelete, onCreatePRD }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <motion.div
      className={`
        flex-shrink-0 w-80 min-w-[20rem] rounded-2xl
        border backdrop-blur-sm
        bg-gray-50/80 dark:bg-gray-950/50
        border-gray-200/60 dark:border-gray-800/60
        transition-all duration-300 flex flex-col max-h-[calc(100vh-12rem)]
        ${isOver ? 'ring-2 ring-primary/30 bg-primary/5 dark:bg-primary/10' : ''}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-background/50 rounded-t-2xl">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${column.gradient}`} />
            <h3 className="font-semibold text-sm text-foreground">
              {column.title}
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-background/80 dark:bg-background/20 text-muted-foreground shadow-sm">
            {projects.length}
          </span>
        </div>
      </div>

      {/* Projects List */}
      <div 
        ref={setNodeRef} 
        className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-thin min-h-[12rem]"
      >
        {projects.map((project) => (
          <DraggableProject
            key={project.id}
            project={project}
            onClick={onProjectClick}
            onEdit={onEdit}
            onDelete={onDelete}
            onCreatePRD={onCreatePRD}
          />
        ))}
        {projects.length === 0 && (
          <div className="h-24 border-2 border-dashed border-border/50 rounded-xl flex items-center justify-center text-sm text-muted-foreground/50">
            Arrastra aquí
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  
  const user = useAuthStore((state) => state.user);
  const { projects, fetchProjects, deleteProject } = useProjectStore();
  const navigate = useNavigate();

  const [activeProject, setActiveProject] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    fetchProjects();
  }, []);

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
        useProjectStore.setState({
          projects: projects.map(p => (p.id === projectId ? { ...p, kanbanStatus: newStatus } : p))
        });
      } catch (error) {
        console.error('Error updating kanban status:', error);
        fetchProjects(); // revert filter status
      }
    }
  };

  const getProjectsByStatus = (status) => {
    return projects.filter(p => p.kanbanStatus === status);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setShowModal(true);
  };

  const handleDelete = (project) => {
    if (confirm(`¿Eliminar el proyecto "${project.name}"?`)) {
      deleteProject(project.id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProject(null);
  };

  const handleCreatePRD = async (project) => {
    try {
      const { createSession } = usePRDStore.getState();
      const prd = await createSession(project.id);
      navigate(`/prd/${prd.session.id}`);
    } catch (e) {
      alert("Error iniciando PRD: " + (e.response?.data?.error || e.message));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <motion.header 
        className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Mis Proyectos
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gestioná tus proyectos en el tablero
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggler />
            <NotificationBell />
            <Link
              to="/today"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-base"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span>Para Hoy</span>
            </Link>
            <Link
              to="/time-report"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-base"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Reporte</span>
            </Link>
            <Link
              to="/settings"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-base"
              title="Configuración"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground">{user?.name}</span>
            </div>
            <button
              onClick={() => {
                useAuthStore.getState().logout();
                navigate('/login');
              }}
              className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-base"
              title="Cerrar Sesión"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>
        </div>
      </motion.header>

      <main className="flex-1 flex flex-col p-6 overflow-hidden">
        <motion.div 
          className="flex justify-between items-center mb-6 shrink-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <h2 className="text-lg font-semibold text-foreground">Tablero de Control</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Arrastra los proyectos para cambiar su estado.
            </p>
          </div>
          <motion.button
            onClick={() => { setEditingProject(null); setShowModal(true); }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-base font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Nuevo Proyecto</span>
          </motion.button>
        </motion.div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin pb-4">
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-6 h-full items-start px-2">
              {kanbanColumns.map((column) => (
                <DroppableColumn
                  key={column.id}
                  column={column}
                  projects={getProjectsByStatus(column.id)}
                  onProjectClick={(id) => navigate(`/project/${id}`)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCreatePRD={handleCreatePRD}
                />
              ))}
            </div>
          </DndContext>
        </div>

        <DragOverlay>
          {activeProject && (
            <div className={`
              w-80 p-4 rounded-xl shadow-xl border bg-card/90 backdrop-blur scale-105
              ${colorMap[activeProject.color || 'default']?.border || 'border-border/60'}
            `}>
              <h4 className="font-semibold text-foreground mb-2">{activeProject.name}</h4>
              {activeProject.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{activeProject.description}</p>
              )}
            </div>
          )}
        </DragOverlay>
      </main>

      {showModal && (
        <ProjectModal 
          project={editingProject} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
}