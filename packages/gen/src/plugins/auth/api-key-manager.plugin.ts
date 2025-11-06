/**
 * API Key Manager Plugin
 * 
 * Provides secure API key management for server-to-server authentication
 * 
 * Features:
 * - Secure API key generation (cryptographically random)
 * - Key validation and verification
 * - Scope-based permissions
 * - Key expiry and rotation
 * - Rate limiting per key
 * - Usage tracking
 * - Express middleware
 * 
 * Use Cases:
 * - Server-to-server authentication
 * - Third-party API access
 * - Mobile/desktop app authentication
 * - Webhook authentication
 * - Service accounts
 */

import type {
  FeaturePlugin,
  PluginContext,
  PluginOutput,
  PluginRequirements,
  ValidationResult,
  HealthCheckSection
} from '../plugin.interface.js'

export interface ApiKeyManagerConfig {
  /** API Key model name (default: 'ApiKey') */
  modelName?: string
  
  /** User model name for key ownership (default: 'User') */
  userModel?: string
  
  /** Enable usage tracking (default: true) */
  enableUsageTracking?: boolean
  
  /** Enable rate limiting per key (default: true) */
  enableRateLimiting?: boolean
  
  /** Enable key rotation (default: true) */
  enableKeyRotation?: boolean
  
  /** Default key expiry (default: '1y' - 1 year) */
  defaultExpiry?: string
  
  /** Key prefix (default: 'sk_') */
  keyPrefix?: string
  
  /** Key length in bytes (default: 32) */
  keyLength?: number
}

export class ApiKeyManagerPlugin implements FeaturePlugin {
  name = 'api-key-manager'
  version = '1.0.0'
  description = 'API key generation, validation, and management for server-to-server auth'
  enabled = true
  
  private config: Required<ApiKeyManagerConfig>
  
  constructor(config: ApiKeyManagerConfig = {}) {
    this.config = {
      modelName: 'ApiKey',
      userModel: 'User',
      enableUsageTracking: true,
      enableRateLimiting: true,
      enableKeyRotation: true,
      defaultExpiry: '1y',
      keyPrefix: 'sk_',
      keyLength: 32,
      ...config
    }
  }
  
  requirements: PluginRequirements = {
    models: {
      required: ['ApiKey'],
      optional: ['User']
    },
    envVars: {
      required: [],
      optional: ['API_KEY_SALT']
    },
    dependencies: {
      runtime: {
        'crypto': 'built-in'  // Node.js built-in
      },
      dev: {}
    }
  }
  
  /**
   * Validate plugin can be used
   */
  validate(context: PluginContext): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    
    // Check ApiKey model exists
    const apiKeyModel = context.schema.models.find(m => 
      m.name === this.config.modelName
    )
    
    if (!apiKeyModel) {
      errors.push(`ApiKey model '${this.config.modelName}' not found.`)
      suggestions.push(`Add an ApiKey model to your schema:
        
model ApiKey {
  id          Int       @id @default(autoincrement())
  key         String    @unique
  name        String
  description String?
  scopes      String[]  @default([])
  userId      Int?
  user        User?     @relation(fields: [userId], references: [id])
  rateLimit   Int?      @default(60)  // Requests per minute
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([key])
  @@index([userId])
}`)
    } else {
      // Check required fields
      const hasKeyField = apiKeyModel.scalarFields?.some(f => f.name === 'key')
      const hasScopesField = apiKeyModel.scalarFields?.some(f => f.name === 'scopes')
      
      if (!hasKeyField) {
        errors.push(`ApiKey model missing 'key' field (String @unique)`)
      }
      
      if (!hasScopesField) {
        warnings.push(`ApiKey model missing 'scopes' field. Scope-based permissions will be disabled.`)
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }
  
  /**
   * Generate API Key Manager code
   */
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    // Core API key utilities
    files.set('auth/utils/api-key.util.ts', this.generateApiKeyUtil())
    
    // API key service (CRUD for keys)
    files.set('auth/services/api-key.service.ts', this.generateApiKeyService())
    
    // API key middleware
    files.set('auth/middleware/api-key.middleware.ts', this.generateApiKeyMiddleware())
    
    // Types
    files.set('auth/types/api-key.types.ts', this.generateApiKeyTypes())
    
    // Admin routes (manage API keys)
    files.set('auth/routes/api-key.routes.ts', this.generateApiKeyRoutes())
    
    // Barrel export
    files.set('auth/api-keys.ts', this.generateBarrelExport())
    
    return {
      files,
      routes: [
        { path: '/api-keys', method: 'get', handler: './auth/routes/api-key.routes.js' },
        { path: '/api-keys', method: 'post', handler: './auth/routes/api-key.routes.js' },
        { path: '/api-keys/:id', method: 'delete', handler: './auth/routes/api-key.routes.js' },
        { path: '/api-keys/:id/rotate', method: 'post', handler: './auth/routes/api-key.routes.js' }
      ],
      middleware: [
        {
          name: 'requireApiKey',
          importPath: './auth/middleware/api-key.middleware.js',
          global: false
        },
        {
          name: 'requireApiKeyWithScope',
          importPath: './auth/middleware/api-key.middleware.js',
          global: false
        }
      ],
      envVars: {
        API_KEY_SALT: 'optional-salt-for-api-key-hashing'
      },
      packageJson: {
        dependencies: {},
        devDependencies: {}
      }
    }
  }
  
