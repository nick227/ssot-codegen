/**
 * Logger Template
 * 
 * Generates structured logging setup with Pino
 */

import type { ScaffoldConfig } from '../project-scaffold.js'

/**
 * Generate logger.ts with Pino configuration
 */
export function generateLogger(cfg: ScaffoldConfig): string {
  return `// @generated
// Structured logging with Pino

import pino from 'pino'
import config from './config.js'

/**
 * Create logger instance with environment-specific configuration
 */
export const logger = pino({
  level: config.logging.level,
  
  // Pretty print in development
  transport: config.nodeEnv === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    }
  } : undefined,
  
  // Production settings
  formatters: config.nodeEnv === 'production' ? {
    level: (label) => {
      return { level: label }
    },
  } : undefined,
  
  // Base fields included in all logs
  base: {
    env: config.nodeEnv,
  },
  
  // Redact sensitive fields
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
    remove: true,
  },
})

/**
 * Create child logger with additional context
 * 
 * @example
 * const userLogger = createLogger({ userId: '123' })
 * userLogger.info('User action')
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context)
}

export default logger
`
}

/**
 * Generate request logger middleware
 */
export function generateRequestLogger(cfg: ScaffoldConfig, framework: 'express' | 'fastify'): string {
  if (framework === 'express') {
    return `// @generated
// Request logging middleware for Express

import { randomUUID } from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'
import { logger } from './logger.js'

/**
 * Add request ID to each request
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.id = randomUUID()
  res.setHeader('X-Request-ID', req.id)
  next()
}

/**
 * Log HTTP requests
 */
export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  // Log request
  logger.info({
    requestId: req.id,
    method: req.method,
    url: req.url,
    userAgent: req.get('user-agent'),
    ip: req.ip,
  }, 'Incoming request')
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start
    
    const logFn = res.statusCode >= 500 ? logger.error :
                  res.statusCode >= 400 ? logger.warn :
                  logger.info
    
    logFn({
      requestId: req.id,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
    }, 'Request completed')
  })
  
  next()
}
`
  }
  
  // Fastify uses built-in logger, just configure it
  return `// @generated
// Fastify uses built-in logger integration

import type { FastifyRequest, FastifyReply } from 'fastify'
import { randomUUID } from 'node:crypto'

/**
 * Add request ID to Fastify requests
 */
export const requestIdPlugin = (fastify: any, opts: any, done: () => void) => {
  fastify.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
    const requestId = randomUUID()
    req.id = requestId
    reply.header('X-Request-ID', requestId)
  })
  
  done()
}
`
}

