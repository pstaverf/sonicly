import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    cors: true,
    allowedHosts: true
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: '/src/main.tsx'
      }
    }
  }
})
