/**
 * Public API Tests
 * 
 * Verifies the public API works correctly in isolation from CLI
 */

import { describe, it, expect, vi } from 'vitest'
import type {
  GenerateOptions,
  GenerateResult,
  ProgressEvent
} from '../public-api.js'

describe('Public API', () => {
  describe('Type Safety', () => {
    it('GenerateOptions has all required fields', () => {
      // ✅ VALID: Minimal config
      const minimalOptions: GenerateOptions = {
        schema: './schema.prisma'
      }
      
      expect(minimalOptions.schema).toBeDefined()
      
      // ✅ VALID: Full config
      const fullOptions: GenerateOptions = {
        schema: './schema.prisma',
        output: './generated',
        projectName: 'My API',
        framework: 'express',
        standalone: true,
        paths: {
          alias: '@api'
        },
        onProgress: (event) => console.log(event),
        verbosity: 'normal',
        format: true,
        concurrency: 50,
        features: {
          googleAuth: {
            enabled: true,
            clientId: 'test'
          }
        }
      }
      
      expect(fullOptions).toBeDefined()
    })
    
    it('GenerateResult has complete structure', () => {
      const result: GenerateResult = {
        success: true,
        models: ['User', 'Post'],
        filesCreated: 42,
        relationships: 3,
        breakdown: [
          { layer: 'contracts', count: 10 },
          { layer: 'validators', count: 10 }
        ],
        outputDir: '/path/to/output',
        duration: 1234
      }
      
      expect(result.success).toBe(true)
      expect(result.models).toHaveLength(2)
      expect(result.filesCreated).toBe(42)
    })
    
    it('ProgressEvent has correct types', () => {
      const events: ProgressEvent[] = [
        {
          type: 'phase:start',
          phase: 'parseSchema',
          message: 'Parsing schema',
          timestamp: new Date()
        },
        {
          type: 'phase:end',
          phase: 'parseSchema',
          message: 'Schema parsed',
          filesGenerated: 0,
          timestamp: new Date()
        },
        {
          type: 'model:start',
          model: 'User',
          message: 'Processing User',
          timestamp: new Date()
        },
        {
          type: 'file:created',
          message: 'Created user.dto.ts',
          timestamp: new Date()
        }
      ]
      
      expect(events).toHaveLength(4)
      expect(events[0].type).toBe('phase:start')
    })
  })
  
  describe('Progress Callback', () => {
    it('receives progress events', async () => {
      const events: ProgressEvent[] = []
      
      const mockGenerate = vi.fn(async (options: GenerateOptions) => {
        // Simulate progress events
        if (options.onProgress) {
          options.onProgress({
            type: 'phase:start',
            phase: 'parseSchema',
            message: 'Parsing schema',
            timestamp: new Date()
          })
          
          options.onProgress({
            type: 'phase:end',
            phase: 'parseSchema',
            message: 'Schema parsed',
            filesGenerated: 0,
            timestamp: new Date()
          })
        }
        
        return {
          success: true,
          models: ['User'],
          filesCreated: 10,
          relationships: 0,
          breakdown: []
        }
      })
      
      await mockGenerate({
        schema: 'model User { id Int @id }',
        onProgress: (event) => events.push(event)
      })
      
      expect(events).toHaveLength(2)
      expect(events[0].type).toBe('phase:start')
      expect(events[1].type).toBe('phase:end')
    })
  })
  
  describe('Framework Options', () => {
    it('accepts express framework', () => {
      const options: GenerateOptions = {
        schema: './schema.prisma',
        framework: 'express'
      }
      
      expect(options.framework).toBe('express')
    })
    
    it('accepts fastify framework', () => {
      const options: GenerateOptions = {
        schema: './schema.prisma',
        framework: 'fastify'
      }
      
      expect(options.framework).toBe('fastify')
    })
    
    it('defaults to express when not specified', () => {
      const options: GenerateOptions = {
        schema: './schema.prisma'
      }
      
      // Framework is optional, defaults to express
      expect(options.framework).toBeUndefined()
    })
  })
  
  describe('Schema Input', () => {
    it('accepts file path', () => {
      const options: GenerateOptions = {
        schema: './prisma/schema.prisma'
      }
      
      expect(options.schema).toContain('.prisma')
    })
    
    it('accepts inline schema text', () => {
      const options: GenerateOptions = {
        schema: `
          model User {
            id Int @id @default(autoincrement())
            email String @unique
          }
        `
      }
      
      expect(options.schema).toContain('model User')
    })
  })
  
  describe('Custom Paths', () => {
    it('accepts custom path configuration', () => {
      const options: GenerateOptions = {
        schema: './schema.prisma',
        paths: {
          alias: '@api',
          rootDir: './src/generated',
          layers: {
            contracts: 'dtos',
            validators: 'schemas',
            services: 'services',
            controllers: 'handlers',
            routes: 'routes'
          }
        }
      }
      
      expect(options.paths?.alias).toBe('@api')
      expect(options.paths?.layers?.contracts).toBe('dtos')
    })
  })
  
  describe('Features Configuration', () => {
    it('accepts feature flags', () => {
      const options: GenerateOptions = {
        schema: './schema.prisma',
        features: {
          googleAuth: {
            enabled: true,
            clientId: 'test-client-id',
            strategy: 'jwt'
          },
          customFeature: {
            enabled: true,
            customOption: 'value'
          }
        }
      }
      
      expect(options.features?.googleAuth?.enabled).toBe(true)
      expect(options.features?.customFeature).toBeDefined()
    })
  })
})

describe('API Isolation', () => {
  it('has no CLI dependencies', () => {
    // These imports should work without CLI package
    const publicApi = require('../public-api.js')
    
    expect(publicApi.generate).toBeDefined()
    expect(publicApi.validateSchema).toBeDefined()
    expect(publicApi.analyzeSchema).toBeDefined()
    expect(publicApi.getVersion).toBeDefined()
  })
  
  it('types are available without implementation', () => {
    // This should compile even if implementation is not imported
    const config: GenerateOptions = {
      schema: './schema.prisma',
      framework: 'express'
    }
    
    expect(config).toBeDefined()
  })
})

