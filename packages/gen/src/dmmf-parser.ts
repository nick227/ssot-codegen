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

export interface ParsedField {
  name: string
  type: string
  kind: 'scalar' | 'object' | 'enum' | 'unsupported'
  isList: boolean
  isRequired: boolean
  isNullable: boolean  // Field type allows null (String? in schema)
  isOptional: boolean  // Field can be omitted (field? in schema)
  isUnique: boolean
  isId: boolean
  isReadOnly: boolean
  isUpdatedAt: boolean
  hasDefaultValue: boolean
  hasDbDefault: boolean  // DB-managed default (autoincrement, uuid, etc)
  default?: any
  isPartOfCompositePrimaryKey: boolean
  isSelfRelation: boolean  // Field references its own model
  relationName?: string
  relationFromFields?: string[]
  relationToFields?: string[]
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
 */
export function parseDMMF(dmmf: DMMF.Document): ParsedSchema {
  const enums = parseEnums(dmmf.datamodel.enums)
  const enumMap = new Map(enums.map(e => [e.name, e]))
  
  const models = parseModels(dmmf.datamodel.models, enumMap)
  const modelMap = new Map(models.map(m => [m.name, m]))
  
  // Build reverse relation map
  const reverseRelationMap = buildReverseRelationMap(models)
  
  // Add derived properties
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
 * Parse enums
 */
function parseEnums(enums: readonly DMMF.DatamodelEnum[]): ParsedEnum[] {
  return enums.map(e => ({
    name: e.name,
    values: e.values.map(v => v.name),  // Direct assignment (no spread needed)
    documentation: e.documentation
  }))
}

/**
 * Parse models
 */
function parseModels(models: readonly DMMF.Model[], enumMap: Map<string, ParsedEnum>): ParsedModel[] {
  return models.map(model => {
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
 * Parse fields
 */
function parseFields(fields: readonly DMMF.Field[], enumMap: Map<string, ParsedEnum>, modelName: string): ParsedField[] {
  return fields.map(field => {
    const isEnum = enumMap.has(field.type)
    
    // Warn if enum type not found
    if (field.kind === 'enum' && !isEnum) {
      console.warn(`Field ${modelName}.${field.name} references enum ${field.type} which was not found in parsed enums`)
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
  
  const dbManagedDefaults = ['autoincrement', 'uuid', 'cuid', 'now', 'dbgenerated']
  return dbManagedDefaults.includes(defaultValue.name)
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
 * Sanitize documentation strings for safe code generation
 */
function sanitizeDocumentation(doc: string | undefined): string | undefined {
  if (!doc) return undefined
  
  // Remove problematic characters that could break generated comments
  return doc
    .replace(/\*\//g, '* /')    // Prevent closing block comments
    .replace(/\/\*/g, '/ *')    // Prevent opening block comments
    .replace(/\/\//g, '/ /')    // Escape single-line comment markers
    .replace(/`/g, '\\`')       // Escape backticks
    .replace(/\r\n/g, '\n')     // Normalize line endings
    .replace(/\n/g, ' ')        // Convert to single line for JSDoc
    .replace(/\s+/g, ' ')       // Collapse multiple spaces
    .trim()
}

/**
 * Build reverse relation map
 */
function buildReverseRelationMap(models: ParsedModel[]): Map<string, ParsedField[]> {
  const map = new Map<string, ParsedField[]>()
  
  // Initialize map with empty arrays
  for (const model of models) {
    map.set(model.name, [])
  }
  
  // Populate reverse relations
  for (const model of models) {
    for (const field of model.fields) {
      if (field.kind === 'object') {
        const targetRelations = map.get(field.type)
        if (targetRelations) {
          targetRelations.push(field)
        }
      }
    }
  }
  
  return map
}

/**
 * Enhance model with derived properties
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
  
  // Find ID field
  model.idField = model.fields.find(f => f.isId)
  
  // Separate scalar and relation fields (exclude unsupported)
  model.scalarFields = model.fields.filter(f => f.kind !== 'object' && f.kind !== 'unsupported')
  model.relationFields = model.fields.filter(f => f.kind === 'object')
  
  // Check for self-relations
  model.hasSelfRelation = model.fields.some(f => f.isSelfRelation)
  
  // Add reverse relations
  model.reverseRelations = reverseRelationMap.get(model.name) || []
  
  // Fields for CreateDTO (exclude id, readonly, relations, system timestamps, unsupported)
  model.createFields = model.fields.filter(f => 
    !f.isId && 
    !f.isReadOnly && 
    !f.isUpdatedAt &&
    f.kind !== 'object' &&
    f.kind !== 'unsupported' &&
    // Exclude timestamp fields with @default(now()) - these are DB-managed
    !(f.hasDbDefault && (f.name === 'createdAt' || f.name === 'updatedAt'))
  )
  
  // Fields for UpdateDTO (exclude @updatedAt, readonly, id, unsupported)
  model.updateFields = model.fields.filter(f => 
    !f.isId && 
    !f.isReadOnly && 
    !f.isUpdatedAt &&  // Exclude @updatedAt from updates
    f.kind !== 'object' &&
    f.kind !== 'unsupported' &&
    // Exclude timestamp fields with @default(now()) - these are DB-managed
    !(f.hasDbDefault && (f.name === 'createdAt' || f.name === 'updatedAt'))
  )
  
  // Fields for ReadDTO (all scalar fields, excluding unsupported)
  model.readFields = model.scalarFields
}

/**
 * Get field by name
 */
export function getField(model: ParsedModel, fieldName: string): ParsedField | undefined {
  return model.fields.find(f => f.name === fieldName)
}

/**
 * Get relation target model
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
 * Get default value as string
 */
export function getDefaultValueString(field: ParsedField): string | undefined {
  if (!field.hasDefaultValue || !field.default) return undefined
  
  const def = field.default
  
  // Handle different default value types
  if (typeof def === 'string') return `"${def.replace(/"/g, '\\"')}"`
  if (typeof def === 'number') return String(def)
  if (typeof def === 'boolean') return String(def)
  
  // Handle arrays
  if (Array.isArray(def)) {
    const items = def.map(item => {
      if (typeof item === 'string') return `"${item.replace(/"/g, '\\"')}"`
      if (typeof item === 'number' || typeof item === 'boolean') return String(item)
      return JSON.stringify(item)
    })
    return `[${items.join(', ')}]`
  }
  
  // Handle Prisma functions
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
  
  // Handle complex objects (JSON)
  if (typeof def === 'object') {
    try {
      return JSON.stringify(def)
    } catch {
      return undefined
    }
  }
  
  return undefined
}

/**
 * Validate parsed schema
 */
export function validateSchema(schema: ParsedSchema, throwOnError = false): string[] {
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
  
  // Combine all messages with prefixes
  const allMessages = [
    ...errors,
    ...warnings.map(w => `WARNING: ${w}`),
    ...infos.map(i => `INFO: ${i}`)
  ]
  
  if (throwOnError && errors.length > 0) {
    throw new Error(`Schema validation failed:\n${errors.join('\n')}`)
  }
  
  return allMessages
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

