import { describe, it, expect } from 'vitest'
import { ControllerGeneratorV2 } from '../controller-generator-v2.js'
import { createMockModel } from './fixtures.js'

describe('ControllerGeneratorV2 - Express', () => {
  it('should generate Express controller with all handlers', () => {
    const model = createMockModel()
    const generator = new ControllerGeneratorV2(model, 'express')
    const outputs = generator.generate()

    expect(outputs).toHaveLength(1)
    const output = outputs[0]

    expect(output.filename).toBe('todo.controller.ts')
    expect(output.modelName).toBe('Todo')
    expect(output.layer).toBe('controllers')

    // Check all handlers exist
    expect(output.content).toContain('export const listTodos')
    expect(output.content).toContain('export const getTodo')
    expect(output.content).toContain('export const createTodo')
    expect(output.content).toContain('export const updateTodo')
    expect(output.content).toContain('export const deleteTodo')
    expect(output.content).toContain('export const countTodos')
  })

  it('should import Express types and dependencies', () => {
    const model = createMockModel()
    const generator = new ControllerGeneratorV2(model, 'express')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain("import type { Request, Response } from 'express'")
    expect(output.content).toContain("import { todoService } from '@gen/services/todo'")
    expect(output.content).toContain("import { TodoCreateSchema, TodoUpdateSchema, TodoQuerySchema } from '@gen/validators/todo'")
    expect(output.content).toContain("import { ZodError } from 'zod'")
  })

  it('should generate list handler with validation', () => {
    const model = createMockModel()
    const generator = new ControllerGeneratorV2(model, 'express')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('const listTodos = async (req: Request, res: Response)')
    expect(output.content).toContain('TodoQuerySchema.parse(req.query)')
    expect(output.content).toContain('await todoService.list(query)')
    expect(output.content).toContain('return res.json(result)')
    expect(output.content).toContain('if (error instanceof ZodError)')
    expect(output.content).toContain('return res.status(400).json')
  })

  it('should generate get handler with ID parsing', () => {
    const model = createMockModel()
    const generator = new ControllerGeneratorV2(model, 'express')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('const getTodo = async (req: Request, res: Response)')
    expect(output.content).toContain('parseInt(req.params.id, 10)')
    expect(output.content).toContain('if (isNaN(id))')
    expect(output.content).toContain('await todoService.findById(id)')
    expect(output.content).toContain('if (!item)')
    expect(output.content).toContain('return res.status(404).json')
  })

  it('should generate create handler with validation', () => {
    const model = createMockModel()
    const generator = new ControllerGeneratorV2(model, 'express')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('const createTodo = async (req: Request, res: Response)')
    expect(output.content).toContain('TodoCreateSchema.parse(req.body)')
    expect(output.content).toContain('await todoService.create(data)')
    expect(output.content).toContain('return res.status(201).json(item)')
  })

  it('should generate update handler with validation', () => {
    const model = createMockModel()
    const generator = new ControllerGeneratorV2(model, 'express')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('const updateTodo = async (req: Request, res: Response)')
    expect(output.content).toContain('parseInt(req.params.id, 10)')
    expect(output.content).toContain('TodoUpdateSchema.parse(req.body)')
    expect(output.content).toContain('await todoService.update(id, data)')
    expect(output.content).toContain('if (!item)')
    expect(output.content).toContain('return res.status(404).json')
  })

  it('should generate delete handler', () => {
    const model = createMockModel()
    const generator = new ControllerGeneratorV2(model, 'express')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('const deleteTodo = async (req: Request, res: Response)')
    expect(output.content).toContain('await todoService.delete(id)')
    expect(output.content).toContain('if (!deleted)')
    expect(output.content).toContain('return res.status(204).send()')
  })

  it('should generate count handler', () => {
    const model = createMockModel()
    const generator = new ControllerGeneratorV2(model, 'express')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('const countTodos = async (_req: Request, res: Response)')
    expect(output.content).toContain('await todoService.count()')
    expect(output.content).toContain('return res.json({ total })')
  })

  it('should handle string ID type', () => {
    const model = createMockModel({
      fields: [
        { name: 'id', type: 'String', kind: 'scalar', isId: true, isRequired: true, isList: false, isUnique: true, isReadOnly: false, isUpdatedAt: false, hasDefaultValue: true, default: { name: 'uuid', args: [] } }
      ],
      idField: { name: 'id', type: 'String', kind: 'scalar', isId: true, isRequired: true, isList: false, isUnique: true, isReadOnly: false, isUpdatedAt: false, hasDefaultValue: true, default: { name: 'uuid', args: [] } }
    })

    const generator = new ControllerGeneratorV2(model, 'express')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('const id = req.params.id')
    expect(output.content).not.toContain('parseInt(req.params.id')
    expect(output.content).not.toContain('if (isNaN(id))')
  })

  it('should generate barrel export', () => {
    const model = createMockModel()
    const generator = new ControllerGeneratorV2(model, 'express')
    const barrel = generator.generateBarrel()

    expect(barrel.filename).toBe('index.ts')
    expect(barrel.content).toContain("export * from './todo.controller.js'")
  })
})

describe('ControllerGeneratorV2 - Fastify', () => {
  it('should generate Fastify controller with all handlers', () => {
    const model = createMockModel()
    const generator = new ControllerGeneratorV2(model, 'fastify')
    const outputs = generator.generate()

    expect(outputs).toHaveLength(1)
    const output = outputs[0]

    expect(output.filename).toBe('todo.controller.ts')
    expect(output.content).toContain('export const listTodos')
    expect(output.content).toContain('export const getTodo')
    expect(output.content).toContain('export const createTodo')
    expect(output.content).toContain('export const updateTodo')
    expect(output.content).toContain('export const deleteTodo')
    expect(output.content).toContain('export const countTodos')
  })

  it('should import Fastify types', () => {
    const model = createMockModel()
    const generator = new ControllerGeneratorV2(model, 'fastify')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain("import type { FastifyRequest, FastifyReply } from 'fastify'")
  })

  it('should use Fastify request/reply pattern', () => {
    const model = createMockModel()
    const generator = new ControllerGeneratorV2(model, 'fastify')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('request: FastifyRequest')
    expect(output.content).toContain('reply: FastifyReply')
    expect(output.content).toContain('request.query')
    expect(output.content).toContain('request.params')
    expect(output.content).toContain('request.body')
    expect(output.content).toContain('reply.code(')
    expect(output.content).toContain('reply.send(')
  })

  it('should use Fastify status code methods', () => {
    const model = createMockModel()
    const generator = new ControllerGeneratorV2(model, 'fastify')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('reply.code(400).send(')
    expect(output.content).toContain('reply.code(404).send(')
    expect(output.content).toContain('reply.code(201).send(')
    expect(output.content).toContain('reply.code(204).send(')
  })

  it('should handle Fastify typed params', () => {
    const model = createMockModel()
    const generator = new ControllerGeneratorV2(model, 'fastify')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('FastifyRequest<{ Params: { id: string } }>')
  })

  it('should return values directly (Fastify pattern)', () => {
    const model = createMockModel()
    const generator = new ControllerGeneratorV2(model, 'fastify')
    const outputs = generator.generate()
    const output = outputs[0]

    // Fastify allows returning values directly for 200 responses
    expect(output.content).toContain('return result')
    expect(output.content).toContain('return item')
  })
})

