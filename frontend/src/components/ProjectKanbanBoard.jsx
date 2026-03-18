import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import api from '../lib/api';

const kanbanColumns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-100 border-gray-300' },
  { id: 'en_proceso', title: 'En Proceso', color: 'bg-blue-100 border-blue-300' },
  { id: 'esperando', title: 'Esperando', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'completados', title: 'Completados', color: 'bg-green-100 border-green-300' }
];

function DraggableProject({ project, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useDraggable({
    id: project.id,
    data: { project }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onClick && onClick(project.id)}
      className={`bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition border border-gray-200 ${
        isDragging ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <h4 className="font-medium text-gray-800">{project.name}</h4>
      {project.description && (
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
      )}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-gray-400">
          {new Date(project.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

function DroppableColumn({ column, projects, onProjectClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      className={`flex-shrink-0 w-80 ${column.color} rounded-lg border-2 p-3 ${
        isOver ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">{column.title}</h3>
        <span className="bg-white px-2 py-1 rounded text-sm text-gray-600">
          {projects.length}
        </span>
      </div>

      <div ref={setNodeRef} className="space-y-2 min-h-[200px]">
        {projects.map((project) => (
          <DraggableProject
            key={project.id}
            project={project}
            onClick={onProjectClick}
          />
        ))}
      </div>
    </div>
  );
}

export default function ProjectKanbanBoard({ onProjectClick }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

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

    // Validate that the new status is a valid kanban status
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
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📋 Tablero Kanban de Proyectos</h1>
          <p className="text-gray-600 mt-1">Arrastra los proyectos entre columnas para cambiar su estado</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="backlog">Backlog</option>
          <option value="en_proceso">En Proceso</option>
          <option value="esperando">Esperando</option>
          <option value="completados">Completados</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando proyectos...</p>
        </div>
      ) : (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanbanColumns.map((column) => (
              <DroppableColumn
                key={column.id}
                column={column}
                projects={getProjectsByStatus(column.id)}
                onProjectClick={onProjectClick}
              />
            ))}
          </div>

          <DragOverlay>
            {activeProject && (
              <div className="bg-white p-3 rounded-lg shadow-lg border-2 border-blue-500 w-80">
                <h4 className="font-medium text-gray-800">{activeProject.name}</h4>
                {activeProject.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{activeProject.description}</p>
                )}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
