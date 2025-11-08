/**
 * Unit Tests: ErrorEscalationPolicy
 * 
 * Tests all error escalation rules and edge cases.
 * Critical for ensuring consistent error handling across the codebase.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ErrorEscalationPolicy, ErrorPolicyFactory } from '../error-escalation-policy.js'
import { ErrorSeverity } from '../generation-types.js'
import type { GenerationError } from '../generation-types.js'

describe('ErrorEscalationPolicy', () => {
  describe('shouldThrow - VALIDATION errors', () => {
    it('should always throw VALIDATION errors (prevent invalid code)', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      
      const error: GenerationError = {
        severity: ErrorSeverity.VALIDATION,
        message: 'Invalid code generated',
        phase: 'test'
      }
      
      expect(policy.shouldThrow(error)).toBe(true)
    })
    
    it('should throw VALIDATION even with continueOnError=true', () => {
      const policy = new ErrorEscalationPolicy({
        failFast: false,
        continueOnError: true,  // Should be ignored for VALIDATION
        strictPluginValidation: false
      })
      
      const error: GenerationError = {
        severity: ErrorSeverity.VALIDATION,
        message: 'Empty code generated',
        phase: 'validation'
      }
      
      expect(policy.shouldThrow(error)).toBe(true)
    })
  })
  
  describe('shouldThrow - FATAL errors', () => {
    it('should always throw FATAL errors (system failure)', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      
      const error: GenerationError = {
        severity: ErrorSeverity.FATAL,
        message: 'System failure',
        phase: 'test'
      }
      
      expect(policy.shouldThrow(error)).toBe(true)
    })
    
    it('should throw FATAL even with continueOnError=true', () => {
      const policy = new ErrorEscalationPolicy({
        failFast: false,
        continueOnError: true,  // Should be ignored for FATAL
        strictPluginValidation: false
      })
      
      const error: GenerationError = {
        severity: ErrorSeverity.FATAL,
        message: 'Schema parsing failed',
        phase: 'parsing'
      }
      
      expect(policy.shouldThrow(error)).toBe(true)
    })
  })
  
  describe('shouldThrow - blocksGeneration flag', () => {
    it('should throw when blocksGeneration=true regardless of severity', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      
      const error: GenerationError = {
        severity: ErrorSeverity.WARNING,  // Even WARNING should throw!
        message: 'Blocking issue',
        phase: 'test',
        blocksGeneration: true
      }
      
      expect(policy.shouldThrow(error)).toBe(true)
    })
    
    it('should throw blocksGeneration=true even with continueOnError', () => {
      const policy = new ErrorEscalationPolicy({
        failFast: false,
        continueOnError: true,
        strictPluginValidation: false
      })
      
      const error: GenerationError = {
        severity: ErrorSeverity.ERROR,
        message: 'Critical dependency missing',
        phase: 'test',
        blocksGeneration: true
      }
      
      expect(policy.shouldThrow(error)).toBe(true)
    })
  })
  
  describe('shouldThrow - ERROR severity with failFast', () => {
    it('should throw ERROR when failFast=true', () => {
      const policy = new ErrorEscalationPolicy({
        failFast: true,
        continueOnError: true,
        strictPluginValidation: false
      })
      
      const error: GenerationError = {
        severity: ErrorSeverity.ERROR,
        message: 'Model generation failed',
        phase: 'test'
      }
      
      expect(policy.shouldThrow(error)).toBe(true)
    })
    
    it('should NOT throw ERROR when failFast=false and continueOnError=true', () => {
      const policy = new ErrorEscalationPolicy({
        failFast: false,
        continueOnError: true,
        strictPluginValidation: false
      })
      
      const error: GenerationError = {
        severity: ErrorSeverity.ERROR,
        message: 'Model generation failed',
        phase: 'test'
      }
      
      expect(policy.shouldThrow(error)).toBe(false)
    })
  })
  
  describe('shouldThrow - ERROR severity with continueOnError', () => {
    it('should throw ERROR when continueOnError=false', () => {
      const policy = new ErrorEscalationPolicy({
        failFast: false,
        continueOnError: false,
        strictPluginValidation: false
      })
      
      const error: GenerationError = {
        severity: ErrorSeverity.ERROR,
        message: 'Model generation failed',
        phase: 'test'
      }
      
      expect(policy.shouldThrow(error)).toBe(true)
    })
    
    it('should NOT throw ERROR when continueOnError=true', () => {
      const policy = new ErrorEscalationPolicy({
        failFast: false,
        continueOnError: true,
        strictPluginValidation: false
      })
      
      const error: GenerationError = {
        severity: ErrorSeverity.ERROR,
        message: 'Non-critical error',
        phase: 'test'
      }
      
      expect(policy.shouldThrow(error)).toBe(false)
    })
  })
  
  describe('shouldThrow - WARNING severity', () => {
    it('should NEVER throw WARNING errors', () => {
      const policy = new ErrorEscalationPolicy({
        failFast: true,
        continueOnError: false,
        strictPluginValidation: true
      })
      
      const error: GenerationError = {
        severity: ErrorSeverity.WARNING,
        message: 'Minor issue',
        phase: 'test'
      }
      
      expect(policy.shouldThrow(error)).toBe(false)
    })
  })
  
  describe('isBlocking', () => {
    it('should identify VALIDATION as blocking', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      
      const error: GenerationError = {
        severity: ErrorSeverity.VALIDATION,
        message: 'Invalid code',
        phase: 'test'
      }
      
      expect(policy.isBlocking(error)).toBe(true)
    })
    
    it('should identify FATAL as blocking', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      
      const error: GenerationError = {
        severity: ErrorSeverity.FATAL,
        message: 'System failure',
        phase: 'test'
      }
      
      expect(policy.isBlocking(error)).toBe(true)
    })
    
    it('should identify blocksGeneration flag as blocking', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      
      const error: GenerationError = {
        severity: ErrorSeverity.WARNING,  // Even WARNING is blocking!
        message: 'Blocking issue',
        phase: 'test',
        blocksGeneration: true
      }
      
      expect(policy.isBlocking(error)).toBe(true)
    })
    
    it('should NOT identify ERROR as blocking (depends on config)', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      
      const error: GenerationError = {
        severity: ErrorSeverity.ERROR,
        message: 'Regular error',
        phase: 'test'
      }
      
      expect(policy.isBlocking(error)).toBe(false)
    })
    
    it('should NOT identify WARNING as blocking', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      
      const error: GenerationError = {
        severity: ErrorSeverity.WARNING,
        message: 'Minor warning',
        phase: 'test'
      }
      
      expect(policy.isBlocking(error)).toBe(false)
    })
  })
  
  describe('hasBlockingErrors', () => {
    it('should detect blocking errors in array', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      
      const errors: GenerationError[] = [
        { severity: ErrorSeverity.WARNING, message: 'warning', phase: 'test' },
        { severity: ErrorSeverity.ERROR, message: 'error', phase: 'test' },
        { severity: ErrorSeverity.VALIDATION, message: 'validation', phase: 'test' }
      ]
      
      expect(policy.hasBlockingErrors(errors)).toBe(true)
    })
    
    it('should return false when no blocking errors', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      
      const errors: GenerationError[] = [
        { severity: ErrorSeverity.WARNING, message: 'warning', phase: 'test' },
        { severity: ErrorSeverity.ERROR, message: 'error', phase: 'test' }
      ]
      
      expect(policy.hasBlockingErrors(errors)).toBe(false)
    })
    
    it('should return false for empty array', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      expect(policy.hasBlockingErrors([])).toBe(false)
    })
  })
  
  describe('getHighestSeverity', () => {
    it('should return VALIDATION as highest', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      
      const errors: GenerationError[] = [
        { severity: ErrorSeverity.WARNING, message: 'warning', phase: 'test' },
        { severity: ErrorSeverity.ERROR, message: 'error', phase: 'test' },
        { severity: ErrorSeverity.VALIDATION, message: 'validation', phase: 'test' }
      ]
      
      expect(policy.getHighestSeverity(errors)).toBe(ErrorSeverity.VALIDATION)
    })
    
    it('should return FATAL when no VALIDATION', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      
      const errors: GenerationError[] = [
        { severity: ErrorSeverity.WARNING, message: 'warning', phase: 'test' },
        { severity: ErrorSeverity.FATAL, message: 'fatal', phase: 'test' },
        { severity: ErrorSeverity.ERROR, message: 'error', phase: 'test' }
      ]
      
      expect(policy.getHighestSeverity(errors)).toBe(ErrorSeverity.FATAL)
    })
    
    it('should return ERROR when only errors and warnings', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      
      const errors: GenerationError[] = [
        { severity: ErrorSeverity.WARNING, message: 'warning', phase: 'test' },
        { severity: ErrorSeverity.ERROR, message: 'error', phase: 'test' }
      ]
      
      expect(policy.getHighestSeverity(errors)).toBe(ErrorSeverity.ERROR)
    })
    
    it('should return WARNING when only warnings', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      
      const errors: GenerationError[] = [
        { severity: ErrorSeverity.WARNING, message: 'warning 1', phase: 'test' },
        { severity: ErrorSeverity.WARNING, message: 'warning 2', phase: 'test' }
      ]
      
      expect(policy.getHighestSeverity(errors)).toBe(ErrorSeverity.WARNING)
    })
  })
  
  describe('getSummary', () => {
    it('should count errors by severity', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      
      const errors: GenerationError[] = [
        { severity: ErrorSeverity.VALIDATION, message: 'v1', phase: 'test' },
        { severity: ErrorSeverity.VALIDATION, message: 'v2', phase: 'test' },
        { severity: ErrorSeverity.FATAL, message: 'f1', phase: 'test' },
        { severity: ErrorSeverity.ERROR, message: 'e1', phase: 'test' },
        { severity: ErrorSeverity.ERROR, message: 'e2', phase: 'test' },
        { severity: ErrorSeverity.ERROR, message: 'e3', phase: 'test' },
        { severity: ErrorSeverity.WARNING, message: 'w1', phase: 'test' }
      ]
      
      const summary = policy.getSummary(errors)
      
      expect(summary.validation).toBe(2)
      expect(summary.fatal).toBe(1)
      expect(summary.error).toBe(3)
      expect(summary.warning).toBe(1)
      expect(summary.total).toBe(7)
      expect(summary.blocking).toBe(3)  // 2 VALIDATION + 1 FATAL
    })
    
    it('should handle empty array', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      const summary = policy.getSummary([])
      
      expect(summary.validation).toBe(0)
      expect(summary.fatal).toBe(0)
      expect(summary.error).toBe(0)
      expect(summary.warning).toBe(0)
      expect(summary.total).toBe(0)
      expect(summary.blocking).toBe(0)
    })
    
    it('should count blocksGeneration flag', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      
      const errors: GenerationError[] = [
        { severity: ErrorSeverity.ERROR, message: 'e1', phase: 'test', blocksGeneration: true },
        { severity: ErrorSeverity.WARNING, message: 'w1', phase: 'test', blocksGeneration: true }
      ]
      
      const summary = policy.getSummary(errors)
      
      expect(summary.blocking).toBe(2)  // Both have blocksGeneration=true
    })
  })
  
  describe('Factory methods', () => {
    describe('createDefault', () => {
      it('should create lenient policy', () => {
        const policy = ErrorEscalationPolicy.createDefault()
        
        // Default: continueOnError=true, failFast=false
        const error: GenerationError = {
          severity: ErrorSeverity.ERROR,
          message: 'error',
          phase: 'test'
        }
        
        expect(policy.shouldThrow(error)).toBe(false)
      })
    })
    
    describe('createStrict', () => {
      it('should create strict policy', () => {
        const policy = ErrorEscalationPolicy.createStrict()
        
        // Strict: continueOnError=false
        const error: GenerationError = {
          severity: ErrorSeverity.ERROR,
          message: 'error',
          phase: 'test'
        }
        
        expect(policy.shouldThrow(error)).toBe(true)
      })
    })
    
    describe('createFailFast', () => {
      it('should create fail-fast policy', () => {
        const policy = ErrorEscalationPolicy.createFailFast()
        
        // Fail-fast: failFast=true
        const error: GenerationError = {
          severity: ErrorSeverity.ERROR,
          message: 'error',
          phase: 'test'
        }
        
        expect(policy.shouldThrow(error)).toBe(true)
      })
    })
  })
  
  describe('ErrorPolicyFactory.fromConfig', () => {
    it('should create policy from flat config', () => {
      const config = {
        failFast: true,
        continueOnError: false,
        strictPluginValidation: true
      }
      
      const policy = ErrorPolicyFactory.fromConfig(config)
      
      const error: GenerationError = {
        severity: ErrorSeverity.ERROR,
        message: 'error',
        phase: 'test'
      }
      
      expect(policy.shouldThrow(error)).toBe(true)
    })
    
    it('should create policy from nested errorHandling config', () => {
      const config = {
        errorHandling: {
          failFast: false,
          continueOnError: true,
          strictPluginValidation: false
        }
      }
      
      const policy = ErrorPolicyFactory.fromConfig(config)
      
      const error: GenerationError = {
        severity: ErrorSeverity.ERROR,
        message: 'error',
        phase: 'test'
      }
      
      expect(policy.shouldThrow(error)).toBe(false)
    })
    
    it('should use defaults when config values missing', () => {
      const config = {}
      const policy = ErrorPolicyFactory.fromConfig(config)
      
      // Should behave like createDefault()
      const error: GenerationError = {
        severity: ErrorSeverity.ERROR,
        message: 'error',
        phase: 'test'
      }
      
      expect(policy.shouldThrow(error)).toBe(false)
    })
  })
  
  describe('ErrorPolicyFactory.fromEnvironment', () => {
    const originalEnv = process.env
    
    beforeEach(() => {
      // Reset env
      process.env = { ...originalEnv }
      delete process.env.CI
      delete process.env.STRICT_ERRORS
    })
    
    afterEach(() => {
      process.env = originalEnv
    })
    
    it('should create strict policy when STRICT_ERRORS=true', () => {
      process.env.STRICT_ERRORS = 'true'
      const policy = ErrorPolicyFactory.fromEnvironment()
      
      const error: GenerationError = {
        severity: ErrorSeverity.ERROR,
        message: 'error',
        phase: 'test'
      }
      
      expect(policy.shouldThrow(error)).toBe(true)
    })
    
    it('should create fail-fast policy in CI environment', () => {
      process.env.CI = 'true'
      const policy = ErrorPolicyFactory.fromEnvironment()
      
      const error: GenerationError = {
        severity: ErrorSeverity.ERROR,
        message: 'error',
        phase: 'test'
      }
      
      expect(policy.shouldThrow(error)).toBe(true)
    })
    
    it('should create default policy in dev environment', () => {
      const policy = ErrorPolicyFactory.fromEnvironment()
      
      const error: GenerationError = {
        severity: ErrorSeverity.ERROR,
        message: 'error',
        phase: 'test'
      }
      
      expect(policy.shouldThrow(error)).toBe(false)
    })
  })
  
  describe('Edge cases', () => {
    it('should handle error with all flags set', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      
      const error: GenerationError = {
        severity: ErrorSeverity.VALIDATION,
        message: 'Multiple issues',
        phase: 'test',
        blocksGeneration: true,
        model: 'User'
      }
      
      expect(policy.shouldThrow(error)).toBe(true)
      expect(policy.isBlocking(error)).toBe(true)
    })
    
    it('should handle error with minimal properties', () => {
      const policy = ErrorEscalationPolicy.createDefault()
      
      const error: GenerationError = {
        severity: ErrorSeverity.WARNING,
        message: 'warning',
        phase: 'test'
      }
      
      expect(policy.shouldThrow(error)).toBe(false)
      expect(policy.isBlocking(error)).toBe(false)
    })
  })
  
  describe('Priority rules (CRITICAL)', () => {
    it('VALIDATION always throws (priority 1)', () => {
      const policy = new ErrorEscalationPolicy({
        failFast: false,
        continueOnError: true,
        strictPluginValidation: false
      })
      
      expect(policy.shouldThrow({
        severity: ErrorSeverity.VALIDATION,
        message: 'test',
        phase: 'test'
      })).toBe(true)
    })
    
    it('FATAL always throws (priority 2)', () => {
      const policy = new ErrorEscalationPolicy({
        failFast: false,
        continueOnError: true,
        strictPluginValidation: false
      })
      
      expect(policy.shouldThrow({
        severity: ErrorSeverity.FATAL,
        message: 'test',
        phase: 'test'
      })).toBe(true)
    })
    
    it('blocksGeneration always throws (priority 3)', () => {
      const policy = new ErrorEscalationPolicy({
        failFast: false,
        continueOnError: true,
        strictPluginValidation: false
      })
      
      expect(policy.shouldThrow({
        severity: ErrorSeverity.WARNING,
        message: 'test',
        phase: 'test',
        blocksGeneration: true
      })).toBe(true)
    })
    
    it('ERROR + failFast throws (priority 4)', () => {
      const policy = new ErrorEscalationPolicy({
        failFast: true,
        continueOnError: true,
        strictPluginValidation: false
      })
      
      expect(policy.shouldThrow({
        severity: ErrorSeverity.ERROR,
        message: 'test',
        phase: 'test'
      })).toBe(true)
    })
    
    it('ERROR + !continueOnError throws (priority 5)', () => {
      const policy = new ErrorEscalationPolicy({
        failFast: false,
        continueOnError: false,
        strictPluginValidation: false
      })
      
      expect(policy.shouldThrow({
        severity: ErrorSeverity.ERROR,
        message: 'test',
        phase: 'test'
      })).toBe(true)
    })
    
    it('WARNING never throws (priority 6)', () => {
      const policy = new ErrorEscalationPolicy({
        failFast: true,
        continueOnError: false,
        strictPluginValidation: true
      })
      
      expect(policy.shouldThrow({
        severity: ErrorSeverity.WARNING,
        message: 'test',
        phase: 'test'
      })).toBe(false)
    })
  })
})

