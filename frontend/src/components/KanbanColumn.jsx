import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

const statusConfig = {
  pendiente: { label: 'Por Hacer', color: 'bg-gray-100' },
  en_progreso: { label: 'En Progreso', color: 'bg-blue-100' },
  en_revision: { label: 'En Revisión', color: 'bg-yellow-100' },
  completada: { label: 'Completada', color: 'bg-green-100' }
};

export default function KanbanColumn({ status, tasks, onTaskClick, onAddTask }) {
  const { setNodeRef } = useDroppable({ id: status });
  const config = statusConfig[status] || { label: status, color: 'bg-gray-100' };

  return (
    <div className="flex flex-col w-72">
      <div className={`p-3 rounded-t-lg ${config.color}`}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">{config.label}</h3>
          <span className="text-sm text-gray-500">{tasks.length}</span>
        </div>
      </div>
      
      <div
        ref={setNodeRef}
        className="flex-1 bg-gray-50 p-2 rounded-b-lg min-h-[200px]"
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))}
          </div>
        </SortableContext>
        
        <button
          onClick={() => onAddTask(status)}
          className="w-full mt-2 p-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg border border-dashed border-gray-300"
        >
          + Añadir tarea
        </button>
      </div>
    </div>
  );
}