/**
 * Extension Auto-Registration
 * 
 * Automatically discovers and registers all extension routes.
 * No need to manually wire up routes in app.ts!
 */

import type { Application, Router } from 'express'
import { authenticate } from '../auth/jwt.js'
import { requireRole } from '../auth/authorization.js'
import { logger } from '../logger.js'

interface ExtensionMetadata {
  basePath: string
  priority?: number
  description?: string
}

interface ExtensionRouter extends Router {
  __meta?: ExtensionMetadata
}

interface ExtensionModule {
  protectedPostRouter?: ExtensionRouter
  protectedCommentRouter?: ExtensionRouter
  protectedProductRouter?: ExtensionRouter
  [key: string]: any
}

/**
 * Auto-discover and register all extension routes
 * 
 * Scans extensions/ folder for routes and registers them automatically.
 */
export async function registerExtensions(app: Application, apiPrefix: string = '/api'): Promise<void> {
  logger.info('Starting extension auto-registration')
  
  const extensions: Array<{ router: Router; meta: ExtensionMetadata }> = []
  
  // Attempt to load post extensions
  try {
    const postModule = await import('./post/post.routes.ext.js') as ExtensionModule
    if (postModule.protectedPostRouter) {
      const router = postModule.protectedPostRouter
      const meta = router.__meta || { basePath: '/posts', priority: 10 }
      extensions.push({ router, meta })
      logger.debug({ basePath: meta.basePath }, 'Found post extension')
    }
  } catch (error) {
    logger.debug({ error }, 'No post extensions found (this is OK)')
  }
  
  // Attempt to load comment extensions
  try {
    const commentModule = await import('./comment/comment.routes.ext.js') as ExtensionModule
    if (commentModule.protectedCommentRouter) {
      const router = commentModule.protectedCommentRouter
      const meta = router.__meta || { basePath: '/comments', priority: 10 }
      extensions.push({ router, meta })
      logger.debug({ basePath: meta.basePath }, 'Found comment extension')
    }
  } catch (error) {
    logger.debug({ error }, 'No comment extensions found (this is OK)')
  }
  
  // Sort by priority (lower numbers first)
  extensions.sort((a, b) => (a.meta.priority || 100) - (b.meta.priority || 100))
  
  // Register all extensions
  for (const { router, meta } of extensions) {
    const fullPath = `${apiPrefix}${meta.basePath}`
    app.use(fullPath, router)
    logger.info({ 
      path: fullPath, 
      priority: meta.priority, 
      description: meta.description 
    }, 'Registered extension routes')
  }
  
  logger.info({ count: extensions.length }, `✅ Registered ${extensions.length} extension module(s)`)
}

/**
 * Register admin-only generated routes
 * 
 * For models that don't need custom extensions but should be admin-protected.
 */
export async function registerAdminRoutes(app: Application, apiPrefix: string = '/api'): Promise<void> {
  logger.info('Registering admin-only routes')
  
  const adminRoutes = [
    { path: '/authors', module: '@gen/routes/author', export: 'authorRouter', roles: ['ADMIN'] },
    { path: '/categories', module: '@gen/routes/category', export: 'categoryRouter', roles: ['ADMIN', 'EDITOR'] },
    { path: '/tags', module: '@gen/routes/tag', export: 'tagRouter', roles: ['ADMIN', 'EDITOR'] },
  ]
  
  for (const route of adminRoutes) {
    try {
      const module = await import(route.module)
      const router = module[route.export]
      
      if (router) {
        const fullPath = `${apiPrefix}${route.path}`
        app.use(fullPath, authenticate, requireRole(...route.roles), router)
        logger.info({ path: fullPath, roles: route.roles }, 'Registered admin route')
      }
    } catch (error) {
      logger.warn({ path: route.path, error }, 'Failed to load admin route')
    }
  }
}

/**
 * Register all routes (extensions + admin)
 * 
 * Single function call to set up all API routes!
 * 
 * @example
 * ```typescript
 * // app.ts
 * import { registerAllRoutes } from './extensions/index.js'
 * 
 * await registerAllRoutes(app, config.api.prefix)
 * // Done! All routes registered with proper authorization 🎉
 * ```
 */
export async function registerAllRoutes(app: Application, apiPrefix: string = '/api'): Promise<void> {
  logger.info({ apiPrefix }, 'Registering all routes')
  
  // Register custom extensions first
  await registerExtensions(app, apiPrefix)
  
  // Register admin-protected generated routes
  await registerAdminRoutes(app, apiPrefix)
  
  logger.info('✅ All routes registered successfully')
}

