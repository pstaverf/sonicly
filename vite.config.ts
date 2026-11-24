import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import ssg from 'vite-plugin-ssg'

export default defineConfig({
  plugins: [
    react(),
    ssg({
      script: 'async',
      formatting: 'minify',
      mock: false,
      entry: '/src/main.tsx',
      routes: ['/', '/search', '/library', '/album/:id', '/playlist/:id', '/artist/:id', '/track/:id', '/login'],
      dir: 'dist',
      onFinished() {
        console.log('SSG build finished')
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    cors: true
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
