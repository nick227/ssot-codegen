/**
 * Unit Tests: RegistryModeGenerator
 * 
 * Tests shared registry generation logic used by both legacy and pipeline modes.
 * CRITICAL: Ensures consistent behavior across both code paths.
 */

import { describe, it, expect, vi } from 'vitest'
import { RegistryModeGenerator, generateRegistryMode } from '../registry-mode-generator.js'
import type { ParsedSchema, ParsedModel, ParsedField } from '../../dmmf-parser.js'
import type { UnifiedModelAnalysis } from '../../analyzers/unified-analyzer/index.js'
import type { ServiceAnnotation } from '../../service-linker.js'

// Mock generators
vi.mock('../registry-generator.js', () => ({
  generateRegistrySystem: vi.fn((schema, analysis) => {
    const registry = new Map()
    registry.set('registry.ts', '// Mock registry')
    return registry
  })
}))

vi.mock('../dto-generator.js', () => ({
  generateAllDTOs: vi.fn((model) => ({
    create: `// Create DTO for ${model.name}`,
    update: `// Update DTO for ${model.name}`,
    read: `// Read DTO for ${model.name}`,
    query: `// Query DTO for ${model.name}`
  }))
}))

vi.mock('../validator-generator.js', () => ({
  generateAllValidators: vi.fn((model) => ({
    create: `// Create validator for ${model.name}`,
    update: `// Update validator for ${model.name}`,
    query: `// Query validator for ${model.name}`
  }))
}))

vi.mock('../service-integration.generator.js', () => ({
  generateServiceController: vi.fn((annotation) => `// Controller for ${annotation.name}`),
  generateServiceRoutes: vi.fn((annotation) => `// Routes for ${annotation.name}`),
  generateServiceScaffold: vi.fn((annotation) => `// Scaffold for ${annotation.name}`)
}))

// Helper to create minimal model
function createModel(name: string, isJunction = false): ParsedModel {
  return {
    name,
    nameLower: name.toLowerCase(),
    fields: [
      {
        name: 'id',
        type: 'String',
        kind: 'scalar',
        isRequired: true,
        isList: false,
        isId: true
      } as ParsedField
    ],
    uniqueFields: [],
    uniqueIndexes: [],
    primaryKey: null,
    documentation: undefined
  }
}

// Helper to create analysis
function createAnalysis(modelName: string, isJunction = false): UnifiedModelAnalysis {
  return {
    model: createModel(modelName),
    relationships: [],
    autoIncludeRelations: [],
    isJunctionTable: isJunction,
    specialFields: {},
    hasPublishedField: false,
    hasSlugField: false,
    capabilities: {
      canFilter: false,
      canSearch: false,
      canSort: false,
      canPaginate: false,
      hasTimestamps: false,
      hasSoftDelete: false
    }
  }
}

// Helper to create service annotation
function createServiceAnnotation(name: string): ServiceAnnotation {
  return {
    name,
    methods: [
      { name: 'process', httpMethod: 'POST', path: '/process' }
    ]
  }
}

