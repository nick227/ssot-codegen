/**
 * Generator Interface - Standard interface for all code generators
 * 
 * Ensures consistency across DTOs, validators, services, controllers, routes
 */

import type { ParsedModel } from '../dmmf-parser.js'

/**
 * Configuration for generators
 */
export interface GeneratorConfig {
  model: ParsedModel
  framework?: 'express' | 'fastify'
  options?: GeneratorOptions
}

export interface GeneratorOptions {
  includeComments?: boolean
  includeValidation?: boolean
  includeErrorHandling?: boolean
  [key: string]: any
}

/**
 * Standard output structure
 */
export interface GeneratorOutput {
  /**
   * Generated files (filename -> content)
   */
  files: Map<string, string>
  
  /**
   * Import statements needed
   */
  imports: string[]
  
  /**
   * Exported symbols
   */
  exports: string[]
  
  /**
   * Metadata about generation
   */
  metadata?: {
    fileCount: number
    lineCount: number
    [key: string]: any
  }
}

/**
 * Standard generator interface
 */
export interface IGenerator {
  /**
   * Generate all files for this layer
   */
  generate(): GeneratorOutput
  
  /**
   * Get list of imports needed by generated code
   */
  getImports(): string[]
  
  /**
   * Get list of exports provided by generated code
   */
  getExports(): string[]
  
  /**
   * Generate barrel file for this layer
   */
  generateBarrel(): string
  
  /**
   * Validate that generation is possible
   * Returns array of error messages (empty if valid)
   */
  validate(): string[]
}

