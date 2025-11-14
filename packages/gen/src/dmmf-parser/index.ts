/**
 * DMMF Parser - Internal Module Index
 * 
 * This is the internal index for the modularized dmmf-parser.
 * External consumers should import from '../dmmf-parser.js' (the facade).
 * 
 * Module organization:
 * - types.ts - All type definitions
 * - constants.ts - Default function names and system fields
 * - type-guards.ts - DMMF validation guards
 * - security/ - Escaping, sanitization, redaction
 * - parsing/ - Enum, model, field parsers and core orchestrator
 * - enhancement/ - Model enhancement logic
 * - validation/ - Schema validation and circular detection
 * - defaults/ - Default value handling
 * - utils/ - General utilities
 */

// Re-export everything for internal use
export * from './types.js'
export * from './constants.js'
export * from './type-guards.js'
export * from './security/escaping.js'
export * from './security/sanitization.js'
export * from './utils/freezing.js'
export * from './utils/string-utils.js'
export * from './utils/logger.js'
export * from './utils/field-helpers.js'
export * from './defaults/index.js'
export * from './parsing/enum-parser.js'
export * from './parsing/field-parser.js'
export * from './parsing/model-parser.js'
export * from './parsing/reverse-relations.js'
export * from './parsing/core.js'
export * from './enhancement/model-enhancer.js'
export * from './validation/schema-validator.js'
export * from './validation/circular-detection.js'
export * from './validation/mysql-key-length.js'

