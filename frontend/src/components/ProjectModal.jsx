import { useState } from 'react';
import { motion } from 'framer-motion';
import { useProjectStore } from '../store';
import { useNavigate } from 'react-router-dom';

const colorMap = {
  default: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-300 dark:border-gray-600' },
  red: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700' },
  green: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-700 dark:text-green-300', border: 'border-green-300 dark:border-green-700' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/50', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-300 dark:border-pink-700' },
};

export default function ProjectModal({ project, onClose }) {
  const isEditing = !!project;
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    color: project?.color || 'default',
  });
  const [loading, setLoading] = useState(false);

  const { createProject, updateProject } = useProjectStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await updateProject(project.id, {
          name: form.name,
          description: form.description,
          color: form.color,
        });
        onClose();
      } else {
        const newProject = await createProject({
          name: form.name,
          description: form.description,
          color: form.color,
        });
        onClose();
        navigate(`/project/${newProject.id}`);
      }
    } catch (error) {
      alert(isEditing ? 'Error al actualizar proyecto' : 'Error al crear proyecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div 
        className="bg-card rounded-2xl w-full max-w-md border border-border/60 shadow-soft"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 w-full border-b border-border pb-2">
            {isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                Nombre
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-base"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                Descripción
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-base resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      form.color === c ? 'border-foreground scale-110' : 'border-border hover:scale-105'
                    } ${colorMap[c]?.bg || 'bg-gray-100'}`}
                    title={c.charAt(0).toUpperCase() + c.slice(1)}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted transition-base font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-base"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
