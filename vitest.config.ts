import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/types/**',
        '**/*.d.ts',
        '**/mock-*.ts',
        '.next/',
      ],
    },
    include: ['**/*.{test,spec}.{js,ts,tsx}'],
    exclude: ['node_modules', '.next', 'tests/e2e/**', 'tests/smoke/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Disable CSS processing for tests
  esbuild: {
    loader: 'tsx',
  },
  // Mock CSS imports
  define: {
    'import.meta.vitest': undefined,
  },
})

