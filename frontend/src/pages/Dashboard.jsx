import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useProjectStore } from '../store';
import { useTheme } from '../contexts/ThemeContext';
import NotificationBell from '../components/NotificationBell';
import ThemeToggler from '../components/ThemeToggler';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const user = useAuthStore((state) => state.user);
  const { projects, fetchProjects, createProject } = useProjectStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const project = await createProject(newProject);
      navigate(`/project/${project.id}`);
    } catch (error) {
      alert('Error al crear proyecto');
    } finally {
      setLoading(false);
      setShowModal(false);
      setNewProject({ name: '', description: '' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.header 
        className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Mis Proyectos
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gestioná tus proyectos y tareas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggler />
            <NotificationBell />
            <Link
              to="/today"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <span>📅</span>
              <span>Para Hoy</span>
            </Link>
            <Link
              to="/time-report"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              📊 Reporte
            </Link>
            <Link
              to="/settings"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Configuración"
            >
              ⚙️
            </Link>
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground">{user?.name}</span>
            </div>
            <button
              onClick={() => {
                useAuthStore.getState().logout();
                navigate('/login');
              }}
              className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Cerrar Sesión"
            >
              🚪
            </button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <motion.div 
          className="flex justify-between items-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <h2 className="text-xl font-semibold text-foreground">Proyectos</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Accedé al <Link to="/dashboard/kanban" className="text-primary hover:underline">tablero Kanban</Link> para ver los proyectos por estado
            </p>
          </div>
          <motion.button
            onClick={() => setShowModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-soft"
          >
            <span>+</span>
            <span>Nuevo Proyecto</span>
          </motion.button>
        </motion.div>

        {projects.length === 0 ? (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center text-2xl">
              📁
            </div>
            <p className="text-muted-foreground">No tienes proyectos. ¡Crea uno para comenzar!</p>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4, boxShadow: 'var(--shadow-soft-hover)' }}
                className="group relative bg-card p-5 rounded-2xl border border-border/60 shadow-soft transition-all duration-200"
              >
                <Link to={`/project/${project.id}`}>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {project.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                    {project.description || 'Sin descripción'}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                        {project.owner?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-muted-foreground">
                        {project.owner?.name}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      project.kanbanStatus === 'completados'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : project.kanbanStatus === 'en_proceso'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : project.kanbanStatus === 'esperando'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {project.kanbanStatus === 'completados' ? '✅ Completado' :
                       project.kanbanStatus === 'en_proceso' ? '🔄 En Proceso' :
                       project.kanbanStatus === 'esperando' ? '⏳ Esperando' : '📋 Backlog'}
                    </span>
                  </div>
                </Link>
                <motion.button
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm(`¿Eliminar el proyecto "${project.name}"?`)) {
                      useProjectStore.getState().deleteProject(project.id);
                    }
                  }}
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-3 right-3 p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar proyecto"
                >
                  🗑️
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nuevo Proyecto</h2>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
    </div>
  );
}