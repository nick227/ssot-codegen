/**
 * Default value handling tests
 */

import { describe, it, expect } from 'vitest'
import { parseDMMF } from '../parsing/core.js'
import { getDefaultValueString, isClientManagedDefault } from '../defaults/index.js'
import type { ParsedField } from '../types.js'
import type { DMMF } from '@prisma/generator-helper'

describe('Default Value Handling', () => {
  describe('getDefaultValueString', () => {
    it('should return string literal for string defaults', () => {
      const field: ParsedField = {
        name: 'status',
        type: 'String',
        kind: 'scalar',
        isList: false,
        isRequired: true,
        isNullable: false,
        isOptional: false,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        isUpdatedAt: false,
        hasDefaultValue: true,
        hasDbDefault: false,
        default: 'active',
        isPartOfCompositePrimaryKey: false,
        isSelfRelation: false
      }
      
      const result = getDefaultValueString(field)
      expect(result).toBe('"active"')
    })

    it('should return number literal for number defaults', () => {
      const field: ParsedField = {
        name: 'count',
        type: 'Int',
        kind: 'scalar',
        isList: false,
        isRequired: true,
        isNullable: false,
        isOptional: false,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        isUpdatedAt: false,
        hasDefaultValue: true,
        hasDbDefault: false,
        default: 0,
        isPartOfCompositePrimaryKey: false,
        isSelfRelation: false
      }
      
      const result = getDefaultValueString(field)
      expect(result).toBe('0')
    })

    it('should return boolean literal for boolean defaults', () => {
      const field: ParsedField = {
        name: 'active',
        type: 'Boolean',
        kind: 'scalar',
        isList: false,
        isRequired: true,
        isNullable: false,
        isOptional: false,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        isUpdatedAt: false,
        hasDefaultValue: true,
        hasDbDefault: false,
        default: true,
        isPartOfCompositePrimaryKey: false,
        isSelfRelation: false
      }
      
      const result = getDefaultValueString(field)
      expect(result).toBe('true')
    })

    it('should return "new Date()" for now() function', () => {
      const field: ParsedField = {
        name: 'createdAt',
        type: 'DateTime',
        kind: 'scalar',
        isList: false,
        isRequired: true,
        isNullable: false,
        isOptional: false,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        isUpdatedAt: false,
        hasDefaultValue: true,
        hasDbDefault: false,
        default: { name: 'now', args: [] },
        isPartOfCompositePrimaryKey: false,
        isSelfRelation: false
      }
      
      const result = getDefaultValueString(field)
      expect(result).toBe('new Date()')
    })

    it('should return undefined for autoincrement()', () => {
      const field: ParsedField = {
        name: 'id',
        type: 'Int',
        kind: 'scalar',
        isList: false,
        isRequired: true,
        isNullable: false,
        isOptional: true,
        isUnique: false,
        isId: true,
        isReadOnly: true,
        isUpdatedAt: false,
        hasDefaultValue: true,
        hasDbDefault: true,
        default: { name: 'autoincrement', args: [] },
        isPartOfCompositePrimaryKey: false,
        isSelfRelation: false
      }
      
      const result = getDefaultValueString(field)
      expect(result).toBeUndefined()
    })

    it('should return undefined for uuid()', () => {
      const field: ParsedField = {
        name: 'id',
        type: 'String',
        kind: 'scalar',
        isList: false,
        isRequired: true,
        isNullable: false,
        isOptional: true,
        isUnique: false,
        isId: true,
        isReadOnly: true,
        isUpdatedAt: false,
        hasDefaultValue: true,
        hasDbDefault: true,
        default: { name: 'uuid', args: [] },
        isPartOfCompositePrimaryKey: false,
        isSelfRelation: false
      }
      
      const result = getDefaultValueString(field)
      expect(result).toBeUndefined()
    })

    it('should return enum reference for enum defaults', () => {
      const field: ParsedField = {
        name: 'role',
        type: 'Role',
        kind: 'enum',
        isList: false,
        isRequired: true,
        isNullable: false,
        isOptional: false,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        isUpdatedAt: false,
        hasDefaultValue: true,
        hasDbDefault: false,
        default: 'USER',
        isPartOfCompositePrimaryKey: false,
        isSelfRelation: false
      }
      
      const result = getDefaultValueString(field)
      expect(result).toBe('Role.USER')
    })

    it('should escape special characters in strings', () => {
      const field: ParsedField = {
        name: 'description',
        type: 'String',
        kind: 'scalar',
        isList: false,
        isRequired: true,
        isNullable: false,
        isOptional: false,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        isUpdatedAt: false,
        hasDefaultValue: true,
        hasDbDefault: false,
        default: 'Line 1\nLine 2\t"quoted"',
        isPartOfCompositePrimaryKey: false,
        isSelfRelation: false
      }
      
      const result = getDefaultValueString(field)
      expect(result).toContain('\\n')
      expect(result).toContain('\\t')
      expect(result).toContain('\\"')
    })

    it('should return undefined for BigInt fields', () => {
      const field: ParsedField = {
        name: 'bignum',
        type: 'BigInt',
        kind: 'scalar',
        isList: false,
        isRequired: true,
        isNullable: false,
        isOptional: false,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        isUpdatedAt: false,
        hasDefaultValue: true,
        hasDbDefault: false,
        default: 123,
        isPartOfCompositePrimaryKey: false,
        isSelfRelation: false
      }
      
      const result = getDefaultValueString(field)
      expect(result).toBeUndefined()
    })

    it('should return undefined for Decimal fields', () => {
      const field: ParsedField = {
        name: 'price',
        type: 'Decimal',
        kind: 'scalar',
        isList: false,
        isRequired: true,
        isNullable: false,
        isOptional: false,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        isUpdatedAt: false,
        hasDefaultValue: true,
        hasDbDefault: false,
        default: 19.99,
        isPartOfCompositePrimaryKey: false,
        isSelfRelation: false
      }
      
      const result = getDefaultValueString(field)
      expect(result).toBeUndefined()
    })

    it('should handle null default', () => {
      const field: ParsedField = {
        name: 'optional',
        type: 'String',
        kind: 'scalar',
        isList: false,
        isRequired: false,
        isNullable: true,
        isOptional: true,
        isUnique: false,
        isId: false,
        isReadOnly: false,
        isUpdatedAt: false,
        hasDefaultValue: true,
        hasDbDefault: false,
        default: null,
        isPartOfCompositePrimaryKey: false,
        isSelfRelation: false
      }
      
      const result = getDefaultValueString(field)
      expect(result).toBe('null')
    })
  })

  describe('isClientManagedDefault', () => {
    it('should return true for now()', () => {
      const defaultValue = { name: 'now', args: [] }
      expect(isClientManagedDefault(defaultValue)).toBe(true)
    })

    it('should return false for autoincrement()', () => {
      const defaultValue = { name: 'autoincrement', args: [] }
      expect(isClientManagedDefault(defaultValue)).toBe(false)
    })

    it('should return false for uuid()', () => {
      const defaultValue = { name: 'uuid', args: [] }
      expect(isClientManagedDefault(defaultValue)).toBe(false)
    })

    it('should return false for cuid()', () => {
      const defaultValue = { name: 'cuid', args: [] }
      expect(isClientManagedDefault(defaultValue)).toBe(false)
    })

    it('should return false for dbgenerated()', () => {
      const defaultValue = { name: 'dbgenerated', args: [] }
      expect(isClientManagedDefault(defaultValue)).toBe(false)
    })

    it('should return false for primitives', () => {
      expect(isClientManagedDefault('string')).toBe(false)
      expect(isClientManagedDefault(123)).toBe(false)
      expect(isClientManagedDefault(true)).toBe(false)
      expect(isClientManagedDefault(null)).toBe(false)
    })
  })

  describe('Integration with parseDMMF', () => {
    it('should correctly identify DB-managed defaults', () => {
      const dmmf: DMMF.Document = {
        datamodel: {
          enums: [],
          models: [
            {
              name: 'Test',
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
      
      const schema = parseDMMF(dmmf)
      const model = schema.models[0]
      const idField = model.fields.find(f => f.name === 'id')!
      
      expect(idField.hasDbDefault).toBe(true)
      expect(getDefaultValueString(idField)).toBeUndefined()
    })

    it('should correctly identify client-managed defaults', () => {
      const dmmf: DMMF.Document = {
        datamodel: {
          enums: [],
          models: [
            {
              name: 'Test',
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
                  type: 'String',
                  default: { name: 'uuid', args: [] },
                  isGenerated: false,
                  isUpdatedAt: false
                },
                {
                  name: 'createdAt',
                  kind: 'scalar',
                  isList: false,
                  isRequired: true,
                  isUnique: false,
                  isId: false,
                  isReadOnly: false,
                  hasDefaultValue: true,
                  type: 'DateTime',
                  default: { name: 'now', args: [] },
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
      
      const schema = parseDMMF(dmmf)
      const model = schema.models[0]
      const createdAtField = model.fields.find(f => f.name === 'createdAt')!
      
      expect(createdAtField.hasDbDefault).toBe(false)
      expect(isClientManagedDefault(createdAtField.default)).toBe(true)
      expect(getDefaultValueString(createdAtField)).toBe('new Date()')
    })
  })
})

