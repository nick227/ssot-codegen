/**
 * Website Schema Types
 * 
 * Type definitions for website schema structure and bulk generation
 */

/**
 * Website Schema Definition
 * Complete definition for a website type
 */
export interface WebsiteSchema {
  /** Unique identifier for this website type */
  id: string
  
  /** Human-readable name */
  name: string
  
  /** Description of the website type */
  description?: string
  
  /** Path to Prisma schema file */
  schemaPath: string
  
  /** Path to UI configuration file */
  uiConfigPath: string
  
  /** Path to theme configuration (optional) */
  themePath?: string
  
  /** Default schematic references */
  schematics?: SchematicReferences
  
  /** Metadata */
  metadata?: {
    version?: string
    author?: string
    tags?: string[]
  }
}

/**
 * Schematic References
 * References to reusable schematics
 */
export interface SchematicReferences {
  /** Layout schematic name */
  layout?: string
  
  /** Page schematic names */
  pages?: string[]
  
  /** Component schematic names */
  components?: string[]
  
  /** Theme schematic name */
  theme?: string
}

/**
 * Schematic Definition
 * Reusable template/pattern
 */
export interface Schematic {
  /** Unique identifier */
  id: string
  
  /** Human-readable name */
  name: string
  
  /** Description */
  description?: string
  
  /** Schematic type */
  type: 'layout' | 'page' | 'component' | 'theme'
  
  /** Template content (JSON or function) */
  template: Record<string, unknown> | ((context: SchematicContext) => Record<string, unknown>)
  
  /** Variables/placeholders */
  variables?: Record<string, SchematicVariable>
  
  /** Variants */
  variants?: Record<string, SchematicVariant>
  
  /** Dependencies on other schematics */
  dependencies?: string[]
}

/**
 * Schematic Context
 * Context passed to schematic template functions
 */
export interface SchematicContext {
  /** Parsed Prisma schema */
  schema: any
  
  /** UI configuration */
  uiConfig: any
  
  /** Theme configuration */
  theme?: any
  
  /** Custom variables */
  variables?: Record<string, unknown>
  
  /** Model names */
  models?: string[]
}

/**
 * Schematic Variable
 * Definition of a variable/placeholder
 */
export interface SchematicVariable {
  /** Variable type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  
  /** Default value */
  default?: unknown
  
  /** Description */
  description?: string
  
  /** Required */
  required?: boolean
}

/**
 * Schematic Variant
 * Variation of a schematic
 */
export interface SchematicVariant {
  /** Description */
  description?: string
  
  /** Override template */
  template?: Record<string, unknown>
  
  /** Override variables */
  variables?: Record<string, unknown>
}

/**
 * Bulk Generation Configuration
 */
export interface BulkGenerateConfig {
  /** Projects to generate - can be array of ProjectConfig or array of project IDs (strings) */
  projects: ProjectConfig[] | string[]
  
  /** Generation options */
  options?: BulkGenerateOptions
}

/**
 * Project Configuration
 * Configuration for a single generated project
 */
export interface ProjectConfig {
  /** Unique project identifier */
  id: string
  
  /** Project name */
  name: string
  
  /** Base website schema */
  schema: string | WebsiteSchema
  
  /** Output directory */
  outputDir: string
  
  /** Customizations to apply */
  customizations?: ProjectCustomizations
  
  /** Schematic overrides */
  schematics?: SchematicReferences
  
  /** Environment-specific configs */
  environments?: Record<string, ProjectConfig>
}

/**
 * Project Customizations
 * Customizations applied to base schema
 */
export interface ProjectCustomizations {
  /** Theme customizations */
  theme?: Partial<Record<string, unknown>>
  
  /** Site settings */
  site?: Partial<Record<string, unknown>>
  
  /** Navigation customizations */
  navigation?: Partial<Record<string, unknown>>
  
  /** Page customizations */
  pages?: Array<Partial<Record<string, unknown>>>
  
  /** Component customizations */
  components?: Partial<Record<string, unknown>>
}

/**
 * Bulk Generation Options
 */
export interface BulkGenerateOptions {
  /** Generate in parallel */
  parallel?: boolean
  
  /** Skip existing projects */
  skipExisting?: boolean
  
  /** Validate before generation */
  validate?: boolean
  
  /** Continue on errors */
  continueOnError?: boolean
  
  /** Output verbosity */
  verbose?: boolean
}

/**
 * Template Registry
 * Central registry of available templates
 */
export interface TemplateRegistry {
  /** Registered templates */
  templates: Record<string, TemplateDefinition>
  
  /** Template categories */
  categories?: Record<string, string[]>
}

/**
 * Template Definition
 * Definition in template registry
 */
export interface TemplateDefinition {
  /** Template name */
  name: string
  
  /** Description */
  description?: string
  
  /** Category */
  category?: string
  
  /** Schema path */
  schema?: string
  
  /** UI config path */
  uiConfig?: string
  
  /** Schematic references */
  schematics?: SchematicReferences
  
  /** Preview image */
  preview?: string
  
  /** Tags */
  tags?: string[]
}

