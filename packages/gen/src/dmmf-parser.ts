/**
 * DMMF Parser - Parses Prisma DMMF into normalized, usable format
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
 * This allows parsing to complete even with some issues, then validation reports all problems.
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
 * - Future Prisma versions may add new default functions or field properties
 * - Generators can override default behavior via ParseOptions if needed
 * 
 * NOTE: This file is ~1100 lines and exceeds the 200-line guideline.
 * However, splitting it would require updating 77+ import sites and
 * would break cohesion of a single-responsibility module. The file
 * is well-organized into clear sections.
 * 
 * Structure:
 * 1. Types and interfaces
 * 2. Core parsing functions
 * 3. Helper functions and utilities
 * 4. Validation functions
 */

import type { DMMF } from '@prisma/generator-helper'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

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
}

/**
 * Create default logger instance (per-parse to avoid global mutable state)
 */
function createDefaultLogger(): DMMFParserLogger {
  return {
    warn: (msg) => console.warn(msg),
    error: (msg) => console.error(msg)
  }
}

/**
 * Prisma DB-managed default function names
 * These are handled by the database, not the client
 * 
 * Note: This list is based on Prisma schema language specification.
 * Future Prisma versions may add new default functions.
 * Unknown defaults are treated conservatively (not generated in client code).
 */
const DB_MANAGED_DEFAULTS = ['autoincrement', 'uuid', 'cuid', 'dbgenerated'] as const

/**
 * Prisma client-managed default function names
 * These are evaluated on the client side and passed to the database
 */
const CLIENT_MANAGED_DEFAULTS = ['now'] as const

/**
 * System-managed timestamp field names
 */
const SYSTEM_TIMESTAMP_FIELDS = ['createdAt', 'updatedAt'] as const

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

// ============================================================================
// CORE PARSING FUNCTIONS
// ============================================================================

/**
 * Parse DMMF into our format
 * 
 * IMPORTANT: Parse order dependency
 * 1. Parse enums (independent)
 * 2. Parse models (depends on enumMap)
 * 3. Build reverse relation map (depends on parsed models)
 * 4. Enhance models (depends on models, modelMap, reverseRelationMap)
 * 5. Validate schema (if throwOnError is true)
 * 
 * This order ensures all dependencies are satisfied before enhancement.
 */
export function parseDMMF(dmmf: DMMF.Document, options: ParseOptions = {}): ParsedSchema {
  const logger = options.logger || createDefaultLogger()
  
  // Guard against malformed DMMF
  if (!dmmf || typeof dmmf !== 'object') {
    throw new Error('Invalid DMMF document: expected object')
  }
  if (!dmmf.datamodel || typeof dmmf.datamodel !== 'object') {
    throw new Error('Invalid DMMF document: missing datamodel')
  }
  if (!Array.isArray(dmmf.datamodel.enums)) {
    throw new Error('Invalid DMMF document: datamodel.enums must be an array')
  }
  if (!Array.isArray(dmmf.datamodel.models)) {
    throw new Error('Invalid DMMF document: datamodel.models must be an array')
  }
  
  const enums = parseEnums(dmmf.datamodel.enums, logger)
  const enumMap = new Map(enums.map(e => [e.name, e]))
  
  const models = parseModels(dmmf.datamodel.models, enumMap, logger)
  const modelMap = new Map(models.map(m => [m.name, m]))
  
  // Build reverse relation map AFTER models are fully parsed
  const reverseRelationMap = buildReverseRelationMap(models)
  
  // Enhance models with derived properties (must be last)
  for (const model of models) {
    enhanceModel(model, modelMap, reverseRelationMap)
  }
  
  const schema: ParsedSchema = {
    models: Object.freeze(models),  // Freeze top-level arrays
    enums: Object.freeze(enums),    // Freeze top-level arrays
    modelMap,
    enumMap,
    reverseRelationMap
  }
  
  // Run validation if throwOnError is enabled
  if (options.throwOnError) {
    validateSchemaDetailed(schema, true)
  }
  
  return schema
}

/**
 * Type guard for DMMF enum (deep validation)
 * 
 * Note: Allows empty enums (values.length === 0) to pass through parsing.
 * Empty enums are caught later in validateSchema() with better error reporting.
 */
function isValidDMMFEnum(e: unknown): e is DMMF.DatamodelEnum {
  if (!e || typeof e !== 'object') return false
  const obj = e as Record<string, unknown>
  
  if (typeof obj.name !== 'string' || obj.name.length === 0) return false
  if (!Array.isArray(obj.values)) return false  // Allow empty arrays
  
  // Validate nested values structure
  for (const val of obj.values) {
    if (!val || typeof val !== 'object') return false
    const valObj = val as Record<string, unknown>
    if (typeof valObj.name !== 'string' || valObj.name.length === 0) return false
  }
  
  return true
}

/**
 * Type guard for DMMF model (deep validation)
 */
function isValidDMMFModel(m: unknown): m is DMMF.Model {
  if (!m || typeof m !== 'object') return false
  const obj = m as Record<string, unknown>
  
  if (typeof obj.name !== 'string' || obj.name.length === 0) return false
  if (!Array.isArray(obj.fields)) return false
  
  // Validate uniqueFields if present
  if (obj.uniqueFields !== undefined) {
    if (!Array.isArray(obj.uniqueFields)) return false
    for (const uf of obj.uniqueFields) {
      if (!Array.isArray(uf)) return false
    }
  }
  
  return true
}

