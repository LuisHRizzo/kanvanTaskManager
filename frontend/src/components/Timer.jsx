import { motion } from 'framer-motion';

export default function Timer({ taskId, activeEntry, elapsedTime, loading, onStart, onStop, formatTime }) {
  const isActive = activeEntry?.taskId === taskId;

  return (
    <div className="flex items-center gap-3">
      {isActive ? (
        <>
          <motion.div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {formatTime(elapsedTime)}
            </span>
          </motion.div>
          <motion.button
            onClick={() => onStop(taskId)}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-base disabled:opacity-50 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
            </svg>
            <span>Detener</span>
          </motion.button>
        </>
      ) : (
        <motion.button
          onClick={() => onStart(taskId)}
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-base disabled:opacity-50 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>Iniciar</span>
        </motion.button>
      )}
    </div>
  );
}