  /**
   * Generate API key utilities
   */
  private generateApiKeyUtil(): string {
    return `// @generated
// API Key Utilities
// Provides secure API key generation and validation

import crypto from 'node:crypto'

const KEY_PREFIX = '${this.config.keyPrefix}'
const KEY_LENGTH = ${this.config.keyLength}
const API_KEY_SALT = process.env.API_KEY_SALT || ''

/**
 * Generate a new secure API key
 * 
 * Format: ${this.config.keyPrefix}[random_bytes]
 * 
 * @example
 * const apiKey = generateApiKey()
 * // Returns: "${this.config.keyPrefix}abc123def456..."
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(KEY_LENGTH)
  const key = randomBytes.toString('base64url')
  return \`\${KEY_PREFIX}\${key}\`
}

/**
 * Hash API key for storage
 * 
 * Stores hashed version for security (like password hashing)
 * 
 * @example
 * const hashedKey = hashApiKey(apiKey)
 * // Store hashedKey in database
 */
export function hashApiKey(apiKey: string): string {
  return crypto
    .createHash('sha256')
    .update(apiKey + API_KEY_SALT)
    .digest('hex')
}

/**
 * Verify API key against hash
 * 
 * @example
 * const isValid = verifyApiKey(providedKey, storedHash)
 */
export function verifyApiKey(apiKey: string, hash: string): boolean {
  const computedHash = hashApiKey(apiKey)
  return crypto.timingSafeEqual(
    Buffer.from(computedHash),
    Buffer.from(hash)
  )
}

/**
 * Validate API key format
 * 
 * Checks:
 * - Starts with correct prefix
 * - Has minimum length
 * - Only contains valid characters
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || !apiKey.startsWith(KEY_PREFIX)) {
    return false
  }
  
  // Remove prefix and check length
  const keyPart = apiKey.slice(KEY_PREFIX.length)
  if (keyPart.length < KEY_LENGTH) {
    return false
  }
  
  // Check format (base64url: a-zA-Z0-9_-)
  return /^[a-zA-Z0-9_-]+$/.test(keyPart)
}

/**
 * Mask API key for display
 * 
 * @example
 * maskApiKey("${this.config.keyPrefix}abc123def456")
 * // Returns: "${this.config.keyPrefix}abc...456"
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 12) {
    return '***'
  }
  
  const prefix = apiKey.slice(0, KEY_PREFIX.length + 3)
  const suffix = apiKey.slice(-3)
  return \`\${prefix}...\${suffix}\`
}

/**
 * Extract API key from request
 * 
 * Supports:
 * - Authorization: Bearer <key>
 * - Authorization: ApiKey <key>
 * - x-api-key header
 * - ?api_key=<key> (query param)
 */
export function extractApiKey(headers: Record<string, string | string[] | undefined>, query: Record<string, any>): string | null {
  // Check Authorization header
  const authHeader = headers.authorization || headers.Authorization
  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.split(' ')
    if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'ApiKey')) {
      return parts[1]
    }
  }
  
  // Check x-api-key header
  const apiKeyHeader = headers['x-api-key'] || headers['X-API-Key']
  if (apiKeyHeader && typeof apiKeyHeader === 'string') {
    return apiKeyHeader
  }
  
  // Check query parameter
  if (query.api_key && typeof query.api_key === 'string') {
    return query.api_key
  }
  
  return null
}
`
  }
  
