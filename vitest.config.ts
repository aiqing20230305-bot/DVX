import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    // v2.30.0: Configure test isolation
    // Run server tests sequentially to avoid database conflicts
    fileParallelism: false,
    // Isolate each test file
    isolate: true,
    // v2.30.0 Phase 3: Coverage reporting
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['server/**/*.ts', 'src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'server/**/__tests__/**',
        'src/**/__tests__/**',
        'src/test/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/types.ts',
        '**/*.d.ts',
      ],
      all: true,
      lines: 60,
      functions: 60,
      branches: 60,
      statements: 60,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
