import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // AGREGADO: Lista de dominios permitidos
    allowedHosts: [
      'taskmanager.163.176.208.127.sslip.io'
    ],
    watch: {
      usePolling: true
    }
  }
});
