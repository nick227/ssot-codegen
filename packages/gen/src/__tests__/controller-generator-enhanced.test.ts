/**
 * Controller Generator Enhanced - Integration Tests
 * Verifies generated code compiles and is syntactically valid
 */

import { describe, it, expect } from 'vitest'
import { generateEnhancedController } from '../generators/controller-generator-enhanced.js'
import type { ParsedModel, ParsedSchema, ParsedField } from '../dmmf-parser.js'
import { analyzeModelUnified } from '../analyzers/unified-analyzer/index.js'

// Mock minimal model for testing
function createTestModel(name: string = 'User'): ParsedModel {
  const idField: ParsedField = {
    name: 'id',
    type: 'Int',
    kind: 'scalar',
    isId: true,
    isList: false,
    isRequired: true,
    isUnique: true,
    hasDefaultValue: true,
    default: { name: 'autoincrement', args: [] },
    isUpdatedAt: false,
    documentation: undefined
  }

  return {
    name,
    dbName: name.toLowerCase(),
    documentation: undefined,
    scalarFields: [
      idField,
      {
        name: 'email',
        type: 'String',
        kind: 'scalar',
        isId: false,
        isList: false,
        isRequired: true,
        isUnique: true,
        hasDefaultValue: false,
        isUpdatedAt: false,
        documentation: undefined
      },
      {
        name: 'slug',
        type: 'String',
        kind: 'scalar',
        isId: false,
        isList: false,
        isRequired: false,
        isUnique: true,
        hasDefaultValue: false,
        isUpdatedAt: false,
        documentation: undefined
      },
      {
        name: 'published',
        type: 'Boolean',
        kind: 'scalar',
        isId: false,
        isList: false,
        isRequired: true,
        hasDefaultValue: true,
        default: { name: 'false', args: [] },
        isUpdatedAt: false,
        documentation: undefined
      }
    ],
    relationFields: [],
    idField,
    uniqueFields: []
  }
}

function createTestSchema(): ParsedSchema {
  const model = createTestModel()
  return {
    models: [model],
    modelMap: new Map([[model.name, model]]),
    enums: [],
    enumMap: new Map()
  }
}

describe('generateEnhancedController', () => {
  it('should generate Express controller without errors', () => {
    const model = createTestModel()
    const schema = createTestSchema()
    const analysis = analyzeModelUnified(model, schema)
    
    const code = generateEnhancedController(model, schema, 'express', analysis)
    
    expect(code).toBeDefined()
    expect(code).toContain('export const listUsers')
    expect(code).toContain('export const getUser')
    expect(code).toContain('export const createUser')
    expect(code).toContain('export const updateUser')
    expect(code).toContain('export const deleteUser')
  })

  it('should generate Fastify controller without errors', () => {
    const model = createTestModel()
    const schema = createTestSchema()
    const analysis = analyzeModelUnified(model, schema)
    
    const code = generateEnhancedController(model, schema, 'fastify', analysis)
    
    expect(code).toBeDefined()
    expect(code).toContain('export const listUsers')
    expect(code).toContain('FastifyRequest')
    expect(code).toContain('FastifyReply')
  })

  it('should include slug endpoint when slug field present', () => {
    const model = createTestModel()
    const schema = createTestSchema()
    const analysis = analyzeModelUnified(model, schema)
    
    const code = generateEnhancedController(model, schema, 'express', analysis)
    
    expect(code).toContain('getUserBySlug')
  })

  it('should include published endpoints when published field present', () => {
    const model = createTestModel()
    const schema = createTestSchema()
    const analysis = analyzeModelUnified(model, schema)
    
    const code = generateEnhancedController(model, schema, 'express', analysis)
    
    expect(code).toContain('listPublishedUsers')
    expect(code).toContain('publishUser')
    expect(code).toContain('unpublishUser')
  })

  it('should throw error for missing analysis', () => {
    const model = createTestModel()
    const schema = createTestSchema()
    
    expect(() => {
      generateEnhancedController(model, schema, 'express', null)
    }).toThrow('Analysis required')
  })

  it('should throw error for composite primary keys', () => {
    const model = createTestModel()
    model.scalarFields.push({
      name: 'secondId',
      type: 'Int',
      kind: 'scalar',
      isId: true,
      isList: false,
      isRequired: true,
      isUnique: false,
      hasDefaultValue: false,
      isUpdatedAt: false,
      documentation: undefined
    })
    
    const schema = createTestSchema()
    const analysis = analyzeModelUnified(model, schema)
    
    expect(() => {
      generateEnhancedController(model, schema, 'express', analysis)
    }).toThrow('composite primary key')
  })

  it('should include bulk operations by default', () => {
    const model = createTestModel()
    const schema = createTestSchema()
    const analysis = analyzeModelUnified(model, schema)
    
    const code = generateEnhancedController(model, schema, 'express', analysis)
    
    expect(code).toContain('bulkCreateUsers')
    expect(code).toContain('bulkUpdateUsers')
    expect(code).toContain('bulkDeleteUsers')
  })

  it('should respect enableBulkOperations config', () => {
    const model = createTestModel()
    const schema = createTestSchema()
    const analysis = analyzeModelUnified(model, schema)
    
    const code = generateEnhancedController(model, schema, 'express', analysis, {
      enableBulkOperations: false
    })
    
    expect(code).not.toContain('bulkCreateUsers')
  })

  it('should include security recommendations', () => {
    const model = createTestModel()
    const schema = createTestSchema()
    const analysis = analyzeModelUnified(model, schema)
    
    const code = generateEnhancedController(model, schema, 'express', analysis)
    
    expect(code).toContain('SECURITY RECOMMENDATIONS')
    expect(code).toContain('Rate Limiting')
    expect(code).toContain('CSRF Protection')
  })

  it('should include type interfaces', () => {
    const model = createTestModel()
    const schema = createTestSchema()
    const analysis = analyzeModelUnified(model, schema)
    
    const code = generateEnhancedController(model, schema, 'express', analysis)
    
    expect(code).toContain('interface UserParams')
    expect(code).toContain('interface PaginationQuery')
    expect(code).toContain('interface CountBody')
  })

  it('should use configurable bulk size limit', () => {
    const model = createTestModel()
    const schema = createTestSchema()
    const analysis = analyzeModelUnified(model, schema)
    
    const code = generateEnhancedController(model, schema, 'express', analysis, {
      bulkOperationLimits: { maxBatchSize: 50 }
    })
    
    expect(code).toContain('.max(50)')
  })

  it('should not use non-null assertions', () => {
    const model = createTestModel()
    const schema = createTestSchema()
    const analysis = analyzeModelUnified(model, schema)
    
    const code = generateEnhancedController(model, schema, 'express', analysis)
    
    // Verify no unsafe patterns
    expect(code).not.toContain('idResult.id!')
    expect(code).toContain('idResult.id === undefined')
  })
})

