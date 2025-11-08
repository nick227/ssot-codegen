/**
 * SDK Runtime - Type-safe client SDK for generated APIs
 * 
 * Provides base classes and utilities for generated SDK clients.
 */

// Core client
export * from './client/index.js'

// Model clients
export * from './models/index.js'

// Types
export * from './types/index.js'

// Search
export * from './search/index.js'

// Legacy export for backwards compatibility
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
export interface ClientConfig {
  baseUrl?: string
  headers?: Record<string, string>
}
