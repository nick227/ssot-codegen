/**
 * JWT Service Plugin
 * 
 * Provides comprehensive JWT token management for authentication
 * 
 * Features:
 * - Access token generation and verification
 * - Refresh token support
 * - Token blacklist/revocation (optional)
 * - Configurable expiry times
 * - Express middleware for auth
 * - Type-safe token payloads
 * 
 * Use Cases:
 * - Standalone JWT authentication
 * - OAuth callback token generation (Google, GitHub, etc.)
 * - API key authentication
 * - Session alternative
 */

import type {
  FeaturePlugin,
  PluginContext,
  PluginOutput,
  PluginRequirements,
  ValidationResult,
  HealthCheckSection
} from '../plugin.interface.js'

export interface JWTServiceConfig {
  /** User model name (default: 'User') */
  userModel?: string
  
  /** Enable refresh tokens (default: true) */
  enableRefreshTokens?: boolean
  
  /** Enable token blacklist/revocation (default: false) */
  enableBlacklist?: boolean
  
  /** Access token expiry (default: '15m') */
  accessTokenExpiry?: string
  
  /** Refresh token expiry (default: '7d') */
  refreshTokenExpiry?: string
  
  /** Token issuer (default: 'ssot-api') */
  issuer?: string
  
  /** Token audience (default: 'ssot-client') */
  audience?: string
}

export class JWTServicePlugin implements FeaturePlugin {
  name = 'jwt-service'
  version = '1.0.0'
  description = 'JWT token generation, verification, and refresh mechanism'
  enabled = true
  
  private config: Required<JWTServiceConfig>
  
  constructor(config: JWTServiceConfig = {}) {
    this.config = {
      userModel: 'User',
      enableRefreshTokens: true,
      enableBlacklist: false,
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
      issuer: 'ssot-api',
      audience: 'ssot-client',
      ...config
    }
  }
  
  requirements: PluginRequirements = {
    models: {
      required: ['User'],  // Need a User model
      optional: ['RefreshToken']  // For refresh token storage
    },
    envVars: {
      required: ['JWT_SECRET'],
      optional: ['JWT_REFRESH_SECRET', 'JWT_ISSUER', 'JWT_AUDIENCE']
    },
    dependencies: {
      runtime: {
        'jsonwebtoken': '^9.0.2'
      },
      dev: {
        '@types/jsonwebtoken': '^9.0.5'
      }
    }
  }
  
  /**
   * Validate plugin can be used
   */
  validate(context: PluginContext): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    
    // Check User model exists
    const userModel = context.schema.models.find(m => 
      m.name === this.config.userModel
    )
    
    if (!userModel) {
      errors.push(`User model '${this.config.userModel}' not found. JWT requires a User model.`)
      suggestions.push(`Add a User model to your schema or configure a different userModel`)
    }
    
    // Check for RefreshToken model if refresh enabled
    if (this.config.enableRefreshTokens) {
      const refreshTokenModel = context.schema.models.find(m => m.name === 'RefreshToken')
      
      if (!refreshTokenModel) {
        warnings.push(`RefreshToken model not found. Refresh tokens will be stored in memory (not persistent).`)
        suggestions.push(`For persistent refresh tokens, add this model:
          
model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  createdAt DateTime @default(now())
}`)
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
   * Generate JWT service code
   */
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    // Core JWT utilities
    files.set('auth/utils/jwt.util.ts', this.generateJWTUtil())
    
    // JWT middleware
    files.set('auth/middleware/jwt.middleware.ts', this.generateJWTMiddleware())
    
    // Token service (refresh, blacklist)
    if (this.config.enableRefreshTokens || this.config.enableBlacklist) {
      files.set('auth/services/token.service.ts', this.generateTokenService())
    }
    
    // Types
    files.set('auth/types/jwt.types.ts', this.generateJWTTypes())
    
    // Barrel export
    files.set('auth/jwt.ts', this.generateBarrelExport())
    
    return {
      files,
      routes: [],  // JWT service doesn't add routes (auth providers do)
      middleware: [
        {
          name: 'requireAuth',
          importPath: './auth/middleware/jwt.middleware.js',
          global: false
        },
        {
          name: 'optionalAuth',
          importPath: './auth/middleware/jwt.middleware.js',
          global: false
        },
        {
          name: 'requireRole',
          importPath: './auth/middleware/jwt.middleware.js',
          global: false
        }
      ],
      envVars: {
        JWT_SECRET: 'your-super-secret-jwt-key-change-in-production',
        ...(this.config.enableRefreshTokens && { JWT_REFRESH_SECRET: 'your-refresh-token-secret' }),
        JWT_ACCESS_EXPIRY: this.config.accessTokenExpiry,
        ...(this.config.enableRefreshTokens && { JWT_REFRESH_EXPIRY: this.config.refreshTokenExpiry }),
        JWT_ISSUER: this.config.issuer,
        JWT_AUDIENCE: this.config.audience
      },
      packageJson: {
        dependencies: this.requirements.dependencies!.runtime,
        devDependencies: this.requirements.dependencies!.dev
      }
    }
  }
  
  /**
   * Generate core JWT utilities
   */
  private generateJWTUtil(): string {
    return `// @generated
// JWT Token Utilities
// Provides token generation, verification, and decoding

import jwt from 'jsonwebtoken'
import type { JWTPayload, JWTOptions, TokenPair } from '../types/jwt.types.js'

// Configuration from environment
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '${this.config.accessTokenExpiry}'
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '${this.config.refreshTokenExpiry}'
const JWT_ISSUER = process.env.JWT_ISSUER || '${this.config.issuer}'
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || '${this.config.audience}'

/**
 * Generate access token
 * 
 * @example
 * const token = generateAccessToken({ userId: 123, email: 'user@example.com' })
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    {
      expiresIn: JWT_ACCESS_EXPIRY,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    }
  )
}

${this.config.enableRefreshTokens ? `
/**
 * Generate refresh token
 * 
 * @example
 * const refreshToken = generateRefreshToken({ userId: 123 })
 */
export function generateRefreshToken(payload: { userId: number | string }): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_REFRESH_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRY,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    }
  )
}

