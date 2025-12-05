import { config as loadEnv } from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Load .env from multiple possible locations (workspace-first)
 * This allows generated projects to share a workspace .env file
 */
function loadEnvironment() {
  const envPaths = [
    path.join(__dirname, '../../.env'),                    // Project root
    path.join(__dirname, '../../../.env'),                 // Parent (workspace root)
    path.join(__dirname, '../../../../.env'),              // Grandparent
  ]

  let envLoaded = false
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      loadEnv({ path: envPath, override: false })
      console.log(`✅ Loaded environment from: ${path.relative(process.cwd(), envPath)}`)
      envLoaded = true
      break
    }
  }

  if (!envLoaded) {
    console.warn('⚠️  No .env file found in project or workspace root')
    console.warn('💡 Create .env in workspace root or run: cp .env.example .env')
    loadEnv() // Try default locations
  }
}

// Load environment on import
loadEnvironment()

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL!,
  api: {
    prefix: process.env.API_PREFIX || '/api',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
} as const

// Validate required env vars
if (!config.databaseUrl) {
  console.error('❌ DATABASE_URL is required')
  console.error('💡 Create a .env file in workspace root with your database connection')
  throw new Error('DATABASE_URL is required')
}

export default config

