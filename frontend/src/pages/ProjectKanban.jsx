import { useNavigate } from 'react-router-dom';
import ProjectKanbanBoard from '../components/ProjectKanbanBoard';
import NotificationBell from '../components/NotificationBell';
import { useAuthStore } from '../store';
import { Link } from 'react-router-dom';

export default function ProjectKanban() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
          <div>
            <Link to="/dashboard" className="text-blue-600 hover:underline">← Volver al Dashboard</Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Tablero Kanban de Proyectos</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="text-gray-700">Hola, {user?.name}</span>
          </div>
        </div>
      </header>

      <main>
        <ProjectKanbanBoard onProjectClick={handleProjectClick} />
      </main>
    </div>
  );
}