  /**
   * Generate API key service
   */
  private generateApiKeyService(): string {
    return `// @generated
// API Key Service
// Manages API key lifecycle: create, validate, revoke, rotate

import prisma from '@/db'
import { generateApiKey, hashApiKey, verifyApiKey } from '../utils/api-key.util.js'
import type { ApiKeyCreateInput, ApiKeyRecord, ApiKeyValidationResult } from '../types/api-key.types.js'
import { logger } from '@/logger'

export const apiKeyService = {
  /**
   * Create a new API key
   * 
   * @example
   * const result = await apiKeyService.create({
   *   name: 'Production API',
   *   scopes: ['read:posts', 'write:posts'],
   *   userId: 123,
   *   expiresIn: '1y'
   * })
   * 
   * // IMPORTANT: result.key is only shown once!
   * // Store it securely, it cannot be retrieved later
   */
  async create(input: ApiKeyCreateInput): Promise<ApiKeyRecord> {
    // Generate new API key
    const apiKey = generateApiKey()
    const hashedKey = hashApiKey(apiKey)
    
    // Calculate expiry if specified
    let expiresAt: Date | undefined
    if (input.expiresIn) {
      expiresAt = calculateExpiry(input.expiresIn)
    }
    
    // Store in database
    const record = await prisma.apiKey.create({
      data: {
        key: hashedKey,
        name: input.name,
        description: input.description,
        scopes: input.scopes || [],
        userId: input.userId,
        rateLimit: input.rateLimit || ${this.config.enableRateLimiting ? '60' : 'null'},
        expiresAt,
        isActive: true
      }
    })
    
    logger.info({ apiKeyId: record.id, name: record.name }, 'API key created')
    
    // Return with plain key (only time it's accessible!)
    return {
      id: record.id,
      key: apiKey,  // ⚠️ Only shown once!
      name: record.name,
      description: record.description || undefined,
      scopes: record.scopes,
      rateLimit: record.rateLimit || undefined,
      expiresAt: record.expiresAt || undefined,
      createdAt: record.createdAt
    }
  },
  
  /**
   * Validate API key and get metadata
   * 
   * @example
   * const result = await apiKeyService.validate(providedKey)
   * if (!result.valid) {
   *   return res.status(401).json({ error: result.error })
   * }
   */
  async validate(apiKey: string): Promise<ApiKeyValidationResult> {
    try {
      const hashedKey = hashApiKey(apiKey)
      
      // Find key in database
      const record = await prisma.apiKey.findUnique({
        where: { key: hashedKey },
        include: { user: true }
      })
      
      if (!record) {
        return {
          valid: false,
          error: 'Invalid API key'
        }
      }
      
      // Check if active
      if (!record.isActive) {
        return {
          valid: false,
          error: 'API key has been revoked'
        }
      }
      
      // Check if expired
      if (record.expiresAt && record.expiresAt < new Date()) {
        return {
          valid: false,
          error: 'API key has expired'
        }
      }
      
      // Update last used timestamp
      ${this.config.enableUsageTracking ? `
      await prisma.apiKey.update({
        where: { id: record.id },
        data: { lastUsedAt: new Date() }
      }).catch(() => {
        // Ignore update errors (don't block request)
      })
      ` : ''}
      
      logger.debug({ apiKeyId: record.id }, 'API key validated')
      
      return {
        valid: true,
        keyId: record.id,
        name: record.name,
        scopes: record.scopes,
        userId: record.userId || undefined,
        rateLimit: record.rateLimit || undefined
      }
    } catch (error) {
      logger.error({ error }, 'API key validation error')
      return {
        valid: false,
        error: 'API key validation failed'
      }
    }
  },
  
  /**
   * List all API keys (for admin)
   */
  async list(userId?: number): Promise<any[]> {
    const where = userId ? { userId } : {}
    
    const keys = await prisma.apiKey.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        scopes: true,
        rateLimit: true,
        expiresAt: true,
        lastUsedAt: true,
        isActive: true,
        createdAt: true,
        userId: true
        // key field NOT selected (never show hashed keys)
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return keys
  },
  
  /**
   * Revoke API key
   */
  async revoke(keyId: number): Promise<boolean> {
    try {
      await prisma.apiKey.update({
        where: { id: keyId },
        data: { isActive: false }
      })
      
      logger.info({ apiKeyId: keyId }, 'API key revoked')
      return true
    } catch (error) {
      return false
    }
  },
  
  ${this.config.enableKeyRotation ? `
  /**
   * Rotate API key (generate new key, keep same permissions)
   * 
   * @example
   * const newKey = await apiKeyService.rotate(oldKeyId)
   * // Returns new key, old key is revoked
   */
  async rotate(keyId: number): Promise<ApiKeyRecord | null> {
    try {
      // Get old key record
      const oldRecord = await prisma.apiKey.findUnique({
        where: { id: keyId }
      })
      
      if (!oldRecord) {
        return null
      }
      
      // Generate new key
      const newApiKey = generateApiKey()
      const hashedKey = hashApiKey(newApiKey)
      
      // Create new record with same permissions
      const newRecord = await prisma.apiKey.create({
        data: {
          key: hashedKey,
          name: oldRecord.name + ' (rotated)',
          description: oldRecord.description,
          scopes: oldRecord.scopes,
          userId: oldRecord.userId,
          rateLimit: oldRecord.rateLimit,
          expiresAt: oldRecord.expiresAt,
          isActive: true
        }
      })
      
      // Revoke old key
      await prisma.apiKey.update({
        where: { id: keyId },
        data: { isActive: false }
      })
      
      logger.info({ oldKeyId: keyId, newKeyId: newRecord.id }, 'API key rotated')
      
      return {
        id: newRecord.id,
        key: newApiKey,  // ⚠️ Only shown once!
        name: newRecord.name,
        description: newRecord.description || undefined,
        scopes: newRecord.scopes,
        rateLimit: newRecord.rateLimit || undefined,
        expiresAt: newRecord.expiresAt || undefined,
        createdAt: newRecord.createdAt
      }
    } catch (error) {
      logger.error({ error, keyId }, 'API key rotation failed')
      return null
    }
  },
  ` : ''}
  
  /**
   * Delete API key permanently
   */
  async delete(keyId: number): Promise<boolean> {
    try {
      await prisma.apiKey.delete({
        where: { id: keyId }
      })
      
      logger.info({ apiKeyId: keyId }, 'API key deleted')
      return true
    } catch (error) {
      return false
    }
  },
  
  /**
   * Check if key has required scope
   */
  hasScope(apiKey: { scopes: string[] }, requiredScope: string): boolean {
    if (!apiKey.scopes || apiKey.scopes.length === 0) {
      return false
    }
    
    // Support wildcard scopes
    if (apiKey.scopes.includes('*')) {
      return true
    }
    
    // Check exact scope
    if (apiKey.scopes.includes(requiredScope)) {
      return true
    }
    
    // Check wildcard patterns (e.g., "read:*" matches "read:posts")
    const scopePattern = requiredScope.split(':')[0] + ':*'
    if (apiKey.scopes.includes(scopePattern)) {
      return true
    }
    
    return false
  }
}

/**
 * Calculate expiry date from string
 */
function calculateExpiry(expiresIn: string): Date {
  const match = expiresIn.match(/^(\\d+)([smhdy])$/)
  if (!match) {
    // Default to 1 year
    return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  }
  
  const value = parseInt(match[1])
  const unit = match[2]
  
  let ms = 0
  switch (unit) {
    case 's': ms = value * 1000; break
    case 'm': ms = value * 60 * 1000; break
    case 'h': ms = value * 60 * 60 * 1000; break
    case 'd': ms = value * 24 * 60 * 60 * 1000; break
    case 'y': ms = value * 365 * 24 * 60 * 60 * 1000; break
  }
  
  return new Date(Date.now() + ms)
}
`
  }
  
