/**
 * Centralized error collection with immutable access
 * Replaces error array side effects throughout the codebase
 */

import { ErrorSeverity, type GenerationError } from './generation-types.js'

/**
 * Collects and manages generation errors
 * 
 * Features:
 * - Immutable error access (prevents side effects)
 * - Automatic severity-based logging
 * - Stack trace preservation
 * - Blocking error detection
 */
export class ErrorCollector {
  private readonly errors: GenerationError[] = []
  
  /**
   * Add error with automatic logging based on severity
   */
  addError(error: GenerationError): void {
    // Log with appropriate level and full context
    const logLevel = this.getLogLevel(error.severity)
    const prefix = this.getLogPrefix(error.severity)
    
    console[logLevel](`[ssot-codegen] ${prefix} ${error.message}`, {
      severity: error.severity,
      model: error.model,
      phase: error.phase,
      blocksGeneration: error.blocksGeneration,
      stack: error.error?.stack
    })
    
    this.errors.push(error)
  }
  
  /**
   * Check if any blocking errors exist
   * Blocking errors prevent successful generation regardless of continueOnError
   */
  hasBlockingErrors(): boolean {
    return this.errors.some(e => 
      e.severity === ErrorSeverity.VALIDATION || 
      e.severity === ErrorSeverity.FATAL ||
      e.blocksGeneration === true
    )
  }
  
  /**
   * Check if any critical errors exist (ERROR or FATAL)
   * Used to determine if checklist should be generated
   */
  hasCriticalErrors(): boolean {
    return this.errors.some(e => 
      e.severity === ErrorSeverity.ERROR || 
      e.severity === ErrorSeverity.FATAL
    )
  }
  
  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): readonly GenerationError[] {
    return this.errors.filter(e => e.severity === severity)
  }
  
  /**
   * Get all errors (immutable)
   */
  getErrors(): readonly GenerationError[] {
    return Object.freeze([...this.errors])
  }
  
  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.errors.length
  }
  
  /**
   * Get summary statistics
   */
  getSummary(): {
    total: number
    validation: number
    fatal: number
    error: number
    warning: number
    blocking: number
  } {
    return {
      total: this.errors.length,
      validation: this.getErrorsBySeverity(ErrorSeverity.VALIDATION).length,
      fatal: this.getErrorsBySeverity(ErrorSeverity.FATAL).length,
      error: this.getErrorsBySeverity(ErrorSeverity.ERROR).length,
      warning: this.getErrorsBySeverity(ErrorSeverity.WARNING).length,
      blocking: this.errors.filter(e => e.blocksGeneration).length
    }
  }
  
  /**
   * Log summary of all errors
   */
  logSummary(): void {
    if (this.errors.length === 0) {
      console.log('\n✅ [ssot-codegen] Generation completed successfully with no errors')
      return
    }
    
    const validation = this.getErrorsBySeverity(ErrorSeverity.VALIDATION)
    const fatal = this.getErrorsBySeverity(ErrorSeverity.FATAL)
    const critical = this.getErrorsBySeverity(ErrorSeverity.ERROR)
    const warnings = this.getErrorsBySeverity(ErrorSeverity.WARNING)
    
    console.log('\n' + '='.repeat(60))
    console.log('[ssot-codegen] Generation Summary')
    console.log('='.repeat(60))
    
    if (validation.length > 0) {
      console.log(`\n🚫 VALIDATION FAILURES: ${validation.length} (BLOCKS GENERATION)`)
      validation.forEach(e => {
        console.log(`   - ${e.message}${e.model ? ` (model: ${e.model})` : ''}`)
      })
    }
    
    if (fatal.length > 0) {
      console.log(`\n❌ FATAL ERRORS: ${fatal.length}`)
      fatal.forEach(e => {
        console.log(`   - ${e.message}${e.model ? ` (model: ${e.model})` : ''}`)
      })
    }
    
    if (critical.length > 0) {
      console.log(`\n🔴 ERRORS: ${critical.length}`)
      critical.forEach(e => {
        console.log(`   - ${e.message}${e.model ? ` (model: ${e.model})` : ''}`)
      })
    }
    
    if (warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS: ${warnings.length}`)
      warnings.forEach(e => {
        console.log(`   - ${e.message}${e.model ? ` (model: ${e.model})` : ''}`)
      })
    }
    
    console.log('\n' + '='.repeat(60))
    
    if (validation.length > 0) {
      console.log('🚫 Generation BLOCKED due to validation failures.')
    } else if (fatal.length > 0 || critical.length > 0) {
      console.log('⚠️  Generation completed with errors. Some files may be missing or incomplete.')
    } else {
      console.log('✅ Generation completed with warnings only. All files generated.')
    }
    console.log('='.repeat(60) + '\n')
  }
  
  /**
   * Get appropriate log level for severity
   */
  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'log' {
    switch (severity) {
      case ErrorSeverity.VALIDATION:
      case ErrorSeverity.FATAL:
      case ErrorSeverity.ERROR:
        return 'error'
      case ErrorSeverity.WARNING:
        return 'warn'
      default:
        return 'log'
    }
  }
  
  /**
   * Get log prefix for severity
   */
  private getLogPrefix(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.VALIDATION:
        return 'VALIDATION FAILURE:'
      case ErrorSeverity.FATAL:
        return 'FATAL:'
      case ErrorSeverity.ERROR:
        return 'ERROR:'
      case ErrorSeverity.WARNING:
        return 'WARNING:'
      default:
        return ''
    }
  }
}

