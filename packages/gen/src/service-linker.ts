/**
 * Service Linker - Parses and validates @service annotations from Prisma schema
 * 
 * Enables schema-driven service integration for complex workflows:
 * - AI agents
 * - File uploads
 * - Payment processing
 * - Webhook handlers
 * - Email queues
 * 
 * Philosophy: Schema declares WHAT, TypeScript implements HOW, Generator integrates
 */

import type { ParsedModel } from './dmmf-parser.js'
import fs from 'node:fs'
import path from 'node:path'

export interface ServiceAnnotation {
  name: string                 // Service name (e.g., 'ai-agent')
  methods: string[]            // Exposed methods (e.g., ['sendPrompt', 'getHistory'])
  provider?: string            // External provider hint (e.g., 'openai', 's3', 'stripe')
  rateLimit?: string           // Rate limit config (e.g., '10/minute')
  auth?: boolean               // Requires authentication (default: true)
  description?: string         // Service description
  serviceFile: string          // Path to implementation file
  model: ParsedModel           // Associated Prisma model
}

export interface ServiceMethod {
  name: string
  isExposed: boolean
  requiresAuth: boolean
  requiresOwnership?: string   // Field to check ownership (e.g., 'userId')
  rateLimit?: string
}

/**
 * Parse @service annotation from Prisma model documentation
 * 
 * Expected format:
 * ```prisma
 * /// @service ai-agent
 * /// @provider openai
 * /// @methods sendMessage, getHistory, regenerateResponse
 * /// @rateLimit 20/minute
 * /// @description AI conversation orchestration service
 * model AIPrompt { ... }
 * ```
 */
export function parseServiceAnnotation(model: ParsedModel): ServiceAnnotation | null {
  const doc = model.documentation || ''
  
  // Parse: /// @service ai-agent
  const serviceMatch = doc.match(/@service\s+(\S+)/)
  if (!serviceMatch) {
    return null  // Not a service model
  }
  
  const serviceName = serviceMatch[1]
  
  // Parse: /// @methods sendPrompt, getHistory, retryFailed
  const methodsMatch = doc.match(/@methods\s+([^\n]+)/)
  const methods = methodsMatch 
    ? methodsMatch[1].split(',').map(m => m.trim()).filter(Boolean)
    : []
  
  // Parse: /// @provider openai
  const providerMatch = doc.match(/@provider\s+(\S+)/)
  
  // Parse: /// @rateLimit 10/minute
  const rateLimitMatch = doc.match(/@rateLimit\s+([^\n]+)/)
  
  // Parse: /// @description ...
  const descriptionMatch = doc.match(/@description\s+([^\n]+(?:\n(?!\/\/\/).*)*)/m)
  
  return {
    name: serviceName,
    methods,
    provider: providerMatch?.[1],
    rateLimit: rateLimitMatch?.[1]?.trim(),
    auth: true,  // Default to requiring authentication
    description: descriptionMatch?.[1]?.trim(),
    serviceFile: `./services/${serviceName}.service.ts`,
    model
  }
}

/**
 * Parse all service annotations from schema
 */
export function parseAllServiceAnnotations(models: ParsedModel[]): ServiceAnnotation[] {
  const services: ServiceAnnotation[] = []
  
  for (const model of models) {
    const annotation = parseServiceAnnotation(model)
    if (annotation) {
      services.push(annotation)
    }
  }
  
  return services
}

/**
 * Validate that service file exists
 */
export function validateServiceFile(annotation: ServiceAnnotation, projectRoot: string): {
  exists: boolean
  path: string
  error?: string
} {
  const servicePath = path.join(projectRoot, 'src', annotation.serviceFile)
  
  if (!fs.existsSync(servicePath)) {
    return {
      exists: false,
      path: servicePath,
      error: `Service file not found: ${servicePath}`
    }
  }
  
  return {
    exists: true,
    path: servicePath
  }
}

/**
 * Generate service file path
 */
export function getServiceFilePath(annotation: ServiceAnnotation, projectRoot: string): string {
  return path.join(projectRoot, 'src', annotation.serviceFile)
}

/**
 * Get service export name (camelCase)
 */
export function getServiceExportName(annotation: ServiceAnnotation): string {
  return toCamelCase(annotation.name) + 'Service'
}

/**
 * Convert kebab-case to camelCase
 * @deprecated Use kebabToCamelCase from '../utils/naming.js' instead
 * Re-exported for backward compatibility
 */
export { kebabToCamelCase as toCamelCase } from './utils/naming.js'

/**
 * Parse rate limit string to config
 * 
 * Examples:
 * - '10/minute' → { max: 10, windowMs: 60000 }
 * - '100/hour' → { max: 100, windowMs: 3600000 }
 * - '1000/day' → { max: 1000, windowMs: 86400000 }
 */
export function parseRateLimit(rateLimitStr: string): {
  max: number
  windowMs: number
} {
  const match = rateLimitStr.match(/(\d+)\s*\/\s*(\w+)/)
  
  if (!match) {
    throw new Error(`Invalid rate limit format: ${rateLimitStr}. Expected: "10/minute"`)
  }
  
  const max = parseInt(match[1], 10)
  const unit = match[2].toLowerCase()
  
  const windows: Record<string, number> = {
    'second': 1000,
    'minute': 60 * 1000,
    'hour': 60 * 60 * 1000,
    'day': 24 * 60 * 60 * 1000
  }
  
  // Handle plural forms
  const unitKey = unit.endsWith('s') ? unit.slice(0, -1) : unit
  const windowMs = windows[unitKey]
  
  if (!windowMs) {
    throw new Error(`Unknown rate limit unit: ${unit}. Use: second, minute, hour, or day`)
  }
  
  return { max, windowMs }
}

/**
 * Infer HTTP method from method name
 * 
 * Conventions:
 * - get*, list*, find* → GET
 * - create*, send*, add* → POST
 * - update*, edit*, modify* → PUT/PATCH
 * - delete*, remove* → DELETE
 */
export function inferHTTPMethod(methodName: string): 'get' | 'post' | 'put' | 'delete' {
  const lower = methodName.toLowerCase()
  
  if (lower.startsWith('get') || lower.startsWith('list') || lower.startsWith('find')) {
    return 'get'
  }
  if (lower.startsWith('update') || lower.startsWith('edit') || lower.startsWith('modify')) {
    return 'put'
  }
  if (lower.startsWith('delete') || lower.startsWith('remove')) {
    return 'delete'
  }
  
  // Default to POST for actions
  return 'post'
}

/**
 * Infer route path from method name
 * 
 * Examples:
 * - sendMessage → /send-message
 * - getHistory → /history
 * - regenerateResponse → /regenerate-response
 */
export function inferRoutePath(methodName: string): string {
  // Remove common prefixes
  let path = methodName
    .replace(/^(get|list|find|create|send|add|update|edit|delete|remove)/, '')
  
  // If empty after removing prefix, use full method name
  if (!path) {
    path = methodName
  }
  
  // Convert camelCase to kebab-case
  path = path
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')  // Remove leading dash
  
  return `/${path}`
}

/**
 * Check if method name suggests it modifies data
 */
export function isModifyingMethod(methodName: string): boolean {
  const lower = methodName.toLowerCase()
  return (
    lower.startsWith('create') ||
    lower.startsWith('send') ||
    lower.startsWith('add') ||
    lower.startsWith('update') ||
    lower.startsWith('edit') ||
    lower.startsWith('delete') ||
    lower.startsWith('remove') ||
    lower.startsWith('regenerate')
  )
}

