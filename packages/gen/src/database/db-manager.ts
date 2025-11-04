import { createConnection } from 'mysql2/promise'
import { Client } from 'pg'
import { existsSync } from 'node:fs'
import { logger } from '../logger.js'

export interface DatabaseConfig {
  provider: 'postgresql' | 'mysql' | 'sqlite'
  host?: string
  port?: number
  user?: string
  password?: string
  database: string
  url?: string
}

/**
 * Parse DATABASE_URL into components
 */
export function parseDatabaseUrl(url: string): DatabaseConfig {
  try {
    const parsed = new URL(url)
    const provider = parsed.protocol.replace(':', '') as 'postgresql' | 'mysql' | 'sqlite'
    
    return {
      provider: provider === 'postgres' ? 'postgresql' : provider,
      host: parsed.hostname || 'localhost',
      port: parsed.port ? parseInt(parsed.port) : undefined,
      user: parsed.username || undefined,
      password: parsed.password || undefined,
      database: parsed.pathname.slice(1).split('?')[0],
      url,
    }
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL: ${error}`)
  }
}

/**
 * Build DATABASE_URL from components
 */
export function buildDatabaseUrl(config: DatabaseConfig): string {
  if (config.url) return config.url

  const {
    provider,
    host = 'localhost',
    port,
    user = 'root',
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
 * Check if database exists (PostgreSQL)
 */
async function postgresDatabaseExists(config: DatabaseConfig): Promise<boolean> {
  const client = new Client({
    host: config.host || 'localhost',
    port: config.port || 5432,
    user: config.user || 'postgres',
    password: config.password || '',
    database: 'postgres', // Connect to default database to check
  })

  try {
    await client.connect()
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.database]
    )
    return result.rowCount! > 0
  } catch (error) {
    logger.error({ error, config }, 'Failed to check if PostgreSQL database exists')
    return false
  } finally {
    await client.end()
  }
}

/**
 * Create database (PostgreSQL)
 */
async function createPostgresDatabase(config: DatabaseConfig): Promise<void> {
  const client = new Client({
    host: config.host || 'localhost',
    port: config.port || 5432,
    user: config.user || 'postgres',
    password: config.password || '',
    database: 'postgres', // Connect to default database
  })

  try {
    await client.connect()
    await client.query(`CREATE DATABASE "${config.database}"`)
    logger.info({ database: config.database }, 'PostgreSQL database created')
  } catch (error: any) {
    if (error.code === '42P04') {
      // Database already exists
      logger.info({ database: config.database }, 'PostgreSQL database already exists')
    } else {
      throw error
    }
  } finally {
    await client.end()
  }
}

/**
 * Check if database exists (MySQL)
 */
async function mysqlDatabaseExists(config: DatabaseConfig): Promise<boolean> {
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
    logger.error({ error, config }, 'Failed to check if MySQL database exists')
    return false
  } finally {
    await connection.end()
  }
}

/**
 * Create database (MySQL)
 */
async function createMysqlDatabase(config: DatabaseConfig): Promise<void> {
  const connection = await createConnection({
    host: config.host || 'localhost',
    port: config.port || 3306,
    user: config.user || 'root',
    password: config.password || '',
  })

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``)
    logger.info({ database: config.database }, 'MySQL database created')
  } catch (error) {
    logger.error({ error, database: config.database }, 'Failed to create MySQL database')
    throw error
  } finally {
    await connection.end()
  }
}

/**
 * Ensure database exists (create if not)
 */
export async function ensureDatabaseExists(config: DatabaseConfig): Promise<void> {
  logger.info({ provider: config.provider, database: config.database }, 'Checking database existence')

  if (config.provider === 'sqlite') {
    // SQLite creates database file automatically
    logger.info({ database: config.database }, 'SQLite database will be created automatically')
    return
  }

  try {
    if (config.provider === 'postgresql') {
      const exists = await postgresDatabaseExists(config)
      if (!exists) {
        await createPostgresDatabase(config)
      } else {
        logger.info({ database: config.database }, 'PostgreSQL database already exists')
      }
    } else if (config.provider === 'mysql') {
      const exists = await mysqlDatabaseExists(config)
      if (!exists) {
        await createMysqlDatabase(config)
      } else {
        logger.info({ database: config.database }, 'MySQL database already exists')
      }
    }
  } catch (error) {
    logger.error({ error, config }, 'Failed to ensure database exists')
    throw new Error(`Failed to create database: ${error}`)
  }
}

/**
 * Load database configuration from environment
 */
export function loadDatabaseConfig(exampleName?: string): DatabaseConfig {
  // Check if full DATABASE_URL is provided
  if (process.env.DATABASE_URL) {
    return parseDatabaseUrl(process.env.DATABASE_URL)
  }

  // Build from components
  const provider = (process.env.DB_PROVIDER || 'mysql') as 'postgresql' | 'mysql' | 'sqlite'
  const database = process.env.DB_NAME || exampleName || 'ssot_default'

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
 * Generate example-specific database name
 */
export function generateDatabaseName(exampleName: string, prefix = 'ssot'): string {
  return `${prefix}_${exampleName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
}

