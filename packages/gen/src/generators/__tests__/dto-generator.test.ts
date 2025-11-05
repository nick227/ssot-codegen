/**
 * DTO Generator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DTOGenerator } from '../dto-generator-v2.js'
import { TODO_MODEL, USER_MODEL, COMPREHENSIVE_MODEL, createMockModel, assertGeneratorOutput } from './fixtures.js'

describe('DTOGenerator', () => {
  let generator: DTOGenerator
  
  beforeEach(() => {
    generator = new DTOGenerator({ model: TODO_MODEL })
  })
  
  describe('constructor', () => {
    it('should initialize with model', () => {
      expect(generator).toBeInstanceOf(DTOGenerator)
    })
    
    it('should set framework to express by default', () => {
      expect((generator as any).framework).toBe('express')
    })
  })
  
  describe('validate', () => {
    it('should return empty array for valid model', () => {
      const errors = generator.validate()
      expect(errors).toEqual([])
    })
    
    it('should detect missing ID field', () => {
      const badModel = createMockModel({ idField: undefined })
      const badGenerator = new DTOGenerator({ model: badModel })
      const errors = badGenerator.validate()
      expect(errors).toContain('Model TestModel has no @id field')
    })
  })
  
  describe('generateCreate', () => {
    it('should generate CreateDTO with required fields', () => {
      const result = generator.generateCreate()
      
      expect(result).toContain('export interface TodoCreateDTO')
      expect(result).toContain('title: string')
      expect(result).toContain('// @generated')
    })
    
    it('should mark optional fields with ?', () => {
      const result = generator.generateCreate()
      expect(result).toContain('completed?: boolean')
      expect(result).toContain('description?: string | null')
    })
    
    it('should exclude id, readonly, and updatedAt fields', () => {
      const result = generator.generateCreate()
      expect(result).not.toContain('id:')
      expect(result).not.toContain('updatedAt:')
    })
  })
  
  describe('generateUpdate', () => {
    it('should generate UpdateDTO with all fields optional', () => {
      const result = generator.generateUpdate()
      
      expect(result).toContain('export interface TodoUpdateDTO')
      expect(result).toContain('title?: string')
      expect(result).toContain('completed?: boolean')
    })
  })
  
  describe('generateRead', () => {
    it('should generate ReadDTO with all scalar fields', () => {
      const result = generator.generateRead()
      
      expect(result).toContain('export interface TodoReadDTO')
      expect(result).toContain('id: number')
      expect(result).toContain('title: string')
      expect(result).toContain('completed: boolean')
      expect(result).toContain('createdAt: Date')
      expect(result).toContain('updatedAt: Date')
    })
  })
  
  describe('generateQuery', () => {
    it('should generate QueryDTO with pagination fields', () => {
      const result = generator.generateQuery()
      
      expect(result).toContain('export interface TodoQueryDTO')
      expect(result).toContain('skip?: number')
      expect(result).toContain('take?: number')
    })
    
    it('should include where clause for filterable fields', () => {
      const result = generator.generateQuery()
      expect(result).toContain('where?:')
      expect(result).toContain('title?:')
    })
    
    it('should generate ListResponse interface', () => {
      const result = generator.generateQuery()
      expect(result).toContain('export interface TodoListResponse')
      expect(result).toContain('data: TodoReadDTO[]')
      expect(result).toContain('meta:')
    })
  })
  
  describe('getImports', () => {
    it('should return empty array when no enums', () => {
      const imports = generator.getImports()
      expect(imports).toEqual([])
    })
    
    it('should include enum imports when model has enums', () => {
      const genWithEnum = new DTOGenerator({ model: COMPREHENSIVE_MODEL })
      const imports = genWithEnum.getImports()
      expect(imports).toContain(`import type { Status } from '@prisma/client'`)
    })
  })
  
  describe('getExports', () => {
    it('should return all DTO export names', () => {
      const exports = generator.getExports()
      
      expect(exports).toContain('TodoCreateDTO')
      expect(exports).toContain('TodoUpdateDTO')
      expect(exports).toContain('TodoReadDTO')
      expect(exports).toContain('TodoQueryDTO')
      expect(exports).toContain('TodoListResponse')
    })
  })
  
  describe('generateBarrel', () => {
    it('should generate barrel with all DTO exports', () => {
      const barrel = generator.generateBarrel()
      
      expect(barrel).toContain('// @generated barrel')
      expect(barrel).toContain(`export * from './todo.create.dto.js'`)
      expect(barrel).toContain(`export * from './todo.update.dto.js'`)
      expect(barrel).toContain(`export * from './todo.read.dto.js'`)
      expect(barrel).toContain(`export * from './todo.query.dto.js'`)
    })
  })
  
  describe('generate', () => {
    it('should generate all DTO files', () => {
      const output = generator.generate()
      
      assertGeneratorOutput(output)
      expect(output.files.size).toBe(4)
      expect(output.files.has('todo.create.dto.ts')).toBe(true)
      expect(output.files.has('todo.update.dto.ts')).toBe(true)
      expect(output.files.has('todo.read.dto.ts')).toBe(true)
      expect(output.files.has('todo.query.dto.ts')).toBe(true)
    })
    
    it('should include metadata', () => {
      const output = generator.generate()
      expect(output.metadata?.fileCount).toBe(4)
      expect(output.metadata?.lineCount).toBeGreaterThan(0)
    })
  })
  
  describe('edge cases', () => {
    it('should handle model with no optional fields', () => {
      const model = createMockModel({
        name: 'Required',
        fields: [
          { name: 'id', type: 'Int', isId: true, isRequired: true, kind: 'scalar' } as any,
          { name: 'name', type: 'String', isRequired: true, kind: 'scalar' } as any
        ]
      })
      
      const gen = new DTOGenerator({ model })
      const result = gen.generateCreate()
      
      expect(result).toContain('name: string')
      expect(result).not.toContain('name?:')
    })
    
    it('should handle model with all optional fields', () => {
      const model = createMockModel({
        name: 'Optional',
        fields: [
          { name: 'id', type: 'Int', isId: true, isRequired: true, kind: 'scalar' } as any,
          { name: 'optField1', type: 'String', isRequired: false, kind: 'scalar' } as any,
          { name: 'optField2', type: 'Int', isRequired: false, kind: 'scalar' } as any
        ]
      })
      
      const gen = new DTOGenerator({ model })
      const result = gen.generateCreate()
      
      expect(result).toContain('optField1?: string | null')
      expect(result).toContain('optField2?: number | null')
    })
  })
})