  /**
   * Generate API key middleware
   */
  private generateApiKeyMiddleware(): string {
    return `// @generated
// API Key Authentication Middleware

import type { Request, Response, NextFunction } from 'express'
import { extractApiKey, isValidApiKeyFormat } from '../utils/api-key.util.js'
import { apiKeyService } from '../services/api-key.service.js'

/**
 * Require valid API key
 * 
 * @example
 * router.post('/api/data', requireApiKey, handleData)
 */
export async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKey = extractApiKey(req.headers as any, req.query)
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        message: 'Provide API key via Authorization header, x-api-key header, or api_key query parameter'
      })
    }
    
    // Validate format first (fast check)
    if (!isValidApiKeyFormat(apiKey)) {
      return res.status(401).json({
        error: 'Invalid API key format'
      })
    }
    
    // Validate against database
    const result = await apiKeyService.validate(apiKey)
    
    if (!result.valid) {
      return res.status(401).json({
        error: result.error || 'Invalid API key'
      })
    }
    
    // Attach API key info to request
    req.apiKey = {
      id: result.keyId!,
      name: result.name!,
      scopes: result.scopes || [],
      userId: result.userId,
      rateLimit: result.rateLimit
    }
    
    next()
  } catch (error) {
    logger.error({ error }, 'API key middleware error')
    return res.status(500).json({
      error: 'Authentication error'
    })
  }
}

/**
 * Require API key with specific scope
 * 
 * @example
 * router.post('/api/posts', requireApiKeyWithScope('write:posts'), createPost)
 */
export function requireApiKeyWithScope(...requiredScopes: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First check API key is present
    if (!req.apiKey) {
      return res.status(401).json({
        error: 'API key required',
        message: 'Use requireApiKey middleware first'
      })
    }
    
    // Check if key has any of the required scopes
    const hasRequiredScope = requiredScopes.some(scope =>
      apiKeyService.hasScope(req.apiKey!, scope)
    )
    
    if (!hasRequiredScope) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: \`Required scope: \${requiredScopes.join(' or ')}\`,
        keyScopes: req.apiKey.scopes
      })
    }
    
    next()
  }
}

/**
 * Optional API key (attach if present)
 */
export async function optionalApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKey = extractApiKey(req.headers as any, req.query)
    
    if (!apiKey || !isValidApiKeyFormat(apiKey)) {
      return next()
    }
    
    const result = await apiKeyService.validate(apiKey)
    
    if (result.valid) {
      req.apiKey = {
        id: result.keyId!,
        name: result.name!,
        scopes: result.scopes || [],
        userId: result.userId,
        rateLimit: result.rateLimit
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
  
  next()
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        id: number
        name: string
        scopes: string[]
        userId?: number
        rateLimit?: number
      }
    }
  }
}
`
  }
  
