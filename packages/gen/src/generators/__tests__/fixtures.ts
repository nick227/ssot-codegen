/**
 * Test Fixtures - Mock data for generator testing
 */

import type { ParsedModel, ParsedField } from '../../dmmf-parser.js'

/**
 * Create mock field with defaults
 */
export function createMockField(overrides: Partial<ParsedField> = {}): ParsedField {
  return {
    name: 'testField',
    type: 'String',
    kind: 'scalar',
    isList: false,
    isRequired: true,
    isUnique: false,
    isId: false,
    isReadOnly: false,
    isUpdatedAt: false,
    hasDefaultValue: false,
    ...overrides
  }
}

/**
 * Create mock model with defaults
 */
export function createMockModel(overrides: Partial<ParsedModel> = {}): ParsedModel {
  const fields = overrides.fields || [
    createMockField({ name: 'id', type: 'Int', isId: true }),
    createMockField({ name: 'name', type: 'String', isRequired: true }),
    createMockField({ name: 'active', type: 'Boolean', hasDefaultValue: true, default: true })
  ]
  
  const idField = fields.find(f => f.isId)
  const scalarFields = fields.filter(f => f.kind !== 'object')
  const relationFields = fields.filter(f => f.kind === 'object')
  const createFields = fields.filter(f => !f.isId && !f.isReadOnly && !f.isUpdatedAt && f.kind !== 'object')
  
  return {
    name: 'TestModel',
    fields,
    primaryKey: { fields: ['id'] },
    uniqueFields: [],
    idField,
    scalarFields,
    relationFields,
    createFields,
    updateFields: createFields,
    readFields: scalarFields,
    ...overrides
  }
}

/**
 * Todo model fixture
 */
export const TODO_MODEL = createMockModel({
  name: 'Todo',
  fields: [
    createMockField({ name: 'id', type: 'Int', isId: true }),
    createMockField({ name: 'title', type: 'String', isRequired: true }),
    createMockField({ name: 'completed', type: 'Boolean', hasDefaultValue: true, default: false }),
    createMockField({ name: 'description', type: 'String', isRequired: false }),
    createMockField({ name: 'createdAt', type: 'DateTime', hasDefaultValue: true }),
    createMockField({ name: 'updatedAt', type: 'DateTime', isUpdatedAt: true, isReadOnly: true })
  ]
})

/**
 * User model fixture (with relations)
 */
export const USER_MODEL = createMockModel({
  name: 'User',
  fields: [
    createMockField({ name: 'id', type: 'String', isId: true }),
    createMockField({ name: 'email', type: 'String', isRequired: true, isUnique: true }),
    createMockField({ name: 'name', type: 'String', isRequired: true }),
    createMockField({ name: 'posts', type: 'Post', kind: 'object', isList: true })
  ]
})

/**
 * Post model fixture (with relations and enums)
 */
export const POST_MODEL = createMockModel({
  name: 'Post',
  fields: [
    createMockField({ name: 'id', type: 'Int', isId: true }),
    createMockField({ name: 'title', type: 'String', isRequired: true }),
    createMockField({ name: 'content', type: 'String', isRequired: false }),
    createMockField({ name: 'published', type: 'Boolean', hasDefaultValue: true, default: false }),
    createMockField({ name: 'status', type: 'PostStatus', kind: 'enum', isRequired: true }),
    createMockField({ name: 'authorId', type: 'String', isRequired: true }),
    createMockField({ name: 'author', type: 'User', kind: 'object', isRequired: true }),
    createMockField({ name: 'createdAt', type: 'DateTime', hasDefaultValue: true }),
    createMockField({ name: 'updatedAt', type: 'DateTime', isUpdatedAt: true, isReadOnly: true })
  ]
})

/**
 * Model with all field types
 */
export const COMPREHENSIVE_MODEL = createMockModel({
  name: 'Comprehensive',
  fields: [
    createMockField({ name: 'id', type: 'Int', isId: true }),
    createMockField({ name: 'stringField', type: 'String' }),
    createMockField({ name: 'intField', type: 'Int' }),
    createMockField({ name: 'floatField', type: 'Float' }),
    createMockField({ name: 'boolField', type: 'Boolean' }),
    createMockField({ name: 'dateField', type: 'DateTime' }),
    createMockField({ name: 'jsonField', type: 'Json' }),
    createMockField({ name: 'bytesField', type: 'Bytes' }),
    createMockField({ name: 'optionalString', type: 'String', isRequired: false }),
    createMockField({ name: 'stringList', type: 'String', isList: true }),
    createMockField({ name: 'enumField', type: 'Status', kind: 'enum' }),
    createMockField({ name: 'relation', type: 'RelatedModel', kind: 'object' })
  ]
})

/**
 * Helper: Assert output structure
 */
export function assertGeneratorOutput(output: any): void {
  if (!output.files || !(output.files instanceof Map)) {
    throw new Error('Output must have files Map')
  }
  if (!Array.isArray(output.imports)) {
    throw new Error('Output must have imports array')
  }
  if (!Array.isArray(output.exports)) {
    throw new Error('Output must have exports array')
  }
}

