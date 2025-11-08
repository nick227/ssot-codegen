/**
 * Configuration normalization and validation
 * Validates conflicting options and provides safe defaults
 */

import type { CodeGeneratorConfig } from '../code-generator.js'
import type { NormalizedConfig } from './generation-types.js'

/**
 * Valid hook framework names
 */
const VALID_HOOK_FRAMEWORKS = ['react', 'vue', 'angular', 'zustand', 'vanilla'] as const
type HookFramework = typeof VALID_HOOK_FRAMEWORKS[number]

/**
 * Normalizes and validates code generator configuration
 * 
 * Features:
 * - Validates conflicting options
 * - Provides safe defaults
 * - Warns about production requirements
 * - Returns readonly configuration
 */
export class ConfigNormalizer {
  /**
   * Normalize configuration with validation
   * @throws Error if configuration is invalid or has conflicts
   */
  normalize(config: CodeGeneratorConfig): NormalizedConfig {
    this.validateConflicts(config)
    this.validateRequiredFields(config)
    this.logDefaults(config)
    
    return {
      framework: config.framework || 'express',
      useEnhanced: config.useEnhancedGenerators ?? true,
      useRegistry: config.useRegistry ?? false,
      errorHandling: this.normalizeErrorHandling(config),
      generation: this.normalizeGeneration(config),
      metadata: this.normalizeMetadata(config),
      features: config.features
    }
  }
  
  /**
   * Validate for conflicting options
   */
  private validateConflicts(config: CodeGeneratorConfig): void {
    // failFast and continueOnError are mutually exclusive
    if (config.failFast && config.continueOnError) {
      throw new Error(
        'Configuration conflict: Cannot set both failFast=true and continueOnError=true. ' +
        'Use failFast to stop on first error, or continueOnError to continue despite errors.'
      )
    }
    
    // Warn about strictPluginValidation in registry mode
    if (config.useRegistry && config.strictPluginValidation) {
      console.warn(
        '[ssot-codegen] strictPluginValidation has limited effect in registry mode. ' +
        'Registry architecture uses centralized plugin handling.'
      )
    }
  }
  
  /**
   * Validate required fields based on environment
   */
  private validateRequiredFields(config: CodeGeneratorConfig): void {
    // Production builds require real values
    if (process.env.NODE_ENV === 'production') {
      if (!config.schemaHash || config.schemaHash === 'development') {
        throw new Error(
          'Production builds require a real schemaHash. ' +
          'Set config.schemaHash to a hash of your schema file for versioning.'
        )
      }
      
      if (!config.toolVersion || config.toolVersion === '0.0.0-dev') {
        throw new Error(
          'Production builds require a real toolVersion. ' +
          'Set config.toolVersion to your package version.'
        )
      }
    }
    
    // Warn about missing optional fields
    if (!config.projectName) {
      console.log('[ssot-codegen] No projectName set, using default: "Generated Project"')
    }
  }
  
  /**
   * Log which defaults are being used
   */
  private logDefaults(config: CodeGeneratorConfig): void {
    const defaults: string[] = []
    
    if (!config.framework) {
      defaults.push('framework=express')
    }
    
    if (config.useEnhancedGenerators === undefined) {
      defaults.push('useEnhanced=true')
    }
    
    if (config.hookFrameworks === undefined || config.hookFrameworks.length === 0) {
      defaults.push('hookFrameworks=[react]')
    }
    
    if (defaults.length > 0) {
      console.log(`[ssot-codegen] Using defaults: ${defaults.join(', ')}`)
    }
  }
  
  /**
   * Normalize error handling configuration
   */
  private normalizeErrorHandling(config: CodeGeneratorConfig) {
    return {
      failFast: config.failFast ?? false,
      continueOnError: config.continueOnError ?? true,
      strictPluginValidation: config.strictPluginValidation ?? false
    }
  }
  
  /**
   * Normalize generation configuration
   */
  private normalizeGeneration(config: CodeGeneratorConfig) {
    return {
      checklist: config.generateChecklist ?? true,
      autoOpen: config.autoOpenChecklist ?? false,
      hookFrameworks: this.validateHookFrameworks(config.hookFrameworks)
    }
  }
  
  /**
   * Normalize metadata configuration
   */
  private normalizeMetadata(config: CodeGeneratorConfig) {
    const schemaHash = config.schemaHash || 'development'
    const toolVersion = config.toolVersion || '0.0.0-dev'
    
    // Warn about development values in production
    if (process.env.NODE_ENV === 'production') {
      if (schemaHash === 'development') {
        console.warn('[ssot-codegen] ⚠️  Using development schemaHash in production!')
      }
      if (toolVersion === '0.0.0-dev') {
        console.warn('[ssot-codegen] ⚠️  Using development toolVersion in production!')
      }
    }
    
    return {
      projectName: config.projectName || 'Generated Project',
      schemaHash,
      toolVersion
    }
  }
  
  /**
   * Validate hook framework names
   */
  private validateHookFrameworks(frameworks: string[] | undefined): ReadonlyArray<HookFramework> {
    if (!frameworks || frameworks.length === 0) {
      return ['react'] as const
    }
    
    const invalid = frameworks.filter(f => !VALID_HOOK_FRAMEWORKS.includes(f as HookFramework))
    if (invalid.length > 0) {
      console.warn(
        `[ssot-codegen] Invalid hook frameworks: ${invalid.join(', ')}. ` +
        `Valid options: ${VALID_HOOK_FRAMEWORKS.join(', ')}. Using default: react`
      )
      return ['react'] as const
    }
    
    return frameworks as ReadonlyArray<HookFramework>
  }
}