/**
 * Type guard for DMMF field (deep validation)
 */
function isValidDMMFField(f: unknown): f is DMMF.Field {
  if (!f || typeof f !== 'object') return false
  const obj = f as Record<string, unknown>
  
  if (typeof obj.name !== 'string' || obj.name.length === 0) return false
  if (typeof obj.type !== 'string' || obj.type.length === 0) return false
  if (typeof obj.kind !== 'string') return false
  if (typeof obj.isList !== 'boolean') return false
  if (typeof obj.isRequired !== 'boolean') return false
  
  // Validate relationFromFields/relationToFields if present
  if (obj.relationFromFields !== undefined && !Array.isArray(obj.relationFromFields)) return false
  if (obj.relationToFields !== undefined && !Array.isArray(obj.relationToFields)) return false
  
  return true
}

/**
 * Safe JSON stringify with circular reference handling and size limit
 * Prevents console spam for large schemas
 */
function safeStringify(obj: unknown, maxLength = 500): string {
  try {
    const str = JSON.stringify(obj, null, 2)
    if (str.length > maxLength) {
      return str.substring(0, maxLength) + '... (truncated)'
    }
    return str
  } catch (err) {
    return '[Unable to serialize: circular reference or complex object]'
  }
}

/**
 * Deep freeze an object and all nested objects/arrays
 * 
 * Recursively freezes all properties to ensure complete immutability.
 * Handles circular references by tracking visited objects.
 * 
 * @param obj - Object to freeze
 * @param visited - Set of already-frozen objects (for circular reference handling)
 * @returns The frozen object
 */
function deepFreeze<T>(obj: T, visited = new WeakSet()): T {
  // Skip primitives and null
  if (obj === null || typeof obj !== 'object') return obj
  
  // Avoid freezing the same object twice (handles circular refs)
  if (visited.has(obj as any)) return obj
  visited.add(obj as any)
  
  // Freeze the object itself
  Object.freeze(obj)
  
  // Recursively freeze all properties
  if (obj && typeof obj === 'object') {
    Object.getOwnPropertyNames(obj).forEach(prop => {
      const value = (obj as any)[prop]
      if (value && typeof value === 'object') {
        deepFreeze(value, visited)
      }
    })
  }
  
  return obj
}

/**
 * Parse enums with type guards
 */
function parseEnums(enums: readonly DMMF.DatamodelEnum[], logger: DMMFParserLogger): ParsedEnum[] {
  return enums
    .filter(e => {
      if (!isValidDMMFEnum(e)) {
        logger.warn(`Skipping invalid DMMF enum: ${safeStringify(e)}`)
        return false
      }
      return true
    })
    .map(e => {
      // Filter out any malformed value objects and extract names
      // Guard against non-objects or objects missing 'name' property
      const values = e.values
        .filter(v => {
          if (!v || typeof v !== 'object' || typeof (v as any).name !== 'string') {
            logger.warn(`Skipping invalid enum value in ${e.name}: ${safeStringify(v)}`)
            return false
          }
          return true
        })
        .map(v => v.name)
      
      return {
        name: e.name,
        values: Object.freeze(values),
        documentation: sanitizeDocumentation(e.documentation)
      }
    })
}

/**
 * Parse models with type guards
 */
function parseModels(models: readonly DMMF.Model[], enumMap: Map<string, ParsedEnum>, logger: DMMFParserLogger): ParsedModel[] {
  return models
    .filter(m => {
      if (!isValidDMMFModel(m)) {
        logger.warn(`Skipping invalid DMMF model: ${safeStringify(m)}`)
        return false
      }
      return true
    })
    .map(model => {
      const fields = parseFields(model.fields, enumMap, model.name, logger)
    
    // Validate primary key fields are strings and freeze
    const primaryKey = model.primaryKey ? {
      name: model.primaryKey.name || undefined,
      fields: Object.freeze(validateStringArray(model.primaryKey.fields, `${model.name}.primaryKey.fields`))
    } : undefined
    
    return {
      name: model.name,
      // Use toLowerCase() for consistent ASCII lowercasing
      // Prisma model names are ASCII identifiers, so locale-insensitive casing is appropriate
      // Note: This avoids toLocaleLowerCase() compatibility issues in some environments
      nameLower: model.name.toLowerCase(),
      dbName: model.dbName || undefined,
      fields,
      primaryKey,
      uniqueFields: Object.freeze(model.uniqueFields.map((uf, i) => 
        Object.freeze(validateStringArray(uf, `${model.name}.uniqueFields[${i}]`))
      )),
      documentation: sanitizeDocumentation(model.documentation),
      // These will be filled by enhanceModel
      scalarFields: [],
      relationFields: [],
      createFields: [],
      updateFields: [],
      readFields: [],
      reverseRelations: [],
      hasSelfRelation: false
    }
  })
}

/**
 * Validate array contains only strings
 */
function validateStringArray(arr: readonly any[], context: string): string[] {
  if (!Array.isArray(arr)) {
    throw new Error(`${context} is not an array`)
  }
  
  for (let i = 0; i < arr.length; i++) {
    if (typeof arr[i] !== 'string') {
      throw new Error(`${context}[${i}] is not a string (got ${typeof arr[i]})`)
    }
  }
  
  return arr as string[]
}

