/**
 * Base Generator - Abstract base class for all generators
 * 
 * Provides shared functionality and enforces consistent structure
 */

import type { ParsedModel } from '../dmmf-parser.js'
import type { IGenerator, GeneratorConfig, GeneratorOutput } from './generator-interface.js'
import { ModelMetadata } from './utils/model-metadata.js'
import { ImportBuilder } from './utils/import-builder.js'
import { TemplateBuilder } from './utils/template-builder.js'

export abstract class BaseGenerator implements IGenerator {
  protected readonly model: ParsedModel
  protected readonly metadata: ModelMetadata
  protected readonly imports: ImportBuilder
  protected readonly framework: 'express' | 'fastify'
  
  constructor(config: GeneratorConfig) {
    this.model = config.model
    this.metadata = new ModelMetadata(config.model)
    this.imports = new ImportBuilder()
    this.framework = config.framework || 'express'
  }
  
  /**
   * Main generation method - must be implemented by subclasses
   */
  abstract generate(): GeneratorOutput
  
  /**
   * Get imports needed by generated code
   */
  abstract getImports(): string[]
  
  /**
   * Get exports provided by generated code
   */
  abstract getExports(): string[]
  
  /**
   * Generate barrel file
   */
  abstract generateBarrel(): string
  
  /**
   * Validate model before generation
   */
  validate(): string[] {
    const errors: string[] = []
    
    if (!this.model.name) {
      errors.push('Model name is required')
    }
    
    if (!this.model.idField) {
      errors.push(`Model ${this.model.name} has no @id field`)
    }
    
    return errors
  }
  
  /**
   * Create standard template builder with header
   */
  protected createTemplate(): TemplateBuilder {
    return new TemplateBuilder().header()
  }
  
  /**
   * Get model name (convenience)
   */
  protected get modelName(): string {
    return this.metadata.name
  }
  
  /**
   * Get model lowercase (convenience)
   */
  protected get modelLower(): string {
    return this.metadata.lower
  }
  
  /**
   * Get ID type (convenience)
   */
  protected get idType(): 'string' | 'number' {
    return this.metadata.idType
  }
}


