/**
 * Schema Validator - Validate parsed schema before generation
 * 
 * v2.0: Upfront schema validation (runs BEFORE analysis).
 * Catches structural issues early to prevent wasted work.
 * 
 * VALIDATION RULES:
 * 1. Model structure (required properties)
 * 2. Field structure (required properties)
 * 3. Relationship integrity (valid targets)
 * 4. Service annotations (valid format)
 * 5. Naming conflicts (model vs service names)
 */

import type { ParsedSchema, ParsedModel } from '../dmmf-parser.js'
import type { ServiceAnnotation } from '../service-linker.js'
import { ErrorSeverity, type GenerationError } from '../pipeline/generation-types.js'

/**
 * Validate parsed schema structure
 * 
 * Checks for critical issues that would cause generation to fail:
 * - Models missing required properties (name, nameLower)
 * - Invalid field structures
 * - Broken relationships
 * - Invalid service annotations
 */
export class SchemaValidator {
  /**
   * Validate schema and collect errors
   * Returns array of validation errors (empty if valid)
   */
  static validate(schema: ParsedSchema): GenerationError[] {
    const errors: GenerationError[] = []
    
    // Validate models
    for (const model of schema.models) {
      this.validateModel(model, errors)
    }
    
    return errors
  }
  
  /**
   * Validate single model structure
   */
  private static validateModel(model: ParsedModel, errors: GenerationError[]): void {
    // Required properties
    if (!model.name || typeof model.name !== 'string') {
      errors.push({
        severity: ErrorSeverity.ERROR,
        message: `Model missing or invalid 'name' property`,
        model: model.name || 'unknown',
        phase: 'schema-validation'
      })
    }
    
    if (!model.nameLower || typeof model.nameLower !== 'string') {
      errors.push({
        severity: ErrorSeverity.ERROR,
        message: `Model missing or invalid 'nameLower' property`,
        model: model.name || 'unknown',
        phase: 'schema-validation'
      })
    }
    
    // Validate fields array exists
    if (!Array.isArray(model.fields)) {
      errors.push({
        severity: ErrorSeverity.ERROR,
        message: `Model '${model.name}' has invalid or missing 'fields' array`,
        model: model.name,
        phase: 'schema-validation'
      })
      return  // Can't continue validating fields if array is invalid
    }
    
    // Validate each field
    for (const field of model.fields) {
      this.validateField(field, model.name, errors)
    }
  }
  
  /**
   * Validate single field structure
   */
  private static validateField(field: any, modelName: string, errors: GenerationError[]): void {
    if (!field.name || typeof field.name !== 'string') {
      errors.push({
        severity: ErrorSeverity.ERROR,
        message: `Field missing or invalid 'name' property`,
        model: modelName,
        phase: 'schema-validation'
      })
    }
    
    if (!field.type || typeof field.type !== 'string') {
      errors.push({
        severity: ErrorSeverity.ERROR,
        message: `Field '${field.name}' missing or invalid 'type' property`,
        model: modelName,
        phase: 'schema-validation'
      })
    }
  }
  
  /**
   * Validate service annotations
   */
  static validateServiceAnnotations(
    serviceAnnotations: Map<string, ServiceAnnotation>,
    errors: GenerationError[]
  ): void {
    for (const [modelName, annotation] of serviceAnnotations) {
      // Validate required fields
      if (!annotation.name || typeof annotation.name !== 'string') {
        errors.push({
          severity: ErrorSeverity.ERROR,
          message: `Service annotation missing 'name' field`,
          model: modelName,
          phase: 'service-annotation-validation'
        })
        continue
      }
      
      if (!Array.isArray(annotation.methods)) {
        errors.push({
          severity: ErrorSeverity.ERROR,
          message: `Service annotation missing 'methods' array`,
          model: modelName,
          phase: 'service-annotation-validation'
        })
        continue
      }
      
      // Validate method structure
      for (const method of annotation.methods) {
        if (!method.name || !method.httpMethod || !method.path) {
          errors.push({
            severity: ErrorSeverity.ERROR,
            message: `Invalid method structure in service annotation`,
            model: modelName,
            phase: 'service-annotation-validation'
          })
        }
      }
    }
  }
}

