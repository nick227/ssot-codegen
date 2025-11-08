/**
 * Type definitions for DMMF Parser
 * 
 * All interfaces and types used throughout the parser.
 */

import type { DMMF } from '@prisma/generator-helper'

/**
 * Logger interface for configurable logging
 */
export interface DMMFParserLogger {
  warn(message: string): void
  error(message: string): void
}

/**
 * Parse options with scoped logger to avoid global mutable state
 */
export interface ParseOptions {
  logger?: DMMFParserLogger
  throwOnError?: boolean
  /** 
   * Enable/disable Object.freeze() calls for immutability.
   * Default: true (freeze everything for safety)
   * Set to false for performance in production if you trust consumers not to mutate.
   * 
   * Performance impact: ~1-2ms for schemas with 500+ fields when enabled.
   */
  freeze?: boolean
}

/**
 * Prisma default value types
 * Flexible to accommodate DMMF readonly types and complex nested structures
 */
export type PrismaDefaultValue = 
  | string 
  | number 
  | boolean 
  | { name: string; args?: readonly unknown[] | unknown[] }
  | readonly unknown[]  // For array defaults in composite types
  | null

/**
 * Parsed field from Prisma schema
 * 
 * Note: isNullable vs isOptional distinction
 * - isNullable: Type allows null (String? in schema → can store null in DB)
 * - isOptional: Can be omitted in create operations
 * 
 * For scalar/enum fields:
 *   isOptional = isNullable OR hasDefaultValue
 * 
 * For relation fields:
 *   isOptional = isNullable OR (no relationFromFields - implicit relation)
 *   Implicit relations are managed by the other side of the relationship
 * 
 * For list fields:
 *   Always optional (empty array is valid)
 */
export interface ParsedField {
  // Core field metadata
  name: string
  type: string
  kind: 'scalar' | 'object' | 'enum' | 'unsupported'
  isList: boolean
  
  // Type constraints
  isRequired: boolean
  isNullable: boolean  // Field type allows null (String? in schema)
  isOptional: boolean  // Field can be omitted in create operations
  isUnique: boolean
  
  // Special field types
  isId: boolean
  isReadOnly: boolean
  isUpdatedAt: boolean
  
  // Default values
  hasDefaultValue: boolean
  hasDbDefault: boolean  // DB-managed default (autoincrement, uuid, etc)
  default?: PrismaDefaultValue  // Typed default value from DMMF
  
  // Composite key metadata (for generator use)
  isPartOfCompositePrimaryKey: boolean
  
  // Relationship metadata
  isSelfRelation: boolean  // Field references its own model
  relationName?: string
  relationFromFields?: readonly string[]  // Frozen to prevent mutations
  relationToFields?: readonly string[]    // Frozen to prevent mutations
  
  // Documentation
  documentation?: string
}

export interface ParsedModel {
  name: string
  nameLower: string  // Lowercase name for case-insensitive lookups
  dbName?: string
  readonly fields: readonly ParsedField[]  // Frozen to prevent accidental mutations
  primaryKey?: {
    name?: string
    readonly fields: readonly string[]  // Frozen to prevent accidental mutations
  }
  readonly uniqueFields: readonly (readonly string[])[]  // Frozen to prevent accidental mutations
  documentation?: string
  // Derived properties
  idField?: ParsedField
  readonly scalarFields: readonly ParsedField[]  // Frozen to prevent accidental mutations
  readonly relationFields: readonly ParsedField[]  // Frozen to prevent accidental mutations
  readonly createFields: readonly ParsedField[]  // Fields for CreateDTO, frozen
  readonly updateFields: readonly ParsedField[]  // Fields for UpdateDTO, frozen
  readonly readFields: readonly ParsedField[]    // Fields for ReadDTO, frozen
  readonly reverseRelations: readonly ParsedField[]  // Fields from other models that reference this model, frozen
  hasSelfRelation: boolean  // Model has fields that reference itself
}

export interface ParsedEnum {
  name: string
  readonly values: readonly string[]  // Frozen to prevent accidental mutations
  documentation?: string
}

export interface ParsedSchema {
  readonly models: readonly ParsedModel[]  // Frozen to prevent mutations
  readonly enums: readonly ParsedEnum[]    // Frozen to prevent mutations
  modelMap: ReadonlyMap<string, ParsedModel>  // Read-only view to prevent mutations
  enumMap: ReadonlyMap<string, ParsedEnum>    // Read-only view to prevent mutations
  reverseRelationMap: ReadonlyMap<string, readonly ParsedField[]>  // Read-only view, frozen fields
}

/**
 * Validation result structure
 */
export interface SchemaValidationResult {
  errors: string[]
  warnings: string[]
  infos: string[]
  all: string[]  // All messages with prefixes
  isValid: boolean
}

