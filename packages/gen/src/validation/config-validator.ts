/**
 * Config Validator - Validate configuration before generation
 * 
 * v2.0: Centralized validation that runs BEFORE any processing.
 * Catches invalid configs early to prevent wasted work.
 * 
 * VALIDATION RULES:
 * 1. Mutually exclusive options (e.g., useRegistry + individual generators)
 * 2. Required dependencies (e.g., schemaHash for production)
 * 3. Invalid values (e.g., unknown framework)
 * 4. Deprecated options (warnings only)
 */

import type { CodeGeneratorConfig } from '../code-generator.js'

/**
 * Validation error
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly suggestion?: string
  ) {
    super(message)
    this.name = 'ConfigValidationError'
  }
}

/**
 * Validation warning (non-blocking)
 */
export interface ConfigValidationWarning {
  field: string
  message: string
  suggestion: string
}

/**
 * Validation result
 */
export interface ConfigValidationResult {
  valid: boolean
  errors: ConfigValidationError[]
  warnings: ConfigValidationWarning[]
}

/**
 * Validates generator configuration
 */
export class ConfigValidator {
  /**
   * Validate config and throw on errors
   * Use this in production code
   */
  static validate(config: CodeGeneratorConfig): void {
    const result = this.validateDetailed(config)
    
    // Log warnings
    for (const warning of result.warnings) {
      console.warn(`[ssot-codegen] Config warning (${warning.field}): ${warning.message}`)
      if (warning.suggestion) {
        console.warn(`  Suggestion: ${warning.suggestion}`)
      }
    }
    
    // Throw on errors
    if (!result.valid) {
      const errorMessages = result.errors.map(e => `${e.field}: ${e.message}`).join('\n  ')
      throw new ConfigValidationError(
        `Invalid configuration:\n  ${errorMessages}`,
        'config'
      )
    }
  }
  
  /**
   * Validate config and return detailed result
   * Use this for testing or when you need warnings
   */
  static validateDetailed(config: CodeGeneratorConfig): ConfigValidationResult {
    const errors: ConfigValidationError[] = []
    const warnings: ConfigValidationWarning[] = []
    
    // Validate framework
    if (config.framework && !['express', 'fastify'].includes(config.framework)) {
      errors.push(new ConfigValidationError(
        `Invalid framework: ${config.framework}`,
        'framework',
        "Use 'express' or 'fastify'"
      ))
    }
    
    // Validate hook frameworks
    if (config.hookFrameworks) {
      const validFrameworks = ['react', 'vue', 'angular', 'zustand', 'vanilla']
      const invalid = config.hookFrameworks.filter(f => !validFrameworks.includes(f))
      
      if (invalid.length > 0) {
        warnings.push({
          field: 'hookFrameworks',
          message: `Invalid hook frameworks: ${invalid.join(', ')}`,
          suggestion: `Valid frameworks: ${validFrameworks.join(', ')}`
        })
      }
    }
    
    // Validate mutually exclusive options
    if (config.failFast && config.continueOnError) {
      warnings.push({
        field: 'errorHandling',
        message: 'failFast and continueOnError are both enabled',
        suggestion: 'failFast takes precedence - errors will throw immediately'
      })
    }
    
    // Production validation
    const isProd = process.env.NODE_ENV === 'production'
    if (isProd) {
      if (!config.schemaHash || config.schemaHash === 'development') {
        warnings.push({
          field: 'schemaHash',
          message: 'Using development schema hash in production',
          suggestion: 'Set config.schemaHash to computed hash for production builds'
        })
      }
      
      if (!config.toolVersion || config.toolVersion === '0.0.0-dev') {
        warnings.push({
          field: 'toolVersion',
          message: 'Using development tool version in production',
          suggestion: 'Set config.toolVersion to real version for production builds'
        })
      }
      
      if (config.continueOnError !== false) {
        warnings.push({
          field: 'continueOnError',
          message: 'continueOnError enabled in production',
          suggestion: 'Set continueOnError: false for production builds to fail on errors'
        })
      }
    }
    
    // Deprecated options (warnings only)
    // (Add here when options are deprecated in future)
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}

