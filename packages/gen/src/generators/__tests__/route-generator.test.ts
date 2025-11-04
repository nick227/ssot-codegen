import { describe, it, expect } from 'vitest'
import { RouteGeneratorV2 } from '../route-generator-v2.js'
import { createMockModel } from './fixtures.js'

describe('RouteGeneratorV2 - Express', () => {
  it('should generate Express routes with Router', () => {
    const model = createMockModel()
    const generator = new RouteGeneratorV2(model, 'express')
    const outputs = generator.generate()

    expect(outputs).toHaveLength(1)
    const output = outputs[0]

    expect(output.filename).toBe('todo.routes.ts')
    expect(output.modelName).toBe('Todo')
    expect(output.layer).toBe('routes')
  })

  it('should import Express Router and controller', () => {
    const model = createMockModel()
    const generator = new RouteGeneratorV2(model, 'express')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain("import { Router } from 'express'")
    expect(output.content).toContain("import * as todoController from '@gen/controllers/todo'")
  })

  it('should create and export Router instance', () => {
    const model = createMockModel()
    const generator = new RouteGeneratorV2(model, 'express')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('export const todoRouter = Router()')
  })

  it('should define all CRUD routes', () => {
    const model = createMockModel()
    const generator = new RouteGeneratorV2(model, 'express')
    const outputs = generator.generate()
    const output = outputs[0]

    // GET routes
    expect(output.content).toContain("todoRouter.get('/', todoController.listTodos)")
    expect(output.content).toContain("todoRouter.get('/:id', todoController.getTodo)")
    expect(output.content).toContain("todoRouter.get('/meta/count', todoController.countTodos)")

    // POST route
    expect(output.content).toContain("todoRouter.post('/', todoController.createTodo)")

    // PUT/PATCH routes
    expect(output.content).toContain("todoRouter.put('/:id', todoController.updateTodo)")
    expect(output.content).toContain("todoRouter.patch('/:id', todoController.updateTodo)")

    // DELETE route
    expect(output.content).toContain("todoRouter.delete('/:id', todoController.deleteTodo)")
  })

  it('should include route comments', () => {
    const model = createMockModel()
    const generator = new RouteGeneratorV2(model, 'express')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('// List all Todo records')
    expect(output.content).toContain('// Get Todo by ID')
    expect(output.content).toContain('// Create Todo')
    expect(output.content).toContain('// Update Todo')
    expect(output.content).toContain('// Delete Todo')
    expect(output.content).toContain('// Count Todo records')
  })

  it('should generate barrel export', () => {
    const model = createMockModel()
    const generator = new RouteGeneratorV2(model, 'express')
    const barrel = generator.generateBarrel()

    expect(barrel.filename).toBe('index.ts')
    expect(barrel.content).toContain("export * from './todo.routes.js'")
  })
})

describe('RouteGeneratorV2 - Fastify', () => {
  it('should generate Fastify routes plugin', () => {
    const model = createMockModel()
    const generator = new RouteGeneratorV2(model, 'fastify')
    const outputs = generator.generate()

    expect(outputs).toHaveLength(1)
    const output = outputs[0]

    expect(output.filename).toBe('todo.routes.ts')
    expect(output.modelName).toBe('Todo')
    expect(output.layer).toBe('routes')
  })

  it('should import Fastify types and controller', () => {
    const model = createMockModel()
    const generator = new RouteGeneratorV2(model, 'fastify')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain("import type { FastifyInstance } from 'fastify'")
    expect(output.content).toContain("import * as todoController from '@gen/controllers/todo'")
  })

  it('should export async plugin function', () => {
    const model = createMockModel()
    const generator = new RouteGeneratorV2(model, 'fastify')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('export async function todoRoutes(fastify: FastifyInstance)')
  })

  it('should define all CRUD routes with Fastify API', () => {
    const model = createMockModel()
    const generator = new RouteGeneratorV2(model, 'fastify')
    const outputs = generator.generate()
    const output = outputs[0]

    // GET routes
    expect(output.content).toContain("fastify.get('/', todoController.listTodos)")
    expect(output.content).toContain("fastify.get<{ Params: { id: string } }>('/:id', todoController.getTodo)")
    expect(output.content).toContain("fastify.get('/meta/count', todoController.countTodos)")

    // POST route
    expect(output.content).toContain("fastify.post('/', todoController.createTodo)")

    // PUT/PATCH routes
    expect(output.content).toContain("fastify.put<{ Params: { id: string } }>('/:id', todoController.updateTodo)")
    expect(output.content).toContain("fastify.patch<{ Params: { id: string } }>('/:id', todoController.updateTodo)")

    // DELETE route
    expect(output.content).toContain("fastify.delete<{ Params: { id: string } }>('/:id', todoController.deleteTodo)")
  })

  it('should use Fastify typed route parameters', () => {
    const model = createMockModel()
    const generator = new RouteGeneratorV2(model, 'fastify')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('Params: { id: string }')
  })

  it('should include route comments', () => {
    const model = createMockModel()
    const generator = new RouteGeneratorV2(model, 'fastify')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('// List all Todo records')
    expect(output.content).toContain('// Get Todo by ID')
    expect(output.content).toContain('// Create Todo')
    expect(output.content).toContain('// Update Todo')
    expect(output.content).toContain('// Delete Todo')
    expect(output.content).toContain('// Count Todo records')
  })

  it('should use async function syntax', () => {
    const model = createMockModel()
    const generator = new RouteGeneratorV2(model, 'fastify')
    const outputs = generator.generate()
    const output = outputs[0]

    expect(output.content).toContain('export async function todoRoutes(')
  })
})

describe('RouteGeneratorV2 - Framework Differences', () => {
  it('should generate different route patterns for Express vs Fastify', () => {
    const model = createMockModel()
    
    const expressGen = new RouteGeneratorV2(model, 'express')
    const fastifyGen = new RouteGeneratorV2(model, 'fastify')
    
    const expressOutput = expressGen.generate()[0]
    const fastifyOutput = fastifyGen.generate()[0]

    // Express uses Router instance
    expect(expressOutput.content).toContain('Router()')
    expect(fastifyOutput.content).not.toContain('Router()')

    // Fastify uses async plugin function
    expect(fastifyOutput.content).toContain('async function')
    expect(fastifyOutput.content).toContain('FastifyInstance')

    // Different method registration
    expect(expressOutput.content).toContain('todoRouter.get(')
    expect(fastifyOutput.content).toContain('fastify.get(')
  })
})

