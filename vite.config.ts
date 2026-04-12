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
          // v2.31.0 Phase 2: Optimized code splitting strategy
          // React core (high priority, loaded first)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI icons (medium priority, frequently used)
          'ui-icons': ['lucide-react'],
          // Charts (lazy loaded, only for specific pages)
          'charts-vendor': ['recharts'],
          // Office libraries (lazy loaded, only when exporting)
          'office-vendor': ['xlsx', 'jspdf', 'pdf-parse'],
          // State management (high priority, app-wide)
          'state-vendor': ['zustand'],
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
