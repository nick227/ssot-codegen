/**
 * Centralized Error Escalation Policy
 * 
 * CRITICAL FIX: Consolidates error handling logic from 3 different locations.
 * Provides a single source of truth for when errors should throw vs continue.
 * 
 * REPLACES:
 * - Legacy mode error checking (code-generator.ts:475-525)
 * - GenerationContext.shouldThrow (generation-context.ts:96-121)
 * - ErrorCollector.hasBlockingErrors (error-collector.ts:40-55)
 * 
 * RULES (in priority order):
 * 1. VALIDATION errors → ALWAYS throw (prevent invalid code)
 * 2. FATAL errors → ALWAYS throw (system-level failure)
 * 3. Errors with blocksGeneration=true → ALWAYS throw
 * 4. ERROR severity + failFast=true → throw immediately
 * 5. ERROR severity + continueOnError=false → throw
 * 6. WARNING → NEVER throw
 */

import { ErrorSeverity, type GenerationError } from './generation-types.js'

/**
 * Error handling configuration
 */
export interface ErrorHandlingConfig {
  /**
   * Stop on first ERROR (not WARNING)
   * Default: false
   */
  failFast: boolean
  
  /**
   * Continue generation despite ERROR-level issues
   * Default: true
   */
  continueOnError: boolean
  
  /**
   * Fail if plugins have validation errors
   * Default: false
   */
  strictPluginValidation: boolean
}

/**
 * Centralized policy for error escalation
 * 
 * Determines whether an error should throw or be collected.
 * All error handling in the codebase should use this class.
 * 
 * @example
 * ```ts
 * const policy = new ErrorEscalationPolicy(config)
 * 
 * try {
 *   // ... do work
 * } catch (error) {
 *   const genError = { severity: ErrorSeverity.ERROR, message: '...' }
 *   
 *   if (policy.shouldThrow(genError)) {
 *     throw new GenerationFailedError(genError.message, genError)
 *   } else {
 *     errors.push(genError)  // Collect for summary
 *   }
 * }
 * ```
 */
export class ErrorEscalationPolicy {
  constructor(private readonly config: ErrorHandlingConfig) {}
  
  /**
   * Determine if error should throw immediately
   * 
   * Priority rules:
   * 1. VALIDATION/FATAL → always throw
   * 2. blocksGeneration flag → always throw
   * 3. ERROR + failFast → throw
   * 4. ERROR + !continueOnError → throw
   * 5. WARNING → never throw
   * 
   * @param error - Error to check
   * @returns true if error should throw, false if it should be collected
   */
  shouldThrow(error: GenerationError): boolean {
    // RULE 1: VALIDATION errors always throw (prevent invalid code)
    if (error.severity === ErrorSeverity.VALIDATION) {
      return true
    }
    
    // RULE 2: FATAL errors always throw (system-level failure)
    if (error.severity === ErrorSeverity.FATAL) {
      return true
    }
    
    // RULE 3: Errors with blocksGeneration flag always throw
    if (error.blocksGeneration === true) {
      return true
    }
    
    // RULE 4: ERROR severity respects config
    if (error.severity === ErrorSeverity.ERROR) {
      // Fail fast - stop on first ERROR
      if (this.config.failFast) {
        return true
      }
      
      // Continue on error disabled - throw on any ERROR
      if (!this.config.continueOnError) {
        return true
      }
      
      // Otherwise collect ERROR for summary
      return false
    }
    
    // RULE 5: WARNING never throws
    return false
  }
  
  /**
   * Check if error is blocking (prevents successful generation)
   * 
   * Blocking errors:
   * - VALIDATION (invalid code would be generated)
   * - FATAL (system-level failure)
   * - blocksGeneration flag (explicit block)
   * 
   * @param error - Error to check
   * @returns true if error blocks generation
   */
  isBlocking(error: GenerationError): boolean {
    return (
      error.severity === ErrorSeverity.VALIDATION ||
      error.severity === ErrorSeverity.FATAL ||
      error.blocksGeneration === true
    )
  }
  
