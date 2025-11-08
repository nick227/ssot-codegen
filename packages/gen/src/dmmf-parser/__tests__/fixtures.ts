/**
 * Test fixtures for DMMF parser tests
 * 
 * Provides realistic DMMF structures for testing
 */

import type { DMMF } from '@prisma/generator-helper'

/**
 * Simple User model with basic fields
 */
export const simpleUserDMMF: DMMF.Document = {
  datamodel: {
    enums: [
      {
        name: 'Role',
        values: [
          { name: 'USER', dbName: null },
          { name: 'ADMIN', dbName: null }
        ],
        dbName: null
      }
    ],
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
            name: 'name',
            kind: 'scalar',
            isList: false,
            isRequired: false,
            isUnique: false,
            isId: false,
            isReadOnly: false,
            hasDefaultValue: false,
            type: 'String',
            isGenerated: false,
            isUpdatedAt: false
          },
          {
            name: 'role',
            kind: 'enum',
            isList: false,
            isRequired: true,
            isUnique: false,
            isId: false,
            isReadOnly: false,
            hasDefaultValue: true,
            type: 'Role',
            default: 'USER',
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
          },
          {
            name: 'updatedAt',
            kind: 'scalar',
            isList: false,
            isRequired: true,
            isUnique: false,
            isId: false,
            isReadOnly: false,
            hasDefaultValue: false,
            type: 'DateTime',
            isGenerated: false,
            isUpdatedAt: true
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

/**
 * Related models (User -> Post) with foreign keys
 */
export const relatedModelsDMMF: DMMF.Document = {
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
            type: 'String',
            default: { name: 'uuid', args: [] },
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
            relationName: 'PostToUser',
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
            name: 'title',
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
            name: 'authorId',
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
            name: 'author',
            kind: 'object',
            isList: false,
            isRequired: true,
            isUnique: false,
            isId: false,
            isReadOnly: false,
            hasDefaultValue: false,
            type: 'User',
            relationName: 'PostToUser',
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

/**
 * Self-referencing model (Category with parent/children)
 */
export const selfReferencingDMMF: DMMF.Document = {
  datamodel: {
    enums: [],
    models: [
      {
        name: 'Category',
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
          },
          {
            name: 'parentId',
            kind: 'scalar',
            isList: false,
            isRequired: false,
            isUnique: false,
            isId: false,
            isReadOnly: false,
            hasDefaultValue: false,
            type: 'Int',
            isGenerated: false,
            isUpdatedAt: false
          },
          {
            name: 'parent',
            kind: 'object',
            isList: false,
            isRequired: false,
            isUnique: false,
            isId: false,
            isReadOnly: false,
            hasDefaultValue: false,
            type: 'Category',
            relationName: 'CategoryToCategory',
            relationFromFields: ['parentId'],
            relationToFields: ['id'],
            isGenerated: false,
            isUpdatedAt: false
          },
          {
            name: 'children',
            kind: 'object',
            isList: true,
            isRequired: true,
            isUnique: false,
            isId: false,
            isReadOnly: false,
            hasDefaultValue: false,
            type: 'Category',
            relationName: 'CategoryToCategory',
            relationFromFields: [],
            relationToFields: [],
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

/**
 * Composite primary key model
 */
export const compositePkDMMF: DMMF.Document = {
  datamodel: {
    enums: [],
    models: [
      {
        name: 'UserRole',
        dbName: null,
        fields: [
          {
            name: 'userId',
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
            name: 'roleId',
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
            name: 'assignedAt',
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
        primaryKey: {
          name: null,
          fields: ['userId', 'roleId']
        },
        uniqueFields: [],
        uniqueIndexes: []
      }
    ]
  },
  schema: { inputObjectTypes: { prisma: [] }, outputObjectTypes: { prisma: [], model: [] }, enumTypes: { prisma: [], model: [] }, fieldRefTypes: { prisma: [] } },
  mappings: { modelOperations: [], otherOperations: { read: [], write: [] } }
}

/**
 * Malformed DMMF for error testing
 */
export const malformedDMMF = {
  // Missing datamodel
  schema: {},
  mappings: {}
} as unknown as DMMF.Document

/**
 * Empty DMMF (valid but no models/enums)
 */
export const emptyDMMF: DMMF.Document = {
  datamodel: {
    enums: [],
    models: []
  },
  schema: { inputObjectTypes: { prisma: [] }, outputObjectTypes: { prisma: [], model: [] }, enumTypes: { prisma: [], model: [] }, fieldRefTypes: { prisma: [] } },
  mappings: { modelOperations: [], otherOperations: { read: [], write: [] } }
}