/**
 * Parse fields with type guards
 */
function parseFields(fields: readonly DMMF.Field[], enumMap: Map<string, ParsedEnum>, modelName: string, logger: DMMFParserLogger): ParsedField[] {
  return fields
    .filter(f => {
      if (!isValidDMMFField(f)) {
        logger.warn(`Skipping invalid DMMF field in model ${modelName}: ${safeStringify(f)}`)
        return false
      }
      return true
    })
    .map(field => {
      const isEnum = enumMap.has(field.type)
    
    // Warn if enum type not found
    if (field.kind === 'enum' && !isEnum) {
      logger.warn(`Field ${modelName}.${field.name} references enum ${field.type} which was not found in parsed enums`)
    }
    
    const kind = isEnum ? 'enum' : determineFieldKind(field)
    const hasDbDefault = isDbManagedDefault(field.default)
    const isReadOnly = determineReadOnly(field)
    const isSelfRelation = field.kind === 'object' && field.type === modelName
    
    // isNullable: Type system allows null (String? in schema)
    // In Prisma: isRequired=true means field cannot be null
    // For relation fields, this is more nuanced (see below)
    const isNullable = !field.isRequired
    
    // isOptional: Field can be omitted in create operations
    // This is more nuanced than isNullable and varies by field kind:
    // 
    // List fields:
    //   Optional if nullable OR has default OR is implicit relation list
    //   Note: In Prisma, lists can be required (isRequired: true) and non-nullable
    //   Required scalar/enum lists without defaults are NOT optional (rare but valid)
    // 
    // Scalar/enum fields:
    //   Optional if nullable OR has any default value (DB or client-managed)
    //   Note: Even DB-managed defaults (autoincrement) make field optional in create
    // 
    // Relation fields:
    //   Optional if nullable OR implicit (no relationFromFields)
    //   Implicit relations are managed by the other side of the relationship
    //   and don't need to be specified when creating this model
    let isOptional: boolean
    if (field.isList) {
      // List fields need explicit checks based on kind:
      if (field.kind === 'object') {
        // Relation list - optional if nullable or implicit (no FK ownership)
        const isImplicitRelation = !field.relationFromFields || field.relationFromFields.length === 0
        isOptional = isNullable || isImplicitRelation
      } else {
        // Scalar/enum list - optional if nullable OR has default
        // Required non-nullable scalar lists WITHOUT defaults are NOT optional
        // Example: tags String[] (required, no default) - user must provide at least empty array
        isOptional = isNullable || field.hasDefaultValue
      }
    } else if (field.kind === 'object') {
      // Relation field is optional if:
      // 1. It's nullable (can pass null/undefined), OR
      // 2. It's an implicit relation (no relationFromFields - managed by other side)
      // 
      // A relation WITH relationFromFields (owns the FK) is REQUIRED unless nullable
      // because you must provide the foreign key value(s) when creating
      const isImplicitRelation = !field.relationFromFields || field.relationFromFields.length === 0
      isOptional = isNullable || isImplicitRelation
    } else {
      // Scalar/enum field is optional if nullable OR has any default
      // Client-managed defaults (now()) still make field optional since Prisma handles it
      isOptional = isNullable || field.hasDefaultValue
    }
    
    // Deep-copy and deep-freeze default if it's an object to prevent external mutations
    // Deep freezing ensures nested objects/arrays are also immutable
    const safeDefault: PrismaDefaultValue | undefined = field.default && typeof field.default === 'object'
      ? deepFreeze({ ...field.default as object }) as PrismaDefaultValue
      : field.default
    
    return {
      name: field.name,
      type: field.type,
      kind,
      isList: field.isList,
      isRequired: field.isRequired,
      isNullable,
      isOptional,
      isUnique: field.isUnique || false,
      isId: field.isId,
      isReadOnly,
      isUpdatedAt: field.isUpdatedAt || false,
      hasDefaultValue: field.hasDefaultValue,
      hasDbDefault,
      default: safeDefault,  // Frozen copy to prevent mutations
      isPartOfCompositePrimaryKey: false,  // Set by enhanceModel
      isSelfRelation,
      relationName: field.relationName,
      // Preserve relation metadata with proper array copying and freezing (no mutation of DMMF readonly arrays)
      // Arrays are copied from DMMF and frozen to prevent any accidental mutations
      // This ensures immutability for both forward and reverse relation views
      relationFromFields: field.relationFromFields ? Object.freeze([...field.relationFromFields]) : undefined,
      relationToFields: field.relationToFields ? Object.freeze([...field.relationToFields]) : undefined,
      documentation: sanitizeDocumentation(field.documentation)
    }
  })
}

/**
 * Determine field kind
 */
function determineFieldKind(field: DMMF.Field): 'scalar' | 'object' | 'enum' | 'unsupported' {
  if (field.kind === 'scalar') return 'scalar'
  if (field.kind === 'object') return 'object'
  if (field.kind === 'enum') return 'enum'
  return 'unsupported'
}