  /**
   * Check if errors array contains any blocking errors
   * 
   * @param errors - Array of errors to check
   * @returns true if any error is blocking
   */
  hasBlockingErrors(errors: GenerationError[]): boolean {
    return errors.some(e => this.isBlocking(e))
  }
  
  /**
   * Filter errors by whether they should throw
   * 
   * @param errors - Array of errors
   * @returns Errors that should throw according to policy
   */
  getThrowableErrors(errors: GenerationError[]): GenerationError[] {
    return errors.filter(e => this.shouldThrow(e))
  }
  
  /**
   * Get highest severity from error array
   * 
   * @param errors - Array of errors
   * @returns Highest severity level
   */
  getHighestSeverity(errors: GenerationError[]): ErrorSeverity {
    if (errors.some(e => e.severity === ErrorSeverity.VALIDATION)) {
      return ErrorSeverity.VALIDATION
    }
    if (errors.some(e => e.severity === ErrorSeverity.FATAL)) {
      return ErrorSeverity.FATAL
    }
    if (errors.some(e => e.severity === ErrorSeverity.ERROR)) {
      return ErrorSeverity.ERROR
    }
    return ErrorSeverity.WARNING
  }
  
  /**
   * Get summary of errors by severity
   * 
   * @param errors - Array of errors
   * @returns Count by severity level
   */
  getSummary(errors: GenerationError[]): {
    validation: number
    fatal: number
    error: number
    warning: number
    total: number
    blocking: number
  } {
    return {
      validation: errors.filter(e => e.severity === ErrorSeverity.VALIDATION).length,
      fatal: errors.filter(e => e.severity === ErrorSeverity.FATAL).length,
      error: errors.filter(e => e.severity === ErrorSeverity.ERROR).length,
      warning: errors.filter(e => e.severity === ErrorSeverity.WARNING).length,
      total: errors.length,
      blocking: errors.filter(e => this.isBlocking(e)).length
    }
  }
  
  /**
   * Create a default policy (for backward compatibility)
   * 
   * Default settings:
   * - failFast: false (collect all errors)
   * - continueOnError: true (generate what we can)
   * - strictPluginValidation: false (allow plugin warnings)
   */
  static createDefault(): ErrorEscalationPolicy {
    return new ErrorEscalationPolicy({
      failFast: false,
      continueOnError: true,
      strictPluginValidation: false
    })
  }
  
  /**
   * Create a strict policy (for production)
   * 
   * Strict settings:
   * - failFast: false (see all errors)
   * - continueOnError: false (fail on any error)
   * - strictPluginValidation: true (fail on plugin errors)
   */
  static createStrict(): ErrorEscalationPolicy {
    return new ErrorEscalationPolicy({
      failFast: false,
      continueOnError: false,
      strictPluginValidation: true
    })
  }
  
  /**
   * Create a fail-fast policy (for CI/CD)
   * 
   * Fail-fast settings:
   * - failFast: true (stop on first error)
   * - continueOnError: false
   * - strictPluginValidation: true
   */
  static createFailFast(): ErrorEscalationPolicy {
    return new ErrorEscalationPolicy({
      failFast: true,
      continueOnError: false,
      strictPluginValidation: true
    })
  }
}

/**
 * Factory for creating policies from config
 */
export class ErrorPolicyFactory {
  /**
   * Create policy from config object
   * 
   * Extracts error handling settings and normalizes defaults
   */
  static fromConfig(config: any): ErrorEscalationPolicy {
    // Handle nested errorHandling object (pipeline mode)
    const errorConfig = config.errorHandling || config
    
    return new ErrorEscalationPolicy({
      failFast: errorConfig.failFast ?? false,
      continueOnError: errorConfig.continueOnError ?? true,
      strictPluginValidation: errorConfig.strictPluginValidation ?? false
    })
  }
  
  /**
   * Create policy from environment (for testing)
   */
  static fromEnvironment(): ErrorEscalationPolicy {
    const isCI = !!process.env.CI
    const isStrict = process.env.STRICT_ERRORS === 'true'
    
    if (isStrict) {
      return ErrorEscalationPolicy.createStrict()
    }
    
    if (isCI) {
      return ErrorEscalationPolicy.createFailFast()
    }
    
    return ErrorEscalationPolicy.createDefault()
  }
}