describe('RegistryModeGenerator', () => {
  describe('Basic generation', () => {
    it('should generate registry, DTOs, and validators', () => {
      const schema: ParsedSchema = {
        models: [createModel('User')],
        enums: []
      }
      
      const analysis = new Map([['User', createAnalysis('User')]])
      const annotations = new Map()
      
      const result = generateRegistryMode(schema, analysis, annotations)
      
      expect(result.registry.size).toBeGreaterThan(0)
      expect(result.contracts.size).toBeGreaterThan(0)
      expect(result.validators.size).toBeGreaterThan(0)
      expect(result.modelsProcessed).toBe(1)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should process multiple models', () => {
      const schema: ParsedSchema = {
        models: [
          createModel('User'),
          createModel('Post'),
          createModel('Comment')
        ],
        enums: []
      }
      
      const analysis = new Map([
        ['User', createAnalysis('User')],
        ['Post', createAnalysis('Post')],
        ['Comment', createAnalysis('Comment')]
      ])
      const annotations = new Map()
      
      const result = generateRegistryMode(schema, analysis, annotations)
      
      expect(result.modelsProcessed).toBe(3)
      expect(result.contracts.size).toBe(3)
      expect(result.validators.size).toBe(3)
    })
  })
  
  describe('Junction table handling', () => {
    it('should skip junction tables by default', () => {
      const schema: ParsedSchema = {
        models: [
          createModel('User'),
          createModel('UserPost'),  // Junction table
          createModel('Post')
        ],
        enums: []
      }
      
      const analysis = new Map([
        ['User', createAnalysis('User', false)],
        ['UserPost', createAnalysis('UserPost', true)],  // isJunctionTable
        ['Post', createAnalysis('Post', false)]
      ])
      const annotations = new Map()
      
      const result = generateRegistryMode(schema, analysis, annotations, {
        skipJunctionTables: true
      })
      
      // Should only process 2 models (skip junction)
      expect(result.modelsProcessed).toBe(2)
      expect(result.contracts.has('UserPost')).toBe(false)
    })
    
    it('should include junction tables when configured', () => {
      const schema: ParsedSchema = {
        models: [
          createModel('User'),
          createModel('UserPost')
        ],
        enums: []
      }
      
      const analysis = new Map([
        ['User', createAnalysis('User', false)],
        ['UserPost', createAnalysis('UserPost', true)]
      ])
      const annotations = new Map()
      
      const result = generateRegistryMode(schema, analysis, annotations, {
        skipJunctionTables: false
      })
      
      // Should process both
      expect(result.modelsProcessed).toBe(2)
      expect(result.contracts.has('UserPost')).toBe(true)
    })
  })
  
  describe('Service integration generation', () => {
    it('should generate service integrations when annotations present', () => {
      const schema: ParsedSchema = {
        models: [createModel('ImageProcessor')],
        enums: []
      }
      
      const analysis = new Map([['ImageProcessor', createAnalysis('ImageProcessor')]])
      const annotations = new Map([
        ['ImageProcessor', createServiceAnnotation('image-optimizer')]
      ])
      
      const result = generateRegistryMode(schema, analysis, annotations, {
        includeServiceIntegrations: true
      })
      
      expect(result.serviceIntegrations).toBe(1)
      expect(result.serviceControllers.size).toBe(1)
      expect(result.serviceRoutes.size).toBe(1)
      expect(result.serviceScaffolds.size).toBe(1)
    })
    
    it('should skip service integrations when disabled', () => {
      const schema: ParsedSchema = {
        models: [createModel('ImageProcessor')],
        enums: []
      }
      
      const analysis = new Map([['ImageProcessor', createAnalysis('ImageProcessor')]])
      const annotations = new Map([
        ['ImageProcessor', createServiceAnnotation('image-optimizer')]
      ])
      
      const result = generateRegistryMode(schema, analysis, annotations, {
        includeServiceIntegrations: false
      })
      
      expect(result.serviceIntegrations).toBe(0)
      expect(result.serviceControllers.size).toBe(0)
    })
    
    it('should handle multiple service annotations', () => {
      const schema: ParsedSchema = {
        models: [
          createModel('ImageProcessor'),
          createModel('AIChat')
        ],
        enums: []
      }
      
      const analysis = new Map([
        ['ImageProcessor', createAnalysis('ImageProcessor')],
        ['AIChat', createAnalysis('AIChat')]
      ])
      const annotations = new Map([
        ['ImageProcessor', createServiceAnnotation('image-optimizer')],
        ['AIChat', createServiceAnnotation('ai-chat')]
      ])
      
      const result = generateRegistryMode(schema, analysis, annotations)
      
      expect(result.serviceIntegrations).toBe(2)
      expect(result.serviceControllers.size).toBe(2)
      expect(result.serviceRoutes.size).toBe(2)
      expect(result.serviceScaffolds.size).toBe(2)
    })
  })
  
  describe('Code validation', () => {
    it('should validate code when enabled', () => {
      const schema: ParsedSchema = {
        models: [createModel('User')],
        enums: []
      }
      
      const analysis = new Map([['User', createAnalysis('User')]])
      const annotations = new Map()
      
      const validator = vi.fn(() => true)
      
      const result = generateRegistryMode(schema, analysis, annotations, {
        validateCode: true
      }, validator)
      
      // Should have called validator for DTOs and validators
      expect(validator).toHaveBeenCalled()
    })
    
    it('should skip validation when disabled', () => {
      const schema: ParsedSchema = {
        models: [createModel('User')],
        enums: []
      }
      
      const analysis = new Map([['User', createAnalysis('User')]])
      const annotations = new Map()
      
      const validator = vi.fn(() => true)
      
      const result = generateRegistryMode(schema, analysis, annotations, {
        validateCode: false
      }, validator)
      
      // Should NOT have called validator
      expect(validator).not.toHaveBeenCalled()
    })
    
    it('should skip files with invalid code', () => {
      const schema: ParsedSchema = {
        models: [createModel('User')],
        enums: []
      }
      
      const analysis = new Map([['User', createAnalysis('User')]])
      const annotations = new Map()
      
      // Validator rejects all code
      const validator = vi.fn(() => false)
      
      const result = generateRegistryMode(schema, analysis, annotations, {
        validateCode: true
      }, validator)
      
      // Should have 0 files added (all rejected)
      expect(result.contracts.size).toBe(0)
      expect(result.validators.size).toBe(0)
    })
  })
  
  describe('Error collection', () => {
    it('should collect errors but continue generation', () => {
      const schema: ParsedSchema = {
        models: [
          createModel('User'),
          createModel('Post')
        ],
        enums: []
      }
      
      const analysis = new Map([
        ['User', createAnalysis('User')],
        ['Post', createAnalysis('Post')]
      ])
      const annotations = new Map()
      
      // Mock to throw error for Post
      const { generateAllDTOs } = await import('../dto-generator.js')
      vi.mocked(generateAllDTOs).mockImplementation((model) => {
        if (model.name === 'Post') {
          throw new Error('DTO generation failed for Post')
        }
        return {
          create: `// Create for ${model.name}`,
          update: `// Update for ${model.name}`,
          read: `// Read for ${model.name}`,
          query: `// Query for ${model.name}`
        }
      })
      
      const result = generateRegistryMode(schema, analysis, annotations)
      
      // Should process User successfully, collect error for Post
      expect(result.modelsProcessed).toBe(1)  // Only User
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].model).toBe('Post')
    })
  })
  
  describe('RegistryModeGenerator.mergeIntoGeneratedFiles', () => {
    it('should merge all result categories into GeneratedFiles', () => {
      const result = {
        registry: new Map([['registry.ts', '// registry']]),
        contracts: new Map([['User', new Map([['user.dto.ts', '// dto']])]]),
        validators: new Map([['User', new Map([['user.zod.ts', '// validator']])]]),
        serviceControllers: new Map([['service.controller.ts', '// controller']]),
        serviceRoutes: new Map([['service.routes.ts', '// routes']]),
        serviceScaffolds: new Map([['service.scaffold.ts', '// scaffold']]),
        modelsProcessed: 1,
        serviceIntegrations: 1,
        errors: []
      }
      
      const files: any = {
        contracts: new Map(),
        validators: new Map(),
        services: new Map(),
        controllers: new Map(),
        routes: new Map(),
        registry: undefined
      }
      
      RegistryModeGenerator.mergeIntoGeneratedFiles(result, files)
      
      expect(files.registry?.size).toBe(1)
      expect(files.contracts.size).toBe(1)
      expect(files.validators.size).toBe(1)
      expect(files.controllers.size).toBe(1)
      expect(files.routes.size).toBe(1)
      expect(files.services.size).toBe(1)
    })
    
    it('should not overwrite existing GeneratedFiles data', () => {
      const result = {
        registry: new Map([['registry.ts', '// new']]),
        contracts: new Map([['Post', new Map([['post.dto.ts', '// post']])]]),
        validators: new Map(),
        serviceControllers: new Map(),
        serviceRoutes: new Map(),
        serviceScaffolds: new Map(),
        modelsProcessed: 1,
        serviceIntegrations: 0,
        errors: []
      }
      
      const files: any = {
        contracts: new Map([['User', new Map([['user.dto.ts', '// user']])]]),
        validators: new Map(),
        services: new Map(),
        controllers: new Map(),
        routes: new Map(),
        registry: undefined
      }
      
      RegistryModeGenerator.mergeIntoGeneratedFiles(result, files)
      
      // Should have both User and Post
      expect(files.contracts.size).toBe(2)
      expect(files.contracts.has('User')).toBe(true)
      expect(files.contracts.has('Post')).toBe(true)
    })
  })
  
  describe('Options', () => {
    it('should respect validateCode option', () => {
      const schema: ParsedSchema = {
        models: [createModel('User')],
        enums: []
      }
      
      const analysis = new Map([['User', createAnalysis('User')]])
      const annotations = new Map()
      const validator = vi.fn(() => true)
      
      generateRegistryMode(schema, analysis, annotations, {
        validateCode: true
      }, validator)
      
      expect(validator).toHaveBeenCalled()
    })
    
    it('should respect skipJunctionTables option', () => {
      const schema: ParsedSchema = {
        models: [
          createModel('User'),
          createModel('UserPost')
        ],
        enums: []
      }
      
      const analysis = new Map([
        ['User', createAnalysis('User', false)],
        ['UserPost', createAnalysis('UserPost', true)]
      ])
      const annotations = new Map()
      
      const result = generateRegistryMode(schema, analysis, annotations, {
        skipJunctionTables: true
      })
      
      expect(result.modelsProcessed).toBe(1)
    })
    
    it('should respect includeServiceIntegrations option', () => {
      const schema: ParsedSchema = {
        models: [createModel('Service')],
        enums: []
      }
      
      const analysis = new Map([['Service', createAnalysis('Service')]])
      const annotations = new Map([
        ['Service', createServiceAnnotation('my-service')]
      ])
      
      const result = generateRegistryMode(schema, analysis, annotations, {
        includeServiceIntegrations: false
      })
      
      expect(result.serviceIntegrations).toBe(0)
      expect(result.serviceControllers.size).toBe(0)
    })
  })
  
  describe('Edge cases', () => {
    it('should handle empty schema', () => {
      const schema: ParsedSchema = {
        models: [],
        enums: []
      }
      
      const analysis = new Map()
      const annotations = new Map()
      
      const result = generateRegistryMode(schema, analysis, annotations)
      
      expect(result.modelsProcessed).toBe(0)
      expect(result.serviceIntegrations).toBe(0)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should handle models with no analysis', () => {
      const schema: ParsedSchema = {
        models: [createModel('User')],
        enums: []
      }
      
      const analysis = new Map()  // Empty - no analysis for User
      const annotations = new Map()
      
      const result = generateRegistryMode(schema, analysis, annotations)
      
      // Should still process (analysis is for optimization)
      expect(result.modelsProcessed).toBe(1)
    })
    
    it('should handle service annotation without model', () => {
      const schema: ParsedSchema = {
        models: [],
        enums: []
      }
      
      const analysis = new Map()
      const annotations = new Map([
        ['StandaloneService', createServiceAnnotation('standalone')]
      ])
      
      const result = generateRegistryMode(schema, analysis, annotations)
      
      // Should still generate service integration
      expect(result.serviceIntegrations).toBe(1)
    })
  })
  
  describe('Consistency between modes', () => {
    it('should produce same result structure regardless of options', () => {
      const schema: ParsedSchema = {
        models: [createModel('User')],
        enums: []
      }
      
      const analysis = new Map([['User', createAnalysis('User')]])
      const annotations = new Map()
      
      const result1 = generateRegistryMode(schema, analysis, annotations, {
        validateCode: true
      })
      
      const result2 = generateRegistryMode(schema, analysis, annotations, {
        validateCode: false
      })
      
      // Structure should be identical (validation doesn't change structure)
      expect(Object.keys(result1)).toEqual(Object.keys(result2))
    })
  })
})

