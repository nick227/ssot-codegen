/**
 * @ssot-codegen/gen
 * 
 * Main entry point for all code generators
 */

// Core generation
export { generateCode } from './code-generator.js'
export type { CodeGeneratorConfig, GenerationError } from './code-generator.js'
export { ErrorSeverity } from './code-generator.js'

// Public API
export * from './api/index.js'
export { generate as generateFromSchema } from './api/public-api.js'

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

// Hook adapter utilities (used by generated UI code)
export { useModel, createHookRegistry } from './utils/hook-adapter.js'
export type { HookAdapter } from './utils/hook-adapter.js'
