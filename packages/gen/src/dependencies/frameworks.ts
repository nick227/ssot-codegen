import type { DependencySet } from './types.js'
import { VERSIONS } from './versions.js'

/**
 * Framework-specific dependencies
 */

export const EXPRESS_DEPENDENCIES: DependencySet = {
  runtime: {
    'express': VERSIONS.express,
    'express-async-errors': VERSIONS.expressAsyncErrors,
  },
  dev: {
    '@types/express': VERSIONS.typesExpress,
  }
}

export const EXPRESS_PLUGINS = {
  // Core middleware
  core: {
    'morgan': VERSIONS.morgan,
    'compression': VERSIONS.compression,
    'cookie-parser': VERSIONS.cookieParser,
  },
  
  // Security
  security: {
    'helmet': VERSIONS.helmet,
    'cors': VERSIONS.cors,
    'express-rate-limit': VERSIONS.expressRateLimit,
  },
  
  // Validation
  validation: {
    'express-validator': VERSIONS.expressValidator,
  },
  
  // File handling
  fileHandling: {
    'multer': VERSIONS.multer,
  },
  
  // Dev types
  devTypes: {
    '@types/morgan': VERSIONS.typesMorgan,
    '@types/cors': VERSIONS.typesCors,
    '@types/multer': VERSIONS.typesMulter,
  }
}

export const FASTIFY_DEPENDENCIES: DependencySet = {
  runtime: {
    'fastify': VERSIONS.fastify,
  },
  dev: {}
}

export const FASTIFY_PLUGINS = {
  // Core
  core: {
    '@fastify/compress': VERSIONS.fastifyCompress,
    '@fastify/cookie': VERSIONS.cookieParser, // Reuse cookie-parser version
  },
  
  // Security
  security: {
    '@fastify/helmet': VERSIONS.fastifyHelmet,
    '@fastify/cors': VERSIONS.fastifyCors,
    '@fastify/rate-limit': VERSIONS.fastifyRateLimit,
  },
  
  // Documentation
  documentation: {
    '@fastify/swagger': VERSIONS.fastifySwagger,
    '@fastify/swagger-ui': VERSIONS.fastifySwaggerUi,
  }
}

/**
 * Get framework dependencies
 */
export function getFrameworkDependencies(
  framework: 'express' | 'fastify',
  includePlugins: string[] = []
): DependencySet {
  const base = framework === 'express' 
    ? EXPRESS_DEPENDENCIES 
    : FASTIFY_DEPENDENCIES
  
  const plugins = framework === 'express'
    ? EXPRESS_PLUGINS
    : FASTIFY_PLUGINS
  
  const runtime = { ...base.runtime }
  const dev = { ...base.dev }
  
  // Add requested plugins
  for (const pluginGroup of includePlugins) {
    if (plugins[pluginGroup as keyof typeof plugins]) {
      Object.assign(runtime, plugins[pluginGroup as keyof typeof plugins])
    }
  }
  
  return { runtime, dev }
}

/**
 * Get recommended plugins for framework
 */
export function getRecommendedPlugins(
  framework: 'express' | 'fastify',
  scenario: 'minimal' | 'standard' | 'production' = 'standard'
): string[] {
  const recommendations = {
    express: {
      minimal: [],
      standard: ['core', 'security'],
      production: ['core', 'security', 'validation']
    },
    fastify: {
      minimal: [],
      standard: ['core', 'security'],
      production: ['core', 'security', 'documentation']
    }
  }
  
  return recommendations[framework][scenario]
}

