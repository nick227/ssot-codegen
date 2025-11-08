/**
 * Tests for unified controller generator
 * 
 * Verifies that the new template-based approach produces equivalent output
 * to the old Express/Fastify-specific generators
 */

import { describe, it, expect } from 'vitest'
import type { ParsedModel } from '../../dmmf-parser.js'
import { generateUnifiedCRUDMethods } from '../controller-generator-unified.js'
import { DEFAULT_CONTROLLER_CONFIG } from '../controller-helpers.js'

// Helper to create a minimal test model
function createTestModel(name: string, idType: 'Int' | 'String' = 'Int'): ParsedModel {
  return {
    name,
    idField: {
      name: 'id',
      type: idType,
      kind: 'scalar',
      isId: true,
      isRequired: true,
      isList: false,
      isReadOnly: false,
      isUnique: true,
      isUpdatedAt: false
    },
    scalarFields: [
      {
        name: 'id',
        type: idType,
        kind: 'scalar',
        isId: true,
        isRequired: true,
        isList: false,
        isReadOnly: false,
        isUnique: true,
        isUpdatedAt: false
      },
      {
        name: 'name',
        type: 'String',
        kind: 'scalar',
        isId: false,
        isRequired: true,
        isList: false,
        isReadOnly: false,
        isUnique: false,
        isUpdatedAt: false
      }
    ],
    fields: [
      {
        name: 'id',
        type: idType,
        kind: 'scalar',
        isId: true,
        isRequired: true,
        isList: false,
        isReadOnly: false,
        isUnique: true,
        isUpdatedAt: false
      },
      {
        name: 'name',
        type: 'String',
        kind: 'scalar',
        isId: false,
        isRequired: true,
        isList: false,
        isReadOnly: false,
        isUnique: false,
        isUpdatedAt: false
      }
    ],
    relationFields: []
  } as ParsedModel
}

describe('generateUnifiedCRUDMethods', () => {
  describe('Express', () => {
    it('should generate Express CRUD methods', () => {
      const model = createTestModel('User')
      const result = generateUnifiedCRUDMethods(model, 'user', 'express', DEFAULT_CONTROLLER_CONFIG)
      
      // Check that it contains expected method names
      expect(result).toContain('export const listUsers')
      expect(result).toContain('export const searchUsers')
      expect(result).toContain('export const getUser')
      expect(result).toContain('export const createUser')
      expect(result).toContain('export const updateUser')
      expect(result).toContain('export const deleteUser')
      expect(result).toContain('export const countUsers')
      expect(result).toContain('export const existsUser')
      
      // Check Express-specific syntax
      expect(result).toContain('Request')
      expect(result).toContain('Response')
      expect(result).toContain('res.json')
      expect(result).toContain('res.status')
      
      // Should NOT contain Fastify syntax
      expect(result).not.toContain('FastifyRequest')
      expect(result).not.toContain('FastifyReply')
      expect(result).not.toContain('reply.send')
    })
    
    it('should include type interfaces', () => {
      const model = createTestModel('User')
      const result = generateUnifiedCRUDMethods(model, 'user', 'express', DEFAULT_CONTROLLER_CONFIG)
      
      expect(result).toContain('interface UserParams')
      expect(result).toContain('interface PaginationQuery')
    })
    
    it('should include service calls', () => {
      const model = createTestModel('Product')
      const result = generateUnifiedCRUDMethods(model, 'product', 'express', DEFAULT_CONTROLLER_CONFIG)
      
      expect(result).toContain('productService.list')
      expect(result).toContain('productService.findById')
      expect(result).toContain('productService.create')
      expect(result).toContain('productService.update')
      expect(result).toContain('productService.delete')
    })
  })
  
  describe('Fastify', () => {
    it('should generate Fastify CRUD methods', () => {
      const model = createTestModel('User')
      const result = generateUnifiedCRUDMethods(model, 'user', 'fastify', DEFAULT_CONTROLLER_CONFIG)
      
      // Check that it contains expected method names
      expect(result).toContain('export const listUsers')
      expect(result).toContain('export const searchUsers')
      expect(result).toContain('export const getUser')
      expect(result).toContain('export const createUser')
      expect(result).toContain('export const updateUser')
      expect(result).toContain('export const deleteUser')
      expect(result).toContain('export const countUsers')
      expect(result).toContain('export const existsUser')
      
      // Check Fastify-specific syntax
      expect(result).toContain('FastifyRequest')
      expect(result).toContain('FastifyReply')
      expect(result).toContain('reply.send')
      expect(result).toContain('reply.code')
      
      // Should NOT contain Express-specific response handling
      expect(result).not.toContain('res.json')
      expect(result).not.toContain('res.status')
    })
    
    it('should include same type interfaces as Express', () => {
      const model = createTestModel('User')
      const result = generateUnifiedCRUDMethods(model, 'user', 'fastify', DEFAULT_CONTROLLER_CONFIG)
      
      expect(result).toContain('interface UserParams')
      expect(result).toContain('interface PaginationQuery')
    })
    
    it('should include same service calls as Express', () => {
      const model = createTestModel('Product')
      const result = generateUnifiedCRUDMethods(model, 'product', 'fastify', DEFAULT_CONTROLLER_CONFIG)
      
      expect(result).toContain('productService.list')
      expect(result).toContain('productService.findById')
      expect(result).toContain('productService.create')
      expect(result).toContain('productService.update')
      expect(result).toContain('productService.delete')
    })
  })
  
  describe('Framework Consistency', () => {
    it('should have same business logic for both frameworks', () => {
      const model = createTestModel('User')
      
      const expressResult = generateUnifiedCRUDMethods(model, 'user', 'express', DEFAULT_CONTROLLER_CONFIG)
      const fastifyResult = generateUnifiedCRUDMethods(model, 'user', 'fastify', DEFAULT_CONTROLLER_CONFIG)
      
      // Both should have ID validation
      expect(expressResult).toContain('parseIdParam')
      expect(fastifyResult).toContain('parseIdParam')
      
      // Both should have error handling
      expect(expressResult).toContain('handleError')
      expect(fastifyResult).toContain('handleError')
      
      // Both should have same validation schemas
      expect(expressResult).toContain('UserQuerySchema')
      expect(fastifyResult).toContain('UserQuerySchema')
      expect(expressResult).toContain('UserCreateSchema')
      expect(fastifyResult).toContain('UserCreateSchema')
      expect(expressResult).toContain('UserUpdateSchema')
      expect(fastifyResult).toContain('UserUpdateSchema')
    })
  })
})

