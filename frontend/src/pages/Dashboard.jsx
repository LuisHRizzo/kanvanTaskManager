import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useProjectStore } from '../store';

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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Mis Proyectos
          </h1>
          <div className="flex items-center gap-4">
            <Link
              to="/settings"
              className="text-blue-600 hover:text-blue-800"
            >
              ⚙️ Configuración
            </Link>
            <Link
              to="/time-report"
              className="text-blue-600 hover:text-blue-800"
            >
              📊 Reporte de Tiempo
            </Link>
            <span className="text-gray-700">Hola, {user?.name}</span>
            <button
              onClick={() => {
                useAuthStore.getState().logout();
                navigate('/login');
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-gray-700">Proyectos</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Nuevo Proyecto
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No tienes proyectos. ¡Crea uno para comenzar!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {project.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description || 'Sin descripción'}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Propietario: {project.owner?.name}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    project.role === 'owner' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {project.role === 'owner' ? 'Propietario' : 'Miembro'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
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