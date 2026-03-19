import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

export default function ThemeToggler() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <motion.div
          initial={false}
          animate={{
            rotate: theme === 'dark' ? 180 : 0,
            opacity: theme === 'dark' ? 0 : 1,
            scale: theme === 'dark' ? 0.5 : 1,
          }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0"
        >
          <Sun className="w-5 h-5 text-amber-500" strokeWidth={2} />
        </motion.div>
        <motion.div
          initial={false}
          animate={{
            rotate: theme === 'dark' ? 180 : 0,
            opacity: theme === 'dark' ? 1 : 0,
            scale: theme === 'dark' ? 1 : 0.5,
          }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0"
        >
          <Moon className="w-5 h-5 text-blue-400" strokeWidth={2} />
        </motion.div>
      </div>
    </motion.button>
  );
}
