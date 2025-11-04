/**
 * Model Metadata - Shared model information utilities
 * 
 * Centralizes common model computations to avoid duplication
 */

import type { ParsedModel } from '../../dmmf-parser.js'

export class ModelMetadata {
  constructor(private readonly model: ParsedModel) {}
  
  /**
   * Model name (PascalCase)
   */
  get name(): string {
    return this.model.name
  }
  
  /**
   * Model name in lowercase (for file names, prisma calls)
   */
  get lower(): string {
    return this.model.name.toLowerCase()
  }
  
  /**
   * Plural form (for routes, endpoints)
   */
  get plural(): string {
    // Simple pluralization (can be enhanced with pluralize library)
    const name = this.lower
    if (name.endsWith('s')) return name
    if (name.endsWith('y')) return name.slice(0, -1) + 'ies'
    return name + 's'
  }
  
  /**
   * ID field type ('string' | 'number')
   */
  get idType(): 'string' | 'number' {
    if (!this.model.idField) return 'number'
    return this.model.idField.type === 'String' ? 'string' : 'number'
  }
  
  /**
   * ID field name
   */
  get idFieldName(): string {
    return this.model.idField?.name || 'id'
  }
  
  /**
   * Check if model has relations
   */
  get hasRelations(): boolean {
    return this.model.relationFields.length > 0
  }
  
  /**
   * Check if model has enums
   */
  get hasEnums(): boolean {
    return this.model.fields.some(f => f.kind === 'enum')
  }
  
  /**
   * Get enum types used in model
   */
  getEnumTypes(): string[] {
    return this.model.fields
      .filter(f => f.kind === 'enum')
      .map(f => f.type)
  }
  
  /**
   * Get import path for this model's contracts
   */
  getContractsPath(): string {
    return `@gen/contracts/${this.lower}`
  }
  
  /**
   * Get import path for this model's validators
   */
  getValidatorsPath(): string {
    return `@gen/validators/${this.lower}`
  }
  
  /**
   * Get import path for this model's services
   */
  getServicesPath(): string {
    return `@gen/services/${this.lower}`
  }
}

