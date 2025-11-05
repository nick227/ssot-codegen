import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000, // 30s for integration tests
    hookTimeout: 10000,
    teardownTimeout: 10000,
  },
  resolve: {
    alias: {
      '@gen': path.resolve(__dirname, './gen'),
      '@': path.resolve(__dirname, './src'),
    },
  },
})
