/**
 * Schema validation
 * 
 * Validates parsed schema for structural integrity and semantic correctness.
 */

import type { ParsedSchema, SchemaValidationResult } from '../types.js'
import { detectCircularRelations } from './circular-detection.js'

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

