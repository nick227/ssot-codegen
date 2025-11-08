/**
 * Integration tests for complete DMMF parsing workflows
 * 
 * Tests real-world scenarios and complex schema patterns
 */

import { describe, it, expect } from 'vitest'
import { parseDMMF } from '../parsing/core.js'
import { validateSchemaDetailed } from '../validation/schema-validator.js'
import { getField, getRelationTarget, isOptionalForCreate } from '../utils/field-helpers.js'
import { getDefaultValueString } from '../defaults/index.js'
import type { DMMF } from '@prisma/generator-helper'

describe('DMMF Parser - Integration Tests', () => {
  describe('E-Commerce Schema', () => {
    const ecommerceDMMF: DMMF.Document = {
      datamodel: {
        enums: [
          {
            name: 'OrderStatus',
            values: [
              { name: 'PENDING', dbName: null },
              { name: 'PROCESSING', dbName: null },
              { name: 'SHIPPED', dbName: null },
              { name: 'DELIVERED', dbName: null },
              { name: 'CANCELLED', dbName: null }
            ],
            dbName: null
          }
        ],
        models: [
          {
            name: 'Customer',
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
                name: 'email',
                kind: 'scalar',
                isList: false,
                isRequired: true,
                isUnique: true,
                isId: false,
                isReadOnly: false,
                hasDefaultValue: false,
                type: 'String',
                isGenerated: false,
                isUpdatedAt: false
              },
              {
                name: 'orders',
                kind: 'object',
                isList: true,
                isRequired: true,
                isUnique: false,
                isId: false,
                isReadOnly: false,
                hasDefaultValue: false,
                type: 'Order',
                relationName: 'CustomerOrders',
                relationFromFields: [],
                relationToFields: [],
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
          },
          {
            name: 'Order',
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
                name: 'customerId',
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
              },
              {
                name: 'customer',
                kind: 'object',
                isList: false,
                isRequired: true,
                isUnique: false,
                isId: false,
                isReadOnly: false,
                hasDefaultValue: false,
                type: 'Customer',
                relationName: 'CustomerOrders',
                relationFromFields: ['customerId'],
                relationToFields: ['id'],
                isGenerated: false,
                isUpdatedAt: false
              },
              {
                name: 'status',
                kind: 'enum',
                isList: false,
                isRequired: true,
                isUnique: false,
                isId: false,
                isReadOnly: false,
                hasDefaultValue: true,
                type: 'OrderStatus',
                default: 'PENDING',
                isGenerated: false,
                isUpdatedAt: false
              },
              {
                name: 'total',
                kind: 'scalar',
                isList: false,
                isRequired: true,
                isUnique: false,
                isId: false,
                isReadOnly: false,
                hasDefaultValue: true,
                type: 'Float',
                default: 0,
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

    it('should parse complete e-commerce schema', () => {
      const schema = parseDMMF(ecommerceDMMF)
      
      expect(schema.models).toHaveLength(2)
      expect(schema.enums).toHaveLength(1)
      expect(schema.modelMap.get('Customer')).toBeDefined()
      expect(schema.modelMap.get('Order')).toBeDefined()
      expect(schema.enumMap.get('OrderStatus')).toBeDefined()
    })

    it('should correctly handle Customer -> Order relationship', () => {
      const schema = parseDMMF(ecommerceDMMF)
      
      const customer = schema.modelMap.get('Customer')!
      const order = schema.modelMap.get('Order')!
      
      // Customer has orders (one-to-many, implicit side)
      const ordersField = getField(customer, 'orders')!
      expect(ordersField.kind).toBe('object')
      expect(ordersField.isList).toBe(true)
      expect(ordersField.isOptional).toBe(true) // Implicit relation
      
      // Order has customer (many-to-one, explicit side with FK)
      const customerField = getField(order, 'customer')!
      expect(customerField.kind).toBe('object')
      expect(customerField.isList).toBe(false)
      expect(customerField.relationFromFields).toEqual(['customerId'])
      expect(customerField.relationToFields).toEqual(['id'])
    })

    it('should identify correct DTO fields', () => {
      const schema = parseDMMF(ecommerceDMMF)
      const order = schema.modelMap.get('Order')!
      
      // CreateDTO should exclude: id (autoincrement), relation fields
      // CreateDTO should include: customerId (FK), status (has default), total (has default)
      const createFieldNames = order.createFields.map(f => f.name)
      
      expect(createFieldNames).not.toContain('id') // Autoincrement
      expect(createFieldNames).not.toContain('customer') // Relation
      expect(createFieldNames).toContain('customerId') // FK field
      expect(createFieldNames).toContain('status') // Enum with default
      expect(createFieldNames).toContain('total') // Scalar with default
    })

    it('should generate correct default values', () => {
      const schema = parseDMMF(ecommerceDMMF)
      const order = schema.modelMap.get('Order')!
      
      const idField = getField(order, 'id')!
      expect(getDefaultValueString(idField)).toBeUndefined() // DB-managed

      const statusField = getField(order, 'status')!
      expect(getDefaultValueString(statusField)).toBe('OrderStatus.PENDING')

      const totalField = getField(order, 'total')!
      expect(getDefaultValueString(totalField)).toBe('0')
    })

    it('should validate schema successfully', () => {
      const schema = parseDMMF(ecommerceDMMF)
      const validation = validateSchemaDetailed(schema)
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  describe('Blog Platform Schema', () => {
    const blogDMMF: DMMF.Document = {
      datamodel: {
        enums: [],
        models: [
          {
            name: 'User',
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
                name: 'posts',
                kind: 'object',
                isList: true,
                isRequired: true,
                isUnique: false,
                isId: false,
                isReadOnly: false,
                hasDefaultValue: false,
                type: 'Post',
                relationName: 'Author',
                relationFromFields: [],
                relationToFields: [],
                isGenerated: false,
                isUpdatedAt: false
              },
              {
                name: 'comments',
                kind: 'object',
                isList: true,
                isRequired: true,
                isUnique: false,
                isId: false,
                isReadOnly: false,
                hasDefaultValue: false,
                type: 'Comment',
                relationName: 'CommentAuthor',
                relationFromFields: [],
                relationToFields: [],
                isGenerated: false,
                isUpdatedAt: false
              }
            ],
            primaryKey: null,
            uniqueFields: [],
            uniqueIndexes: []
          },
          {
            name: 'Post',
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
                name: 'authorId',
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
                name: 'author',
                kind: 'object',
                isList: false,
                isRequired: true,
                isUnique: false,
                isId: false,
                isReadOnly: false,
                hasDefaultValue: false,
                type: 'User',
                relationName: 'Author',
                relationFromFields: ['authorId'],
                relationToFields: ['id'],
                isGenerated: false,
                isUpdatedAt: false
              },
              {
                name: 'comments',
                kind: 'object',
                isList: true,
                isRequired: true,
                isUnique: false,
                isId: false,
                isReadOnly: false,
                hasDefaultValue: false,
                type: 'Comment',
                relationName: 'PostComments',
                relationFromFields: [],
                relationToFields: [],
                isGenerated: false,
                isUpdatedAt: false
              }
            ],
            primaryKey: null,
            uniqueFields: [],
            uniqueIndexes: []
          },
          {
            name: 'Comment',
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
                name: 'postId',
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
                name: 'post',
                kind: 'object',
                isList: false,
                isRequired: true,
                isUnique: false,
                isId: false,
                isReadOnly: false,
                hasDefaultValue: false,
                type: 'Post',
                relationName: 'PostComments',
                relationFromFields: ['postId'],
                relationToFields: ['id'],
                isGenerated: false,
                isUpdatedAt: false
              },
              {
                name: 'authorId',
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
                name: 'author',
                kind: 'object',
                isList: false,
                isRequired: true,
                isUnique: false,
                isId: false,
                isReadOnly: false,
                hasDefaultValue: false,
                type: 'User',
                relationName: 'CommentAuthor',
                relationFromFields: ['authorId'],
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

    it('should parse multi-model relationships correctly', () => {
      const schema = parseDMMF(blogDMMF)
      
      expect(schema.models).toHaveLength(3)
      
      const user = schema.modelMap.get('User')!
      const post = schema.modelMap.get('Post')!
      const comment = schema.modelMap.get('Comment')!
      
      // User has multiple relationship types
      expect(user.relationFields).toHaveLength(2)
      
      // Post references User and has Comments
      expect(post.relationFields).toHaveLength(2)
      
      // Comment references both Post and User
      expect(comment.relationFields).toHaveLength(2)
    })

    it('should build correct reverse relation maps', () => {
      const schema = parseDMMF(blogDMMF)
      
      // User should have reverse relations from Post (author) and Comment (author)
      const userReverseRelations = schema.reverseRelationMap.get('User')!
      expect(userReverseRelations.length).toBeGreaterThan(0)
      
      // Post should have reverse relation from Comment
      const postReverseRelations = schema.reverseRelationMap.get('Post')!
      expect(postReverseRelations.length).toBeGreaterThan(0)
    })

    it('should navigate relationships using helpers', () => {
      const schema = parseDMMF(blogDMMF)
      
      const comment = schema.modelMap.get('Comment')!
      const postField = getField(comment, 'post')!
      const authorField = getField(comment, 'author')!
      
      const postTarget = getRelationTarget(postField, schema.modelMap)
      const authorTarget = getRelationTarget(authorField, schema.modelMap)
      
      expect(postTarget?.name).toBe('Post')
      expect(authorTarget?.name).toBe('User')
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle schemas with many models efficiently', () => {
      // Generate DMMF with 50 models
      const manyModelsDMMF: DMMF.Document = {
        datamodel: {
          enums: [],
          models: Array.from({ length: 50 }, (_, i) => ({
            name: `Model${i}`,
            dbName: null,
            fields: [
              {
                name: 'id',
                kind: 'scalar' as const,
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
          }))
        },
        schema: { inputObjectTypes: { prisma: [] }, outputObjectTypes: { prisma: [], model: [] }, enumTypes: { prisma: [], model: [] }, fieldRefTypes: { prisma: [] } },
        mappings: { modelOperations: [], otherOperations: { read: [], write: [] } }
      }
      
      const startTime = Date.now()
      const schema = parseDMMF(manyModelsDMMF)
      const endTime = Date.now()
      
      expect(schema.models).toHaveLength(50)
      expect(endTime - startTime).toBeLessThan(100) // Should parse in < 100ms
    })

    it('should maintain immutability with freeze option', () => {
      const simpleDMMF: DMMF.Document = {
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
      
      const schema = parseDMMF(simpleDMMF, { freeze: true })
      
      // Attempt to mutate should have no effect (silent in non-strict mode)
      expect(() => {
        ;(schema.models as any).push({})
      }).toThrow()
    })
  })
})

