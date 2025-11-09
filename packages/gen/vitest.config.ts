import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/pipeline': path.resolve(__dirname, 'src/pipeline'),
      '@/generators': path.resolve(__dirname, 'src/generators'),
      '@/analyzers': path.resolve(__dirname, 'src/analyzers'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/plugins': path.resolve(__dirname, 'src/plugins'),
      '@/templates': path.resolve(__dirname, 'src/templates'),
      '@/database': path.resolve(__dirname, 'src/database'),
      '@/api': path.resolve(__dirname, 'src/api'),
      '@/cache': path.resolve(__dirname, 'src/cache'),
      '@/validation': path.resolve(__dirname, 'src/validation'),
      '@/builders': path.resolve(__dirname, 'src/builders')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/generators/**/*.test.ts'],
    exclude: ['src/__tests__/integration/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/index.ts',
        'src/__tests__/**'
      ]
    }
  }
})