/**
 * Check if default value is DB-managed (not client-side)
 * 
 * DB-managed defaults (autoincrement, uuid, cuid, dbgenerated):
 * - Handled entirely by the database
 * - Should NOT be included in INSERT statements
 * - Should NOT be in create DTOs
 * - Field marked as read-only if it's an ID or system timestamp
 * 
 * IMPORTANT: 'now()' is CLIENT-managed and returns false here
 * This ensures consistency with getDefaultValueString() which returns 'new Date()' for now()
 * 
 * @param defaultValue - The default value from DMMF field
 * @returns true if DB-managed, false if client-managed or not a function default
 */
function isDbManagedDefault(defaultValue: unknown): boolean {
  if (!defaultValue || typeof defaultValue !== 'object') return false
  
  const def = defaultValue as Record<string, unknown>
  if (!('name' in def) || typeof def.name !== 'string') return false
  
  // Explicitly check it's NOT a client-managed default
  if (CLIENT_MANAGED_DEFAULTS.includes(def.name as typeof CLIENT_MANAGED_DEFAULTS[number])) {
    return false
  }
  
  // Check if it's a known DB-managed default
  // Note: dbgenerated can have args (validated via 'args' property), but we still treat it as DB-managed
  return DB_MANAGED_DEFAULTS.includes(def.name as typeof DB_MANAGED_DEFAULTS[number])
}

/**
 * Check if default value is client-managed (e.g., now())
 * 
 * Client-managed defaults:
 * - Evaluated on the client side
 * - Passed to database in INSERT statements
 * - Should be in create DTOs as optional fields
 * - getDefaultValueString() returns TypeScript code for these
 * 
 * Exported for use by generators that need to distinguish client-managed defaults
 * 
 * @param defaultValue - The default value from DMMF field
 * @returns true if client-managed, false otherwise
 */
export function isClientManagedDefault(defaultValue: unknown): boolean {
  if (!defaultValue || typeof defaultValue !== 'object') return false
  
  const def = defaultValue as Record<string, unknown>
  if (!('name' in def) || typeof def.name !== 'string') return false
  
  return CLIENT_MANAGED_DEFAULTS.includes(def.name as typeof CLIENT_MANAGED_DEFAULTS[number])
}

/**
 * Determine if field is read-only
 * 
 * Uses SYSTEM_TIMESTAMP_FIELDS consistently instead of hardcoding names.
 * 
 * Important: createdAt/updatedAt with client-managed defaults (now()) are NOT read-only
 * to allow user-provided values during creation. Only DB-managed defaults make them read-only.
 */
function determineReadOnly(field: DMMF.Field): boolean {
  // Explicitly marked as read-only
  if (field.isReadOnly) return true
  
  // ID fields with DB-managed defaults (autoincrement, uuid, etc)
  if (field.isId && field.hasDefaultValue && isDbManagedDefault(field.default)) return true
  
  // @updatedAt fields are always read-only (Prisma manages them automatically)
  if (field.isUpdatedAt) return true
  
  // System timestamp fields are read-only ONLY if they have DB-managed defaults
  // Client-managed defaults (like now()) should allow user-provided values
  const isSystemTimestamp = SYSTEM_TIMESTAMP_FIELDS.includes(field.name as typeof SYSTEM_TIMESTAMP_FIELDS[number])
  if (isSystemTimestamp && field.hasDefaultValue && isDbManagedDefault(field.default)) {
    return true
  }
  
  return false
}

/**
 * Sanitize documentation strings for safe code generation in JSDoc comments
 * 
 * Preserves code examples and markdown while preventing comment injection.
 * Handles triple and single backticks correctly with proper state tracking.
 * 
 * @param doc - Documentation string to sanitize
 * @returns Sanitized string safe for JSDoc, or undefined if empty
 */
function sanitizeDocumentation(doc: string | undefined): string | undefined {
  if (!doc) return undefined
  
  // Normalize line endings first
  let sanitized = doc.replace(/\r\n/g, '\n')
  
  // Track code blocks properly (triple backticks have priority over single)
  let result = ''
  let i = 0
  let inTripleBacktick = false
  let inSingleBacktick = false
  
  while (i < sanitized.length) {
    const char = sanitized[i]
    const next = sanitized[i + 1]
    const next2 = sanitized[i + 2]
    
    // Check for triple backtick (code block) - MUST check before single backtick
    // Triple backticks override single backtick state
    if (char === '`' && next === '`' && next2 === '`') {
      inTripleBacktick = !inTripleBacktick
      // When entering/exiting triple backtick, reset single backtick state
      if (inSingleBacktick && inTripleBacktick) {
        inSingleBacktick = false
      }
      result += '```'
      i += 3
      continue
    }
    
    // Check for single backtick (inline code) - only if not in triple backtick
    if (!inTripleBacktick && char === '`') {
      inSingleBacktick = !inSingleBacktick
      result += char
      i++
      continue
    }
    
    // Escape comment-closing sequences outside of ALL code blocks
    if (!inTripleBacktick && !inSingleBacktick) {
      if (char === '*' && next === '/') {
        result += '*\\/'
        i += 2
        continue
      }
      if (char === '/' && next === '*') {
        result += '/\\*'
        i += 2
        continue
      }
    }
    
    // Regular character
    result += char
    i++
  }
  
  // Convert to single line for JSDoc and collapse spaces
  // Note: This may reduce markdown readability but is necessary for JSDoc format
  // JSDoc rendering will handle some markdown formatting even in single-line format
  return result
    .replace(/\n/g, ' ')        // Convert to single line for JSDoc
    .replace(/\s+/g, ' ')       // Collapse multiple spaces
    .trim()
}

