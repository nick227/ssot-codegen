/**
 * Schema validation tests
 */

import { describe, it, expect } from 'vitest'
import { parseDMMF } from '../parsing/core.js'
import { validateSchema, validateSchemaDetailed } from '../validation/schema-validator.js'
import { simpleUserDMMF, relatedModelsDMMF, selfReferencingDMMF } from './fixtures.js'
import type { DMMF } from '@prisma/generator-helper'

describe('Schema Validation', () => {
  describe('validateSchema', () => {
    it('should return empty array for valid schema', () => {
      const schema = parseDMMF(simpleUserDMMF)
      const errors = validateSchema(schema)
      
      expect(errors).toHaveLength(0)
    })

    it('should detect missing ID field', () => {
      const invalidDMMF: typeof simpleUserDMMF = {
        ...simpleUserDMMF,
        datamodel: {
          ...simpleUserDMMF.datamodel,
          models: [
            {
              name: 'NoIdModel',
              dbName: null,
              fields: [
                {
                  name: 'name',
                  kind: 'scalar',
                  isList: false,
                  isRequired: true,
                  isUnique: false,
                  isId: false,
                  isReadOnly: false,
                  hasDefaultValue: false,
                  type: 'String',
                  isGenerated: false,
                  isUpdatedAt: false
                }
              ],
              primaryKey: null,
              uniqueFields: [],
              uniqueIndexes: []
            }
          ]
        }
      }
      
      const schema = parseDMMF(invalidDMMF)
      const errors = validateSchema(schema)
      
      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(e => e.includes('no @id field'))).toBe(true)
    })

    it('should detect unknown enum reference', () => {
      const invalidDMMF: typeof simpleUserDMMF = {
        ...simpleUserDMMF,
        datamodel: {
          ...simpleUserDMMF.datamodel,
          enums: [], // Remove enum
          models: simpleUserDMMF.datamodel.models // Keep model with enum field
        }
      }
      
      const schema = parseDMMF(invalidDMMF)
      const errors = validateSchema(schema)
      
      expect(errors.some(e => e.includes('unknown enum'))).toBe(true)
    })
  })

  describe('validateSchemaDetailed', () => {
    it('should return structured validation results', () => {
      const schema = parseDMMF(simpleUserDMMF)
      const result = validateSchemaDetailed(schema)
      
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
      expect(result).toHaveProperty('infos')
      expect(result).toHaveProperty('all')
      expect(result).toHaveProperty('isValid')
    })

    it('should mark valid schema as valid', () => {
      const schema = parseDMMF(simpleUserDMMF)
      const result = validateSchemaDetailed(schema)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect self-referencing relations', () => {
      const schema = parseDMMF(selfReferencingDMMF)
      const result = validateSchemaDetailed(schema)
      
      expect(result.infos.some(i => i.includes('self-referencing'))).toBe(true)
    })

    it('should throw when throwOnError is true', () => {
      const invalidDMMF: typeof simpleUserDMMF = {
        ...simpleUserDMMF,
        datamodel: {
          ...simpleUserDMMF.datamodel,
          models: [
            {
              name: 'Invalid',
              dbName: null,
              fields: [],
              primaryKey: null,
              uniqueFields: [],
              uniqueIndexes: []
            }
          ]
        }
      }
      
      const schema = parseDMMF(invalidDMMF)
      expect(() => validateSchemaDetailed(schema, true)).toThrow('Schema validation failed')
    })
  })

  describe('Relation Validation', () => {
    it('should validate relationFromFields exist', () => {
      const invalidDMMF: DMMF.Document = {
        ...relatedModelsDMMF,
        datamodel: {
          ...relatedModelsDMMF.datamodel,
          models: relatedModelsDMMF.datamodel.models.map(m => {
            if (m.name === 'Post') {
              return {
                ...m,
                fields: m.fields.map(f => {
                  if (f.name === 'author' && f.kind === 'object') {
                    return {
                      ...f,
                      relationFromFields: ['nonExistentField']
                    }
                  }
                  return f
                })
              }
            }
            return m
          })
        }
      }
      
      const schema = parseDMMF(invalidDMMF)
      const errors = validateSchema(schema)
      
      expect(errors.some(e => e.includes('non-existent field'))).toBe(true)
    })

    it('should validate mismatched relationFromFields and relationToFields', () => {
      const invalidDMMF: DMMF.Document = {
        ...relatedModelsDMMF,
        datamodel: {
          ...relatedModelsDMMF.datamodel,
          models: relatedModelsDMMF.datamodel.models.map(m => {
            if (m.name === 'Post') {
              return {
                ...m,
                fields: m.fields.map(f => {
                  if (f.name === 'author' && f.kind === 'object') {
                    return {
                      ...f,
                      relationFromFields: ['authorId', 'extra'],
                      relationToFields: ['id'] // Mismatch: 2 from, 1 to
                    }
                  }
                  return f
                })
              }
            }
            return m
          })
        }
      }
      
      const schema = parseDMMF(invalidDMMF)
      const errors = validateSchema(schema)
      
      expect(errors.some(e => e.includes('mismatched field counts'))).toBe(true)
    })
  })

  describe('Circular Dependency Detection', () => {
    it('should detect circular required relations', () => {
      // Create circular required relations (A requires B, B requires A)
      const circularDMMF: DMMF.Document = {
        datamodel: {
          enums: [],
          models: [
            {
              name: 'ModelA',
              dbName: null,
              fields: [
                {
                  name: 'id',
                  kind: 'scalar',
                  isList: false,
                  isRequired: true,
                  isUnique: false,
                  isId: true,
                  isReadOnly: false,
                  hasDefaultValue: true,
                  type: 'Int',
                  default: { name: 'autoincrement', args: [] },
                  isGenerated: false,
                  isUpdatedAt: false
                },
                {
                  name: 'bId',
                  kind: 'scalar',
                  isList: false,
                  isRequired: true,
                  isUnique: false,
                  isId: false,
                  isReadOnly: false,
                  hasDefaultValue: false,
                  type: 'Int',
                  isGenerated: false,
                  isUpdatedAt: false
                },
                {
                  name: 'b',
                  kind: 'object',
                  isList: false,
                  isRequired: true, // Required!
                  isUnique: false,
                  isId: false,
                  isReadOnly: false,
                  hasDefaultValue: false,
                  type: 'ModelB',
                  relationName: 'AToB',
                  relationFromFields: ['bId'],
                  relationToFields: ['id'],
                  isGenerated: false,
                  isUpdatedAt: false
                }
              ],
              primaryKey: null,
              uniqueFields: [],
              uniqueIndexes: []
            },
            {
              name: 'ModelB',
              dbName: null,
              fields: [
                {
                  name: 'id',
                  kind: 'scalar',
                  isList: false,
                  isRequired: true,
                  isUnique: false,
                  isId: true,
                  isReadOnly: false,
                  hasDefaultValue: true,
                  type: 'Int',
                  default: { name: 'autoincrement', args: [] },
                  isGenerated: false,
                  isUpdatedAt: false
                },
                {
                  name: 'aId',
                  kind: 'scalar',
                  isList: false,
                  isRequired: true,
                  isUnique: false,
                  isId: false,
                  isReadOnly: false,
                  hasDefaultValue: false,
                  type: 'Int',
                  isGenerated: false,
                  isUpdatedAt: false
                },
                {
                  name: 'a',
                  kind: 'object',
                  isList: false,
                  isRequired: true, // Required!
                  isUnique: false,
                  isId: false,
                  isReadOnly: false,
                  hasDefaultValue: false,
                  type: 'ModelA',
                  relationName: 'BToA',
                  relationFromFields: ['aId'],
                  relationToFields: ['id'],
                  isGenerated: false,
                  isUpdatedAt: false
                }
              ],
              primaryKey: null,
              uniqueFields: [],
              uniqueIndexes: []
            }
          ]
        },
        schema: { inputObjectTypes: { prisma: [] }, outputObjectTypes: { prisma: [], model: [] }, enumTypes: { prisma: [], model: [] }, fieldRefTypes: { prisma: [] } },
        mappings: { modelOperations: [], otherOperations: { read: [], write: [] } }
      }
      
      const schema = parseDMMF(circularDMMF)
      const errors = validateSchema(schema)
      
      expect(errors.some(e => e.includes('Circular relationship'))).toBe(true)
    })

    it('should not flag circular optional relations', () => {
      // Create circular optional relations (valid pattern)
      const validCircularDMMF: DMMF.Document = {
        datamodel: {
          enums: [],
          models: [
            {
              name: 'ModelA',
              dbName: null,
              fields: [
                {
                  name: 'id',
                  kind: 'scalar',
                  isList: false,
                  isRequired: true,
                  isUnique: false,
                  isId: true,
                  isReadOnly: false,
                  hasDefaultValue: true,
                  type: 'Int',
                  default: { name: 'autoincrement', args: [] },
                  isGenerated: false,
                  isUpdatedAt: false
                },
                {
                  name: 'bId',
                  kind: 'scalar',
                  isList: false,
                  isRequired: false, // Optional!
                  isUnique: false,
                  isId: false,
                  isReadOnly: false,
                  hasDefaultValue: false,
                  type: 'Int',
                  isGenerated: false,
                  isUpdatedAt: false
                },
                {
                  name: 'b',
                  kind: 'object',
                  isList: false,
                  isRequired: false, // Optional!
                  isUnique: false,
                  isId: false,
                  isReadOnly: false,
                  hasDefaultValue: false,
                  type: 'ModelB',
                  relationName: 'AToB',
                  relationFromFields: ['bId'],
                  relationToFields: ['id'],
                  isGenerated: false,
                  isUpdatedAt: false
                }
              ],
              primaryKey: null,
              uniqueFields: [],
              uniqueIndexes: []
            },
            {
              name: 'ModelB',
              dbName: null,
              fields: [
                {
                  name: 'id',
                  kind: 'scalar',
                  isList: false,
                  isRequired: true,
                  isUnique: false,
                  isId: true,
                  isReadOnly: false,
                  hasDefaultValue: true,
                  type: 'Int',
                  default: { name: 'autoincrement', args: [] },
                  isGenerated: false,
                  isUpdatedAt: false
                },
                {
                  name: 'aId',
                  kind: 'scalar',
                  isList: false,
                  isRequired: true,
                  isUnique: false,
                  isId: false,
                  isReadOnly: false,
                  hasDefaultValue: false,
                  type: 'Int',
                  isGenerated: false,
                  isUpdatedAt: false
                },
                {
                  name: 'a',
                  kind: 'object',
                  isList: false,
                  isRequired: true,
                  isUnique: false,
                  isId: false,
                  isReadOnly: false,
                  hasDefaultValue: false,
                  type: 'ModelA',
                  relationName: 'BToA',
                  relationFromFields: ['aId'],
                  relationToFields: ['id'],
                  isGenerated: false,
                  isUpdatedAt: false
                }
              ],
              primaryKey: null,
              uniqueFields: [],
              uniqueIndexes: []
            }
          ]
        },
        schema: { inputObjectTypes: { prisma: [] }, outputObjectTypes: { prisma: [], model: [] }, enumTypes: { prisma: [], model: [] }, fieldRefTypes: { prisma: [] } },
        mappings: { modelOperations: [], otherOperations: { read: [], write: [] } }
      }
      
      const schema = parseDMMF(validCircularDMMF)
      const errors = validateSchema(schema)
      
      expect(errors.some(e => e.includes('Circular relationship'))).toBe(false)
    })
  })
})

