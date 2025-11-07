import type { PathsConfig } from '../path-resolver.js'
import type { ParsedModel } from '../dmmf-parser.js'
import type { LogLevel } from '@/utils/cli-logger.js'

/**
 * Phase Result - Return value from phase execution
 * Moved from phase-runner.ts to break circular dependency
 * 
 * @property success - Whether the phase completed successfully
 * @property data - Optional data to store in context for subsequent phases
 * @property filesGenerated - Number of files created by this phase (for logging)
 * @property error - Error object if phase failed
 */
export interface PhaseResult<TData = unknown> {
  success: boolean
  data?: TData
  filesGenerated?: number
  error?: Error
}

/**
 * Generated files organized by layer
 * Moved from code-generator.ts to break circular dependency
 */
export interface GeneratedFiles {
  contracts: Map<string, Map<string, string>>  // model -> filename -> content
  validators: Map<string, Map<string, string>>
  services: Map<string, string>
  controllers: Map<string, string>
  routes: Map<string, string>
  sdk: Map<string, string>  // filename -> content
  registry?: Map<string, string>  // Registry-based architecture files
  checklist?: Map<string, string>  // System health check dashboard
  plugins?: Map<string, Map<string, string>>  // Plugin-generated files (plugin -> files)
  pluginOutputs?: Map<string, unknown>  // Plugin outputs with envVars and deps
  hooks: {
    core: Map<string, string>        // Framework-agnostic queries
    react?: Map<string, string>      // React hooks
    vue?: Map<string, string>        // Vue composables
    zustand?: Map<string, string>    // Zustand stores
    vanilla?: Map<string, string>    // Vanilla JS stores
    angular?: Map<string, string>    // Angular services
  }
}

export interface GeneratorConfig {
  output?: string
  schemaPath?: string
  schemaText?: string
  paths?: Partial<PathsConfig>
  framework?: 'express' | 'fastify'
  standalone?: boolean
  projectName?: string
  verbosity?: LogLevel
  colors?: boolean
  timestamps?: boolean
  features?: any  // Plugin features configuration
}

export interface GeneratorResult {
  models: string[]
  files: number
  relationships: number
  breakdown: Array<{ layer: string; count: number }>
  outputDir?: string
}

export interface StandaloneProjectOptions {
  outputDir: string
  projectName: string
  framework: 'express' | 'fastify'
  models: string[]
  schemaContent: string
  schemaPath?: string
  generatedFiles?: GeneratedFiles
  serviceNames?: string[]
  hasPlugins?: boolean
}

export interface TestSuiteOptions {
  outputDir: string
  models: ParsedModel[]
  framework: 'express' | 'fastify'
}