/**
 * Generate token pair (access + refresh)
 * 
 * @example
 * const { accessToken, refreshToken } = generateTokenPair({
 *   userId: 123,
 *   email: 'user@example.com'
 * })
 */
export function generateTokenPair(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ userId: payload.userId })
  }
}
` : ''}

/**
 * Verify access token
 * 
 * @throws Error if token is invalid or expired
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    }) as JWTPayload
    
    if (payload.type !== 'access') {
      throw new Error('Invalid token type')
    }
    
    return payload
  } catch (error) {
    throw new Error('Invalid or expired access token')
  }
}

${this.config.enableRefreshTokens ? `
/**
 * Verify refresh token
 * 
 * @throws Error if token is invalid or expired
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    }) as JWTPayload
    
    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type')
    }
    
    return payload
  } catch (error) {
    throw new Error('Invalid or expired refresh token')
  }
}
` : ''}

/**
 * Decode token without verification (for debugging)
 * 
 * @example
 * const payload = decodeToken(token)
 * console.log('Token expires:', new Date(payload.exp * 1000))
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch (error) {
    return null
  }
}

/**
 * Check if token is expired (without verification)
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) return true
  
  return decoded.exp * 1000 < Date.now()
}

/**
 * Get token expiry time
 */
export function getTokenExpiry(token: string): Date | null {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) return null
  
  return new Date(decoded.exp * 1000)
}

/**
 * Generate custom token with options
 */
export function generateCustomToken(payload: object, options: JWTOptions): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: options.expiresIn || JWT_ACCESS_EXPIRY,
    issuer: options.issuer || JWT_ISSUER,
    audience: options.audience || JWT_AUDIENCE,
    ...options
  })
}
`
  }
  
  /**
   * Generate JWT middleware
   */
  private generateJWTMiddleware(): string {
    return `// @generated
// JWT Authentication Middleware

import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, decodeToken } from '../utils/jwt.util.js'
${this.config.enableBlacklist ? "import { tokenService } from '../services/token.service.js'" : ''}

/**
 * Extract token from request
 * Supports:
 * - Authorization: Bearer <token>
 * - Authorization: JWT <token>
 * - ?token=<token> (query param)
 * - x-auth-token header
 */
function extractToken(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization
  if (authHeader) {
    const parts = authHeader.split(' ')
    if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'JWT')) {
      return parts[1]
    }
  }
  
  // Check query parameter
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token
  }
  
  // Check custom header
  const customHeader = req.headers['x-auth-token']
  if (customHeader && typeof customHeader === 'string') {
    return customHeader
  }
  
  return null
}

/**
 * Require authentication
 * 
 * Use this middleware on routes that require authentication
 * 
 * @example
 * router.get('/profile', requireAuth, getProfile)
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req)
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided' 
      })
    }
    ${this.config.enableBlacklist ? `
    // Check if token is blacklisted
    const isBlacklisted = await tokenService.isBlacklisted(token)
    if (isBlacklisted) {
      return res.status(401).json({ 
        error: 'Token revoked',
        message: 'This token has been revoked' 
      })
    }
    ` : ''}
    
    // Verify token
    const payload = verifyAccessToken(token)
    
    // Attach payload to request
    req.user = payload
    req.token = token
    
    next()
  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid token',
      message: error instanceof Error ? error.message : 'Authentication failed'
    })
  }
}

/**
 * Optional authentication
 * 
 * Attaches user if token is valid, but doesn't block if missing/invalid
 * 
 * @example
 * router.get('/posts', optionalAuth, listPosts)
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req)
    
    if (!token) {
      return next()
    }
    ${this.config.enableBlacklist ? `
    // Check if token is blacklisted
    const isBlacklisted = await tokenService.isBlacklisted(token)
    if (isBlacklisted) {
      return next()
    }
    ` : ''}
    
    // Verify token (ignore errors)
    const payload = verifyAccessToken(token)
    req.user = payload
    req.token = token
  } catch (error) {
    // Ignore authentication errors for optional auth
  }
  
  next()
}

/**
 * Require specific role
 * 
 * @example
 * router.delete('/users/:id', requireAuth, requireRole('admin'), deleteUser)
 */