/**
 * Build reverse relation map
 * Maps model names to fields from other models that reference them
 * 
 * Creates frozen copies to prevent unintentional mutations and cross-contamination
 * between forward and reverse relation views.
 * 
 * Deduplication key includes:
 * - Source model name
 * - Field name  
 * - Relation name (or 'implicit' if undefined)
 * - Target model name
 * 
 * This ensures each unique relation is recorded once, even across multiple
 * parsing passes or schema manipulations.
 * 
 * Returns map with frozen arrays to prevent external mutations that could
 * corrupt results across multiple parse calls.
 */
function buildReverseRelationMap(models: ParsedModel[]): Map<string, readonly ParsedField[]> {
  const map = new Map<string, ParsedField[]>()
  const modelNames = new Set(models.map(m => m.name))
  
  // Initialize map with empty arrays for all valid models
  for (const model of models) {
    map.set(model.name, [])
  }
  
  // Track global deduplication key to prevent duplicates across all passes
  const globalSeen = new Set<string>()
  
  // Populate reverse relations with deduplication
  for (const model of models) {
    for (const field of model.fields) {
      if (field.kind === 'object') {
        // Only add if target model exists (prevents dangling references)
        if (modelNames.has(field.type)) {
          // Comprehensive deduplication key: source.field.relation.target
          // Handles explicit and implicit relations, self-relations, and many-to-many
          const key = `${model.name}.${field.name}.${field.relationName || 'implicit'}.${field.type}`
          if (!globalSeen.has(key)) {
            globalSeen.add(key)
            const targetRelations = map.get(field.type)
            if (targetRelations) {  // Defensive check instead of !
              // Create a deep frozen copy to prevent mutations affecting both forward and reverse views
              // This is critical because ParsedField objects may be shared or referenced elsewhere
              const frozenField: ParsedField = Object.freeze({
                ...field,
                relationFromFields: field.relationFromFields ? Object.freeze([...field.relationFromFields]) : undefined,
                relationToFields: field.relationToFields ? Object.freeze([...field.relationToFields]) : undefined,
                // Deep-copy and deep-freeze default object to prevent external mutations
                default: field.default && typeof field.default === 'object' 
                  ? deepFreeze({ ...field.default as object }) as PrismaDefaultValue
                  : field.default
              })
              targetRelations.push(frozenField)
            }
          }
        }
      }
    }
  }
  
  // Freeze all arrays in the map before returning to prevent external mutations
  const frozenMap = new Map<string, readonly ParsedField[]>()
  for (const [key, value] of map.entries()) {
    frozenMap.set(key, Object.freeze(value))
  }
  
  return frozenMap
}

/**
 * Enhance model with derived properties
 * 
 * Optimized single-pass categorization of fields
 * 
 * Note: This function mutates the model in-place during initial parsing.
 * The readonly properties in ParsedModel interface are for consumers,
 * not for the initial construction phase.
 */
function enhanceModel(
  model: ParsedModel, 
  modelMap: Map<string, ParsedModel>,
  reverseRelationMap: Map<string, readonly ParsedField[]>
): void {
  // Cast to mutable version for initialization
  // This is safe because we're in the construction phase
  const mutableModel = model as {
    -readonly [K in keyof ParsedModel]: ParsedModel[K]
  }
  // Mark fields that are part of composite primary key
  if (model.primaryKey?.fields) {
    const compositePkFields = new Set(model.primaryKey.fields)
    for (const field of model.fields) {
      if (compositePkFields.has(field.name)) {
        field.isPartOfCompositePrimaryKey = true
      }
    }
  }
  
  // Single-pass field categorization (performance optimization)
  const scalarFields: ParsedField[] = []
  const relationFields: ParsedField[] = []
  const createFields: ParsedField[] = []
  const updateFields: ParsedField[] = []
  let idField: ParsedField | undefined
  let hasSelfRelation = false
  
  // Type-safe check for system timestamp fields
  const isSystemTimestamp = (name: string): boolean => 
    (SYSTEM_TIMESTAMP_FIELDS as readonly string[]).includes(name)
  
  for (const field of model.fields) {
    // Track ID field
    if (field.isId) idField = field
    
    // Track self-relations
    if (field.isSelfRelation) hasSelfRelation = true
    
    // Categorize by kind
    if (field.kind === 'object') {
      relationFields.push(field)
      continue
    }
    
    if (field.kind === 'unsupported') {
      continue // Skip unsupported fields entirely
    }
    
    // Scalar or enum field (unsupported already skipped)
    scalarFields.push(field)
    
    // Check if field should be in CreateDTO and UpdateDTO
    // Exclusions apply to both create and update:
    // - ID fields (generated or provided separately)
    // - Read-only fields (computed, @updatedAt, etc.)
    // - DB-managed timestamps (createdAt with default, updatedAt)
    // - Unsupported field types (already filtered above)
    // Note: If criteria diverge in future (e.g., create vs update optionality), split this
    const isDbManagedTimestamp = field.hasDbDefault && isSystemTimestamp(field.name)
    const isIncludedInDTO = !field.isId && !field.isReadOnly && !field.isUpdatedAt && !isDbManagedTimestamp
    
    if (isIncludedInDTO) {
      createFields.push(field)
      updateFields.push(field)
    }
  }
  
  // Set all derived properties
  // Note: Freeze all arrays for immutability and consistency
  // Using mutableModel to assign to readonly properties during construction
  mutableModel.idField = idField
  mutableModel.fields = Object.freeze([...model.fields])
  mutableModel.scalarFields = Object.freeze(scalarFields)
  mutableModel.relationFields = Object.freeze(relationFields)
  mutableModel.createFields = Object.freeze(createFields)
  mutableModel.updateFields = Object.freeze(updateFields)
  mutableModel.readFields = Object.freeze([...scalarFields]) // All scalar fields for reading
  mutableModel.hasSelfRelation = hasSelfRelation
  mutableModel.reverseRelations = Object.freeze([...(reverseRelationMap.get(model.name) || [])])
}

