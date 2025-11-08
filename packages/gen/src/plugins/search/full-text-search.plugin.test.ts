/**
 * Full-Text Search Plugin Tests
 */

import { describe, it, expect } from 'vitest'
import { FullTextSearchPlugin, type SearchPluginConfig } from './full-text-search.plugin.js'
import type { ParsedSchema, ParsedModel, ParsedField } from '../../dmmf-parser.js'
import type { PluginContextV2 } from '../plugin-v2.interface.js'

describe('FullTextSearchPlugin', () => {
  const createMockModel = (name: string, fields: Array<{ name: string; type: string }>): ParsedModel => ({
    name,
    nameLower: name.toLowerCase(),
    fields: fields.map((f): ParsedField => ({
      name: f.name,
      type: f.type,
      kind: 'scalar',
      isList: false,
      isRequired: true,
      isUnique: false,
      isId: f.name === 'id',
      isReadOnly: false,
      isUpdatedAt: false,
      hasDefaultValue: false
    })),
    primaryKey: undefined,
    uniqueFields: [],
    idField: { name: 'id', type: 'Int', kind: 'scalar', isList: false, isRequired: true, isUnique: true, isId: true, isReadOnly: false, isUpdatedAt: false, hasDefaultValue: true },
    scalarFields: [],
    relationFields: [],
    createFields: [],
    updateFields: [],
    readFields: []
  })
  
  const createMockSchema = (...models: ParsedModel[]): ParsedSchema => ({
    models,
    enums: [],
    modelMap: new Map(models.map(m => [m.name, m])),
    enumMap: new Map()
  })
  
  const createMockContext = (schema: ParsedSchema, pluginConfig: SearchPluginConfig): PluginContextV2 => ({
    schema,
    projectName: 'test-project',
    framework: 'express' as const,
    outputDir: '/output',
    config: {
      plugins: {
        'full-text-search': pluginConfig
      }
    } as any
  })
  
  describe('Plugin Metadata', () => {
    it('should have correct metadata', () => {
      const plugin = new FullTextSearchPlugin()
      
      expect(plugin.name).toBe('full-text-search')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.enabled).toBe(true)
      expect(plugin.description).toContain('search')
    })
    
    it('should have config schema', () => {
      const plugin = new FullTextSearchPlugin()
      
      expect(plugin.configSchema).toBeDefined()
      expect(plugin.configSchema.type).toBe('object')
      expect(plugin.configSchema.properties.strategy).toBeDefined()
      expect(plugin.configSchema.properties.models).toBeDefined()
    })
  })
  
  describe('Validation', () => {
    it('should pass validation with correct config', () => {
      const plugin = new FullTextSearchPlugin()
      const productModel = createMockModel('Product', [
        { name: 'id', type: 'Int' },
        { name: 'name', type: 'String' },
        { name: 'description', type: 'String' }
      ])
      
      const schema = createMockSchema(productModel)
      const pluginConfig: SearchPluginConfig = {
        strategy: 'simple',
        models: {
          Product: {
            enabled: true,
            fields: [
              { name: 'name', weight: 100, matchTypes: ['startsWith', 'contains'] },
              { name: 'description', weight: 50, matchTypes: ['contains'] }
            ]
          }
        }
      }
      
      const context = createMockContext(schema, pluginConfig)
      const result = plugin.validate(context)
      
      expect(result.valid).toBe(true)
      expect(result.errors.length).toBe(0)
    })
    
    it('should fail validation with no models configured', () => {
      const plugin = new FullTextSearchPlugin()
      const schema = createMockSchema()
      const pluginConfig: SearchPluginConfig = {
        models: {}
      }
      
      const context = createMockContext(schema, pluginConfig)
      const result = plugin.validate(context)
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].code).toBe('NO_SEARCH_MODELS')
    })
    
    it('should warn if model not found in schema', () => {
      const plugin = new FullTextSearchPlugin()
      const schema = createMockSchema()
      const pluginConfig: SearchPluginConfig = {
        models: {
          Product: {
            enabled: true,
            fields: [
              { name: 'name', weight: 100, matchTypes: ['contains'] }
            ]
          }
        }
      }
      
      const context = createMockContext(schema, pluginConfig)
      const result = plugin.validate(context)
      
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0].code).toBe('MODEL_NOT_FOUND')
    })
    
    it('should warn if field not found in model', () => {
      const plugin = new FullTextSearchPlugin()
      const productModel = createMockModel('Product', [
        { name: 'id', type: 'Int' },
        { name: 'name', type: 'String' }
      ])
      
      const schema = createMockSchema(productModel)
      const pluginConfig: SearchPluginConfig = {
        models: {
          Product: {
            enabled: true,
            fields: [
              { name: 'nonExistentField', weight: 100, matchTypes: ['contains'] }
            ]
          }
        }
      }
      
      const context = createMockContext(schema, pluginConfig)
      const result = plugin.validate(context)
      
      expect(result.warnings.some(w => w.field === 'nonExistentField')).toBe(true)
    })
  })
  
  describe('Code Generation', () => {
    it('should generate search config file', () => {
      const plugin = new FullTextSearchPlugin()
      const productModel = createMockModel('Product', [
        { name: 'id', type: 'Int' },
        { name: 'name', type: 'String' },
        { name: 'description', type: 'String' }
      ])
      
      const schema = createMockSchema(productModel)
      const pluginConfig: SearchPluginConfig = {
        strategy: 'simple',
        models: {
          Product: {
            enabled: true,
            fields: [
              { name: 'name', weight: 100, matchTypes: ['startsWith', 'contains'] },
              { name: 'description', weight: 50, matchTypes: ['contains'] }
            ]
          }
        }
      }
      
      const context = createMockContext(schema, pluginConfig)
      const output = plugin.generate(context)
      
      expect(output.files.has('search/search.config.ts')).toBe(true)
      
      const configFile = output.files.get('search/search.config.ts')!
      expect(configFile).toContain('productSearchConfig')
      expect(configFile).toContain('searchRegistry')
      expect(configFile).toContain('SearchConfig')
    })
    
    it('should generate search service file', () => {
      const plugin = new FullTextSearchPlugin()
      const productModel = createMockModel('Product', [
        { name: 'id', type: 'Int' },
        { name: 'name', type: 'String' }
      ])
      
      const schema = createMockSchema(productModel)
      const pluginConfig: SearchPluginConfig = {
        models: {
          Product: {
            enabled: true,
            fields: [
              { name: 'name', weight: 100, matchTypes: ['contains'] }
            ]
          }
        }
      }
      
      const context = createMockContext(schema, pluginConfig)
      const output = plugin.generate(context)
      
      expect(output.files.has('search/search.service.ts')).toBe(true)
      
      const serviceFile = output.files.get('search/search.service.ts')!
      expect(serviceFile).toContain('SearchService')
      expect(serviceFile).toContain('SearchEngine')
      expect(serviceFile).toContain('@ssot-codegen/sdk-runtime')
    })
    
    it('should generate search controller file', () => {
      const plugin = new FullTextSearchPlugin()
      const productModel = createMockModel('Product', [
        { name: 'id', type: 'Int' },
        { name: 'name', type: 'String' }
      ])
      
      const schema = createMockSchema(productModel)
      const pluginConfig: SearchPluginConfig = {
        models: {
          Product: {
            enabled: true,
            fields: [
              { name: 'name', weight: 100, matchTypes: ['contains'] }
            ]
          }
        }
      }
      
      const context = createMockContext(schema, pluginConfig)
      const output = plugin.generate(context)
      
      expect(output.files.has('search/search.controller.ts')).toBe(true)
      
      const controllerFile = output.files.get('search/search.controller.ts')!
      expect(controllerFile).toContain('export async function search')
      expect(controllerFile).toContain('export async function searchAll')
    })
    
    it('should generate search types file', () => {
      const plugin = new FullTextSearchPlugin()
      const productModel = createMockModel('Product', [
        { name: 'id', type: 'Int' },
        { name: 'name', type: 'String' }
      ])
      
      const schema = createMockSchema(productModel)
      const pluginConfig: SearchPluginConfig = {
        models: {
          Product: {
            enabled: true,
            fields: [
              { name: 'name', weight: 100, matchTypes: ['contains'] }
            ]
          }
        }
      }
      
      const context = createMockContext(schema, pluginConfig)
      const output = plugin.generate(context)
      
      expect(output.files.has('search/search.types.ts')).toBe(true)
      
      const typesFile = output.files.get('search/search.types.ts')!
      expect(typesFile).toContain('SearchResult')
      expect(typesFile).toContain('SearchOptions')
    })
    
    it('should include ranking config when specified', () => {
      const plugin = new FullTextSearchPlugin()
      const productModel = createMockModel('Product', [
        { name: 'id', type: 'Int' },
        { name: 'name', type: 'String' },
        { name: 'createdAt', type: 'DateTime' },
        { name: 'viewCount', type: 'Int' }
      ])
      
      const schema = createMockSchema(productModel)
      const pluginConfig: SearchPluginConfig = {
        models: {
          Product: {
            enabled: true,
            fields: [
              { name: 'name', weight: 100, matchTypes: ['contains'] }
            ],
            ranking: {
              boostRecent: { field: 'createdAt', weight: 5 },
              boostPopular: { field: 'viewCount', weight: 3 }
            }
          }
        }
      }
      
      const context = createMockContext(schema, pluginConfig)
      const output = plugin.generate(context)
      
      const configFile = output.files.get('search/search.config.ts')!
      expect(configFile).toContain('boostRecent')
      expect(configFile).toContain('boostPopular')
      expect(configFile).toContain('createdAt')
      expect(configFile).toContain('viewCount')
    })
    
    it('should register routes', () => {
      const plugin = new FullTextSearchPlugin()
      const productModel = createMockModel('Product', [
        { name: 'id', type: 'Int' },
        { name: 'name', type: 'String' }
      ])
      
      const schema = createMockSchema(productModel)
      const pluginConfig: SearchPluginConfig = {
        models: {
          Product: {
            enabled: true,
            fields: [
              { name: 'name', weight: 100, matchTypes: ['contains'] }
            ]
          }
        }
      }
      
      const context = createMockContext(schema, pluginConfig)
      const output = plugin.generate(context)
      
      expect(output.routes.length).toBe(2)
      expect(output.routes[0].path).toBe('/api/search')
      expect(output.routes[0].method).toBe('get')
      expect(output.routes[1].path).toBe('/api/search/all')
    })
    
    it('should include SDK runtime dependency', () => {
      const plugin = new FullTextSearchPlugin()
      const productModel = createMockModel('Product', [
        { name: 'id', type: 'Int' },
        { name: 'name', type: 'String' }
      ])
      
      const schema = createMockSchema(productModel)
      const pluginConfig: SearchPluginConfig = {
        models: {
          Product: {
            enabled: true,
            fields: [
              { name: 'name', weight: 100, matchTypes: ['contains'] }
            ]
          }
        }
      }
      
      const context = createMockContext(schema, pluginConfig)
      const output = plugin.generate(context)
      
      expect(output.packageJson?.dependencies).toHaveProperty('@ssot-codegen/sdk-runtime')
    })
  })
  
  describe('Multiple Models', () => {
    it('should handle multiple models', () => {
      const plugin = new FullTextSearchPlugin()
      const productModel = createMockModel('Product', [
        { name: 'id', type: 'Int' },
        { name: 'name', type: 'String' }
      ])
      const userModel = createMockModel('User', [
        { name: 'id', type: 'Int' },
        { name: 'email', type: 'String' },
        { name: 'name', type: 'String' }
      ])
      
      const schema = createMockSchema(productModel, userModel)
      const pluginConfig: SearchPluginConfig = {
        models: {
          Product: {
            enabled: true,
            fields: [
              { name: 'name', weight: 100, matchTypes: ['contains'] }
            ]
          },
          User: {
            enabled: true,
            fields: [
              { name: 'email', weight: 100, matchTypes: ['startsWith'] },
              { name: 'name', weight: 80, matchTypes: ['contains'] }
            ]
          }
        }
      }
      
      const context = createMockContext(schema, pluginConfig)
      const output = plugin.generate(context)
      
      const configFile = output.files.get('search/search.config.ts')!
      expect(configFile).toContain('productSearchConfig')
      expect(configFile).toContain('userSearchConfig')
      expect(configFile).toContain('product: productSearchConfig')
      expect(configFile).toContain('user: userSearchConfig')
    })
  })
})

