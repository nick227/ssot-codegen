/**
 * Feature Plugin System Interface
 * 
 * Enables extending the code generator with non-schema-driven features
 * like authentication, storage, email, payments, etc.
 */

import type { ParsedSchema } from '../dmmf-parser.js'

/**
 * Plugin context - available to all plugins
 */
export interface PluginContext {
  schema: ParsedSchema
  projectName: string
  framework: 'express' | 'fastify'
  outputDir: string
  config: Record<string, unknown>
}

/**
 * Plugin requirements
 */
export interface PluginRequirements {
  models?: {
    required: string[]        // Models that MUST exist (e.g., 'User')
    optional?: string[]       // Models that enhance the feature
    fields?: Record<string, string[]>  // Required fields per model
  }
  envVars: {
    required: string[]        // Must be set (e.g., 'GOOGLE_CLIENT_ID')
    optional?: string[]       // Nice to have
  }
  dependencies: {
    runtime: Record<string, string>     // npm dependencies
    dev?: Record<string, string>        // npm devDependencies
  }
}

/**
 * Plugin generated output
 */
export interface PluginOutput {
  files: Map<string, string>              // filepath → content
  routes: PluginRoute[]                   // New routes to register
  middleware: PluginMiddleware[]          // New middleware
  envVars: Record<string, string>         // .env additions with placeholders
  packageJson?: {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    scripts?: Record<string, string>
  }
  migrations?: string[]                   // Prisma migrations needed
}

/**
 * Plugin route definition
 */
export interface PluginRoute {
  path: string
  method: 'get' | 'post' | 'put' | 'delete'
  handler: string  // Import path to handler
  middleware?: string[]
}

/**
 * Plugin middleware definition
 */
export interface PluginMiddleware {
  name: string
  importPath: string
  global?: boolean  // Apply globally or per-route
}

/**
 * Health check section for checklist integration
 */
export interface HealthCheckSection {
  id: string
  title: string
  icon: string
  checks: HealthCheck[]
  interactiveDemo?: string  // HTML for interactive testing
}

export interface HealthCheck {
  id: string
  name: string
  description: string
  testFunction?: string     // JavaScript test function
  endpoint?: string         // API endpoint to test
  skipForStatic?: boolean   // Skip when no server
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  suggestions?: string[]
}

/**
 * Base plugin interface that all feature plugins implement
 */
export interface FeaturePlugin {
  // Plugin metadata
  name: string
  version: string
  description: string
  enabled: boolean
  
  // What the plugin needs
  requirements: PluginRequirements
  
  // Validate plugin can be used
  validate(context: PluginContext): ValidationResult
  
  // Generate code for this plugin
  generate(context: PluginContext): PluginOutput
  
  // Health check integration (optional)
  healthCheck?(context: PluginContext): HealthCheckSection
  
  // Pre-generation hook (optional)
  beforeGeneration?(context: PluginContext): Promise<void>
  
  // Post-generation hook (optional)
  afterGeneration?(context: PluginContext, output: PluginOutput): Promise<void>
}

/**
 * Plugin registry - manages all enabled plugins
 */
export class PluginRegistry {
  private plugins: Map<string, FeaturePlugin> = new Map()
  
  register(plugin: FeaturePlugin): void {
    this.plugins.set(plugin.name, plugin)
  }
  
  get(name: string): FeaturePlugin | undefined {
    return this.plugins.get(name)
  }
  
  getEnabled(): FeaturePlugin[] {
    return Array.from(this.plugins.values()).filter(p => p.enabled)
  }
  
  async validateAll(context: PluginContext): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>()
    
    for (const plugin of this.getEnabled()) {
      results.set(plugin.name, plugin.validate(context))
    }
    
    return results
  }
  
  async generateAll(context: PluginContext): Promise<Map<string, PluginOutput>> {
    const outputs = new Map<string, PluginOutput>()
    
    for (const plugin of this.getEnabled()) {
      // Run pre-generation hook
      if (plugin.beforeGeneration) {
        await plugin.beforeGeneration(context)
      }
      
      // Generate
      const output = plugin.generate(context)
      outputs.set(plugin.name, output)
      
      // Run post-generation hook
      if (plugin.afterGeneration) {
        await plugin.afterGeneration(context, output)
      }
    }
    
    return outputs
  }
  
  getHealthChecks(context: PluginContext): HealthCheckSection[] {
    return this.getEnabled()
      .filter(p => p.healthCheck)
      .map(p => p.healthCheck!(context))
  }
}