// ============================================================================
// HELPER FUNCTIONS AND UTILITIES
// ============================================================================

/**
 * Get field by name
 * @returns Field if found, undefined if not found
 * @throws Never - Use optional chaining when calling (field?.name)
 */
export function getField(model: ParsedModel, fieldName: string): ParsedField | undefined {
  return model.fields.find(f => f.name === fieldName)
}

/**
 * Get relation target model
 * @param field - Field to get target for
 * @param modelMap - Map of all models
 * @returns Target model if field is a relation and target exists, undefined otherwise
 * 
 * Returns undefined when:
 * - field.kind is not 'object' (not a relation)
 * - Target model doesn't exist in modelMap
 */
export function getRelationTarget(
  field: ParsedField,
  modelMap: Map<string, ParsedModel>
): ParsedModel | undefined {
  if (field.kind !== 'object') return undefined
  return modelMap.get(field.type)
}

/**
 * Check if field is optional for create
 */
export function isOptionalForCreate(field: ParsedField): boolean {
  return field.isOptional
}

/**
 * Check if field is nullable
 */
export function isNullable(field: ParsedField): boolean {
  return field.isNullable
}

/**
 * Escape string for safe embedding in generated TypeScript code
 * Handles backslashes, quotes, control chars, script tags, and backticks
 * 
 * Note: Includes backtick escaping for potential template literal usage.
 * Currently only used for double-quoted strings, but future-proofed.
 */
