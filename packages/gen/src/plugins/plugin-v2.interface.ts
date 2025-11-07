/**
 * Feature Plugin System v2 Interface
 * 
 * Enhanced plugin API with template overrides and lifecycle hooks
 * 
 * Breaking changes from v1:
 * - Added template override system
 * - Extended lifecycle hooks
 * - Plugin dependencies
 * - Custom phase injection
 * - Configuration schema validation
 */

import type { ParsedSchema, ParsedModel } from '../dmmf-parser.js'
import type { GenerationPhase, PhaseContext } from '../generator/phase-runner.js'

/**
 * Plugin context v2 - Enhanced with template system access
 */
export interface PluginContextV2 {
  schema: ParsedSchema
  projectName: string
  framework: 'express' | 'fastify'
  outputDir: string
  config: Record<string, unknown>
  
  // v2: Template system access
  templates?: TemplateRegistry
  
  // v2: Phase system access
  phases?: Map<string, GenerationPhase>
}

/**
 * Template registry for overrides
 */
export interface TemplateRegistry {
  get(name: string): string | undefined
  set(name: string, template: string): void
  override(name: string, template: string): void
  extend(name: string, extension: TemplateExtension): void
}

/**
 * Template extension for partial overrides
 */
export interface TemplateExtension {
  before?: string  // Inject before
  after?: string   // Inject after
  replace?: Array<{ pattern: RegExp; replacement: string }>
}

/**
 * Plugin requirements v2
 */
export interface PluginRequirementsV2 {
  models?: {
    required: string[]
    optional?: string[]
    fields?: Record<string, string[]>
  }
  envVars: {
    required: string[]
    optional?: string[]
    schema?: Record<string, EnvVarSchema>  // v2: Schema validation
  }
  dependencies: {
    runtime: Record<string, string>
    dev?: Record<string, string>
    peer?: Record<string, string>  // v2: Peer dependencies
  }
  plugins?: string[]  // v2: Plugin dependencies
}

/**
 * Environment variable schema for validation
 */
export interface EnvVarSchema {
  type: 'string' | 'number' | 'boolean' | 'url' | 'email'
  required: boolean
  default?: string
  pattern?: RegExp
  description?: string
}

/**
 * Plugin output v2 - Enhanced with template overrides
 */
export interface PluginOutputV2 {
  files: Map<string, string>
  routes: PluginRoute[]
  middleware: PluginMiddleware[]
  envVars: Record<string, string>
  packageJson?: {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
    scripts?: Record<string, string>
  }
  migrations?: string[]
  
  // v2: Template overrides
  templateOverrides?: Map<string, string>
  
  // v2: Custom phases
  customPhases?: GenerationPhase[]
}

/**
 * Plugin route definition (unchanged)
 */
export interface PluginRoute {
  path: string
  method: 'get' | 'post' | 'put' | 'delete' | 'patch'
  handler: string
  middleware?: string[]
}

/**
 * Plugin middleware definition (unchanged)
 */
export interface PluginMiddleware {
  name: string
  importPath: string
  global?: boolean
}

/**
 * Health check section (unchanged)
 */
export interface HealthCheckSection {
  id: string
  title: string
  icon: string
  checks: HealthCheck[]
  interactiveDemo?: string
}

export interface HealthCheck {
  id: string
  name: string
  description: string
  testFunction?: string
  endpoint?: string
  skipForStatic?: boolean
}

/**
 * Validation result v2 - Enhanced with severity levels
 */
export interface ValidationResultV2 {
  valid: boolean
  errors: ValidationMessage[]
  warnings: ValidationMessage[]
  suggestions: ValidationMessage[]
}

export interface ValidationMessage {
  severity: 'error' | 'warning' | 'info'
  message: string
  field?: string
  code?: string
}

/**
 * Lifecycle hooks v2 - Extended
 */
export interface PluginLifecycleHooks {
  // v1: Existing hooks
  beforeGeneration?(context: PluginContextV2): Promise<void>
  afterGeneration?(context: PluginContextV2, output: PluginOutputV2): Promise<void>
  
  // v2: New granular hooks
  onSchemaValidated?(schema: ParsedSchema): Promise<void>
  onModelGenerated?(model: ParsedModel, files: Map<string, string>): Promise<void>
  onFilesWritten?(fileCount: number): Promise<void>
  onError?(error: Error, phase: string): Promise<void>
  onComplete?(result: { files: number; duration: number }): Promise<void>
}

/**
 * Plugin configuration schema v2
 */
export interface PluginConfigSchema {
  type: 'object'
  properties: Record<string, PropertySchema>
  required?: string[]
  additionalProperties?: boolean
}

export interface PropertySchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description?: string
  default?: unknown
  enum?: unknown[]
  pattern?: string
  minimum?: number
  maximum?: number
  items?: PropertySchema
  properties?: Record<string, PropertySchema>
}

/**
 * Feature Plugin v2 Interface
 */
export interface FeaturePluginV2 {
  // Plugin metadata
  name: string
  version: string
  description: string
  enabled: boolean
  
  // v2: Configuration schema
  configSchema?: PluginConfigSchema
  
  // v2: Plugin dependencies
  dependencies?: string[]  // Other plugin names this depends on
  
  // What the plugin needs
  requirements: PluginRequirementsV2
  
  // Validate plugin can be used
  validate(context: PluginContextV2): ValidationResultV2
  
  // Generate code for this plugin
  generate(context: PluginContextV2): PluginOutputV2
  
  // Health check integration (optional)
  healthCheck?(context: PluginContextV2): HealthCheckSection
  
  // v2: Lifecycle hooks
  lifecycle?: PluginLifecycleHooks
  
  // v2: Template override capability
  overrideTemplates?(registry: TemplateRegistry): void
  
  // v2: Custom phase injection
  registerPhases?(): GenerationPhase[]
}

/**
 * Plugin capabilities flags v2
 */
export interface PluginCapabilities {
  supportsTemplateOverrides: boolean
  supportsCustomPhases: boolean
  supportsLifecycleHooks: boolean
  supportsConfigValidation: boolean
  requiresRuntime: boolean  // Needs runtime SDK
  requiresDatabase: boolean  // Needs DB connection
}

/**
 * Base plugin class v2 - Provides defaults
 */
export abstract class BasePluginV2 implements FeaturePluginV2 {
  abstract name: string
  abstract version: string
  abstract description: string
  abstract requirements: PluginRequirementsV2
  
  enabled = true
  configSchema?: PluginConfigSchema
  dependencies?: string[]
  lifecycle?: PluginLifecycleHooks
  
  /**
   * Get plugin capabilities
   */
  getCapabilities(): PluginCapabilities {
    return {
      supportsTemplateOverrides: !!this.overrideTemplates,
      supportsCustomPhases: !!this.registerPhases,
      supportsLifecycleHooks: !!this.lifecycle,
      supportsConfigValidation: !!this.configSchema,
      requiresRuntime: this.requirements.dependencies.runtime !== undefined,
      requiresDatabase: !!this.requirements.models?.required?.length
    }
  }
  
  abstract validate(context: PluginContextV2): ValidationResultV2
  abstract generate(context: PluginContextV2): PluginOutputV2
  
  // Optional methods have default no-op implementations
  healthCheck?(context: PluginContextV2): HealthCheckSection
  overrideTemplates?(registry: TemplateRegistry): void
  registerPhases?(): GenerationPhase[]
}

