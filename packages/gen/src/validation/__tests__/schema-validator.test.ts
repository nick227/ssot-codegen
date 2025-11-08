/**
 * Unit Tests: SchemaValidator
 * 
 * Tests schema structure validation before generation.
 * CRITICAL: Ensures invalid schemas are caught before wasting time on analysis.
 */

import { describe, it, expect } from 'vitest'
import { SchemaValidator } from '../schema-validator.js'
import { ErrorSeverity } from '../../pipeline/generation-types.js'
import type { ParsedSchema, ParsedModel, ParsedField } from '../../dmmf-parser.js'

// Helper to create valid model
function createValidModel(name: string = 'User'): ParsedModel {
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
        isId: true,
        isUnique: true,
        isUpdatedAt: false,
        isRelation: false,
        hasDefaultValue: false
      } as ParsedField
    ],
    uniqueFields: [],
    uniqueIndexes: [],
    primaryKey: null,
    documentation: undefined
  }
}

// Helper to create valid schema
function createValidSchema(models: ParsedModel[] = []): ParsedSchema {
  return {
    models: models.length > 0 ? models : [createValidModel()],
    enums: []
  }
}

describe('SchemaValidator', () => {
  describe('Valid schemas', () => {
    it('should pass valid schema', () => {
      const schema = createValidSchema()
      const errors = SchemaValidator.validate(schema)
      
      expect(errors).toHaveLength(0)
    })
    
    it('should pass schema with multiple models', () => {
      const schema = createValidSchema([
        createValidModel('User'),
        createValidModel('Post'),
        createValidModel('Comment')
      ])
      
      const errors = SchemaValidator.validate(schema)
      
      expect(errors).toHaveLength(0)
    })
    
    it('should pass schema with complex fields', () => {
      const model: ParsedModel = {
        ...createValidModel(),
        fields: [
          {
            name: 'id',
            type: 'String',
            kind: 'scalar',
            isRequired: true,
            isList: false,
            isId: true,
            isUnique: true,
            isUpdatedAt: false,
            isRelation: false,
            hasDefaultValue: false
          } as ParsedField,
          {
            name: 'posts',
            type: 'Post',
            kind: 'object',
            isRequired: false,
            isList: true,
            isId: false,
            isUnique: false,
            isUpdatedAt: false,
            isRelation: true,
            hasDefaultValue: false,
            relationName: 'UserPosts'
          } as ParsedField
        ]
      }
      
      const schema = createValidSchema([model])
      const errors = SchemaValidator.validate(schema)
      
      expect(errors).toHaveLength(0)
    })
  })
  
  describe('Model structure validation', () => {
    it('should reject model without name', () => {
      const model = {
        ...createValidModel(),
        name: undefined as any
      }
      
      const schema = createValidSchema([model])
      const errors = SchemaValidator.validate(schema)
      
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].severity).toBe(ErrorSeverity.ERROR)
      expect(errors[0].message).toContain('name')
      expect(errors[0].phase).toBe('schema-validation')
    })
    
    it('should reject model with invalid name type', () => {
      const model = {
        ...createValidModel(),
        name: 123 as any
      }
      
      const schema = createValidSchema([model])
      const errors = SchemaValidator.validate(schema)
      
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('name')
    })
    
    it('should reject model without nameLower', () => {
      const model = {
        ...createValidModel(),
        nameLower: undefined as any
      }
      
      const schema = createValidSchema([model])
      const errors = SchemaValidator.validate(schema)
      
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('nameLower')
    })
    
    it('should reject model without fields array', () => {
      const model = {
        ...createValidModel(),
        fields: undefined as any
      }
      
      const schema = createValidSchema([model])
      const errors = SchemaValidator.validate(schema)
      
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('fields')
    })
    
    it('should reject model with invalid fields type', () => {
      const model = {
        ...createValidModel(),
        fields: 'not an array' as any
      }
      
      const schema = createValidSchema([model])
      const errors = SchemaValidator.validate(schema)
      
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('fields')
    })
  })
  
  describe('Field structure validation', () => {
    it('should reject field without name', () => {
      const model: ParsedModel = {
        ...createValidModel(),
        fields: [
          {
            name: undefined as any,
            type: 'String',
            kind: 'scalar'
          } as ParsedField
        ]
      }
      
      const schema = createValidSchema([model])
      const errors = SchemaValidator.validate(schema)
      
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('name')
      expect(errors[0].model).toBe('User')
    })
    
    it('should reject field without type', () => {
      const model: ParsedModel = {
        ...createValidModel(),
        fields: [
          {
            name: 'email',
            type: undefined as any,
            kind: 'scalar'
          } as ParsedField
        ]
      }
      
      const schema = createValidSchema([model])
      const errors = SchemaValidator.validate(schema)
      
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('type')
    })
    
    it('should reject field with invalid name type', () => {
      const model: ParsedModel = {
        ...createValidModel(),
        fields: [
          {
            name: 123 as any,
            type: 'String',
            kind: 'scalar'
          } as ParsedField
        ]
      }
      
      const schema = createValidSchema([model])
      const errors = SchemaValidator.validate(schema)
      
      expect(errors.length).toBeGreaterThan(0)
    })
  })
  
  describe('Service annotation validation', () => {
    it('should reject annotation without name', () => {
      const annotations = new Map([
        ['Model', {
          name: undefined as any,
          methods: []
        }]
      ])
      
      const errors: any[] = []
      SchemaValidator.validateServiceAnnotations(annotations, errors)
      
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('name')
      expect(errors[0].model).toBe('Model')
    })
    
    it('should reject annotation without methods array', () => {
      const annotations = new Map([
        ['Model', {
          name: 'service',
          methods: undefined as any
        }]
      ])
      
      const errors: any[] = []
      SchemaValidator.validateServiceAnnotations(annotations, errors)
      
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('methods')
    })
    
    it('should reject annotation with invalid method structure', () => {
      const annotations = new Map([
        ['Model', {
          name: 'service',
          methods: [
            { name: 'test', httpMethod: 'POST' }  // Missing 'path'
          ]
        }]
      ])
      
      const errors: any[] = []
      SchemaValidator.validateServiceAnnotations(annotations, errors)
      
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('method')
    })
    
    it('should pass valid annotation', () => {
      const annotations = new Map([
        ['Model', {
          name: 'image-optimizer',
          methods: [
            { name: 'optimize', httpMethod: 'POST', path: '/optimize' },
            { name: 'analyze', httpMethod: 'GET', path: '/analyze' }
          ]
        }]
      ])
      
      const errors: any[] = []
      SchemaValidator.validateServiceAnnotations(annotations, errors)
      
      expect(errors).toHaveLength(0)
    })
  })
  
  describe('Multiple errors', () => {
    it('should collect all errors from all models', () => {
      const model1 = {
        ...createValidModel('Model1'),
        name: undefined as any
      }
      
      const model2 = {
        ...createValidModel('Model2'),
        nameLower: undefined as any
      }
      
      const model3 = {
        ...createValidModel('Model3'),
        fields: undefined as any
      }
      
      const schema = createValidSchema([model1, model2, model3])
      const errors = SchemaValidator.validate(schema)
      
      expect(errors.length).toBeGreaterThanOrEqual(3)
    })
  })
  
  describe('Empty schema', () => {
    it('should pass empty schema', () => {
      const schema: ParsedSchema = {
        models: [],
        enums: []
      }
      
      const errors = SchemaValidator.validate(schema)
      
      expect(errors).toHaveLength(0)
    })
  })
  
  describe('Edge cases', () => {
    it('should handle model with empty fields array', () => {
      const model: ParsedModel = {
        ...createValidModel(),
        fields: []
      }
      
      const schema = createValidSchema([model])
      const errors = SchemaValidator.validate(schema)
      
      expect(errors).toHaveLength(0)
    })
    
    it('should handle model with special characters in name', () => {
      const model = createValidModel('User_Profile_V2')
      const schema = createValidSchema([model])
      const errors = SchemaValidator.validate(schema)
      
      expect(errors).toHaveLength(0)
    })
  })
})

