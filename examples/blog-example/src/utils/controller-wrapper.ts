/**
 * Controller Wrapper Utility
 * 
 * Simplifies controller imports and makes route definitions cleaner.
 * Caches controller modules for performance.
 */

import type { Request, Response } from 'express'
import { logger } from '../logger.js'

type ControllerModule = Record<string, (req: Request, res: Response) => Promise<any> | any>

// Cache controller modules to avoid repeated imports
const controllerCache = new Map<string, ControllerModule>()

/**
 * Wrap a generated controller method for easy route registration
 * 
 * @example
 * router.get('/', wrapController('post', 'listPosts'))
 * router.post('/:id/publish', wrapController('post', 'publishPost'))
 */
export const wrapController = (modelName: string, methodName: string) => {
  return async (req: Request, res: Response) => {
    try {
      // Check cache first
      let module: ControllerModule | undefined = controllerCache.get(modelName)
      
      if (!module) {
        // Dynamic import with caching
        const imported = await import(`@gen/controllers/${modelName}`)
        module = imported as ControllerModule
        controllerCache.set(modelName, module)
        logger.debug({ modelName }, 'Controller module loaded and cached')
      }
      
      if (!module) {
        logger.error({ modelName }, 'Failed to load controller module')
        return res.status(500).json({
          error: 'Internal Server Error',
          message: `Controller module ${modelName} not found`
        })
      }
      
      const method = module[methodName]
      if (!method) {
        logger.error({ modelName, methodName }, 'Controller method not found')
        return res.status(500).json({
          error: 'Internal Server Error',
          message: `Controller method ${methodName} not found`
        })
      }
      
      // Execute controller method
      await method(req, res)
    } catch (error) {
      logger.error({ error, modelName, methodName }, 'Controller execution error')
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' })
      }
    }
  }
}

/**
 * Wrap multiple controller methods at once
 * 
 * @example
 * const { list, get, create } = wrapControllers('post', ['listPosts', 'getPost', 'createPost'])
 * router.get('/', list)
 * router.get('/:id', get)
 * router.post('/', create)
 */
export const wrapControllers = <T extends string>(
  modelName: string,
  methodNames: readonly T[]
): Record<T, ReturnType<typeof wrapController>> => {
  const wrapped = {} as Record<T, ReturnType<typeof wrapController>>
  
  for (const methodName of methodNames) {
    wrapped[methodName] = wrapController(modelName, methodName)
  }
  
  return wrapped
}

/**
 * Clear controller cache (useful for testing or hot reload)
 */
export const clearControllerCache = () => {
  const count = controllerCache.size
  controllerCache.clear()
  logger.debug({ count }, 'Controller cache cleared')
}

/**
 * Preload controllers (optional performance optimization)
 */
export const preloadControllers = async (modelNames: string[]) => {
  logger.info({ models: modelNames }, 'Preloading controllers')
  
  for (const modelName of modelNames) {
    try {
      const module = await import(`@gen/controllers/${modelName}`)
      controllerCache.set(modelName, module)
      logger.debug({ modelName }, 'Controller preloaded')
    } catch (error) {
      logger.warn({ modelName, error }, 'Failed to preload controller')
    }
  }
  
  logger.info({ count: controllerCache.size }, 'Controllers preloaded')
}

