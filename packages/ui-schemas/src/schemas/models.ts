/**
 * Models Schema
 * 
 * Parsed schema surface exposing entities, fields, relations, and types.
 * This is auto-generated from the Prisma schema during build.
 */

import { z } from 'zod'

// ============================================================================
// Field Types
// ============================================================================

export const FieldTypeSchema = z.enum([
  'String',
  'Int',
  'Float',
  'Boolean',
  'DateTime',
  'Json',
  'Bytes',
  'Decimal',
  'BigInt'
])

export type FieldType = z.infer<typeof FieldTypeSchema>

// ============================================================================
// Field Definition
// ============================================================================

export const FieldSchema = z.object({
  name: z.string(),
  type: z.string(), // Can be scalar type or model name (for relations)
  isRequired: z.boolean(),
  isList: z.boolean(),
  isUnique: z.boolean().optional(),
  isId: z.boolean().optional(),
  isRelation: z.boolean(),
  relationTo: z.string().optional(), // Target model for relations
  relationName: z.string().optional(),
  default: z.unknown().optional(),
  documentation: z.string().optional()
})

export type Field = z.infer<typeof FieldSchema>

// ============================================================================
// Enum Definition
// ============================================================================

export const EnumSchema = z.object({
  name: z.string(),
  values: z.array(z.string()),
  documentation: z.string().optional()
})

export type Enum = z.infer<typeof EnumSchema>

// ============================================================================
// Model Definition
// ============================================================================

export const ModelSchema = z.object({
  name: z.string(),
  fields: z.array(FieldSchema),
  idFields: z.array(z.string()).optional(),
  uniqueFields: z.array(z.array(z.string())).optional(),
  documentation: z.string().optional()
})

export type Model = z.infer<typeof ModelSchema>

// ============================================================================
// Models (Root)
// ============================================================================

export const ModelsSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  
  // Auto-generated from Prisma schema
  generatedAt: z.string(), // ISO timestamp
  schemaPath: z.string(),
  
  models: z.array(ModelSchema),
  enums: z.array(EnumSchema)
})

export type Models = z.infer<typeof ModelsSchema>

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateModels(data: unknown) {
  const result = ModelsSchema.safeParse(data)
  
  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code
    }))
    
    return {
      valid: false as const,
      errors
    }
  }
  
  return {
    valid: true as const,
    data: result.data
  }
}

/**
 * Find model by name (case-insensitive)
 */
export function findModel(models: Models, name: string): Model | null {
  return models.models.find(m => m.name.toLowerCase() === name.toLowerCase()) || null
}

/**
 * Find field in model
 */
export function findField(model: Model, fieldName: string): Field | null {
  return model.fields.find(f => f.name === fieldName) || null
}

/**
 * Get all relation fields for a model
 */
export function getRelationFields(model: Model): Field[] {
  return model.fields.filter(f => f.isRelation)
}

/**
 * Get all scalar fields for a model
 */
export function getScalarFields(model: Model): Field[] {
  return model.fields.filter(f => !f.isRelation)
}

/**
 * Find enum by name
 */
export function findEnum(models: Models, name: string): Enum | null {
  return models.enums.find(e => e.name === name) || null
}

/**
 * Check if field is relation
 */
export function isRelationField(field: Field): boolean {
  return field.isRelation
}

/**
 * Validate deep field path against models
 */
export function validateFieldPath(
  models: Models,
  modelName: string,
  fieldPath: string
): {
  valid: boolean
  type?: string
  trace: string[]
  suggestions?: string[]
} {
  const trace: string[] = []
  const parts = fieldPath.split('.')
  
  let currentModel = findModel(models, modelName)
  if (!currentModel) {
    return {
      valid: false,
      trace: [`❌ Model '${modelName}' not found`],
      suggestions: models.models.map(m => m.name)
    }
  }
  
  trace.push(`✅ Model: ${currentModel.name}`)
  
  for (let i = 0; i < parts.length; i++) {
    const fieldName = parts[i]
    const field = findField(currentModel, fieldName)
    
    if (!field) {
      const suggestions = currentModel.fields
        .map(f => f.name)
        .filter(name => name.toLowerCase().includes(fieldName.toLowerCase()))
      
      return {
        valid: false,
        trace: [...trace, `❌ Field '${fieldName}' not found on ${currentModel.name}`],
        suggestions
      }
    }
    
    trace.push(`✅ Field: ${field.name} (${field.type})`)
    
    // If not last part and is relation, traverse
    if (i < parts.length - 1) {
      if (!field.isRelation || !field.relationTo) {
        return {
          valid: false,
          trace: [...trace, `❌ Field '${fieldName}' is not a relation, cannot traverse further`]
        }
      }
      
      currentModel = findModel(models, field.relationTo)
      if (!currentModel) {
        return {
          valid: false,
          trace: [...trace, `❌ Related model '${field.relationTo}' not found`]
        }
      }
    } else {
      // Last part - return type
      return {
        valid: true,
        type: field.type,
        trace
      }
    }
  }
  
  return { valid: false, trace: [...trace, '❌ Unexpected end of path'] }
}

