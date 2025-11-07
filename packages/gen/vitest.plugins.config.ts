/**
 * Vitest Configuration for Plugin Tests
 */

import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    name: 'plugins',
    include: ['src/plugins/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.e2e.test.ts' // E2E tests excluded by default
    ],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/plugins/**/*.plugin.ts'],
      exclude: [
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.interface.ts',
        '**/index.ts'
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70
      }
    },
    // Timeout for slow generation tests
    testTimeout: 10000,
    // Run tests in parallel
    threads: true,
    // Show detailed output
    reporters: ['verbose'],
    // Retry flaky tests once
    retry: 1
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})

