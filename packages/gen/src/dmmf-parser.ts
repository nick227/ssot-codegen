/**
 * DMMF Parser - Parses Prisma DMMF into normalized, usable format
 * 
 * Extracts everything we need from Prisma schema:
 * - Models and fields
 * - Field types and constraints
 * - Relationships
 * - Enums
 * - Documentation
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
 * Default console logger
 */
const defaultLogger: DMMFParserLogger = {
  warn: (msg) => console.warn(msg),
  error: (msg) => console.error(msg)
}

/**
 * Global logger instance (can be overridden)
 */
let logger: DMMFParserLogger = defaultLogger

/**
 * Set custom logger
 */
export function setDMMFParserLogger(customLogger: DMMFParserLogger): void {
  logger = customLogger
}

/**
 * Reset to default logger
 */
export function resetDMMFParserLogger(): void {
  logger = defaultLogger
}

/**
 * Prisma DB-managed default function names
 */
const DB_MANAGED_DEFAULTS = ['autoincrement', 'uuid', 'cuid', 'now', 'dbgenerated'] as const
type DbManagedDefault = typeof DB_MANAGED_DEFAULTS[number]

/**
 * System-managed timestamp field names
 */
const SYSTEM_TIMESTAMP_FIELDS = ['createdAt', 'updatedAt'] as const

/**
 * Prisma default value types
 * Flexible to accommodate DMMF readonly types
 */
export type PrismaDefaultValue = 
  | string 
  | number 
  | boolean 
  | { name: string; args?: readonly any[] | any[] }
  | null
  | undefined

/**
 * Parsed field from Prisma schema
 * 
 * Note: isNullable vs isOptional distinction
 * - isNullable: Type allows null (String? → can store null in DB)
 * - isOptional: Can be omitted in create operations (has default OR is nullable)
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
  default?: any  // DMMF uses complex readonly types, use any for flexibility
  
  // Composite key metadata (for generator use)
  isPartOfCompositePrimaryKey: boolean
  
  // Relationship metadata
  isSelfRelation: boolean  // Field references its own model
  relationName?: string
  relationFromFields?: string[]
  relationToFields?: string[]
  
  // Documentation
  documentation?: string
}

export interface ParsedModel {
  name: string
  nameLower: string  // Lowercase name for case-insensitive lookups
  dbName?: string
  fields: ParsedField[]
  primaryKey?: {
    name?: string
    fields: string[]
  }
  uniqueFields: string[][]
  documentation?: string
  // Derived properties
  idField?: ParsedField
  scalarFields: ParsedField[]
  relationFields: ParsedField[]
  createFields: ParsedField[]  // Fields for CreateDTO
  updateFields: ParsedField[]  // Fields for UpdateDTO
  readFields: ParsedField[]    // Fields for ReadDTO
  reverseRelations: ParsedField[]  // Fields from other models that reference this model
  hasSelfRelation: boolean  // Model has fields that reference itself
}

export interface ParsedEnum {
  name: string
  values: string[]
  documentation?: string
}

export interface ParsedSchema {
  models: ParsedModel[]
  enums: ParsedEnum[]
  modelMap: Map<string, ParsedModel>
  enumMap: Map<string, ParsedEnum>
  reverseRelationMap: Map<string, ParsedField[]>  // modelName -> fields that reference it
}

/**
 * Parse DMMF into our format
 * 
 * IMPORTANT: Parse order dependency
 * 1. Parse enums (independent)
 * 2. Parse models (depends on enumMap)
 * 3. Build reverse relation map (depends on parsed models)
 * 4. Enhance models (depends on models, modelMap, reverseRelationMap)
 * 
 * This order ensures all dependencies are satisfied before enhancement.
 */
export function parseDMMF(dmmf: DMMF.Document): ParsedSchema {
  const enums = parseEnums(dmmf.datamodel.enums)
  const enumMap = new Map(enums.map(e => [e.name, e]))
  
  const models = parseModels(dmmf.datamodel.models, enumMap)
  const modelMap = new Map(models.map(m => [m.name, m]))
  
  // Build reverse relation map AFTER models are fully parsed
  const reverseRelationMap = buildReverseRelationMap(models)
  
  // Enhance models with derived properties (must be last)
  for (const model of models) {
    enhanceModel(model, modelMap, reverseRelationMap)
  }
  
  return {
    models,
    enums,
    modelMap,
    enumMap,
    reverseRelationMap
  }
}

/**
 * Type guard for DMMF enum
 */
function isValidDMMFEnum(e: any): e is DMMF.DatamodelEnum {
  return e && typeof e.name === 'string' && Array.isArray(e.values)
}

/**
 * Type guard for DMMF model
 */
function isValidDMMFModel(m: any): m is DMMF.Model {
  return m && typeof m.name === 'string' && Array.isArray(m.fields)
}

/**
 * Type guard for DMMF field
 */
function isValidDMMFField(f: any): f is DMMF.Field {
  return f && typeof f.name === 'string' && typeof f.type === 'string' && typeof f.kind === 'string'
}

/**
 * Parse enums with type guards
 */
