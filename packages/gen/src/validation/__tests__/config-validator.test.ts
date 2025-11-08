/**
 * Unit Tests: ConfigValidator
 * 
 * Tests configuration validation and production warnings.
 * CRITICAL: Ensures invalid configs are caught before generation starts.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ConfigValidator } from '../config-validator.js'
import type { CodeGeneratorConfig } from '../../code-generator.js'

describe('ConfigValidator', () => {
  describe('Framework validation', () => {
    it('should accept valid express framework', () => {
      const config: CodeGeneratorConfig = {
        framework: 'express'
      }
      
      expect(() => ConfigValidator.validate(config)).not.toThrow()
    })
    
    it('should accept valid fastify framework', () => {
      const config: CodeGeneratorConfig = {
        framework: 'fastify'
      }
      
      expect(() => ConfigValidator.validate(config)).not.toThrow()
    })
    
    it('should reject invalid framework', () => {
      const config: CodeGeneratorConfig = {
        framework: 'koa' as any
      }
      
      expect(() => ConfigValidator.validate(config)).toThrow('Invalid framework')
    })
    
    it('should provide suggestion for invalid framework', () => {
      const config: CodeGeneratorConfig = {
        framework: 'nestjs' as any
      }
      
      const result = ConfigValidator.validateDetailed(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('framework')
      expect(result.errors[0].suggestion).toContain('express')
      expect(result.errors[0].suggestion).toContain('fastify')
    })
  })
  
  describe('Hook framework validation', () => {
    it('should accept valid hook frameworks', () => {
      const config: CodeGeneratorConfig = {
        hookFrameworks: ['react', 'vue', 'zustand']
      }
      
      expect(() => ConfigValidator.validate(config)).not.toThrow()
    })
    
    it('should warn on invalid hook framework', () => {
      const config: CodeGeneratorConfig = {
        hookFrameworks: ['react', 'svelte' as any, 'vue']
      }
      
      const result = ConfigValidator.validateDetailed(config)
      
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].field).toBe('hookFrameworks')
      expect(result.warnings[0].message).toContain('svelte')
    })
    
    it('should suggest valid frameworks', () => {
      const config: CodeGeneratorConfig = {
        hookFrameworks: ['invalid' as any]
      }
      
      const result = ConfigValidator.validateDetailed(config)
      
      expect(result.warnings[0].suggestion).toContain('react')
      expect(result.warnings[0].suggestion).toContain('vue')
      expect(result.warnings[0].suggestion).toContain('angular')
    })
  })
  
  describe('Mutually exclusive options', () => {
    it('should warn when failFast and continueOnError both enabled', () => {
      const config: CodeGeneratorConfig = {
        failFast: true,
        continueOnError: true
      }
      
      const result = ConfigValidator.validateDetailed(config)
      
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].field).toBe('errorHandling')
      expect(result.warnings[0].message).toContain('failFast')
      expect(result.warnings[0].message).toContain('continueOnError')
    })
  })
  
  describe('Production validation', () => {
    const originalEnv = process.env.NODE_ENV
    
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
    })
    
    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })
    
    it('should warn about development schemaHash in production', () => {
      const config: CodeGeneratorConfig = {
        schemaHash: 'development'
      }
      
      const result = ConfigValidator.validateDetailed(config)
      
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'schemaHash',
          message: expect.stringContaining('development')
        })
      )
    })
    
    it('should warn about missing schemaHash in production', () => {
      const config: CodeGeneratorConfig = {}
      
      const result = ConfigValidator.validateDetailed(config)
      
      const hashWarning = result.warnings.find(w => w.field === 'schemaHash')
      expect(hashWarning).toBeDefined()
    })
    
    it('should warn about development toolVersion in production', () => {
      const config: CodeGeneratorConfig = {
        toolVersion: '0.0.0-dev'
      }
      
      const result = ConfigValidator.validateDetailed(config)
      
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'toolVersion',
          message: expect.stringContaining('development')
        })
      )
    })
    
    it('should warn about continueOnError in production', () => {
      const config: CodeGeneratorConfig = {
        continueOnError: true
      }
      
      const result = ConfigValidator.validateDetailed(config)
      
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'continueOnError',
          message: expect.stringContaining('production')
        })
      )
    })
    
    it('should NOT warn with proper production config', () => {
      const config: CodeGeneratorConfig = {
        framework: 'express',
        schemaHash: 'abc123def456',
        toolVersion: '1.2.3',
        continueOnError: false,
        strictPluginValidation: true
      }
      
      const result = ConfigValidator.validateDetailed(config)
      
      // Should have no production-related warnings
      const prodWarnings = result.warnings.filter(w =>
        w.field === 'schemaHash' ||
        w.field === 'toolVersion' ||
        w.field === 'continueOnError'
      )
      
      expect(prodWarnings).toHaveLength(0)
    })
  })
  
  describe('Development environment', () => {
    const originalEnv = process.env.NODE_ENV
    
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })
    
    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })
    
    it('should NOT warn about dev config in development', () => {
      const config: CodeGeneratorConfig = {
        schemaHash: 'development',
        toolVersion: '0.0.0-dev',
        continueOnError: true
      }
      
      const result = ConfigValidator.validateDetailed(config)
      
      // No production warnings in dev environment
      expect(result.warnings).toHaveLength(0)
    })
  })
  
  describe('validateDetailed', () => {
    const originalEnv = process.env.NODE_ENV
    
    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })
    
    it('should return valid=true for good config', () => {
      const config: CodeGeneratorConfig = {
        framework: 'express',
        useEnhancedGenerators: true
      }
      
      const result = ConfigValidator.validateDetailed(config)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should return valid=false with errors', () => {
      const config: CodeGeneratorConfig = {
        framework: 'invalid' as any
      }
      
      const result = ConfigValidator.validateDetailed(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
    
    it('should collect all errors and warnings', () => {
      process.env.NODE_ENV = 'production'
      
      const config: CodeGeneratorConfig = {
        framework: 'invalid' as any,
        hookFrameworks: ['react', 'invalid' as any],
        schemaHash: 'development',
        failFast: true,
        continueOnError: true
      }
      
      const result = ConfigValidator.validateDetailed(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })
  
  describe('Edge cases', () => {
    it('should handle empty config', () => {
      const config: CodeGeneratorConfig = {}
      
      expect(() => ConfigValidator.validate(config)).not.toThrow()
    })
    
    it('should handle config with undefined values', () => {
      const config: CodeGeneratorConfig = {
        framework: undefined,
        projectName: undefined,
        schemaHash: undefined
      }
      
      expect(() => ConfigValidator.validate(config)).not.toThrow()
    })
    
    it('should handle config with all valid options', () => {
      const config: CodeGeneratorConfig = {
        framework: 'express',
        useEnhancedGenerators: true,
        useRegistry: false,
        projectName: 'Test Project',
        generateChecklist: true,
        autoOpenChecklist: false,
        schemaHash: 'test-hash',
        toolVersion: '1.0.0',
        hookFrameworks: ['react', 'vue'],
        strictPluginValidation: true,
        continueOnError: false,
        failFast: false,
        usePipeline: true
      }
      
      expect(() => ConfigValidator.validate(config)).not.toThrow()
    })
  })
})

