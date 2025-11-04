/**
 * Flexible, developer-friendly dependency management system
 * 
 * Features:
 * - Profile-based presets (minimal, standard, production, full)
 * - Optional feature flags (logging, testing, linting, etc.)
 * - Framework-specific dependencies (Express/Fastify)
 * - Version override support
 * - Centralized version management
 * 
 * Usage:
 * 
 * ```typescript
 * import { resolveDependencies } from './dependencies/index.js'
 * 
 * // Use a profile
 * const deps = resolveDependencies({ profile: 'production' })
 * 
 * // Customize with features
 * const deps = resolveDependencies({
 *   profile: 'standard',
 *   features: ['logging', 'testing', 'linting']
 * })
 * 
 * // Override versions
 * const deps = resolveDependencies({
 *   profile: 'standard',
 *   versions: {
 *     'express': '^5.0.0'  // Use Express 5 instead
 *   }
 * })
 * ```
 */

// Core exports
export { VERSIONS, getVersion, isValidVersion } from './versions.js'
export { PROFILES, getProfile, listProfiles, type ProfileName } from './profiles.js'
export { FEATURES, resolveFeatures, getFeature, listFeatures, FEATURE_PRESETS, type FeatureName } from './features.js'
export { getFrameworkDependencies, getRecommendedPlugins, EXPRESS_PLUGINS, FASTIFY_PLUGINS } from './frameworks.js'
export { DependencyResolver, resolveDependencies } from './resolver.js'

// Type exports
export type {
  DependencyConfig,
  DependencySet,
  DependencyProfile,
  Feature,
  FeatureSet,
  ResolvedDependencies
} from './types.js'

/**
 * Helper: Get dependencies for common scenarios
 */
export const QUICK_CONFIGS = {
  // Minimal API - just the basics
  minimalApi: {
    profile: 'minimal',
    framework: { name: 'express' as const }
  },
  
  // Standard API - balanced setup
  standardApi: {
    profile: 'standard',
    features: ['compression', 'errorHandling'],
    framework: { name: 'express' as const, plugins: ['core', 'security'] }
  },
  
  // Production API - ready for production
  productionApi: {
    profile: 'production',
    features: ['logging', 'rateLimit', 'compression'],
    framework: { name: 'express' as const, plugins: ['core', 'security'] }
  },
  
  // Full-stack project - everything included
  fullStack: {
    profile: 'full',
    features: [
      'logging', 'rateLimit', 'compression', 'cookies',
      'testing', 'linting', 'formatting'
    ],
    framework: { name: 'express' as const, plugins: ['core', 'security', 'validation'] }
  },
  
  // Microservice - lightweight and fast
  microservice: {
    profile: 'production',
    features: ['logging', 'compression'],
    framework: { name: 'fastify' as const, plugins: ['core', 'security'] }
  }
} as const

/**
 * Example usage:
 * 
 * ```typescript
 * import { resolveDependencies, QUICK_CONFIGS } from './dependencies/index.js'
 * 
 * // Use a quick config
 * const deps = resolveDependencies(QUICK_CONFIGS.productionApi)
 * 
 * // Customize a quick config
 * const deps = resolveDependencies({
 *   ...QUICK_CONFIGS.standardApi,
 *   features: [...QUICK_CONFIGS.standardApi.features, 'fileUploads']
 * })
 * ```
 */

