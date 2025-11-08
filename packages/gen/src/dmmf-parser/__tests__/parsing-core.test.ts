/**
 * Core parsing tests
 * Tests the main parseDMMF orchestrator
 */

import { describe, it, expect } from 'vitest'
import { parseDMMF } from '../parsing/core.js'
import { simpleUserDMMF, relatedModelsDMMF, selfReferencingDMMF, compositePkDMMF, emptyDMMF, malformedDMMF } from './fixtures.js'

describe('parseDMMF - Core Orchestrator', () => {
  describe('Basic Parsing', () => {
    it('should parse simple user model', () => {
      const result = parseDMMF(simpleUserDMMF)
      
      expect(result.models).toHaveLength(1)
      expect(result.enums).toHaveLength(1)
      expect(result.modelMap.size).toBe(1)
      expect(result.enumMap.size).toBe(1)
    })

    it('should parse empty DMMF', () => {
      const result = parseDMMF(emptyDMMF)
      
      expect(result.models).toHaveLength(0)
      expect(result.enums).toHaveLength(0)
      expect(result.modelMap.size).toBe(0)
      expect(result.enumMap.size).toBe(0)
    })

    it('should throw on malformed DMMF', () => {
      expect(() => parseDMMF(malformedDMMF)).toThrow('Invalid DMMF document')
    })

    it('should throw on null DMMF', () => {
      expect(() => parseDMMF(null as any)).toThrow('Invalid DMMF document: expected object')
    })
  })

  describe('Model Parsing', () => {
    it('should extract model name and lowercase variant', () => {
      const result = parseDMMF(simpleUserDMMF)
      const user = result.models[0]
      
      expect(user.name).toBe('User')
      expect(user.nameLower).toBe('user')
    })

    it('should identify ID field', () => {
      const result = parseDMMF(simpleUserDMMF)
      const user = result.models[0]
      
      expect(user.idField).toBeDefined()
      expect(user.idField?.name).toBe('id')
      expect(user.idField?.isId).toBe(true)
    })

    it('should categorize scalar fields', () => {
      const result = parseDMMF(simpleUserDMMF)
      const user = result.models[0]
      
      expect(user.scalarFields.length).toBeGreaterThan(0)
      expect(user.scalarFields.every(f => f.kind === 'scalar' || f.kind === 'enum')).toBe(true)
    })

    it('should categorize relation fields', () => {
      const result = parseDMMF(relatedModelsDMMF)
      const post = result.models.find(m => m.name === 'Post')
      
      expect(post?.relationFields).toBeDefined()
      expect(post?.relationFields.length).toBeGreaterThan(0)
      expect(post?.relationFields.every(f => f.kind === 'object')).toBe(true)
    })
  })

  describe('Field Properties', () => {
    it('should detect optional fields', () => {
      const result = parseDMMF(simpleUserDMMF)
      const user = result.models[0]
      
      const nameField = user.fields.find(f => f.name === 'name')
      expect(nameField?.isOptional).toBe(true)
      expect(nameField?.isNullable).toBe(true)
    })

    it('should detect required fields', () => {
      const result = parseDMMF(simpleUserDMMF)
      const user = result.models[0]
      
      const emailField = user.fields.find(f => f.name === 'email')
      expect(emailField?.isRequired).toBe(true)
      expect(emailField?.isNullable).toBe(false)
    })

    it('should detect fields with defaults', () => {
      const result = parseDMMF(simpleUserDMMF)
      const user = result.models[0]
      
      const idField = user.fields.find(f => f.name === 'id')
      expect(idField?.hasDefaultValue).toBe(true)
      expect(idField?.hasDbDefault).toBe(true)
    })

    it('should detect @updatedAt fields', () => {
      const result = parseDMMF(simpleUserDMMF)
      const user = result.models[0]
      
      const updatedAtField = user.fields.find(f => f.name === 'updatedAt')
      expect(updatedAtField?.isUpdatedAt).toBe(true)
      expect(updatedAtField?.isReadOnly).toBe(true)
    })
  })

  describe('DTO Field Categorization', () => {
    it('should identify createFields (excluding ID, readonly, updatedAt)', () => {
      const result = parseDMMF(simpleUserDMMF)
      const user = result.models[0]
      
      expect(user.createFields).toBeDefined()
      expect(user.createFields.some(f => f.name === 'id')).toBe(false) // Exclude ID
      expect(user.createFields.some(f => f.name === 'updatedAt')).toBe(false) // Exclude @updatedAt
      expect(user.createFields.some(f => f.name === 'email')).toBe(true) // Include regular fields
    })

    it('should identify updateFields (same as createFields)', () => {
      const result = parseDMMF(simpleUserDMMF)
      const user = result.models[0]
      
      expect(user.updateFields).toBeDefined()
      expect(user.updateFields.some(f => f.name === 'id')).toBe(false)
      expect(user.updateFields.some(f => f.name === 'email')).toBe(true)
    })

    it('should include createdAt with now() in createFields', () => {
      const result = parseDMMF(simpleUserDMMF)
      const user = result.models[0]
      
      const createdAtField = user.fields.find(f => f.name === 'createdAt')
      expect(createdAtField?.hasDbDefault).toBe(false) // now() is client-managed
      expect(user.createFields.some(f => f.name === 'createdAt')).toBe(true)
    })
  })

  describe('Enums', () => {
    it('should parse enum values', () => {
      const result = parseDMMF(simpleUserDMMF)
      
      expect(result.enums).toHaveLength(1)
      const roleEnum = result.enums[0]
      expect(roleEnum.name).toBe('Role')
      expect(roleEnum.values).toContain('USER')
      expect(roleEnum.values).toContain('ADMIN')
    })

    it('should detect enum fields', () => {
      const result = parseDMMF(simpleUserDMMF)
      const user = result.models[0]
      
      const roleField = user.fields.find(f => f.name === 'role')
      expect(roleField?.kind).toBe('enum')
      expect(roleField?.type).toBe('Role')
    })
  })

  describe('Relationships', () => {
    it('should parse one-to-many relationships', () => {
      const result = parseDMMF(relatedModelsDMMF)
      
      const user = result.models.find(m => m.name === 'User')
      const post = result.models.find(m => m.name === 'Post')
      
      expect(user?.relationFields.some(f => f.name === 'posts')).toBe(true)
      expect(post?.relationFields.some(f => f.name === 'author')).toBe(true)
    })

    it('should detect foreign key fields', () => {
      const result = parseDMMF(relatedModelsDMMF)
      const post = result.models.find(m => m.name === 'Post')
      
      const authorField = post?.relationFields.find(f => f.name === 'author')
      expect(authorField?.relationFromFields).toEqual(['authorId'])
      expect(authorField?.relationToFields).toEqual(['id'])
    })

    it('should build reverse relation map', () => {
      const result = parseDMMF(relatedModelsDMMF)
      
      expect(result.reverseRelationMap.size).toBeGreaterThan(0)
      const userReverseRelations = result.reverseRelationMap.get('User')
      expect(userReverseRelations).toBeDefined()
    })

    it('should detect self-referencing relations', () => {
      const result = parseDMMF(selfReferencingDMMF)
      const category = result.models[0]
      
      expect(category.hasSelfRelation).toBe(true)
      const parentField = category.fields.find(f => f.name === 'parent')
      expect(parentField?.isSelfRelation).toBe(true)
    })
  })

  describe('Composite Primary Keys', () => {
    it('should parse composite primary key', () => {
      const result = parseDMMF(compositePkDMMF)
      const userRole = result.models[0]
      
      expect(userRole.primaryKey).toBeDefined()
      expect(userRole.primaryKey?.fields).toEqual(['userId', 'roleId'])
    })

    it('should mark fields as part of composite PK', () => {
      const result = parseDMMF(compositePkDMMF)
      const userRole = result.models[0]
      
      const userIdField = userRole.fields.find(f => f.name === 'userId')
      const roleIdField = userRole.fields.find(f => f.name === 'roleId')
      
      expect(userIdField?.isPartOfCompositePrimaryKey).toBe(true)
      expect(roleIdField?.isPartOfCompositePrimaryKey).toBe(true)
    })
  })

  describe('Immutability', () => {
    it('should freeze arrays when freeze option is true', () => {
      const result = parseDMMF(simpleUserDMMF, { freeze: true })
      
      expect(Object.isFrozen(result.models)).toBe(true)
      expect(Object.isFrozen(result.enums)).toBe(true)
      expect(Object.isFrozen(result.models[0].fields)).toBe(true)
    })

    it('should not freeze arrays when freeze option is false', () => {
      const result = parseDMMF(simpleUserDMMF, { freeze: false })
      
      expect(Object.isFrozen(result.models)).toBe(false)
      expect(Object.isFrozen(result.enums)).toBe(false)
    })
  })

  describe('Logger', () => {
    it('should use custom logger', () => {
      const warnings: string[] = []
      const errors: string[] = []
      
      parseDMMF(simpleUserDMMF, {
        logger: {
          warn: (msg) => warnings.push(msg),
          error: (msg) => errors.push(msg)
        }
      })
      
      // No warnings/errors for valid DMMF
      expect(warnings).toHaveLength(0)
      expect(errors).toHaveLength(0)
    })
  })

  describe('Error Handling', () => {
    it('should throw on throwOnError with invalid schema', () => {
      // Create DMMF with missing ID field
      const invalidDMMF: typeof simpleUserDMMF = {
        ...simpleUserDMMF,
        datamodel: {
          ...simpleUserDMMF.datamodel,
          models: [
            {
              name: 'InvalidModel',
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
      
      expect(() => parseDMMF(invalidDMMF, { throwOnError: true })).toThrow('Schema validation failed')
    })
  })
})

