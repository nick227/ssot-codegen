/**
 * Plugin Manager
 * Orchestrates feature plugins during code generation
 */

import type { ParsedSchema } from '../dmmf-parser.js'
import type { FeaturePlugin, PluginContext, PluginOutput, ValidationResult, HealthCheckSection } from './plugin.interface.js'
import { GoogleAuthPlugin } from './auth/google-auth.plugin.js'

export interface PluginManagerConfig {
  schema: ParsedSchema
  projectName: string
  framework: 'express' | 'fastify'
  outputDir: string
  
  // Feature configurations
  features?: {
    googleAuth?: {
      enabled: boolean
      clientId?: string
      clientSecret?: string
      callbackURL?: string
      strategy?: 'jwt' | 'session'
      userModel?: string
    }
    // Future: GitHub, Facebook, etc.
  }
}

/**
 * Plugin Manager - Manages all feature plugins
 */
export class PluginManager {
  private plugins: Map<string, FeaturePlugin> = new Map()
  private context: PluginContext
  
  constructor(config: PluginManagerConfig) {
    this.context = {
      schema: config.schema,
      projectName: config.projectName,
      framework: config.framework,
      outputDir: config.outputDir,
      config: config.features || {}
    }
    
    // Register plugins based on config
    this.registerPlugins(config)
  }
  
  /**
   * Register enabled plugins
   */
  private registerPlugins(config: PluginManagerConfig): void {
    // Google Auth plugin
    if (config.features?.googleAuth?.enabled) {
      const googleAuth = new GoogleAuthPlugin({
        clientId: config.features.googleAuth.clientId || process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',
        clientSecret: config.features.googleAuth.clientSecret || process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE',
        callbackURL: config.features.googleAuth.callbackURL,
        strategy: config.features.googleAuth.strategy || 'jwt',
        userModel: config.features.googleAuth.userModel || 'User'
      })
      
      this.plugins.set('google-auth', googleAuth)
    }
    
    // Future plugins:
    // if (config.features?.githubAuth?.enabled) { ... }
    // if (config.features?.s3Storage?.enabled) { ... }
  }
  
  /**
   * Get all enabled plugins
   */
  getEnabled(): FeaturePlugin[] {
    return Array.from(this.plugins.values()).filter(p => p.enabled)
  }
  
  /**
   * Get plugin by name
   */
  get(name: string): FeaturePlugin | undefined {
    return this.plugins.get(name)
  }
  
  /**
   * Validate all plugins
   */
  async validateAll(): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>()
    
    for (const [name, plugin] of this.plugins) {
      if (!plugin.enabled) continue
      
      const result = plugin.validate(this.context)
      results.set(name, result)
      
      // Log validation results
      if (!result.valid) {
        console.error(`\n❌ Plugin '${name}' validation failed:`)
        result.errors.forEach(e => console.error(`   - ${e}`))
      }
      if (result.warnings.length > 0) {
        console.warn(`\n⚠️  Plugin '${name}' warnings:`)
        result.warnings.forEach(w => console.warn(`   - ${w}`))
      }
      if (result.suggestions && result.suggestions.length > 0) {
        console.info(`\n💡 Suggestions:`)
        result.suggestions.forEach(s => console.info(`   ${s}`))
      }
    }
    
    return results
  }
  
  /**
   * Generate code for all plugins
   */
  async generateAll(): Promise<Map<string, PluginOutput>> {
    const outputs = new Map<string, PluginOutput>()
    
    for (const [name, plugin] of this.plugins) {
      if (!plugin.enabled) continue
      
      console.log(`\n🔌 Generating plugin: ${plugin.description}`)
      
      // Validate first
      const validation = plugin.validate(this.context)
      if (!validation.valid) {
        console.error(`   ❌ Validation failed - skipping plugin`)
        continue
      }
      
      // Run pre-generation hook
      if (plugin.beforeGeneration) {
        await plugin.beforeGeneration(this.context)
      }
      
      // Generate
      const output = plugin.generate(this.context)
      outputs.set(name, output)
      
      console.log(`   ✅ Generated ${output.files.size} files`)
      console.log(`   ✅ Added ${output.routes.length} routes`)
      console.log(`   ✅ Added ${output.middleware.length} middleware`)
      
      // Run post-generation hook
      if (plugin.afterGeneration) {
        await plugin.afterGeneration(this.context, output)
      }
    }
    
    return outputs
  }
  
  /**
   * Get health check sections from all plugins
   */
  getHealthCheckSections(): HealthCheckSection[] {
    return this.getEnabled()
      .filter(p => p.healthCheck)
      .map(p => p.healthCheck!(this.context))
  }
  
  /**
   * Get combined package.json additions
   */
  getPackageJsonAdditions(): {
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
    scripts: Record<string, string>
  } {
    const deps: Record<string, string> = {}
    const devDeps: Record<string, string> = {}
    const scripts: Record<string, string> = {}
    
    for (const plugin of this.getEnabled()) {
      const output = plugin.generate(this.context)
      
      if (output.packageJson?.dependencies) {
        Object.assign(deps, output.packageJson.dependencies)
      }
      if (output.packageJson?.devDependencies) {
        Object.assign(devDeps, output.packageJson.devDependencies)
      }
      if (output.packageJson?.scripts) {
        Object.assign(scripts, output.packageJson.scripts)
      }
    }
    
    return { dependencies: deps, devDependencies: devDeps, scripts }
  }
  
  /**
   * Get combined environment variables
   */
  getEnvironmentVariables(): Record<string, string> {
    const envVars: Record<string, string> = {}
    
    for (const plugin of this.getEnabled()) {
      const output = plugin.generate(this.context)
      Object.assign(envVars, output.envVars)
    }
    
    return envVars
  }
  
  /**
   * Get all routes from plugins
   */
  getAllRoutes(): Array<{ plugin: string, routes: any[] }> {
    const allRoutes: Array<{ plugin: string, routes: any[] }> = []
    
    for (const [name, plugin] of this.plugins) {
      if (!plugin.enabled) continue
      
      const output = plugin.generate(this.context)
      if (output.routes.length > 0) {
        allRoutes.push({ plugin: name, routes: output.routes })
      }
    }
    
    return allRoutes
  }
}

