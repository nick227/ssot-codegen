/**
 * DMMF Parser - Public API Facade
 * 
 * This file re-exports the public API to maintain backward compatibility.
 * Implementation has been modularized into dmmf-parser/ directory.
 * 
 * DO NOT import directly from subdirectories - use this facade.
 * 
 * Extracts everything we need from Prisma schema:
 * - Models and fields
 * - Field types and constraints
 * - Relationships
 * - Enums
 * - Documentation
 * 
 * Error Handling Strategy:
 * - Structural errors (malformed DMMF, invalid arrays): throw immediately
 * - Semantic errors (missing enums, invalid relations): log warning and continue
 * - Schema errors (circular dependencies, missing IDs): collected in validateSchema()
 * 
 * Immutability:
 * - All arrays in ParsedModel are frozen to prevent accidental mutation
 * - Reverse relation fields are deep-frozen copies to prevent cross-contamination
 * - DMMF readonly arrays are copied before modification
 * 
 * DMMF Version Compatibility:
 * - Tested with Prisma 4.x and 5.x DMMF format
 * - Unknown default functions are treated conservatively as DB-managed (safe fallback)
 * - Type guards validate expected DMMF structure and log warnings for unknown shapes
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  DMMFParserLogger,
  ParseOptions,
  PrismaDefaultValue,
  ParsedField,
  ParsedModel,
  ParsedEnum,
  ParsedSchema,
  SchemaValidationResult
} from './dmmf-parser/types.js'

// ============================================================================
// CORE PARSING
// ============================================================================

export { parseDMMF } from './dmmf-parser/parsing/core.js'

// ============================================================================
// VALIDATION
// ============================================================================

export { 
  validateSchema, 
  validateSchemaDetailed 
} from './dmmf-parser/validation/schema-validator.js'

// ============================================================================
// FIELD UTILITIES
// ============================================================================

export {
  getField,
  getRelationTarget,
  isOptionalForCreate,
  isNullable
} from './dmmf-parser/utils/field-helpers.js'

// ============================================================================
// DEFAULT VALUE HANDLING
// ============================================================================

export {
  getDefaultValueString,
  isClientManagedDefault
} from './dmmf-parser/defaults/index.js'
