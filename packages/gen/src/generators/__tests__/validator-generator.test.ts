import { describe, it, expect } from 'vitest'
import { ValidatorGeneratorV2 } from '../validator-generator-v2.js'
import { createMockModel, createMockField } from './fixtures.js'

describe('ValidatorGeneratorV2', () => {
  it('should generate CreateValidator correctly', () => {
    const model = createMockModel()
    const generator = new ValidatorGeneratorV2(model)
    const outputs = generator.generate()
    const createValidator = outputs.find(o => o.filename.includes('create.zod'))

    expect(createValidator).toBeDefined()
    expect(createValidator!.filename).toBe('todo.create.zod.ts')
    expect(createValidator!.content).toContain('export const TodoCreateSchema')
    expect(createValidator!.content).toContain('z.object(')
    expect(createValidator!.content).toContain('title: z.string()')
    expect(createValidator!.content).toContain('export type TodoCreateInput')
  })

  it('should generate UpdateValidator correctly', () => {
    const model = createMockModel()
    const generator = new ValidatorGeneratorV2(model)
    const outputs = generator.generate()
    const updateValidator = outputs.find(o => o.filename.includes('update.zod'))

    expect(updateValidator).toBeDefined()
    expect(updateValidator!.filename).toBe('todo.update.zod.ts')
    expect(updateValidator!.content).toContain('export const TodoUpdateSchema')
    expect(updateValidator!.content).toContain('TodoCreateSchema.partial()')
    expect(updateValidator!.content).toContain('export type TodoUpdateInput')
  })

  it('should generate QueryValidator correctly', () => {
    const model = createMockModel()
    const generator = new ValidatorGeneratorV2(model)
    const outputs = generator.generate()
    const queryValidator = outputs.find(o => o.filename.includes('query.zod'))

    expect(queryValidator).toBeDefined()
    expect(queryValidator!.filename).toBe('todo.query.zod.ts')
    expect(queryValidator!.content).toContain('export const TodoQuerySchema')
    expect(queryValidator!.content).toContain('skip: z.coerce.number()')
    expect(queryValidator!.content).toContain('take: z.coerce.number()')
    expect(queryValidator!.content).toContain('orderBy: z.enum(')
    expect(queryValidator!.content).toContain('export type TodoQueryInput')
  })

  it('should handle optional fields correctly', () => {
    const model = createMockModel()
    const generator = new ValidatorGeneratorV2(model)
    const outputs = generator.generate()
    const createValidator = outputs.find(o => o.filename.includes('create.zod'))

    // completed has default, so should be optional
    expect(createValidator!.content).toContain('completed')
    expect(createValidator!.content).toContain('optional()')
  })

  it('should generate barrel export correctly', () => {
    const model = createMockModel()
    const generator = new ValidatorGeneratorV2(model)
    const barrel = generator.generateBarrel()

    expect(barrel.filename).toBe('index.ts')
    expect(barrel.content).toContain("export * from './todo.create.zod.js'")
    expect(barrel.content).toContain("export * from './todo.update.zod.js'")
    expect(barrel.content).toContain("export * from './todo.query.zod.js'")
  })

  it('should include all scalar fields in sortable list', () => {
    const model = createMockModel()
    const generator = new ValidatorGeneratorV2(model)
    const outputs = generator.generate()
    const queryValidator = outputs.find(o => o.filename.includes('query.zod'))

    expect(queryValidator!.content).toContain("'id'")
    expect(queryValidator!.content).toContain("'title'")
    expect(queryValidator!.content).toContain("'completed'")
    expect(queryValidator!.content).toContain("'createdAt'")
    expect(queryValidator!.content).toContain("'updatedAt'")
  })

  it('should handle different field types', () => {
    const customModel = createMockModel({
      name: 'User',
      fields: [
        createMockField({ name: 'id', type: 'String', isId: true }),
        createMockField({ name: 'email', type: 'String', isRequired: true }),
        createMockField({ name: 'age', type: 'Int', isRequired: false }),
        createMockField({ name: 'rating', type: 'Float', isRequired: false }),
      ]
    })

    const generator = new ValidatorGeneratorV2(customModel)
    const outputs = generator.generate()
    const createValidator = outputs.find(o => o.filename.includes('create.zod'))

    expect(createValidator!.content).toContain('email: z.string()')
    expect(createValidator!.content).toContain('age')
    expect(createValidator!.content).toContain('rating')
  })

  it('should generate correct output structure', () => {
    const model = createMockModel()
    const generator = new ValidatorGeneratorV2(model)
    const outputs = generator.generate()

    expect(outputs).toHaveLength(3)
    outputs.forEach(output => {
      expect(output.modelName).toBe('Todo')
      expect(output.layer).toBe('validators')
      expect(output.content).toContain('// @generated')
      expect(output.content).toContain("import { z } from 'zod'")
    })
  })
})