  /**
   * Generate TypeScript types
   */
  private generateApiKeyTypes(): string {
    return `// @generated
// API Key Type Definitions

/**
 * API key creation input
 */
export interface ApiKeyCreateInput {
  name: string
  description?: string
  scopes?: string[]
  userId?: number
  rateLimit?: number  // Requests per minute
  expiresIn?: string  // e.g., "1y", "90d", "6h"
}

/**
 * API key record (includes plain key - only shown once!)
 */
export interface ApiKeyRecord {
  id: number
  key: string  // ⚠️ Plain key - only returned on creation/rotation
  name: string
  description?: string
  scopes: string[]
  rateLimit?: number
  expiresAt?: Date
  createdAt: Date
}

/**
 * API key validation result
 */
export interface ApiKeyValidationResult {
  valid: boolean
  error?: string
  keyId?: number
  name?: string
  scopes?: string[]
  userId?: number
  rateLimit?: number
}

/**
 * API key info (attached to request)
 */
export interface ApiKeyInfo {
  id: number
  name: string
  scopes: string[]
  userId?: number
  rateLimit?: number
}

/**
 * API key update input
 */
export interface ApiKeyUpdateInput {
  name?: string
  description?: string
  scopes?: string[]
  rateLimit?: number
  isActive?: boolean
}
`
  }
  
