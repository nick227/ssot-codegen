/**
 * @ssot-codegen/gen
 * 
 * Main entry point for all code generators
 */

// Core generation
export { generateCode } from './code-generator.js'
export type { CodeGeneratorConfig, GenerationError } from './code-generator.js'

// Public API
export * from './api/index.js'

// DMMF Parser
export { parseDMMF } from './dmmf-parser.js'
export type { ParsedSchema, ParsedModel, ParsedField } from './dmmf-parser/types.js'

// UI Generators
export * from './generators/ui/index.js'
export type { UiConfig, SiteConfig } from './generators/ui/index.js'

// Analyzers
export * from './analyzers/index.js'

// Plugins
export * from './plugins/index.js'
