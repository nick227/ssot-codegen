/**
 * Test Setup
 * 
 * Runs before all tests to configure the environment
 */

import { config } from 'dotenv'

// Load environment variables
config()

// Verify required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env')
  console.error('   Tests require a MySQL database connection')
  console.error('   Example: DATABASE_URL="mysql://user:pass@localhost:3306/testdb"')
  process.exit(1)
}

console.log('✅ Test environment configured')
console.log('📦 Database:', process.env.DATABASE_URL.replace(/:\/\/.*@/, '://***:***@'))