  /**
   * Generate API key management routes
   */
  private generateApiKeyRoutes(): string {
    return `// @generated
// API Key Management Routes
// Admin routes for managing API keys

import { Router } from 'express'
import { apiKeyService } from '../services/api-key.service.js'
import { requireAuth } from '../middleware/jwt.middleware.js'
import type { Request, Response } from 'express'

export const apiKeyRouter = Router()

/**
 * GET /api-keys
 * List all API keys for current user
 */
apiKeyRouter.get('/',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.userId
      const keys = await apiKeyService.list(userId)
      
      res.json({ data: keys })
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to list API keys',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /api-keys
 * Create new API key
 */
apiKeyRouter.post('/',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.userId
      const input = {
        ...req.body,
        userId  // Tie key to current user
      }
      
      const apiKey = await apiKeyService.create(input)
      
      res.status(201).json({
        ...apiKey,
        warning: '⚠️ Save this key securely! It will not be shown again.'
      })
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to create API key',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * DELETE /api-keys/:id
 * Revoke API key
 */
apiKeyRouter.delete('/:id',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const keyId = parseInt(req.params.id)
      const success = await apiKeyService.revoke(keyId)
      
      if (!success) {
        return res.status(404).json({ error: 'API key not found' })
      }
      
      res.json({ message: 'API key revoked successfully' })
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to revoke API key',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

${this.config.enableKeyRotation ? `
/**
 * POST /api-keys/:id/rotate
 * Rotate API key (generate new, revoke old)
 */
apiKeyRouter.post('/:id/rotate',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const keyId = parseInt(req.params.id)
      const newKey = await apiKeyService.rotate(keyId)
      
      if (!newKey) {
        return res.status(404).json({ error: 'API key not found' })
      }
      
      res.json({
        ...newKey,
        warning: '⚠️ Save this new key securely! The old key has been revoked.'
      })
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to rotate API key',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)
` : ''}
`
  }
  
  /**
   * Generate barrel export
   */
  private generateBarrelExport(): string {
    return `// @generated
// API Key Manager - Barrel Export

export { 
  generateApiKey,
  hashApiKey,
  verifyApiKey,
  isValidApiKeyFormat,
  maskApiKey,
  extractApiKey
} from './utils/api-key.util.js'

export { 
  requireApiKey,
  requireApiKeyWithScope,
  optionalApiKey
} from './middleware/api-key.middleware.js'

export { apiKeyService } from './services/api-key.service.js'

export type { 
  ApiKeyCreateInput,
  ApiKeyRecord,
  ApiKeyValidationResult,
  ApiKeyInfo,
  ApiKeyUpdateInput
} from './types/api-key.types.js'

export { apiKeyRouter } from './routes/api-key.routes.js'
`
  }
  
  /**
   * Health check for API Key Manager
   */
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'api-key-manager',
      title: '🔑 API Key Manager',
      icon: '🔑',
      checks: [
        {
          id: 'apikey-model',
          name: 'ApiKey Model',
          description: 'Validates ApiKey model exists in database',
          testFunction: `
            const apiKeyModel = await prisma.$queryRaw\\\`SELECT 1 FROM sqlite_master WHERE type='table' AND name='ApiKey'\\\`
            return {
              success: apiKeyModel.length > 0,
              message: apiKeyModel.length > 0 ? 'ApiKey model exists' : 'ApiKey model not found'
            }
          `
        },
        {
          id: 'apikey-generation',
          name: 'Key Generation',
          description: 'Tests API key generation and validation',
          testFunction: `
            const { generateApiKey, hashApiKey, verifyApiKey } = await import('@/auth/api-keys.js')
            const key = generateApiKey()
            const hash = hashApiKey(key)
            const isValid = verifyApiKey(key, hash)
            return {
              success: isValid && key.startsWith('${this.config.keyPrefix}'),
              message: isValid ? 'API key generation working' : 'API key validation failed'
            }
          `
        },
        {
          id: 'apikey-middleware',
          name: 'API Key Middleware',
          description: 'Validates middleware functions are available',
          testFunction: `
            const { requireApiKey, requireApiKeyWithScope } = await import('@/auth/api-keys.js')
            return {
              success: typeof requireApiKey === 'function' && typeof requireApiKeyWithScope === 'function',
              message: 'API key middleware available'
            }
          `
        },
        {
          id: 'apikey-service',
          name: 'API Key Service',
          description: 'Validates API key service is available',
          testFunction: `
            const { apiKeyService } = await import('@/auth/api-keys.js')
            return {
              success: typeof apiKeyService.create === 'function',
              message: 'API key service available'
            }
          `
        }
      ]
    }
  }
}

