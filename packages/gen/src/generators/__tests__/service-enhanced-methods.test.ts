/**
 * Enhanced Service Methods - Tests
 * Tests for auto-detected enhanced methods (search, findBySlug, getFeatured, etc.)
 */

import { describe, it, expect } from 'vitest'
import { generateEnhancedServiceMethods } from '../service-method-generator.js'
import { createMockModel } from './fixtures.js'
import { assertIncludes, assertExcludes } from '../../__tests__/index.js'

describe('Enhanced Service Methods Generator', () => {
  describe('Search Method Generation', () => {
    it('should generate search method for models with String fields', () => {
      const model = createMockModel({
        name: 'Product',
        fields: [
          { name: 'id', type: 'Int', kind: 'scalar', isRequired: true, isId: true },
          { name: 'name', type: 'String', kind: 'scalar', isRequired: true },
          { name: 'description', type: 'String', kind: 'scalar', isRequired: true }
        ]
      })
      
      const methods = generateEnhancedServiceMethods(model)
      
      assertIncludes(methods, [
        'async search(',
        'q: string',
        'name: { contains: params.q',
        'description: { contains: params.q'
      ])
    })
    
    it('should not generate search for models without String fields', () => {
      const model = createMockModel({
        name: 'Counter',
        fields: [
          { name: 'id', type: 'Int', kind: 'scalar', isRequired: true, isId: true },
          { name: 'value', type: 'Int', kind: 'scalar', isRequired: true }
        ]
      })
      
      const methods = generateEnhancedServiceMethods(model)
      
      assertExcludes(methods, ['async search('])
    })
    
    it('should exclude sensitive fields from search', () => {
      const model = createMockModel({
        name: 'User',
        fields: [
          { name: 'id', type: 'Int', kind: 'scalar', isRequired: true, isId: true },
          { name: 'email', type: 'String', kind: 'scalar', isRequired: true },
          { name: 'passwordHash', type: 'String', kind: 'scalar', isRequired: true }
        ]
      })
      
      const methods = generateEnhancedServiceMethods(model)
      
      assertIncludes(methods, ['email: { contains'])
      assertExcludes(methods, ['passwordHash: { contains'])
    })
  })
  
  describe('FindBySlug Method Generation', () => {
    it('should generate findBySlug for models with slug field', () => {
      const model = createMockModel({
        name: 'Post',
        fields: [
          { name: 'id', type: 'Int', kind: 'scalar', isRequired: true, isId: true },
          { name: 'slug', type: 'String', kind: 'scalar', isRequired: true, isUnique: true }
        ]
      })
      
      const methods = generateEnhancedServiceMethods(model)
      
      assertIncludes(methods, [
        'async findBySlug(',
        'slug: string',
        'prisma.post.findUnique',
        'where: { slug }'
      ])
    })
    
    it('should not generate findBySlug without slug field', () => {
      const model = createMockModel({
        name: 'Todo',
        fields: [
          { name: 'id', type: 'Int', kind: 'scalar', isRequired: true, isId: true },
          { name: 'title', type: 'String', kind: 'scalar', isRequired: true }
        ]
      })
      
      const methods = generateEnhancedServiceMethods(model)
      
      assertExcludes(methods, ['async findBySlug('])
    })
    
    it('should skip findBySlug if already exists', () => {
      const model = createMockModel({
        name: 'Post',
        fields: [
          { name: 'id', type: 'Int', kind: 'scalar', isRequired: true, isId: true },
          { name: 'slug', type: 'String', kind: 'scalar', isRequired: true, isUnique: true }
        ]
      })
      
      const existingMethods = new Set(['findBySlug'])
      const methods = generateEnhancedServiceMethods(model, existingMethods)
      
      assertExcludes(methods, ['async findBySlug('])
    })
  })
  
  describe('GetFeatured Method Generation', () => {
    it('should generate getFeatured for models with isFeatured field', () => {
      const model = createMockModel({
        name: 'Product',
        fields: [
          { name: 'id', type: 'Int', kind: 'scalar', isRequired: true, isId: true },
          { name: 'isFeatured', type: 'Boolean', kind: 'scalar', isRequired: true }
        ]
      })
      
      const methods = generateEnhancedServiceMethods(model)
      
      assertIncludes(methods, [
        'async getFeatured(',
        'isFeatured: true',
        'limit = 10'
      ])
    })
    
    it('should include isActive filter when both fields exist', () => {
      const model = createMockModel({
        name: 'Product',
        fields: [
          { name: 'id', type: 'Int', kind: 'scalar', isRequired: true, isId: true },
          { name: 'isFeatured', type: 'Boolean', kind: 'scalar', isRequired: true },
          { name: 'isActive', type: 'Boolean', kind: 'scalar', isRequired: true }
        ]
      })
      
      const methods = generateEnhancedServiceMethods(model)
      
      assertIncludes(methods, [
        'isActive: true',
        'isFeatured: true'
      ])
    })
  })
  
  describe('GetByRelation Method Generation', () => {
    it('should generate getBy{Relation} for foreign keys', () => {
      const model = createMockModel({
        name: 'Post',
        fields: [
          { name: 'id', type: 'Int', kind: 'scalar', isRequired: true, isId: true },
          { name: 'authorId', type: 'Int', kind: 'scalar', isRequired: true },
          { 
            name: 'author', 
            type: 'User', 
            kind: 'object', 
            isRequired: false,
            relationFromFields: ['authorId']
          }
        ]
      })
      
      const methods = generateEnhancedServiceMethods(model)
      
      assertIncludes(methods, [
        'async getByAuthor(',
        'authorId: number',
        'where: { authorId'
      ])
    })
  })
  
  describe('Filter Generation', () => {
    it('should generate range filters for numeric fields in search method', () => {
      const model = createMockModel({
        name: 'Product',
        fields: [
          { name: 'id', type: 'Int', kind: 'scalar', isRequired: true, isId: true },
          { name: 'name', type: 'String', kind: 'scalar', isRequired: true },
          { name: 'price', type: 'Decimal', kind: 'scalar', isRequired: true },
          { name: 'stock', type: 'Int', kind: 'scalar', isRequired: true }
        ]
      })
      
      const methods = generateEnhancedServiceMethods(model)
      
      assertIncludes(methods, [
        'async search(',
        'minPrice?: number',
        'maxPrice?: number',
        'minStock?: number',
        'maxStock?: number'
      ])
    })
    
    it('should generate boolean filters in search method when String fields exist', () => {
      const model = createMockModel({
        name: 'Product',
        fields: [
          { name: 'id', type: 'Int', kind: 'scalar', isRequired: true, isId: true },
          { name: 'name', type: 'String', kind: 'scalar', isRequired: true },
          { name: 'isActive', type: 'Boolean', kind: 'scalar', isRequired: true },
          { name: 'isFeatured', type: 'Boolean', kind: 'scalar', isRequired: true }
        ]
      })
      
      const methods = generateEnhancedServiceMethods(model)
      
      assertIncludes(methods, [
        'async search(',
        'isActive?: boolean',
        'isFeatured?: boolean'
      ])
    })
  })
  
  describe('Duplicate Prevention', () => {
    it('should skip methods that already exist', () => {
      const model = createMockModel({
        name: 'Post',
        fields: [
          { name: 'id', type: 'Int', kind: 'scalar', isRequired: true, isId: true },
          { name: 'slug', type: 'String', kind: 'scalar', isRequired: true, isUnique: true },
          { name: 'title', type: 'String', kind: 'scalar', isRequired: true },
          { name: 'isFeatured', type: 'Boolean', kind: 'scalar', isRequired: true }
        ]
      })
      
      const existingMethods = new Set(['findBySlug', 'getFeatured', 'search'])
      const methods = generateEnhancedServiceMethods(model, existingMethods)
      
      assertExcludes(methods, [
        'async findBySlug(',
        'async getFeatured(',
        'async search('
      ])
    })
  })
})

