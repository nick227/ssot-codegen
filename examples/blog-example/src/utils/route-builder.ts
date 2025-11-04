/**
 * Convention-Based Route Builder
 * 
 * Builds protected routers with minimal configuration.
 * Reduces 180-line route files to 40-line configs!
 */

import { Router } from 'express'
import type { ProtectionConfig } from '../auth/route-protector.js'
import { protect } from '../auth/route-protector.js'
import { wrapController } from '../utils/controller-wrapper.js'
import { logger } from '../logger.js'

type ProtectionType = 'public' | 'auth' | { roles: string[] } | { ownerOrRoles: string[] }

interface CustomRoute {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete'
  path: string
  controller: string
  protection: ProtectionType
}

export interface RouteConfig {
  model: string              // Model name (e.g., 'post')
  service?: any              // Service for ownership checks
  ownerField?: string        // Owner field name (default: auto-detect)
  
  // Standard CRUD permissions
  list?: ProtectionType      // GET /
  get?: ProtectionType       // GET /:id
  create?: ProtectionType    // POST /
  update?: ProtectionType    // PUT/PATCH /:id
  delete?: ProtectionType    // DELETE /:id
  count?: ProtectionType     // GET /meta/count
  
  // Custom routes
  custom?: CustomRoute[]
  
  // Options
  skipCRUD?: boolean         // Skip standard CRUD routes
  modelNameOverride?: string // Override capitalized model name
}

/**
 * Build a protected router with convention-based configuration
 * 
 * @example
 * ```typescript
 * export const protectedPostRouter = buildProtectedRouter({
 *   model: 'post',
 *   service: postService,
 *   
 *   list: 'auth',
 *   get: 'auth',
 *   create: { roles: ['AUTHOR', 'EDITOR', 'ADMIN'] },
 *   update: { ownerOrRoles: ['ADMIN', 'EDITOR'] },
 *   delete: { ownerOrRoles: ['ADMIN'] },
 *   
 *   custom: [
 *     { method: 'get', path: '/published', controller: 'listPublishedPosts', protection: 'public' }
 *   ]
 * })
 * ```
 */
export const buildProtectedRouter = (config: RouteConfig): Router => {
  const router = Router()
  const { model, service, ownerField } = config
  const modelCap = config.modelNameOverride || capitalize(model)
  
  logger.debug({ model }, 'Building protected router')
  
  // Standard CRUD routes
  if (!config.skipCRUD) {
    // List (GET /)
    if (config.list !== undefined) {
      const protection = buildProtection(config.list, service, ownerField)
      router.get('/', ...protection, wrapController(model, `list${modelCap}s`))
    }
    
    // Get by ID (GET /:id)
    if (config.get !== undefined) {
      const protection = buildProtection(config.get, service, ownerField)
      router.get('/:id', ...protection, wrapController(model, `get${modelCap}`))
    }
    
    // Create (POST /)
    if (config.create !== undefined) {
      const protection = buildProtection(config.create, service, ownerField)
      router.post('/', ...protection, wrapController(model, `create${modelCap}`))
    }
    
    // Update (PUT/PATCH /:id)
    if (config.update !== undefined) {
      const protection = buildProtection(config.update, service, ownerField)
      router.put('/:id', ...protection, wrapController(model, `update${modelCap}`))
      router.patch('/:id', ...protection, wrapController(model, `update${modelCap}`))
    }
    
    // Delete (DELETE /:id)
    if (config.delete !== undefined) {
      const protection = buildProtection(config.delete, service, ownerField)
      router.delete('/:id', ...protection, wrapController(model, `delete${modelCap}`))
    }
    
    // Count (GET /meta/count)
    if (config.count !== undefined) {
      const protection = buildProtection(config.count, service, ownerField)
      router.get('/meta/count', ...protection, wrapController(model, `count${modelCap}s`))
    }
  }
  
  // Custom routes
  if (config.custom && config.custom.length > 0) {
    for (const route of config.custom) {
      const protection = buildProtection(route.protection, service, ownerField)
      router[route.method](route.path, ...protection, wrapController(model, route.controller))
    }
  }
  
  logger.info({ model, routeCount: router.stack.length }, 'Protected router built')
  
  return router
}

/**
 * Build protection middleware from config
 */
function buildProtection(
  protection: ProtectionType,
  service?: any,
  ownerField?: string
): ReturnType<typeof protect> {
  if (protection === 'public') {
    return protect({ public: true })
  }
  
  if (protection === 'auth') {
    return protect()
  }
  
  if ('roles' in protection) {
    return protect({ roles: protection.roles })
  }
  
  if ('ownerOrRoles' in protection) {
    if (!service) {
      throw new Error('Service is required for ownership-based protection')
    }
    return protect({ 
      service, 
      ownerField, 
      ownerOrRoles: protection.ownerOrRoles 
    })
  }
  
  // Default to authenticated
  return protect()
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Create a simple router with minimal config (for admin-only models)
 * 
 * @example
 * ```typescript
 * export const authorRouter = createAdminRouter('author', ['ADMIN'])
 * export const categoryRouter = createAdminRouter('category', ['ADMIN', 'EDITOR'])
 * ```
 */
export const createAdminRouter = (model: string, roles: string[]): Router => {
  return buildProtectedRouter({
    model,
    list: { roles },
    get: { roles },
    create: { roles },
    update: { roles },
    delete: { roles },
    count: { roles }
  })
}

/**
 * Create a public read-only router
 * 
 * @example
 * ```typescript
 * export const publicPostRouter = createPublicRouter('post', ['list', 'get'])
 * ```
 */
export const createPublicRouter = (model: string, allowedMethods: Array<'list' | 'get' | 'count'>): Router => {
  const config: RouteConfig = {
    model,
    skipCRUD: true
  }
  
  const router = Router()
  const modelCap = capitalize(model)
  
  if (allowedMethods.includes('list')) {
    router.get('/', ...protect({ public: true }), wrapController(model, `list${modelCap}s`))
  }
  if (allowedMethods.includes('get')) {
    router.get('/:id', ...protect({ public: true }), wrapController(model, `get${modelCap}`))
  }
  if (allowedMethods.includes('count')) {
    router.get('/meta/count', ...protect({ public: true }), wrapController(model, `count${modelCap}s`))
  }
  
  return router
}

