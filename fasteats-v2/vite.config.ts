import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // كل طلبات /api تُحوَّل تلقائياً إلى Backend على port 3001
      '/api': {
        target: 'https://fasteats-backend-b86v.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
