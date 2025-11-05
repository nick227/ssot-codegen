/**
 * Global Test Setup
 * Runs before all tests
 */

import { config } from 'dotenv'
import { beforeAll, afterAll } from 'vitest'
import { getTestPrisma, disconnectDatabase } from './helpers/db-helper.js'

// Load test environment variables
config({ path: '.env.test' })

// Force test environment
process.env.NODE_ENV = 'test'

// Disable console logs in tests (optional)
if (process.env.SILENT_TESTS === 'true') {
  console.log = () => {}
  console.info = () => {}
  console.debug = () => {}
}

// Global setup
beforeAll(async () => {
  const prisma = getTestPrisma()
  
  // Verify database connection
  try {
    await prisma.$connect()
  } catch (error) {
    console.error('Failed to connect to test database:', error)
    throw error
  }
})

// Global teardown
afterAll(async () => {
  const prisma = getTestPrisma()
  await disconnectDatabase(prisma)
})