export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    const userRole = (req.user as any).role
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: \`Required role: \${roles.join(' or ')}\`
      })
    }
    
    next()
  }
}

/**
 * Require token to be fresh (not close to expiry)
 * 
 * @param maxAge Maximum age in seconds (default: 5 minutes)
 * 
 * @example
 * router.post('/sensitive', requireAuth, requireFreshToken(300), doSensitiveAction)
 */
export function requireFreshToken(maxAge: number = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.token) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    const decoded = decodeToken(req.token)
    if (!decoded || !decoded.iat) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    
    const tokenAge = Math.floor(Date.now() / 1000) - decoded.iat
    if (tokenAge > maxAge) {
      return res.status(401).json({ 
        error: 'Token too old',
        message: 'Please refresh your token'
      })
    }
    
    next()
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any
      token?: string
    }
  }
}
`
  }
  
  /**
   * Generate token service (refresh + blacklist)
   */
  private generateTokenService(): string {
    const hasRefreshTokenModel = this.config.enableRefreshTokens
    
    return `// @generated
// Token Service - Refresh and revocation management

import prisma from '@/db'
${this.config.enableRefreshTokens ? "import { generateAccessToken, verifyRefreshToken } from '../utils/jwt.util.js'" : ''}
import type { TokenPair } from '../types/jwt.types.js'

${this.config.enableBlacklist ? `
/**
 * In-memory token blacklist
 * For production, use Redis or database
 */
const tokenBlacklist = new Set<string>()

/**
 * Cleanup expired entries every hour
 */
setInterval(() => {
  // In production, this would clean up expired tokens from Redis/DB
  if (tokenBlacklist.size > 10000) {
    tokenBlacklist.clear()
  }
}, 60 * 60 * 1000)
` : ''}

export const tokenService = {
  ${this.config.enableRefreshTokens ? `
  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken)
      
      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      })
      
      if (!storedToken) {
        return null
      }
      
      // Check if expired
      if (storedToken.expiresAt < new Date()) {
        // Clean up expired token
        await prisma.refreshToken.delete({ where: { id: storedToken.id } })
        return null
      }
      
      // Generate new access token
      const accessToken = generateAccessToken({
        userId: storedToken.userId,
        email: storedToken.user.email,
        name: storedToken.user.name,
        role: storedToken.user.role
      })
      
      return {
        accessToken,
        refreshToken // Return same refresh token
      }
    } catch (error) {
      return null
    }
  },
  
  /**
   * Store refresh token in database
   */
  async storeRefreshToken(userId: number, refreshToken: string, expiresIn: string = '${this.config.refreshTokenExpiry}'): Promise<void> {
    // Calculate expiry date
    const expiryMs = parseExpiry(expiresIn)
    const expiresAt = new Date(Date.now() + expiryMs)
    
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt
      }
    })
  },
  
  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      await prisma.refreshToken.delete({
        where: { token: refreshToken }
      })
      return true
    } catch (error) {
      return false
    }
  },
  
  /**
   * Revoke all user's refresh tokens
   */
  async revokeAllUserTokens(userId: number): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: { userId }
    })
    return result.count
  },
  
  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
    return result.count
  },
  ` : ''}
  
  ${this.config.enableBlacklist ? `
  /**
   * Add token to blacklist
   * 
   * For production: Use Redis with TTL
   */
  async blacklistToken(token: string): Promise<void> {
    tokenBlacklist.add(token)
    
    // In production, store in Redis with TTL equal to token expiry
    // await redis.setex(\`blacklist:\${token}\`, tokenTTL, '1')
  },
  
  /**
   * Check if token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    return tokenBlacklist.has(token)
    
    // In production, check Redis
    // return await redis.exists(\`blacklist:\${token}\`) === 1
  },
  
  /**
   * Revoke token (add to blacklist)
   */
  async revokeToken(token: string): Promise<void> {
    await this.blacklistToken(token)
  },
  ` : ''}
}

/**
 * Parse expiry string to milliseconds
 */
function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\\d+)([smhd])$/)
  if (!match) return 15 * 60 * 1000 // Default: 15 minutes
  
  const value = parseInt(match[1])
  const unit = match[2]
  
  switch (unit) {
    case 's': return value * 1000
    case 'm': return value * 60 * 1000
    case 'h': return value * 60 * 60 * 1000
    case 'd': return value * 24 * 60 * 60 * 1000
    default: return 15 * 60 * 1000
  }
}
`
  }
  
  /**
   * Generate TypeScript types
   */
  private generateJWTTypes(): string {
    return `// @generated
// JWT Type Definitions

/**
 * JWT token payload
 */
export interface JWTPayload {
  userId: number | string
  email?: string
  name?: string
  role?: string
  type: 'access' | 'refresh'
  
  // Standard JWT claims
  iat: number  // Issued at
  exp: number  // Expires at
  iss?: string // Issuer
  aud?: string // Audience
}

/**
 * JWT signing options
 */
export interface JWTOptions {
  expiresIn?: string | number
  issuer?: string
  audience?: string | string[]
  subject?: string
  notBefore?: string | number
}

${this.config.enableRefreshTokens ? `
/**
 * Token pair (access + refresh)
 */
export interface TokenPair {
  accessToken: string
  refreshToken: string
}

/**
 * Token refresh request
 */
export interface TokenRefreshRequest {
  refreshToken: string
}

/**
 * Token refresh response
 */
export interface TokenRefreshResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}
` : ''}

/**
 * Decoded token info
 */
export interface DecodedToken {
  payload: JWTPayload
  isExpired: boolean
  expiresAt: Date | null
  issuedAt: Date | null
}
`
  }
  
  /**
   * Generate barrel export
   */
  private generateBarrelExport(): string {
    return `// @generated
// JWT Service - Barrel Export

export { 
  generateAccessToken,
  ${this.config.enableRefreshTokens ? 'generateRefreshToken, generateTokenPair,' : ''}
  verifyAccessToken,
  ${this.config.enableRefreshTokens ? 'verifyRefreshToken,' : ''}
  decodeToken,
  isTokenExpired,
  getTokenExpiry,
  generateCustomToken
} from './utils/jwt.util.js'

export { 
  requireAuth,
  requireAuth as authenticate,  // Alias for backward compatibility
  optionalAuth,
  requireRole,
  requireFreshToken
} from './middleware/jwt.middleware.js'

${this.config.enableRefreshTokens || this.config.enableBlacklist ? "export { tokenService } from './services/token.service.js'" : ''}

export type { 
  JWTPayload, 
  JWTOptions,
  ${this.config.enableRefreshTokens ? 'TokenPair, TokenRefreshRequest, TokenRefreshResponse,' : ''}
  DecodedToken
} from './types/jwt.types.js'
`
  }
  
  /**
   * Health check for JWT service
   */
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'jwt-service',
      title: '🔑 JWT Service',
      icon: '🔑',
      checks: [
        {
          id: 'jwt-secret',
          name: 'JWT Secret Configured',
          description: 'Validates JWT_SECRET environment variable is set and not using default',
          testFunction: `
            const secret = process.env.JWT_SECRET
            return {
              success: !!secret && secret !== 'change-this-secret-in-production',
              message: secret && secret !== 'change-this-secret-in-production'
                ? 'JWT secret configured'
                : secret
                  ? '⚠️ Using default secret (change in production!)'
                  : '❌ JWT_SECRET not set'
            }
          `
        },
        {
          id: 'jwt-generation',
          name: 'Token Generation',
          description: 'Tests JWT token generation and verification',
          testFunction: `
            const { generateAccessToken, verifyAccessToken } = await import('@/auth/jwt.js')
            const token = generateAccessToken({ userId: 1, email: 'test@example.com' })
            const payload = verifyAccessToken(token)
            return {
              success: payload.userId === 1,
              message: 'JWT generation and verification working'
            }
          `
        },
        ...(this.config.enableRefreshTokens ? [{
          id: 'jwt-refresh',
          name: 'Token Refresh',
          description: 'Tests refresh token generation and verification',
          testFunction: `
            const { generateRefreshToken, verifyRefreshToken } = await import('@/auth/jwt.js')
            const refreshToken = generateRefreshToken({ userId: 1 })
            const payload = verifyRefreshToken(refreshToken)
            return {
              success: payload.type === 'refresh',
              message: 'Refresh token generation working'
            }
          `
        }] : []),
        {
          id: 'jwt-middleware',
          name: 'Auth Middleware',
          description: 'Validates JWT middleware functions are available',
          testFunction: `
            const { requireAuth } = await import('@/auth/jwt.js')
            return {
              success: typeof requireAuth === 'function',
              message: 'Auth middleware available'
            }
          `
        }
      ]
    }
  }
}

