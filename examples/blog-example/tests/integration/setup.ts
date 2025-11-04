import { config } from 'dotenv'
import { beforeAll, afterAll } from 'vitest'

// Load environment variables
config()

// Ensure test environment
if (process.env.NODE_ENV !== 'test') {
  process.env.NODE_ENV = 'test'
}

// Global setup
beforeAll(async () => {
  console.log('🧪 Setting up integration test environment...')
  // You can add global setup here (e.g., test database setup)
})

// Global teardown
afterAll(async () => {
  console.log('🧹 Cleaning up integration test environment...')
  // You can add global cleanup here
})

