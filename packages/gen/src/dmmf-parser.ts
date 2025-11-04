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
  isUnique: boolean
  isId: boolean
  isReadOnly: boolean
  isUpdatedAt: boolean
  hasDefaultValue: boolean
  default?: any
  relationName?: string
  relationFromFields?: string[]
  relationToFields?: string[]
  documentation?: string
}

export interface ParsedModel {
  name: string
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
    values: [...e.values.map(v => v.name)],
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
      dbName: model.dbName || undefined,
      fields,
      primaryKey: model.primaryKey ? {
        name: model.primaryKey.name || undefined,
        fields: [...model.primaryKey.fields]
      } : undefined,
      uniqueFields: model.uniqueFields.map(uf => [...uf]),
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
    const kind = determineFieldKind(field, isEnum)
    
    return {
      name: field.name,
      type: field.type,
      kind,
      isList: field.isList,
      isRequired: field.isRequired,
      isUnique: field.isUnique || false,
      isId: field.isId,
      isReadOnly: field.isReadOnly || false,
      isUpdatedAt: field.isUpdatedAt || false,
      hasDefaultValue: field.hasDefaultValue,
      default: field.default,
      relationName: field.relationName,
      relationFromFields: field.relationFromFields ? [...field.relationFromFields] : undefined,
      relationToFields: field.relationToFields ? [...field.relationToFields] : undefined,
      documentation: field.documentation
    }
  })
}

/**
 * Determine field kind
 */
function determineFieldKind(
  field: DMMF.Field,
  isEnum: boolean
): 'scalar' | 'object' | 'enum' | 'unsupported' {
  if (isEnum) return 'enum'
  if (field.kind === 'scalar') return 'scalar'
  if (field.kind === 'object') return 'object'
  if (field.kind === 'enum') return 'enum'
  return 'unsupported'
}

/**
 * Enhance model with derived properties
 */
function enhanceModel(model: ParsedModel, modelMap: Map<string, ParsedModel>): void {
  // Find ID field
  model.idField = model.fields.find(f => f.isId)
  
  // Separate scalar and relation fields
  model.scalarFields = model.fields.filter(f => f.kind !== 'object')
  model.relationFields = model.fields.filter(f => f.kind === 'object')
  
  // Fields for CreateDTO (exclude id, readonly, relations)
  model.createFields = model.fields.filter(f => 
    !f.isId && 
    !f.isReadOnly && 
    !f.isUpdatedAt &&
    f.kind !== 'object'
  )
  
  // Fields for UpdateDTO (same as create, all optional)
  model.updateFields = [...model.createFields]
  
  // Fields for ReadDTO (all scalar fields)
  model.readFields = [...model.scalarFields]
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
  return !field.isRequired || field.hasDefaultValue
}

/**
 * Check if field is nullable
 */
export function isNullable(field: ParsedField): boolean {
  return !field.isRequired && !field.hasDefaultValue
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
  
  for (const model of schema.models) {
    // Check for ID field
    if (!model.idField) {
      errors.push(`Model ${model.name} has no @id field`)
    }
    
    // Check relations
    for (const field of model.relationFields) {
      const target = schema.modelMap.get(field.type)
      if (!target) {
        errors.push(`Model ${model.name} references unknown model ${field.type}`)
      }
    }
    
    // Check enums
    for (const field of model.fields) {
      if (field.kind === 'enum' && !schema.enumMap.has(field.type)) {
        errors.push(`Field ${model.name}.${field.name} references unknown enum ${field.type}`)
      }
    }
  }
  
  return errors
}

