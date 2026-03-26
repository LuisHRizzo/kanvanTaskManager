import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import TaskCard from './TaskCard';

const columnConfig = {
  pendiente: {
    label: 'Por Hacer',
    gradient: 'from-gray-500 to-gray-600',
    bgLight: 'bg-gray-100/80',
    bgDark: 'dark:bg-gray-900/50',
    borderLight: 'border-gray-200/60',
    borderDark: 'dark:border-gray-800/60',
  },
  en_progreso: {
    label: 'En Progreso',
    gradient: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50/80',
    bgDark: 'dark:bg-blue-950/30',
    borderLight: 'border-blue-200/60',
    borderDark: 'dark:border-blue-800/60',
  },
  en_revision: {
    label: 'En Revisión',
    gradient: 'from-amber-500 to-amber-600',
    bgLight: 'bg-amber-50/80',
    bgDark: 'dark:bg-amber-950/30',
    borderLight: 'border-amber-200/60',
    borderDark: 'dark:border-amber-800/60',
  },
  completada: {
    label: 'Completada',
    gradient: 'from-emerald-500 to-emerald-600',
    bgLight: 'bg-emerald-50/80',
    bgDark: 'dark:bg-emerald-950/30',
    borderLight: 'border-emerald-200/60',
    borderDark: 'dark:border-emerald-800/60',
  },
};

export default function KanbanColumn({ status, tasks, onTaskClick, onAddTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = columnConfig[status] || columnConfig.pendiente;

  return (
    <motion.div 
      className={cn(
        'flex flex-col w-80 min-w-[20rem] rounded-2xl',
        'border backdrop-blur-sm',
        config.bgLight, config.borderLight,
        config.bgDark, config.borderDark,
        'transition-all duration-300',
        isOver && 'ring-2 ring-primary/30 bg-primary/5 dark:bg-primary/10'
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'w-2.5 h-2.5 rounded-full bg-gradient-to-r',
              config.gradient
            )} />
            <h3 className="font-semibold text-sm text-foreground">
              {config.label}
            </h3>
          </div>
          <motion.span 
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              'bg-background/80 dark:bg-background/20',
              'text-muted-foreground'
            )}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {tasks.length}
          </motion.span>
        </div>
      </div>

      {/* Tasks List */}
      <div
        ref={setNodeRef}
        className="flex-1 p-3 space-y-2.5 min-h-[12rem] overflow-y-auto scrollbar-thin"
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <TaskCard
                task={task}
                onClick={() => onTaskClick(task)}
              />
            </motion.div>
          ))}
        </SortableContext>

        {/* Add Task Button */}
        <motion.button
          onClick={() => onAddTask(status)}
          whileHover={{ scale: 1.02, backgroundColor: 'hsl(var(--muted))' }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'w-full p-3 rounded-xl',
            'border border-dashed border-border/60',
            'text-muted-foreground text-sm font-medium',
            'hover:text-foreground hover:border-primary/30',
            'transition-all duration-200',
            'flex items-center justify-center gap-2'
          )}
        >
          <span className="text-lg leading-none">+</span>
          <span>Añadir tarea</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
