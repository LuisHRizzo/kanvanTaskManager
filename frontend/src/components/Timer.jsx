export default function Timer({ taskId, activeEntry, elapsedTime, loading, onStart, onStop, formatTime }) {
  const isActive = activeEntry?.taskId === taskId;
  
  return (
    <div className="flex items-center gap-2">
      {isActive ? (
        <div className="flex items-center gap-2">
          <span className="text-lg font-mono text-green-600 font-bold">
            {formatTime(elapsedTime)}
          </span>
          <button
            onClick={() => onStop(taskId)}
            disabled={loading}
            className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50"
          >
            ⏹ Stop
          </button>
        </div>
      ) : (
        <button
          onClick={() => onStart(taskId)}
          disabled={loading}
          className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 disabled:opacity-50"
        >
          ▶ Start
        </button>
      )}
    </div>
  );
}