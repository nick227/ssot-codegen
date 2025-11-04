import { describe, it, expect } from 'vitest'
import { ServiceGeneratorV2 } from '../service-generator-v2.js'
import { createMockModel } from './fixtures.js'

describe('ServiceGeneratorV2', () => {
  it('should generate service with all CRUD methods', () => {
    const model = createMockModel()
    const generator = new ServiceGeneratorV2(model)
    const outputs = generator.generate()

    expect(outputs).toHaveLength(1)
    const output = outputs[0]

    expect(output.filename).toBe('todo.service.ts')
    expect(output.modelName).toBe('Todo')
    expect(output.layer).toBe('services')

    // Check all methods exist
    expect(output.content).toContain('async list(')
    expect(output.content).toContain('async findById(')
    expect(output.content).toContain('async create(')
    expect(output.content).toContain('async update(')
    expect(output.content).toContain('async delete(')
    expect(output.content).toContain('async count(')
    expect(output.content).toContain('async exists(')
  })

  it('should import correct dependencies', () => {
    const model = createMockModel()
    const generator = new ServiceGeneratorV2(model)
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain("import { prisma } from '@/db'")
    expect(output.content).toContain("import type { TodoCreateDTO, TodoUpdateDTO, TodoQueryDTO } from '@gen/contracts/todo'")
    expect(output.content).toContain("import type { Prisma } from '@prisma/client'")
  })

  it('should generate list method with pagination', () => {
    const model = createMockModel()
    const generator = new ServiceGeneratorV2(model)
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('const { skip = 0, take = 20, orderBy, where } = query')
    expect(output.content).toContain('prisma.todo.findMany({')
    expect(output.content).toContain('skip,')
    expect(output.content).toContain('take,')
    expect(output.content).toContain('orderBy:')
    expect(output.content).toContain('where:')
    expect(output.content).toContain('prisma.todo.count({')
    expect(output.content).toContain('return {')
    expect(output.content).toContain('data: items,')
    expect(output.content).toContain('meta: {')
    expect(output.content).toContain('total,')
    expect(output.content).toContain('hasMore: skip + take < total')
  })

  it('should generate findById with correct ID type', () => {
    const model = createMockModel()
    const generator = new ServiceGeneratorV2(model)
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('async findById(id: number)')
    expect(output.content).toContain('prisma.todo.findUnique({')
    expect(output.content).toContain('where: { id }')
  })

  it('should generate create method', () => {
    const model = createMockModel()
    const generator = new ServiceGeneratorV2(model)
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('async create(data: TodoCreateDTO)')
    expect(output.content).toContain('prisma.todo.create({')
    expect(output.content).toContain('data')
  })

  it('should generate update method with error handling', () => {
    const model = createMockModel()
    const generator = new ServiceGeneratorV2(model)
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('async update(id: number, data: TodoUpdateDTO)')
    expect(output.content).toContain('try {')
    expect(output.content).toContain('prisma.todo.update({')
    expect(output.content).toContain('where: { id },')
    expect(output.content).toContain('data')
    expect(output.content).toContain("if (error.code === 'P2025')")
    expect(output.content).toContain('return null')
  })

  it('should generate delete method with error handling', () => {
    const model = createMockModel()
    const generator = new ServiceGeneratorV2(model)
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('async delete(id: number)')
    expect(output.content).toContain('try {')
    expect(output.content).toContain('prisma.todo.delete({')
    expect(output.content).toContain('where: { id }')
    expect(output.content).toContain("if (error.code === 'P2025')")
    expect(output.content).toContain('return false')
    expect(output.content).toContain('return true')
  })

  it('should generate count and exists methods', () => {
    const model = createMockModel()
    const generator = new ServiceGeneratorV2(model)
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('async count(where?: Prisma.TodoWhereInput)')
    expect(output.content).toContain('prisma.todo.count({ where })')

    expect(output.content).toContain('async exists(id: number)')
    expect(output.content).toContain('const count = await prisma.todo.count({')
    expect(output.content).toContain('return count > 0')
  })

  it('should export service as object', () => {
    const model = createMockModel()
    const generator = new ServiceGeneratorV2(model)
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('export const todoService = {')
    expect(output.content).toMatch(/list,[\s\S]*findById,[\s\S]*create,[\s\S]*update,[\s\S]*delete,/)
  })

  it('should generate barrel export', () => {
    const model = createMockModel()
    const generator = new ServiceGeneratorV2(model)
    const barrel = generator.generateBarrel()

    expect(barrel.filename).toBe('index.ts')
    expect(barrel.modelName).toBe('Todo')
    expect(barrel.layer).toBe('services')
    expect(barrel.content).toContain("export * from './todo.service.js'")
  })

  it('should include JSDoc comments', () => {
    const model = createMockModel()
    const generator = new ServiceGeneratorV2(model)
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('/**')
    expect(output.content).toContain('* List Todo records with pagination')
    expect(output.content).toContain('* Find Todo by ID')
    expect(output.content).toContain('* Create Todo')
    expect(output.content).toContain('* Update Todo')
    expect(output.content).toContain('* Delete Todo')
  })

  it('should handle string ID type', () => {
    const model = createMockModel({
      fields: [
        { name: 'id', type: 'String', kind: 'scalar', isId: true, isRequired: true, isList: false, isUnique: true, isReadOnly: false, isUpdatedAt: false, hasDefaultValue: true, default: { name: 'uuid', args: [] } },
        { name: 'title', type: 'String', kind: 'scalar', isRequired: true, isList: false, isUnique: false, isId: false, isReadOnly: false, isUpdatedAt: false, hasDefaultValue: false }
      ],
      idField: { name: 'id', type: 'String', kind: 'scalar', isId: true, isRequired: true, isList: false, isUnique: true, isReadOnly: false, isUpdatedAt: false, hasDefaultValue: true, default: { name: 'uuid', args: [] } }
    })

    const generator = new ServiceGeneratorV2(model)
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('async findById(id: string)')
    expect(output.content).toContain('async update(id: string,')
    expect(output.content).toContain('async delete(id: string)')
    expect(output.content).toContain('async exists(id: string)')
  })

  it('should include @generated header', () => {
    const model = createMockModel()
    const generator = new ServiceGeneratorV2(model)
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('// @generated')
    expect(output.content).toContain('// This file is automatically generated. Do not edit manually.')
  })
})

