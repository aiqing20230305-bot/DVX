import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'happy-dom',
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core and related libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI component libraries
          'ui-vendor': ['lucide-react'],
          // Data visualization libraries
          'chart-vendor': ['recharts'],
          // State management and utilities
          'utils-vendor': ['zustand'],
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
  },
  server: {
    port: 5176,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