function parseEnums(enums: readonly DMMF.DatamodelEnum[]): ParsedEnum[] {
  return enums
    .filter(e => {
      if (!isValidDMMFEnum(e)) {
        logger.warn(`Skipping invalid DMMF enum: ${JSON.stringify(e)}`)
        return false
      }
      return true
    })
    .map(e => ({
      name: e.name,
      values: e.values.map(v => v.name),  // Direct assignment (no spread needed)
      documentation: e.documentation
    }))
}

/**
 * Parse models with type guards
 */
function parseModels(models: readonly DMMF.Model[], enumMap: Map<string, ParsedEnum>): ParsedModel[] {
  return models
    .filter(m => {
      if (!isValidDMMFModel(m)) {
        logger.warn(`Skipping invalid DMMF model: ${JSON.stringify(m)}`)
        return false
      }
      return true
    })
    .map(model => {
      const fields = parseFields(model.fields, enumMap, model.name)
    
    // Validate primary key fields are strings
    const primaryKey = model.primaryKey ? {
      name: model.primaryKey.name || undefined,
      fields: validateStringArray(model.primaryKey.fields, `${model.name}.primaryKey.fields`)
    } : undefined
    
    return {
      name: model.name,
      nameLower: model.name.toLowerCase(),
      dbName: model.dbName || undefined,
      fields,
      primaryKey,
      uniqueFields: model.uniqueFields.map((uf, i) => 
        validateStringArray(uf, `${model.name}.uniqueFields[${i}]`)
      ),
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
function parseFields(fields: readonly DMMF.Field[], enumMap: Map<string, ParsedEnum>, modelName: string): ParsedField[] {
  return fields
    .filter(f => {
      if (!isValidDMMFField(f)) {
        logger.warn(`Skipping invalid DMMF field in model ${modelName}: ${JSON.stringify(f)}`)
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
    
    // In Prisma's DMMF:
    // - isRequired: true  → field String (cannot be null)
    // - isRequired: false → field String? (can be null)
    // So isNullable is correctly derived from !isRequired
    const isNullable = !field.isRequired
    
    // isOptional means "can be omitted in create operations"
    // True if: not required (can pass null) OR has a default value
    const isOptional = !field.isRequired || field.hasDefaultValue
    
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
      default: field.default,
      isPartOfCompositePrimaryKey: false,  // Set by enhanceModel
      isSelfRelation,
      relationName: field.relationName,
      relationFromFields: field.relationFromFields as string[] | undefined,
      relationToFields: field.relationToFields as string[] | undefined,
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
 * Check if default value is DB-managed
 */
function isDbManagedDefault(defaultValue: any): boolean {
  if (!defaultValue || typeof defaultValue !== 'object') return false
  if (!('name' in defaultValue)) return false
  
  return DB_MANAGED_DEFAULTS.includes(defaultValue.name as any)
}

/**
 * Determine if field is read-only
 */
function determineReadOnly(field: DMMF.Field): boolean {
  // Explicitly marked as read-only
  if (field.isReadOnly) return true
  
  // ID fields with autoincrement
  if (field.isId && field.hasDefaultValue && isDbManagedDefault(field.default)) return true
  
  // @updatedAt fields are read-only
  if (field.isUpdatedAt) return true
  
  // @createdAt fields with @default(now()) are read-only
  if (field.name === 'createdAt' && field.hasDefaultValue && isDbManagedDefault(field.default)) return true
  
  return false
}

/**
 * Sanitize documentation strings for safe code generation in JSDoc comments
 * 
 * Preserves code examples and markdown while preventing comment injection
 * 
 * @param doc - Documentation string to sanitize
 * @returns Sanitized string safe for JSDoc, or undefined if empty
 */
function sanitizeDocumentation(doc: string | undefined): string | undefined {
  if (!doc) return undefined
  
  // Normalize line endings first
  let sanitized = doc.replace(/\r\n/g, '\n')
  
  // Only escape */ that would actually close JSDoc (not in code blocks)
  // Check if we're in a code block by looking for backticks
  const hasCodeBlocks = /```[\s\S]*?```|`[^`]*`/.test(sanitized)
  
  if (hasCodeBlocks) {
    // Preserve code blocks, only escape */ outside of them
    const parts: string[] = []
    let inCodeBlock = false
    let current = ''
    
    for (let i = 0; i < sanitized.length; i++) {
      const char = sanitized[i]
      const next = sanitized[i + 1]
      const prev = sanitized[i - 1]
      
      if (char === '`') {
        inCodeBlock = !inCodeBlock
        current += char
      } else if (!inCodeBlock && char === '*' && next === '/') {
        current += '*\\/'
        i++ // Skip the /
      } else {
        current += char
      }
    }
    sanitized = current
  } else {
    // No code blocks, simple escaping
    sanitized = sanitized
      .replace(/\*\//g, '*\\/')   // Escape */ to prevent closing comment
      .replace(/\/\*/g, '/\\*')   // Escape /* to prevent nested comments
  }
  
  // Convert to single line for JSDoc and collapse spaces
  return sanitized
    .replace(/\n/g, ' ')        // Convert to single line for JSDoc
    .replace(/\s+/g, ' ')       // Collapse multiple spaces
    .trim()
}

/**
 * Build reverse relation map
 * Maps model names to fields from other models that reference them
 * 
 * Note: Deduplicates entries based on field name and source model
 */
function buildReverseRelationMap(models: ParsedModel[]): Map<string, ParsedField[]> {
  const map = new Map<string, ParsedField[]>()
  const modelNames = new Set(models.map(m => m.name))
  
  // Initialize map with empty arrays for all valid models
  for (const model of models) {
    map.set(model.name, [])
  }
  
  // Populate reverse relations with deduplication
  for (const model of models) {
    const seen = new Set<string>()
    
    for (const field of model.fields) {
      if (field.kind === 'object') {
        // Only add if target model exists (prevents dangling references)
        if (modelNames.has(field.type)) {
          // Deduplicate based on source model + field name
          const key = `${model.name}.${field.name}`
          if (!seen.has(key)) {
            seen.add(key)
            const targetRelations = map.get(field.type)!
            targetRelations.push(field)
          }
        }
      }
    }
  }
  
  return map
}

/**
 * Enhance model with derived properties
 * 
 * Optimized single-pass categorization of fields
 */
function enhanceModel(
  model: ParsedModel, 
  modelMap: Map<string, ParsedModel>,
  reverseRelationMap: Map<string, ParsedField[]>
): void {
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
  
  const isSystemTimestamp = (name: string) => 
    SYSTEM_TIMESTAMP_FIELDS.includes(name as any)
  
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
    
    // Scalar field
    scalarFields.push(field)
    
    // Check if field should be in CreateDTO and UpdateDTO
    // Note: Both have same criteria since:
    // - @updatedAt is already excluded above (isReadOnly check covers it)
    // - All other exclusions apply to both create and update
    // If criteria diverge in future, this should be split
    const isDbManagedTimestamp = field.hasDbDefault && isSystemTimestamp(field.name)
    const isIncludedInDTO = !field.isId && !field.isReadOnly && !field.isUpdatedAt && !isDbManagedTimestamp
    
    if (isIncludedInDTO) {
      createFields.push(field)
      updateFields.push(field)
    }
  }
  
  // Set all derived properties
  // Note: Arrays are frozen to prevent accidental mutations
  model.idField = idField
  model.scalarFields = Object.freeze(scalarFields) as ParsedField[]
  model.relationFields = Object.freeze(relationFields) as ParsedField[]
  model.createFields = Object.freeze(createFields) as ParsedField[]
  model.updateFields = Object.freeze(updateFields) as ParsedField[]
  model.readFields = Object.freeze(scalarFields) as ParsedField[] // All scalar fields for reading
  model.hasSelfRelation = hasSelfRelation
  model.reverseRelations = Object.freeze([...(reverseRelationMap.get(model.name) || [])]) as ParsedField[]
}

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
 * Get default value as string for TypeScript code generation
 * 
 * Note: Prisma doesn't support array defaults for scalar fields.
 * Array defaults exist only for composite types which aren't generated here.
 * 
 * @returns TypeScript code string for the default value, or undefined if:
 *  - No default value
 *  - DB-managed default (handled by database)
 *  - Cannot be represented in TypeScript
 */
export function getDefaultValueString(field: ParsedField): string | undefined {
  if (!field.hasDefaultValue || !field.default) return undefined
  
  const def = field.default
  
  // Primitive values
  if (typeof def === 'string') return `"${def.replace(/"/g, '\\"')}"`
  if (typeof def === 'number') return String(def)
  if (typeof def === 'boolean') return String(def)
  if (def === null) return 'null'
  
  // Prisma function defaults (DB-managed)
  if (typeof def === 'object' && 'name' in def) {
    switch (def.name) {
      case 'now': return 'new Date()'
      case 'autoincrement': return undefined // Handled by DB
      case 'uuid': return undefined // Handled by DB
      case 'cuid': return undefined // Handled by DB
      case 'dbgenerated': return undefined // Handled by DB
      default: return undefined
    }
  }
  
  // Complex objects or unexpected types
  return undefined
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
        if (field.isRequired && !field.isNullable) {
          errors.push(`Self-referencing relation ${model.name}.${field.name} is required and non-nullable, creating impossible constraint`)
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
 */
function detectCircularRelations(schema: ParsedSchema): string[] {
  const errors: string[] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()
  
  function visit(modelName: string, path: string[]): void {
    if (visiting.has(modelName)) {
      errors.push(`Circular relationship detected: ${path.join(' -> ')} -> ${modelName}`)
      return
    }
    
    if (visited.has(modelName)) return
    
    const model = schema.modelMap.get(modelName)
    if (!model) return
    
    visiting.add(modelName)
    
    // Check required relations (non-optional, non-nullable)
    for (const field of model.relationFields) {
      if (field.isRequired && !field.isNullable) {
        visit(field.type, [...path, modelName])
      }
    }
    
    visiting.delete(modelName)
    visited.add(modelName)
  }
  
  for (const model of schema.models) {
    visit(model.name, [])
  }
  
  return errors
}

