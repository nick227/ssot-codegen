/**
 * Authorization Utilities
 * 
 * Advanced authorization middleware for resource ownership and permissions.
 * Works with generated services to verify ownership before allowing operations.
 */

import type { Response, NextFunction } from 'express'
import type { AuthRequest } from './jwt.js'
import { logger } from '../logger.js'

/**
 * Generic ownership checker that fetches resource and verifies ownership
 */
export interface OwnershipConfig {
  service: any  // Service with findById method
  ownerField: string  // Field that contains the owner ID (e.g., 'authorId', 'userId')
  resourceName: string  // For error messages (e.g., 'Post', 'Comment')
  allowedRoles?: string[]  // Roles that bypass ownership check (default: ['ADMIN'])
  idParam?: string  // Request param containing resource ID (default: 'id')
}

/**
 * Require ownership of a resource
 * 
 * Usage:
 * ```typescript
 * postRouter.put('/:id', 
 *   authenticate,
 *   requireResourceOwnership({
 *     service: postService,
 *     ownerField: 'authorId',
 *     resourceName: 'Post'
 *   }),
 *   postController.updatePost
 * )
 * ```
 */
export const requireResourceOwnership = (config: OwnershipConfig) => {
  const {
    service,
    ownerField,
    resourceName,
    allowedRoles = ['ADMIN'],
    idParam = 'id'
  } = config

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Must be authenticated
      if (!req.user) {
        logger.warn({ path: req.path }, 'Ownership check failed: no user')
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        })
      }

      // Check if user has bypass role (e.g., ADMIN)
      const userRole = req.user.role || 'USER'
      if (allowedRoles.includes(userRole)) {
        logger.debug({ userId: req.user.userId, role: userRole, resource: resourceName }, 'Ownership check bypassed for role')
        return next()
      }

      // Get resource ID from params
      const resourceId = req.params[idParam]
      if (!resourceId) {
        logger.warn({ path: req.path, idParam }, 'Ownership check failed: no resource ID')
        return res.status(400).json({
          error: 'Bad Request',
          message: `Missing ${idParam} parameter`
        })
      }

      // Parse ID (handle both string and number IDs)
      const parsedId = isNaN(Number(resourceId)) ? resourceId : Number(resourceId)

      // Fetch resource from database
      const resource = await service.findById(parsedId)

      if (!resource) {
        logger.warn({ resourceId, resourceName }, 'Ownership check failed: resource not found')
        return res.status(404).json({
          error: 'Not Found',
          message: `${resourceName} not found`
        })
      }

      // Check ownership
      const ownerId = resource[ownerField]
      if (!ownerId) {
        logger.error({ resourceId, resourceName, ownerField }, 'Ownership check failed: owner field missing')
        return res.status(500).json({
          error: 'Internal Server Error',
          message: `${resourceName} is missing owner information`
        })
      }

      // Compare owner ID with authenticated user ID
      const userIdStr = String(req.user.userId)
      const ownerIdStr = String(ownerId)

      if (userIdStr !== ownerIdStr) {
        logger.warn({ 
          userId: req.user.userId, 
          ownerId, 
          resourceId, 
          resourceName 
        }, 'Ownership check failed: user is not owner')
        return res.status(403).json({
          error: 'Forbidden',
          message: `You do not have permission to modify this ${resourceName}`
        })
      }

      // Success - attach resource to request for potential reuse
      req.resource = resource

      logger.debug({ 
        userId: req.user.userId, 
        resourceId, 
        resourceName 
      }, 'Ownership check passed')
      
      next()
    } catch (error) {
      logger.error({ error, resourceName, idParam: req.params[idParam] }, 'Ownership check error')
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify ownership'
      })
    }
  }
}

/**
 * Require specific role(s) with better error messages
 */
export const requireRole = (...allowedRoles: string[]) => {
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
 * Require ownership OR specific role (most common pattern)
 * 
 * Usage:
 * ```typescript
 * postRouter.delete('/:id', 
 *   authenticate,
 *   requireOwnershipOrRole({
 *     service: postService,
 *     ownerField: 'authorId',
 *     resourceName: 'Post',
 *     allowedRoles: ['ADMIN', 'EDITOR']
 *   }),
 *   postController.deletePost
 * )
 * ```
 */
export const requireOwnershipOrRole = (config: OwnershipConfig) => {
  return requireResourceOwnership(config)  // Already supports allowedRoles
}

/**
 * Check if user can perform action on resource (doesn't fail, just checks)
 * Useful for adding permission flags to response data
 */
export interface PermissionCheck {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canPublish?: boolean
}

export const checkPermissions = (
  user: AuthRequest['user'],
  resource: any,
  ownerField: string
): PermissionCheck => {
  if (!user) {
    return { canView: true, canEdit: false, canDelete: false, canPublish: false }
  }

  const userRole = user.role || 'USER'
  const isAdmin = userRole === 'ADMIN'
  const isEditor = userRole === 'EDITOR'
  const isOwner = String(user.userId) === String(resource[ownerField])

  return {
    canView: true,  // Assume public or authenticated can view
    canEdit: isOwner || isAdmin || isEditor,
    canDelete: isOwner || isAdmin,
    canPublish: isOwner || isAdmin || isEditor
  }
}

// Extend Express Request type to include resource
declare global {
  namespace Express {
    interface Request {
      resource?: any
    }
  }
}

