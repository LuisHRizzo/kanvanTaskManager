import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

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

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return { text: 'Sin fecha', color: 'text-muted-foreground' };
    const today = new Date();
    const due = new Date(dueDate + 'T00:00:00');
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Venció hace ${Math.abs(diffDays)}d`, color: 'text-destructive font-medium' };
    if (diffDays === 0) return { text: 'Vence hoy', color: 'text-orange-500 font-medium' };
    if (diffDays === 1) return { text: 'Vence mañana', color: 'text-orange-500' };
    if (diffDays <= 7) return { text: `${diffDays}d`, color: 'text-muted-foreground' };
    return { text: new Date(dueDate + 'T00:00:00').toLocaleDateString('es-AR', { month: 'short', day: 'numeric' }), color: 'text-muted-foreground' };
  };

  const dueDateStatus = getDueDateStatus(task.dueDate);

  // Color mapping for background and accent
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

  const colors = colorMap[task.color || 'default'];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        y: isDragging ? -5 : 0,
        scale: isDragging ? 1.02 : 1,
      }}
      whileHover={{
        y: -2,
        boxShadow: 'var(--shadow-soft-hover)',
      }}
      className={cn(
        'group relative p-3.5 rounded-xl border shadow-soft cursor-grab active:cursor-grabbing',
        'transition-all duration-200 ease-out',
        'dark:shadow-none',
        colors.bg,
        colors.border,
        isDragging && 'ring-2 ring-primary/20 shadow-glow dark:shadow-glow-dark'
      )}
      onClick={() => !isDragging && onClick?.(task)}
    >
      {/* Color accent border */}
      <div className={cn(
        'absolute left-0 top-3.5 bottom-3.5 w-1 rounded-r-full opacity-60 group-hover:opacity-100 transition-opacity',
        colors.accent
      )} />

      <div className="pl-2">
        {/* Title */}
        <h4 className="font-medium text-sm text-foreground leading-snug mb-2 line-clamp-2">
          {task.title}
        </h4>

        {/* Metadata */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Assignee or Date */}
          <div className="flex items-center gap-1.5 min-w-0">
            {task.assignee ? (
              <motion.div
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium shrink-0">
                  {task.assignee.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate max-w-[100px] hidden sm:inline">
                  {task.assignee.name.split(' ')[0]}
                </span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <span>Sin asignar</span>
              </div>
            )}
          </div>

          {/* Right: Due Date */}
          {task.dueDate && (
            <motion.div
              className={cn(
                'flex items-center gap-1 text-xs shrink-0',
                dueDateStatus.color
              )}
              whileHover={{ scale: 1.05 }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span className="font-medium">{dueDateStatus.text}</span>
            </motion.div>
          )}
        </div>

        {/* Bottom: Additional info */}
        {(task.description || task.status === 'en_progreso') && (
          <div className="mt-2.5 pt-2.5 border-t border-border/50 flex items-center justify-between">
            {task.description && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                <span className="truncate max-w-[150px] line-clamp-1">{task.description}</span>
              </div>
            )}
            {task.status === 'en_progreso' && (
              <div className="flex items-center gap-1 text-xs text-blue-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>En progreso</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
