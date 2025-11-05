import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'blog-unit',
    include: ['tests/**/*.test.ts', '!tests/integration/**'],
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 5000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'gen/**',
        'dist/**',
        'node_modules/**',
        'tests/**',
        '**/*.test.ts',
        '**/*.config.ts'
      ]
    }
  }
})

