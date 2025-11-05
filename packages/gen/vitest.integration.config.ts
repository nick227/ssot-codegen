import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'gen-integration',
    include: ['src/__tests__/integration/**/*.test.ts'],
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/integration/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 15000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Run sequentially to avoid file system conflicts
      },
    },
  },
})

