// @generated
// Vitest configuration for hooks tests

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./gen/sdk/react/__tests__/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['gen/sdk/react/models/**/*.ts'],
      exclude: ['**/*.test.ts', '**/__tests__/**']
    }
  },
  resolve: {
    alias: {
      '@gen': path.resolve(__dirname, './gen'),
      '@': path.resolve(__dirname, './src')
    }
  }
})
