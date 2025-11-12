/**
 * Integration Helpers - Streamlined utilities for frontend-backend integration
 * 
 * Provides consistent path generation, baseUrl defaults, and error handling
 * across all generators to ensure frontend and backend stay in sync.
 */

import { pluralize, toKebabCase } from './naming.js'

/**
 * Generate consistent API route path for a model
 * 
 * Used by both backend route generator and frontend SDK generator
 * to ensure paths match exactly.
 * 
 * @example
 * getModelRoutePath('Conversation') // '/api/conversations'
 * getModelRoutePath('Person') // '/api/people'
 * getModelRoutePath('Category') // '/api/categories'
 */
export function getModelRoutePath(modelName: string, prefix: string = '/api'): string {
  const modelKebab = toKebabCase(modelName)
  const modelPlural = pluralize(modelKebab)
  return `${prefix}/${modelPlural}`
}

/**
 * Get environment-aware default base URL
 * 
 * Automatically detects:
 * - Browser: Uses window.location.origin
 * - Node.js: Checks environment variables
 * - Fallback: localhost:3000
 * 
 * @example
 * getDefaultBaseUrl() // 'http://localhost:3000' (Node.js)
 * getDefaultBaseUrl() // 'https://example.com' (Browser, production)
 */
export function getDefaultBaseUrl(): string {
  // Browser environment
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin
  }
  
  // Node.js environment - check common env vars
  if (typeof process !== 'undefined' && process.env) {
    return process.env.API_URL || 
           process.env.VITE_API_URL || 
           process.env.NEXT_PUBLIC_API_URL ||
           process.env.REACT_APP_API_URL ||
           'http://localhost:3000'
  }
  
  // Fallback
  return 'http://localhost:3000'
}

/**
 * Standard API error response format
 * 
 * Used by both backend controllers and frontend error handling
 * to ensure consistent error structure.
 */
export interface APIErrorResponse {
  error: string           // Error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND')
  message: string         // Human-readable message
  details?: unknown       // Additional details (e.g., Zod errors, stack trace in dev)
  status: number         // HTTP status code
}

/**
 * Create standardized error response
 * 
 * @example
 * createErrorResponse('VALIDATION_ERROR', 'Invalid input', zodErrors, 400)
 */
export function createErrorResponse(
  error: string,
  message: string,
  details?: unknown,
  status: number = 500
): APIErrorResponse {
  return {
    error,
    message,
    details: process.env.NODE_ENV === 'development' ? details : undefined,
    status
  }
}

/**
 * CORS configuration defaults
 * 
 * Provides sensible defaults for CORS configuration in generated backend.
 */
export interface CORSConfig {
  origin: string | string[] | ((origin: string) => boolean)
  credentials: boolean
  methods: string[]
  allowedHeaders: string[]
  exposedHeaders: string[]
}

/**
 * Get default CORS configuration
 * 
 * @example
 * const corsConfig = getDefaultCORSConfig()
 * // Use in Express: app.use(cors(corsConfig))
 */
export function getDefaultCORSConfig(): CORSConfig {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return {
    origin: isDevelopment 
      ? () => true  // Allow all origins in development
      : process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Count',
      'X-Current-Page'
    ]
  }
}

/**
 * Generate CORS middleware code for Express
 */
export function generateExpressCORSCode(): string {
  const config = getDefaultCORSConfig()
  
  return `// CORS configuration
import cors from 'cors'

const corsOptions = {
  origin: ${JSON.stringify(config.origin)},
  credentials: ${config.credentials},
  methods: ${JSON.stringify(config.methods)},
  allowedHeaders: ${JSON.stringify(config.allowedHeaders)},
  exposedHeaders: ${JSON.stringify(config.exposedHeaders)}
}

app.use(cors(corsOptions))`
}

/**
 * Generate CORS middleware code for Fastify
 */
export function generateFastifyCORSCode(): string {
  const config = getDefaultCORSConfig()
  
  return `// CORS configuration
import fastifyCors from '@fastify/cors'

await app.register(fastifyCors, {
  origin: ${JSON.stringify(config.origin)},
  credentials: ${config.credentials},
  methods: ${JSON.stringify(config.methods)},
  allowedHeaders: ${JSON.stringify(config.allowedHeaders)},
  exposedHeaders: ${JSON.stringify(config.exposedHeaders)}
})`
}

