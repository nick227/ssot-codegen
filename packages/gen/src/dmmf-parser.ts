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
  relationName?: string
  relationFromFields?: string[]
  relationToFields?: string[]
  documentation?: string
}

export interface ParsedModel {
  name: string
  nameLower: string  // Cached toLowerCase() for performance (used 63× across codebase)
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
}

/**
 * Parse DMMF into our format
 */
export function parseDMMF(dmmf: DMMF.Document): ParsedSchema {
  const enums = parseEnums(dmmf.datamodel.enums)
  const enumMap = new Map(enums.map(e => [e.name, e]))
  
  const models = parseModels(dmmf.datamodel.models, enumMap)
  const modelMap = new Map(models.map(m => [m.name, m]))
  
  // Add derived properties
  for (const model of models) {
    enhanceModel(model, modelMap)
  }
  
  return {
    models,
    enums,
    modelMap,
    enumMap
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
    const fields = parseFields(model.fields, enumMap)
    
    return {
      name: model.name,
      nameLower: model.name.toLowerCase(),
      dbName: model.dbName || undefined,
      fields,
      primaryKey: model.primaryKey ? {
        name: model.primaryKey.name || undefined,
        fields: model.primaryKey.fields as string[]
      } : undefined,
      uniqueFields: model.uniqueFields as string[][],
      documentation: model.documentation,
      // These will be filled by enhanceModel
      scalarFields: [],
      relationFields: [],
      createFields: [],
      updateFields: [],
      readFields: []
    }
  })
}

/**
 * Parse fields
 */
function parseFields(fields: readonly DMMF.Field[], enumMap: Map<string, ParsedEnum>): ParsedField[] {
  return fields.map(field => {
    const isEnum = enumMap.has(field.type)
    const kind = isEnum ? 'enum' : determineFieldKind(field)
    const hasDbDefault = isDbManagedDefault(field.default)
    const isReadOnly = determineReadOnly(field)
    
    return {
      name: field.name,
      type: field.type,
      kind,
      isList: field.isList,
      isRequired: field.isRequired,
      isNullable: !field.isRequired,
      isOptional: !field.isRequired || field.hasDefaultValue,
      isUnique: field.isUnique || false,
      isId: field.isId,
      isReadOnly,
      isUpdatedAt: field.isUpdatedAt || false,
      hasDefaultValue: field.hasDefaultValue,
      hasDbDefault,
      default: field.default,
      isPartOfCompositePrimaryKey: false,  // Set by enhanceModel
      relationName: field.relationName,
      relationFromFields: field.relationFromFields as string[] | undefined,
      relationToFields: field.relationToFields as string[] | undefined,
      documentation: field.documentation
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
  
  return false
}

/**
 * Enhance model with derived properties
 */
function enhanceModel(model: ParsedModel, modelMap: Map<string, ParsedModel>): void {
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
  
  // Separate scalar and relation fields
  model.scalarFields = model.fields.filter(f => f.kind !== 'object')
  model.relationFields = model.fields.filter(f => f.kind === 'object')
  
  // Fields for CreateDTO (exclude id, readonly, relations, system timestamps)
  model.createFields = model.fields.filter(f => 
    !f.isId && 
    !f.isReadOnly && 
    !f.isUpdatedAt &&
    f.kind !== 'object' &&
    // Exclude system-managed timestamp fields with @default
    !(f.hasDefaultValue && (f.name === 'createdAt' || f.name === 'updatedAt'))
  )
  
  // Fields for UpdateDTO (same as create, all optional)
  model.updateFields = model.createFields
  
  // Fields for ReadDTO (all scalar fields)
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
  if (typeof def === 'string') return `"${def}"`
  if (typeof def === 'number') return String(def)
  if (typeof def === 'boolean') return String(def)
  
  // Handle Prisma functions
  if (typeof def === 'object' && 'name' in def) {
    switch (def.name) {
      case 'now': return 'new Date()'
      case 'autoincrement': return undefined // Handled by DB
      case 'uuid': return undefined // Handled by DB
      case 'cuid': return undefined // Handled by DB
      default: return undefined
    }
  }
  
  return undefined
}

/**
 * Validate parsed schema
 */
export function validateSchema(schema: ParsedSchema): string[] {
  const errors: string[] = []
  
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
      }
    }
    
    // Check enums
    for (const field of model.fields) {
      if (field.kind === 'enum' && !schema.enumMap.has(field.type)) {
        errors.push(`Field ${model.name}.${field.name} references unknown enum ${field.type}`)
      }
    }
  }
  
  // Check for circular relationship dependencies
  const circularErrors = detectCircularRelations(schema)
  errors.push(...circularErrors)
  
  return errors
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

