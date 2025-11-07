/**
 * Plugin Manager v2 - Enhanced plugin orchestration
 * 
 * New features:
 * - Template override system
 * - Lifecycle hook execution
 * - Plugin dependency resolution
 * - Configuration validation
 * - Custom phase injection
 */

import type { ParsedSchema } from '../dmmf-parser.js'
import type {
  FeaturePluginV2,
  PluginContextV2,
  PluginOutputV2,
  ValidationResultV2,
  TemplateRegistry,
  TemplateExtension
} from './plugin-v2.interface.js'
import type { GenerationPhase } from '../generator/phase-runner.js'

export interface PluginManagerV2Config {
  schema: ParsedSchema
  projectName: string
  framework: 'express' | 'fastify'
  outputDir: string
  features: Record<string, any>
}

/**
 * Template registry implementation
 */
class TemplateRegistryImpl implements TemplateRegistry {
  private templates = new Map<string, string>()
  private overrides = new Map<string, string>()
  private extensions = new Map<string, TemplateExtension[]>()
  
  get(name: string): string | undefined {
    // Check for override first
    if (this.overrides.has(name)) {
      return this.overrides.get(name)
    }
    
    // Apply extensions if any
    let template = this.templates.get(name)
    if (template && this.extensions.has(name)) {
      const exts = this.extensions.get(name)!
      for (const ext of exts) {
        if (ext.before) {
          template = ext.before + '\n' + template
        }
        if (ext.after) {
          template = template + '\n' + ext.after
        }
        if (ext.replace) {
          for (const { pattern, replacement } of ext.replace) {
            template = template.replace(pattern, replacement)
          }
        }
      }
    }
    
    return template
  }
  
  set(name: string, template: string): void {
    this.templates.set(name, template)
  }
  
  override(name: string, template: string): void {
    this.overrides.set(name, template)
  }
  
  extend(name: string, extension: TemplateExtension): void {
    if (!this.extensions.has(name)) {
      this.extensions.set(name, [])
    }
    this.extensions.get(name)!.push(extension)
  }
}

/**
 * Plugin Manager v2
 */
export class PluginManagerV2 {
  private plugins = new Map<string, FeaturePluginV2>()
  private context: PluginContextV2
  private templateRegistry: TemplateRegistry
  private customPhases: GenerationPhase[] = []
  
  constructor(config: PluginManagerV2Config) {
    this.templateRegistry = new TemplateRegistryImpl()
    
    this.context = {
      schema: config.schema,
      projectName: config.projectName,
      framework: config.framework,
      outputDir: config.outputDir,
      config: config.features,
      templates: this.templateRegistry
    }
  }
  
  /**
   * Register a plugin
   */
  register(plugin: FeaturePluginV2): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`)
    }
    
    // Check dependencies
    if (plugin.dependencies) {
      for (const depName of plugin.dependencies) {
        if (!this.plugins.has(depName)) {
          throw new Error(`Plugin ${plugin.name} depends on ${depName}, but it's not registered`)
        }
      }
    }
    
    this.plugins.set(plugin.name, plugin)
    
    // Allow plugin to register template overrides
    if (plugin.overrideTemplates) {
      plugin.overrideTemplates(this.templateRegistry)
    }
    
    // Collect custom phases
    if (plugin.registerPhases) {
      const phases = plugin.registerPhases()
      this.customPhases.push(...phases)
    }
  }
  
  /**
   * Execute lifecycle hook across all plugins
   */
  private async executeHook(
    hookName: string,
    ...args: any[]
  ): Promise<void> {
    for (const [name, plugin] of this.plugins) {
      if (plugin.lifecycle && hookName in plugin.lifecycle) {
        try {
          const hook = (plugin.lifecycle as any)[hookName]
          if (typeof hook === 'function') {
            await hook(...args)
          }
        } catch (error) {
          console.error(`[PluginManagerV2] Hook ${hookName} failed for plugin ${name}:`, error)
          throw error
        }
      }
    }
  }
  
  /**
   * Validate all registered plugins
   */
  async validateAll(): Promise<Map<string, ValidationResultV2>> {
    await this.executeHook('beforeGeneration', this.context)
    
    const results = new Map<string, ValidationResultV2>()
    
    for (const [name, plugin] of this.plugins) {
      if (!plugin.enabled) {
        continue
      }
      
      const result = plugin.validate(this.context)
      results.set(name, result)
      
      // Log validation issues
      if (!result.valid) {
        console.warn(`\n⚠️  Plugin ${name} validation failed:`)
        result.errors.forEach(err => console.error(`  ❌ ${err.message}`))
      }
      
      if (result.warnings.length > 0) {
        console.warn(`\n⚠️  Plugin ${name} warnings:`)
        result.warnings.forEach(warn => console.warn(`  ⚠️  ${warn.message}`))
      }
    }
    
    return results
  }
  
  /**
   * Generate code from all plugins
   */
  async generateAll(): Promise<Map<string, PluginOutputV2>> {
    await this.executeHook('onSchemaValidated', this.context.schema)
    
    const outputs = new Map<string, PluginOutputV2>()
    
    for (const [name, plugin] of this.plugins) {
      if (!plugin.enabled) {
        continue
      }
      
      try {
        const output = plugin.generate(this.context)
        outputs.set(name, output)
        
        await this.executeHook('afterGeneration', this.context, output)
      } catch (error) {
        await this.executeHook('onError', error as Error, 'generate')
        throw error
      }
    }
    
    return outputs
  }
  
  /**
   * Get all registered plugins
   */
  getPlugins(): Map<string, FeaturePluginV2> {
    return this.plugins
  }
  
  /**
   * Get template registry
   */
  getTemplateRegistry(): TemplateRegistry {
    return this.templateRegistry
  }
  
  /**
   * Get custom phases from all plugins
   */
  getCustomPhases(): GenerationPhase[] {
    return this.customPhases
  }
  
  /**
   * Validate plugin configuration against schema
   */
  validateConfig(plugin: FeaturePluginV2, config: unknown): ValidationResultV2 {
    if (!plugin.configSchema) {
      return {
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      }
    }
    
    const errors: any[] = []
    const warnings: any[] = []
    
    // Basic schema validation
    const schema = plugin.configSchema
    
    if (typeof config !== 'object' || config === null) {
      errors.push({
        severity: 'error',
        message: 'Configuration must be an object',
        code: 'INVALID_CONFIG_TYPE'
      })
      return { valid: false, errors, warnings, suggestions: [] }
    }
    
    const configObj = config as Record<string, unknown>
    
    // Check required properties
    if (schema.required) {
      for (const prop of schema.required) {
        if (!(prop in configObj)) {
          errors.push({
            severity: 'error',
            message: `Required property '${prop}' is missing`,
            field: prop,
            code: 'MISSING_REQUIRED'
          })
        }
      }
    }
    
    // Validate property types
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in configObj) {
        const value = configObj[key]
        const valueType = Array.isArray(value) ? 'array' : typeof value
        
        if (valueType !== propSchema.type) {
          errors.push({
            severity: 'error',
            message: `Property '${key}' must be of type ${propSchema.type}, got ${valueType}`,
            field: key,
            code: 'INVALID_TYPE'
          })
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions: []
    }
  }
}

