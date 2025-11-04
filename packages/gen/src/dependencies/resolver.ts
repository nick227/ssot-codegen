import type { DependencyConfig, ResolvedDependencies, DependencySet } from './types.js'
import { getProfile, type ProfileName } from './profiles.js'
import { resolveFeatures, type FeatureName } from './features.js'
import { getFrameworkDependencies, getRecommendedPlugins } from './frameworks.js'
import { VERSIONS, getVersion } from './versions.js'

/**
 * Flexible dependency resolver
 * 
 * Resolves dependencies based on profile, features, and custom config
 */
export class DependencyResolver {
  private config: DependencyConfig
  
  constructor(config: DependencyConfig = {}) {
    this.config = config
  }
  
  /**
   * Resolve all dependencies
   */
  resolve(): ResolvedDependencies {
    const profile = this.config.profile || 'standard'
    const features = this.config.features || []
    const framework = this.config.framework?.name || 'express'
    
    // Start with base profile
    const profileDeps = getProfile(profile as ProfileName)
    const runtime: Record<string, string> = { ...profileDeps.runtime }
    const dev: Record<string, string> = { ...profileDeps.dev }
    
    // Add framework dependencies
    const frameworkPlugins = this.config.framework?.plugins 
      || getRecommendedPlugins(framework, profile as any)
    
    const frameworkDeps = getFrameworkDependencies(framework, frameworkPlugins)
    Object.assign(runtime, frameworkDeps.runtime)
    Object.assign(dev, frameworkDeps.dev)
    
    // Add feature dependencies
    if (features.length > 0) {
      const featureDeps = resolveFeatures(features as FeatureName[])
      Object.assign(runtime, featureDeps.runtime)
      Object.assign(dev, featureDeps.dev)
    }
    
    // Apply version overrides
    if (this.config.versions) {
      this.applyVersionOverrides(runtime, this.config.versions)
      this.applyVersionOverrides(dev, this.config.versions)
    }
    
    // Add database driver if specified
    if (this.config.database?.includeDriver) {
      const dbDeps = this.getDatabaseDependencies(this.config.database.provider)
      Object.assign(runtime, dbDeps.runtime)
      Object.assign(dev, dbDeps.dev)
    }
    
    return {
      runtime,
      dev,
      scripts: this.generateScripts(framework, features),
      metadata: {
        profile,
        features,
        framework,
      }
    }
  }
  
  /**
   * Apply version overrides
   */
  private applyVersionOverrides(
    deps: Record<string, string>,
    overrides: Record<string, string>
  ): void {
    for (const [pkg, version] of Object.entries(overrides)) {
      if (deps[pkg]) {
        deps[pkg] = version
      }
    }
  }
  
  /**
   * Get database-specific dependencies
   */
  private getDatabaseDependencies(provider: string): DependencySet {
    const drivers: Record<string, DependencySet> = {
      postgresql: {
        runtime: { 'pg': '^8.13.1' },
        dev: { '@types/pg': '^8.11.10' }
      },
      mysql: {
        runtime: { 'mysql2': '^3.11.5' },
        dev: {}
      },
      sqlite: {
        runtime: { 'better-sqlite3': '^11.7.0' },
        dev: { '@types/better-sqlite3': '^7.6.11' }
      },
      mongodb: {
        runtime: { 'mongodb': '^6.11.0' },
        dev: {}
      }
    }
    
    return drivers[provider] || { runtime: {}, dev: {} }
  }
  
  /**
   * Generate npm scripts based on features
   */
  private generateScripts(framework: string, features: string[]): Record<string, string> {
    const scripts: Record<string, string> = {
      dev: 'tsx watch src/server.ts',
      build: 'rimraf dist && tsc',
      start: 'node dist/server.js',
      generate: 'prisma generate',
      'db:push': 'prisma db push',
      'db:migrate': 'prisma migrate dev',
      'db:studio': 'prisma studio',
    }
    
    // Add type checking
    scripts.typecheck = 'tsc --noEmit'
    
    // Add testing scripts if testing feature enabled
    if (features.includes('testing')) {
      scripts.test = 'vitest run'
      scripts['test:watch'] = 'vitest'
      scripts['test:coverage'] = 'vitest run --coverage'
    }
    
    // Add linting scripts if linting feature enabled
    if (features.includes('linting')) {
      scripts.lint = 'eslint src --ext .ts'
      scripts['lint:fix'] = 'eslint src --ext .ts --fix'
    }
    
    // Add formatting scripts if formatting feature enabled
    if (features.includes('formatting')) {
      scripts.format = 'prettier --write "src/**/*.ts"'
      scripts['format:check'] = 'prettier --check "src/**/*.ts"'
    }
    
    // Add comprehensive ci script if multiple quality tools enabled
    const qualityTools = ['typecheck', 'lint', 'test'].filter(s => scripts[s])
    if (qualityTools.length > 1) {
      scripts.ci = qualityTools.map(s => `npm run ${s}`).join(' && ')
    }
    
    return scripts
  }
}

/**
 * Quick resolve helper
 */
export function resolveDependencies(config: DependencyConfig = {}): ResolvedDependencies {
  const resolver = new DependencyResolver(config)
  return resolver.resolve()
}

