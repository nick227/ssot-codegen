/**
 * @ssot-codegen/gen
 * 
 * Main entry point for all code generators
 */

// Core generation
export { generateFromSchema } from './code-generator.js'
export type { GenerateOptions, GenerateResult, LogLevel } from './code-generator.js'

// DMMF Parser
export { parsePrismaSchema } from './dmmf-parser.js'
export type { ParsedSchema, ParsedModel, ParsedField } from './dmmf-parser/types.js'

// UI Generators
export * from './generators/ui/index.js'

// Analyzers
export * from './analyzers/index.js'

// Plugins
export * from './plugins/index.js'

// API
export * from './api/index.js'

// Utilities
export * from './utils/index.js'