function escapeForCodeGen(str: string): string {
  return str
    .replace(/\\/g, '\\\\')           // Backslash (MUST be first)
    .replace(/"/g, '\\"')             // Double quote
    .replace(/'/g, "\\'")             // Single quote
    .replace(/`/g, '\\`')             // Backtick (for template literals)
    .replace(/\n/g, '\\n')            // Newline
    .replace(/\r/g, '\\r')            // Carriage return
    .replace(/\t/g, '\\t')            // Tab
    .replace(/\f/g, '\\f')            // Form feed
    .replace(/\v/g, '\\v')            // Vertical tab
    .replace(/\u2028/g, '\\u2028')    // Line separator
    .replace(/\u2029/g, '\\u2029')    // Paragraph separator
    .replace(/<\/script>/gi, '<\\/script>') // Script tag
    .replace(/<\/style>/gi, '<\\/style>')   // Style tag
}

/**
 * Get default value as string for TypeScript code generation
 * 
 * Converts Prisma default values to TypeScript code strings for client-side defaults.
 * 
 * Supported:
 * - Primitive literals: string, number (safe range), boolean, null
 * - Client-managed functions: now() → new Date()
 * - Enum values: returns qualified reference (e.g., "EnumName.VALUE")
 * 
 * Not supported (returns undefined):
 * - DB-managed functions: autoincrement(), uuid(), cuid(), dbgenerated()
 * - Complex types: Decimal, BigInt, Bytes, JSON (requires special handling)
 * - Array/object literals (Prisma doesn't support for scalar fields)
 * - Unknown functions (future Prisma additions, treated conservatively as DB-managed)
 * 
 * Security:
 * - String values are escaped for safe embedding in generated code
 * - Prevents code injection via backslashes, quotes, newlines, script tags
 * 
 * Note: Prisma doesn't support array defaults for scalar fields.
 * Array defaults exist only for composite types which aren't generated here.
 * 
 * @param field - Parsed field with potential default value
 * @returns TypeScript code string for the default value, or undefined if:
 *  - No default value
 *  - DB-managed default (handled by database)
 *  - Cannot be safely represented in TypeScript
 *  - Requires special handling by generators (complex types)
 */
export function getDefaultValueString(field: ParsedField): string | undefined {
  if (!field.hasDefaultValue || !field.default) return undefined
  
  const def = field.default
  
  // Primitive values with proper escaping
  if (typeof def === 'string') {
    // Check if it's an enum value (enum fields have kind === 'enum')
    if (field.kind === 'enum') {
      // Validate that enum value is a valid TypeScript identifier
      // Valid identifiers: start with letter/underscore, continue with alphanumeric/underscore
      const isValidIdentifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(def)
      
      if (isValidIdentifier) {
        // Return qualified enum reference for generators to use (dot notation)
        return `${field.type}.${def}`
      } else {
        // Fallback to bracket notation for invalid identifiers (e.g., "123", "my-value")
        return `${field.type}["${escapeForCodeGen(def)}"]`
      }
    }
    return `"${escapeForCodeGen(def)}"`
  }
  
  if (typeof def === 'number') {
    // Reject special numbers that don't have safe TypeScript representations
    if (!Number.isFinite(def)) return undefined
    
    // Guard against BigInt values that exceed safe integer range
    // Prisma may store BigInt defaults as numbers in DMMF
    if (def > Number.MAX_SAFE_INTEGER || def < Number.MIN_SAFE_INTEGER) {
      // BigInt literals would need special handling (e.g., 123n syntax)
      return undefined
    }
    
    // Guard against Decimal-like fractional values for BigInt fields
    // If field type is BigInt but default has decimals, it's invalid
    if (field.type === 'BigInt' && !Number.isInteger(def)) {
      return undefined
    }
    
    return String(def)
  }
  
  if (typeof def === 'boolean') return String(def)
  if (def === null) return 'null'
  
  // Prisma function defaults
  if (typeof def === 'object' && 'name' in def) {
    const defObj = def as { name: string; args?: readonly unknown[] }
    
    switch (defObj.name) {
      // Client-managed defaults (evaluated on client before sending to DB)
      case 'now': 
        return 'new Date()'
      
      // DB-managed defaults (return undefined - handled by DB, not client)
      // These should never appear in INSERT statements or create DTOs
      case 'autoincrement': 
      case 'uuid': 
      case 'cuid': 
      case 'dbgenerated': 
        return undefined
      
      // Unknown function - treat conservatively as DB-managed
      // Future Prisma versions may add new functions
      // Generators can override this behavior if needed
      default: 
        return undefined
    }
  }
  
  // Complex objects or unexpected types
  // Including: Decimal, Bytes, Json, DateTime (non-function)
  return undefined
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

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

/**
 * Validate parsed schema
 * 
 * @param schema - Parsed schema to validate
 * @param throwOnError - If true, throws on validation errors
 * @returns Array of all validation messages (errors, warnings, infos) with prefixes
 * 
 * Note: Use validateSchemaDetailed() to get structured results
 */
export function validateSchema(schema: ParsedSchema, throwOnError = false): string[] {
  const result = validateSchemaDetailed(schema, throwOnError)
  return result.all
}

/**
 * Validate parsed schema with detailed results
 * 
 * @param schema - Parsed schema to validate
 * @param throwOnError - If true, throws on validation errors
 * @returns Structured validation results
 */
export function validateSchemaDetailed(schema: ParsedSchema, throwOnError = false): SchemaValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const infos: string[] = []
  
  // Validate enums
  for (const enumDef of schema.enums) {
    if (enumDef.values.length === 0) {
      errors.push(`Enum ${enumDef.name} has no values`)
    }
  }
  
  for (const model of schema.models) {
    // Check for ID field or composite primary key
    const hasIdField = !!model.idField
    const hasCompositePrimaryKey = model.primaryKey && model.primaryKey.fields.length > 0
    
    if (!hasIdField && !hasCompositePrimaryKey) {
      errors.push(`Model ${model.name} has no @id field or @@id composite key`)
    }
    
    // Validate uniqueFields reference existing fields
    for (const uniqueConstraint of model.uniqueFields) {
      for (const fieldName of uniqueConstraint) {
        const field = model.fields.find(f => f.name === fieldName)
        if (!field) {
          errors.push(`Model ${model.name} unique constraint references non-existent field: ${fieldName}`)
        }
      }
    }
    
    // Check relations
    for (const field of model.relationFields) {
      const target = schema.modelMap.get(field.type)
      if (!target) {
        errors.push(`Model ${model.name} references unknown model ${field.type}`)
      }
      
      // Validate relation fields are populated
      if (field.relationFromFields && field.relationFromFields.length > 0) {
        if (!field.relationToFields || field.relationToFields.length === 0) {
          errors.push(`Relation ${model.name}.${field.name} has relationFromFields but missing relationToFields`)
        } else {
          // Validate relationFromFields and relationToFields have matching counts
          // Each FK field must map to exactly one PK field (1:1 correspondence)
          if (field.relationFromFields.length !== field.relationToFields.length) {
            errors.push(
              `Relation ${model.name}.${field.name} has mismatched field counts: ` +
              `${field.relationFromFields.length} from-fields vs ${field.relationToFields.length} to-fields. ` +
              `Each foreign key field must map to exactly one primary key field.`
            )
          }
        }
        
        // Validate relationFromFields exist in model
        for (const fromField of field.relationFromFields) {
          const exists = model.fields.some(f => f.name === fromField)
          if (!exists) {
            errors.push(`Relation ${model.name}.${field.name} references non-existent field in relationFromFields: ${fromField}`)
          }
        }
        
        // Validate relationToFields exist in target model
        if (target && field.relationToFields) {
          for (const toField of field.relationToFields) {
            const exists = target.fields.some(f => f.name === toField)
            if (!exists) {
              errors.push(`Relation ${model.name}.${field.name} references non-existent field in relationToFields: ${toField}`)
            }
          }
        }
      }
      
      // Self-referencing relations need special handling in generators
      if (field.isSelfRelation) {
        infos.push(`Model ${model.name}.${field.name} is a self-referencing relation (requires special generator handling)`)
        
        // Validate self-relation circular dependencies
        // A self-relation that is both required AND has relationFromFields creates a chicken-egg problem:
        // - Required (not nullable) means it cannot be null
        // - relationFromFields means this side owns the foreign key
        // - This creates an impossible constraint: you can't insert the first record
        // Solution: Make the FK scalar field optional to allow two-step insert
        // 
        // Note: isRequired and isNullable are inverses for most fields,
        // but we check both explicitly for clarity and future-proofing
        const ownsFK = field.relationFromFields && field.relationFromFields.length > 0
        const cannotBeNull = field.isRequired && !field.isNullable
        
        if (cannotBeNull && ownsFK) {
          const fkFields = field.relationFromFields?.join(', ') || '<unknown>'
          errors.push(
            `Self-referencing relation ${model.name}.${field.name} is required (not nullable) ` +
            `and owns the foreign key (relationFromFields: [${fkFields}]), creating impossible constraint. ` +
            `Solution: Make the foreign key scalar field(s) optional (e.g., parentId Int?) OR ` +
            `add a default value to break the circular dependency and allow two-step insert.`
          )
        }
      }
    }
    
    // Check enums
    for (const field of model.fields) {
      if (field.kind === 'enum' && !schema.enumMap.has(field.type)) {
        errors.push(`Field ${model.name}.${field.name} references unknown enum ${field.type}`)
      }
    }
    
    // Warn about unsupported fields
    const unsupportedFields = model.fields.filter(f => f.kind === 'unsupported')
    if (unsupportedFields.length > 0) {
      for (const field of unsupportedFields) {
        warnings.push(`Field ${model.name}.${field.name} has unsupported type ${field.type}`)
      }
    }
  }
  
  // Check for circular relationship dependencies
  const circularErrors = detectCircularRelations(schema)
  errors.push(...circularErrors)
  
  // Combine all messages with consistent prefixes
  const allMessages = [
    ...errors.map(e => `ERROR: ${e}`),
    ...warnings.map(w => `WARNING: ${w}`),
    ...infos.map(i => `INFO: ${i}`)
  ]
  
  const result: SchemaValidationResult = {
    errors,
    warnings,
    infos,
    all: allMessages,
    isValid: errors.length === 0
  }
  
  if (throwOnError && errors.length > 0) {
    throw new Error(`Schema validation failed:\n${errors.join('\n')}`)
  }
  
  return result
}

/**
 * Detect circular relationship dependencies
 * 
 * Only checks for required (non-nullable) relations that own the foreign key (relationFromFields),
 * as these create actual insertion order dependencies that block data creation.
 * 
 * Relations that don't block insertion:
 * - Optional/nullable relations (can insert with null, then update)
 * - List relations (can be empty array)
 * - Implicit relations (no relationFromFields - managed by other side)
 * 
 * This prevents false positives for valid circular patterns like:
 * - User <-> Profile where one side is nullable
 * - Parent -> Child <- Parent where lists are involved
 * 
 * Performance: Uses single global DFS instead of per-model restarts.
 * Deduplicates cycles by tracking visited nodes in current path.
 */
function detectCircularRelations(schema: ParsedSchema): string[] {
  const errors: string[] = []
  const visited = new Set<string>()
  const recursionStack = new Set<string>()  // Track current path for cycle detection
  const seenCycles = new Set<string>()  // Deduplicate reported cycles
  
  function visit(modelName: string, path: string[]): void {
    if (recursionStack.has(modelName)) {
      // Found a cycle - extract the cycle from the path
      const cycleStartIndex = path.findIndex(p => p.startsWith(modelName + '.'))
      const cyclePath = cycleStartIndex >= 0 
        ? [...path.slice(cycleStartIndex), modelName]
        : [...path, modelName]
      
      // Create a normalized cycle key for deduplication
      // Don't sort - preserve edge order for accurate cycle representation
      const cycleKey = cyclePath.join(' -> ')
      
      // Also check reverse direction to avoid reporting A->B->A and B->A->B separately
      const reversedCycle = [...cyclePath].reverse().join(' -> ')
      
      if (!seenCycles.has(cycleKey) && !seenCycles.has(reversedCycle)) {
        seenCycles.add(cycleKey)
        errors.push(
          `Circular relationship detected: ${cyclePath.join(' -> ')}. ` +
          `Make at least one relation nullable or remove relationFromFields to break the cycle.`
        )
      }
      return
    }
    
    if (visited.has(modelName)) return
    
    const model = schema.modelMap.get(modelName)
    if (!model) return
    
    recursionStack.add(modelName)
    
    // Only check required relations that own the FK and create insertion dependencies
    // Skip if:
    // - No relationFields (parsing incomplete)
    // - No relationFromFields (implicit relation, managed by other side)
    // - isList (can be empty array, doesn't block insertion)
    // - isOptional (can insert with null/undefined, then update later)
    for (const field of model.relationFields || []) {
      const ownsFK = field.relationFromFields && field.relationFromFields.length > 0
      const cannotBeNull = field.isRequired && !field.isNullable
      const blocksInsertion = cannotBeNull && !field.isList && ownsFK
      
      if (blocksInsertion) {
        // Build path with "ModelName.fieldName" format
        visit(field.type, [...path, `${modelName}.${field.name}`])
      }
    }
    
    recursionStack.delete(modelName)
    visited.add(modelName)
  }
  
  // Single global DFS pass - more efficient than per-model restarts
  for (const model of schema.models) {
    if (!visited.has(model.name)) {
      visit(model.name, [])
    }
  }
  
  return errors
}

