import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function TaskCard({ task, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (e) => {
    if (!isDragging) {
      onClick?.(task);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-grab hover:shadow-md transition ${
        isDragging ? 'opacity-50 cursor-grabbing' : ''
      }`}
    >
      <div {...attributes} {...listeners}>
        <h4 
          className="font-medium text-gray-900 text-sm mb-2"
          onClick={handleClick}
        >
          {task.title}
        </h4>
      </div>
      
      {task.assignees && task.assignees.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <div className="flex -space-x-2">
            {task.assignees.slice(0, 3).map((assignee, idx) => (
              <div 
                key={assignee.id || idx}
                className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs border-2 border-white cursor-pointer"
                onClick={handleClick}
                title={assignee.name}
              >
                {assignee.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs border-2 border-white">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
          <span className="ml-1 cursor-pointer" onClick={handleClick}>
            {task.assignees.map(a => a.name).join(', ')}
          </span>
        </div>
      )}
      
      {task.assignee && !task.assignees && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <div 
            className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs cursor-pointer"
            onClick={handleClick}
          >
            {task.assignee.name.charAt(0)}
          </div>
          <span 
            className="cursor-pointer"
            onClick={handleClick}
          >
            {task.assignee.name}
          </span>
        </div>
      )}
      
      {task.dueDate && (
        <div 
          className="text-xs text-gray-500 cursor-pointer"
          onClick={handleClick}
        >
          📅 {new Date(task.dueDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}