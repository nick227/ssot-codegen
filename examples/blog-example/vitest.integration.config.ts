import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'blog-integration',
    include: ['tests/integration/**/*.test.ts'],
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/integration/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Run tests sequentially to avoid DB conflicts
      },
    },
  },
})

