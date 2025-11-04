#!/usr/bin/env node
/**
 * Database Setup Script
 * 
 * Ensures database exists before running Prisma migrations.
 * Supports both DATABASE_URL and component-based configuration.
 */

import { config } from 'dotenv'
import { createConnection } from 'mysql2/promise'
import pg from 'pg'
const { Client } = pg

// Load environment variables
config()

/**
 * Parse DATABASE_URL into components
 */
function parseDatabaseUrl(url) {
  try {
    const parsed = new URL(url)
    const provider = parsed.protocol.replace(':', '')
    
    return {
      provider: provider === 'postgres' ? 'postgresql' : provider,
      host: parsed.hostname || 'localhost',
      port: parsed.port ? parseInt(parsed.port) : undefined,
      user: parsed.username || undefined,
      password: parsed.password || undefined,
      database: parsed.pathname.slice(1).split('?')[0],
    }
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL: ${error.message}`)
  }
}

/**
 * Load database configuration from environment
 */
function loadDatabaseConfig() {
  // Option 1: Full DATABASE_URL
  if (process.env.DATABASE_URL) {
    console.log('📊 Using DATABASE_URL from environment')
    return parseDatabaseUrl(process.env.DATABASE_URL)
  }

  // Option 2: Component-based configuration
  const provider = process.env.DB_PROVIDER || 'mysql'
  const database = process.env.DB_NAME || 'ssot_demo'

  console.log('📊 Using component-based database configuration')
  console.log(`   Provider: ${provider}`)
  console.log(`   Database: ${database}`)

  return {
    provider,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER || (provider === 'postgresql' ? 'postgres' : 'root'),
    password: process.env.DB_PASSWORD || '',
    database,
  }
}

/**
 * Build DATABASE_URL from components
 */
function buildDatabaseUrl(config) {
  const {
    provider,
    host = 'localhost',
    port,
    user,
    password = '',
    database,
  } = config

  // Determine default ports
  const defaultPort = provider === 'postgresql' ? 5432 : 3306
  const actualPort = port || defaultPort

  // Build auth string
  const auth = password ? `${user}:${password}` : user

  // Build URL based on provider
  if (provider === 'postgresql') {
    return `postgresql://${auth}@${host}:${actualPort}/${database}?schema=public`
  } else if (provider === 'mysql') {
    return `mysql://${auth}@${host}:${actualPort}/${database}`
  } else if (provider === 'sqlite') {
    return `file:./${database}.db`
  }

  throw new Error(`Unsupported database provider: ${provider}`)
}

/**
 * Check if PostgreSQL database exists
 */
async function postgresDatabaseExists(config) {
  const client = new Client({
    host: config.host || 'localhost',
    port: config.port || 5432,
    user: config.user || 'postgres',
    password: config.password || '',
    database: 'postgres', // Connect to default database
  })

  try {
    await client.connect()
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.database]
    )
    return result.rowCount > 0
  } catch (error) {
    console.error('❌ Failed to check PostgreSQL database:', error.message)
    return false
  } finally {
    await client.end()
  }
}

/**
 * Create PostgreSQL database
 */
async function createPostgresDatabase(config) {
  const client = new Client({
    host: config.host || 'localhost',
    port: config.port || 5432,
    user: config.user || 'postgres',
    password: config.password || '',
    database: 'postgres',
  })

  try {
    await client.connect()
    await client.query(`CREATE DATABASE "${config.database}"`)
    console.log(`✅ Created PostgreSQL database: ${config.database}`)
  } catch (error) {
    if (error.code === '42P04') {
      console.log(`ℹ️  PostgreSQL database already exists: ${config.database}`)
    } else {
      throw error
    }
  } finally {
    await client.end()
  }
}

/**
 * Check if MySQL database exists
 */
async function mysqlDatabaseExists(config) {
  const connection = await createConnection({
    host: config.host || 'localhost',
    port: config.port || 3306,
    user: config.user || 'root',
    password: config.password || '',
  })

  try {
    const [rows] = await connection.query(
      'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
      [config.database]
    )
    return Array.isArray(rows) && rows.length > 0
  } catch (error) {
    console.error('❌ Failed to check MySQL database:', error.message)
    return false
  } finally {
    await connection.end()
  }
}

/**
 * Create MySQL database
 */
async function createMysqlDatabase(config) {
  const connection = await createConnection({
    host: config.host || 'localhost',
    port: config.port || 3306,
    user: config.user || 'root',
    password: config.password || '',
  })

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``)
    console.log(`✅ Created MySQL database: ${config.database}`)
  } catch (error) {
    console.error(`❌ Failed to create MySQL database: ${error.message}`)
    throw error
  } finally {
    await connection.end()
  }
}

/**
 * Main setup function
 */
async function setupDatabase() {
  console.log('🔧 Database Setup Starting...\n')

  try {
    // Load configuration
    const config = loadDatabaseConfig()

    // Handle SQLite (no setup needed)
    if (config.provider === 'sqlite') {
      console.log('✅ SQLite database will be created automatically')
      console.log(`   Location: ./${config.database}.db\n`)
      return
    }

    // Check and create database
    console.log(`\n🔍 Checking if database exists: ${config.database}`)

    if (config.provider === 'postgresql') {
      const exists = await postgresDatabaseExists(config)
      if (!exists) {
        console.log('📝 Database does not exist, creating...')
        await createPostgresDatabase(config)
      } else {
        console.log(`✅ Database already exists: ${config.database}`)
      }
    } else if (config.provider === 'mysql') {
      await createMysqlDatabase(config) // CREATE IF NOT EXISTS handles checking
    }

    // Generate and display DATABASE_URL for Prisma
    const databaseUrl = buildDatabaseUrl(config)
    
    console.log('\n✅ Database setup complete!')
    console.log('\n📝 Add this to your .env file:')
    console.log(`DATABASE_URL="${databaseUrl}"`)
    console.log('\nOr keep using component-based configuration.')
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message)
    console.error('\nTroubleshooting:')
    console.error('  1. Check database server is running')
    console.error('  2. Verify credentials in .env file')
    console.error('  3. Ensure user has CREATE DATABASE permission')
    console.error('  4. For MySQL: Check if root user has no password or set DB_PASSWORD')
    console.error('  5. For PostgreSQL: Default user is "postgres"')
    process.exit(1)
  }
}

// Run setup
setupDatabase()

