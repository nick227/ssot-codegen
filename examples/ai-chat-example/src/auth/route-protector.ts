/**
 * Route Protection Helpers
 * 
 * Simplified API for protecting routes with authentication and authorization.
 * Reduces boilerplate and makes route definitions more readable.
 */

import type { RequestHandler } from 'express'
import { authenticate } from './jwt.js'
import { requireResourceOwnership } from './authorization.js'

export interface ProtectionConfig {
  service?: any          // For ownership checking
  ownerField?: string    // Default: 'authorId'
  requireAuth?: boolean  // Default: true for non-public
  roles?: string[]       // Required roles (OR logic)
  ownerOrRoles?: string[] // Owner OR these roles (most common pattern)
  public?: boolean       // Public route (no auth required)
}

/**
 * Protect a route with authentication and/or authorization
 * 
 * @example
 * // Public route
 * router.get('/posts', ...protect({ public: true }), handler)
 * 
 * @example
 * // Authenticated only
 * router.get('/profile', ...protect(), handler)
 * 
 * @example
 * // Requires specific role
 * router.post('/posts', ...protect({ roles: ['AUTHOR', 'ADMIN'] }), handler)
 * 
 * @example
 * // Requires ownership OR admin role (most common)
 * router.put('/posts/:id', ...protect({ 
 *   service: postService, 
 *   ownerOrRoles: ['ADMIN', 'EDITOR'] 
 * }), handler)
 */
export const protect = (config: ProtectionConfig = {}): RequestHandler[] => {
  const middleware: RequestHandler[] = []
  
  // Public routes - no protection needed
  if (config.public) {
    return middleware
  }
  
  // Authentication (default for all non-public routes)
  if (config.requireAuth !== false) {
    middleware.push(authenticate)
  }
  
  // Role-based protection (simple RBAC)
  if (config.roles && config.roles.length > 0) {
    middleware.push(requireRole(...config.roles))
  }
  
  // Ownership-based protection (with optional role bypass)
  if (config.service && config.ownerOrRoles) {
    const ownerField = config.ownerField || detectOwnerField(config.service)
    const resourceName = extractResourceName(config.service) || 'Resource'
    
    middleware.push(requireResourceOwnership({
      service: config.service,
      ownerField,
      resourceName,
      allowedRoles: config.ownerOrRoles
    }))
  }
  
  return middleware
}

/**
 * Role-based authorization (re-exported from authorization.ts for convenience)
 * This is a simplified wrapper that we'll use internally
 */
import type { Response, NextFunction } from 'express'
import type { AuthRequest } from './jwt.js'
import { logger } from '../logger.js'

const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn({ path: req.path }, 'Role check failed: no user')
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      })
    }

    const userRole = req.user.role || 'USER'
    
    if (!allowedRoles.includes(userRole)) {
      logger.warn({ 
        userId: req.user.userId, 
        userRole, 
        requiredRoles: allowedRoles,
        path: req.path
      }, 'Role check failed')
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`
      })
    }

    logger.debug({ userId: req.user.userId, userRole, path: req.path }, 'Role check passed')
    next()
  }
}

/**
 * Attempt to detect owner field from service or model name
 */
function detectOwnerField(service: any): string {
  // Check if service has metadata about owner field
  if (service.ownerField) {
    return service.ownerField
  }
  
  // Try to extract from service name
  const serviceName = service.constructor?.name || ''
  
  // Common patterns
  if (serviceName.toLowerCase().includes('post')) {
    return 'authorId'
  }
  if (serviceName.toLowerCase().includes('comment')) {
    return 'authorId'
  }
  if (serviceName.toLowerCase().includes('product')) {
    return 'sellerId'
  }
  
  // Default fallbacks in order of likelihood
  return 'authorId'  // Most common in blog/CMS systems
}

/**
 * Extract resource name from service
 */
function extractResourceName(service: any): string | null {
  // Try to get from service metadata
  if (service.resourceName) {
    return service.resourceName
  }
  
  // Try to parse from variable name (won't work at runtime, but helps in dev)
  const serviceName = service.constructor?.name || ''
  if (serviceName.toLowerCase().includes('service')) {
    const modelName = serviceName.replace(/service/i, '')
    return modelName.charAt(0).toUpperCase() + modelName.slice(1)
  }
  
  return null
}

/**
 * Convenience exports for common protection patterns
 */

// Public (no auth)
export const publicRoute = (): RequestHandler[] => protect({ public: true })

// Authenticated (logged in)
export const authRoute = (): RequestHandler[] => protect()

// Specific role required
export const roleRoute = (...roles: string[]): RequestHandler[] => protect({ roles })

// Owner or specific roles (most common pattern)
export const ownerRoute = (service: any, ownerField?: string, bypassRoles: string[] = ['ADMIN']): RequestHandler[] => 
  protect({ service, ownerField, ownerOrRoles: bypassRoles })

// Admin only
export const adminOnly = (): RequestHandler[] => protect({ roles: ['ADMIN'] })

// Editor or admin
export const editorOrAdmin = (): RequestHandler[] => protect({ roles: ['EDITOR', 'ADMIN'] })

