# Roadmap: From Stubs to Full Working Code

**Current Status:** Infrastructure ready, code generation is stubs  
**Goal:** Generate actual, full, working, tested code  
**Timeline Estimate:** 40-60 hours of focused development

---

## 🔴 The Problem: Why Code is Still Stubs

### Current State

**What We Have:**
```typescript
// Generated DTO - STUB
export interface TodoCreateDTO { /* fields */ }

// Generated Controller - STUB
export const createTodo = (input: TodoCreateDTO) => {}

// Generated Validator - STUB
// zod schema for TodoCreate

// Generated Service - STUB
export const todoService = {}
```

**Root Cause:**
```typescript
// packages/gen/src/index.ts line 90
write(dtoFs, `// @generated\nexport interface ${modelName}CreateDTO { /* fields */ }\n`)
//                                                              ^^^^^^^^^^^ HARDCODED STUB
```

### Why This Happens

1. **No Real DMMF Parsing**
   ```typescript
   // Current POC stub
   const stubDMMF = {
     models: [
       { name: 'Todo', fields: [] }  // ← NO FIELD DATA
     ]
   }
   ```

2. **Hardcoded Template Strings**
   - Not using Handlebars templates in `packages/templates-default/`
   - Writing literal stub strings instead
   - No field type mapping
   - No relationship analysis

3. **Missing Business Logic**
   - No CRUD implementation
   - No Prisma queries
   - No validation logic
   - No error handling

---

## 📋 Work Required: Complete Breakdown

### **Phase 1: DMMF Integration** 🔴 CRITICAL
**Effort:** 8-12 hours

#### 1.1 Real DMMF Parsing
**Current:**
```typescript
const stubDMMF = {
  models: [{ name: 'Todo', fields: [] }]
}
```

**Needed:**
```typescript
import { getDMMF } from '@prisma/internals'
import { parseFields, analyzeRelationships } from './dmmf-parser.js'

// Parse real Prisma schema
const dmmf = await getDMMF({ datamodelPath: './prisma/schema.prisma' })

// Extract everything
const parsed = {
  models: dmmf.datamodel.models.map(model => ({
    name: model.name,
    fields: model.fields.map(field => ({
      name: field.name,
      type: field.type,
      kind: field.kind,  // scalar, object, enum
      isList: field.isList,
      isRequired: field.isRequired,
      isUnique: field.isUnique,
      isId: field.isId,
      hasDefaultValue: field.hasDefaultValue,
      default: field.default,
      relationName: field.relationName,
      relationFromFields: field.relationFromFields,
      relationToFields: field.relationToFields,
      documentation: field.documentation
    })),
    primaryKey: model.primaryKey,
    uniqueFields: model.uniqueFields,
    documentation: model.documentation
  })),
  enums: dmmf.datamodel.enums
}
```

**Files to Create:**
- `packages/gen/src/dmmf-parser.ts` (300 lines)
- `packages/gen/src/type-mapper.ts` (150 lines)
- `packages/gen/src/relationship-analyzer.ts` (200 lines)

**Work Items:**
- [ ] Integrate `@prisma/internals` for real DMMF
- [ ] Parse all field types (String, Int, DateTime, Boolean, etc.)
- [ ] Map Prisma types → TypeScript types
- [ ] Map Prisma types → Zod types
- [ ] Extract field constraints (required, unique, default)
- [ ] Parse relationships (1:1, 1:N, M:N)
- [ ] Parse enums
- [ ] Parse model-level annotations (@@unique, @@index)
- [ ] Extract field documentation/comments

---

### **Phase 2: DTO Generation** 🟡 HIGH PRIORITY
**Effort:** 6-8 hours

#### 2.1 TypeScript Interface Generation

**Current:**
```typescript
export interface TodoCreateDTO { /* fields */ }
```

**Needed:**
```typescript
export interface TodoCreateDTO {
  title: string
  completed?: boolean
  description?: string | null
  dueDate?: Date
}

export interface TodoUpdateDTO {
  title?: string
  completed?: boolean
  description?: string | null
  dueDate?: Date
}

export interface TodoReadDTO {
  id: number
  title: string
  completed: boolean
  description: string | null
  dueDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface TodoListDTO extends TodoReadDTO {}

export interface TodoQueryDTO {
  skip?: number
  take?: number
  orderBy?: {
    [K in keyof TodoReadDTO]?: 'asc' | 'desc'
  }
  where?: {
    title?: { contains?: string; equals?: string }
    completed?: boolean
    createdAt?: { gte?: Date; lte?: Date }
  }
}
```

**Implementation:**
```typescript
// packages/gen/src/generators/dto-generator.ts

function generateCreateDTO(model: ParsedModel): string {
  const fields = model.fields
    .filter(f => !f.isId && !f.isReadOnly && !f.isRelation)
    .map(field => {
      const optional = !field.isRequired || field.hasDefaultValue ? '?' : ''
      const nullable = !field.isRequired ? ' | null' : ''
      return `  ${field.name}${optional}: ${mapType(field.type)}${nullable}`
    })
    .join('\n')
  
  return `export interface ${model.name}CreateDTO {\n${fields}\n}`
}

function generateUpdateDTO(model: ParsedModel): string {
  // All fields optional for PATCH
  const fields = model.fields
    .filter(f => !f.isId && !f.isReadOnly && !f.isRelation)
    .map(field => {
      const nullable = !field.isRequired ? ' | null' : ''
      return `  ${field.name}?: ${mapType(field.type)}${nullable}`
    })
    .join('\n')
  
  return `export interface ${model.name}UpdateDTO {\n${fields}\n}`
}

function generateReadDTO(model: ParsedModel): string {
  // All fields from DB
  const fields = model.fields
    .filter(f => !f.isRelation)
    .map(field => {
      const optional = !field.isRequired ? '?' : ''
      const nullable = !field.isRequired ? ' | null' : ''
      return `  ${field.name}${optional}: ${mapType(field.type)}${nullable}`
    })
    .join('\n')
  
  return `export interface ${model.name}ReadDTO {\n${fields}\n}`
}
```

**Work Items:**
- [ ] Generate CreateDTO (fields for insert)
- [ ] Generate UpdateDTO (all optional for PATCH)
- [ ] Generate ReadDTO (all fields from DB)
- [ ] Generate ListDTO (with pagination meta)
- [ ] Generate QueryDTO (for filtering/sorting)
- [ ] Handle optional vs nullable semantics
- [ ] Handle Date serialization
- [ ] Handle enum types
- [ ] Handle nested relations (include/select)
- [ ] Generate proper TypeScript types

---

### **Phase 3: Zod Validator Generation** 🟡 HIGH PRIORITY
**Effort:** 8-10 hours

#### 3.1 Generate Real Zod Schemas

**Current:**
```typescript
// zod schema for TodoCreate
```

**Needed:**
```typescript
import { z } from 'zod'

export const TodoCreateSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  completed: z.boolean()
    .optional()
    .default(false),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .nullable()
    .optional(),
  dueDate: z.coerce.date()
    .optional()
})

export const TodoUpdateSchema = TodoCreateSchema.partial()

export const TodoQuerySchema = z.object({
  skip: z.coerce.number().min(0).optional(),
  take: z.coerce.number().min(1).max(100).optional().default(20),
  orderBy: z.object({
    title: z.enum(['asc', 'desc']).optional(),
    createdAt: z.enum(['asc', 'desc']).optional(),
  }).optional(),
  where: z.object({
    title: z.object({
      contains: z.string().optional(),
      equals: z.string().optional(),
    }).optional(),
    completed: z.boolean().optional(),
  }).optional()
})

export type TodoCreateInput = z.infer<typeof TodoCreateSchema>
export type TodoUpdateInput = z.infer<typeof TodoUpdateSchema>
export type TodoQueryInput = z.infer<typeof TodoQuerySchema>
```

**Type Mapping:**
```typescript
function mapPrismaTypeToZod(field: ParsedField): string {
  const baseZod = (() => {
    switch (field.type) {
      case 'String': return 'z.string()'
      case 'Int': return 'z.number().int()'
      case 'Float': return 'z.number()'
      case 'Boolean': return 'z.boolean()'
      case 'DateTime': return 'z.coerce.date()'
      case 'Json': return 'z.record(z.any())'
      case 'Bytes': return 'z.instanceof(Buffer)'
      default:
        if (isEnum(field.type)) return `z.nativeEnum(${field.type})`
        return 'z.unknown()'
    }
  })()
  
  let validation = baseZod
  
  // Add constraints
  if (field.type === 'String' && field.maxLength) {
    validation += `.max(${field.maxLength})`
  }
  
  if (field.isUnique) {
    validation += ` // unique`
  }
  
  // Handle optional/nullable
  if (!field.isRequired) {
    if (field.hasDefaultValue) {
      validation += `.optional().default(${JSON.stringify(field.default)})`
    } else {
      validation += '.nullable().optional()'
    }
  }
  
  return validation
}
```

**Work Items:**
- [ ] Map all Prisma types to Zod schemas
- [ ] Generate Create validators
- [ ] Generate Update validators (partial)
- [ ] Generate Query validators (pagination, filters)
- [ ] Add string constraints (min, max, email, url, uuid)
- [ ] Add number constraints (min, max, positive, int)
- [ ] Add date constraints (min, max)
- [ ] Handle enum validation
- [ ] Handle array validation
- [ ] Add custom error messages
- [ ] Generate type inference exports
- [ ] Handle nested object validation

---

### **Phase 4: Controller Generation** 🔴 CRITICAL
**Effort:** 10-12 hours

#### 4.1 Full CRUD Controllers

**Current:**
```typescript
export const createTodo = (input: TodoCreateDTO) => {}
```

**Needed:**
```typescript
import type { Request, Response } from 'express'
import { TodoCreateSchema, TodoUpdateSchema, TodoQuerySchema } from '@gen/validators/todo'
import { todoService } from '@gen/services/todo'
import { handleError } from '@gen/shared/error-handler'

export const listTodos = async (req: Request, res: Response) => {
  try {
    const query = TodoQuerySchema.parse(req.query)
    const result = await todoService.list(query)
    res.json(result)
  } catch (error) {
    handleError(error, res)
  }
}

export const getTodo = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' })
    }
    
    const todo = await todoService.findById(id)
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' })
    }
    
    res.json(todo)
  } catch (error) {
    handleError(error, res)
  }
}

export const createTodo = async (req: Request, res: Response) => {
  try {
    const data = TodoCreateSchema.parse(req.body)
    const todo = await todoService.create(data)
    res.status(201).json(todo)
  } catch (error) {
    handleError(error, res)
  }
}

export const updateTodo = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' })
    }
    
    const data = TodoUpdateSchema.parse(req.body)
    const todo = await todoService.update(id, data)
    
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' })
    }
    
    res.json(todo)
  } catch (error) {
    handleError(error, res)
  }
}

export const deleteTodo = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' })
    }
    
    const deleted = await todoService.delete(id)
    
    if (!deleted) {
      return res.status(404).json({ error: 'Todo not found' })
    }
    
    res.status(204).send()
  } catch (error) {
    handleError(error, res)
  }
}
```

**Work Items:**
- [ ] Generate list/index controller
- [ ] Generate show/get controller
- [ ] Generate create controller
- [ ] Generate update controller
- [ ] Generate delete controller
- [ ] Add Zod validation
- [ ] Add error handling
- [ ] Add ID parsing/validation
- [ ] Add 404 handling
- [ ] Add proper HTTP status codes
- [ ] Add pagination support
- [ ] Add filtering support
- [ ] Add sorting support
- [ ] Handle Prisma errors
- [ ] Handle validation errors

---

### **Phase 5: Service Layer Generation** 🟡 HIGH PRIORITY
**Effort:** 10-12 hours

#### 5.1 Real Prisma CRUD Operations

**Current:**
```typescript
export const todoService = {}
```

**Needed:**
```typescript
import prisma from '@/db'
import type { TodoCreateDTO, TodoUpdateDTO, TodoQueryDTO } from '@gen/contracts/todo'
import type { Prisma } from '@prisma/client'

export const todoService = {
  async list(query: TodoQueryDTO) {
    const { skip = 0, take = 20, orderBy, where } = query
    
    const [items, total] = await Promise.all([
      prisma.todo.findMany({
        skip,
        take,
        orderBy: orderBy as Prisma.TodoOrderByWithRelationInput,
        where: where as Prisma.TodoWhereInput,
      }),
      prisma.todo.count({
        where: where as Prisma.TodoWhereInput,
      })
    ])
    
    return {
      data: items,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total
      }
    }
  },
  
  async findById(id: number) {
    return prisma.todo.findUnique({
      where: { id }
    })
  },
  
  async create(data: TodoCreateDTO) {
    return prisma.todo.create({
      data
    })
  },
  
  async update(id: number, data: TodoUpdateDTO) {
    try {
      return await prisma.todo.update({
        where: { id },
        data
      })
    } catch (error) {
      if (error.code === 'P2025') {
        return null  // Not found
      }
      throw error
    }
  },
  
  async delete(id: number) {
    try {
      await prisma.todo.delete({
        where: { id }
      })
      return true
    } catch (error) {
      if (error.code === 'P2025') {
        return false  // Not found
      }
      throw error
    }
  },
  
  async count(where?: Prisma.TodoWhereInput) {
    return prisma.todo.count({ where })
  },
  
  async exists(id: number) {
    const count = await prisma.todo.count({
      where: { id }
    })
    return count > 0
  }
}
```

**With Relationships:**
```typescript
// For models with relationships
export const postService = {
  async listWithAuthor(query: PostQueryDTO) {
    return prisma.post.findMany({
      ...query,
      include: {
        author: true,
        comments: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  },
  
  async createWithRelations(data: PostCreateDTO) {
    return prisma.post.create({
      data: {
        ...data,
        author: {
          connect: { id: data.authorId }
        },
        tags: {
          connect: data.tagIds?.map(id => ({ id }))
        }
      },
      include: {
        author: true,
        tags: true
      }
    })
  }
}
```

**Work Items:**
- [ ] Generate list method with pagination
- [ ] Generate findById method
- [ ] Generate create method
- [ ] Generate update method
- [ ] Generate delete method
- [ ] Generate count method
- [ ] Generate exists method
- [ ] Handle Prisma errors (P2025, P2002, etc.)
- [ ] Generate relationship handling (connect, disconnect)
- [ ] Generate include/select options
- [ ] Generate where clause builders
- [ ] Generate orderBy builders
- [ ] Add transaction support
- [ ] Add batch operations
- [ ] Add soft delete support (if @deletedAt field exists)

---

### **Phase 6: Route Generation** 🟢 MEDIUM PRIORITY
**Effort:** 4-6 hours

#### 6.1 Real Express Routes

**Current:**
```typescript
export const todoRoutes = ['/todo']
```

**Needed:**
```typescript
import { Router } from 'express'
import * as todoController from '@gen/controllers/todo'

export const todoRouter = Router()

todoRouter.get('/', todoController.listTodos)
todoRouter.get('/:id', todoController.getTodo)
todoRouter.post('/', todoController.createTodo)
todoRouter.put('/:id', todoController.updateTodo)
todoRouter.patch('/:id', todoController.updateTodo)
todoRouter.delete('/:id', todoController.deleteTodo)

// Additional routes
todoRouter.get('/count', todoController.countTodos)
todoRouter.post('/bulk', todoController.bulkCreateTodos)
```

**With Middleware:**
```typescript
import { Router } from 'express'
import * as todoController from '@gen/controllers/todo'
import { authenticate } from '@/middleware/auth'
import { rateLimit } from '@/middleware/rate-limit'

export const todoRouter = Router()

// Apply auth to all routes
todoRouter.use(authenticate)

// List with rate limiting
todoRouter.get('/', 
  rateLimit({ max: 100, windowMs: 60000 }),
  todoController.listTodos
)

// Protected create
todoRouter.post('/', 
  rateLimit({ max: 20, windowMs: 60000 }),
  todoController.createTodo
)
```

**Work Items:**
- [ ] Generate Router setup
- [ ] Generate GET /list route
- [ ] Generate GET /:id route
- [ ] Generate POST / route
- [ ] Generate PUT /:id route
- [ ] Generate PATCH /:id route
- [ ] Generate DELETE /:id route
- [ ] Generate additional routes (count, bulk, etc.)
- [ ] Add middleware hooks
- [ ] Add auth middleware integration
- [ ] Add rate limiting
- [ ] Add validation middleware
- [ ] Handle route prefixes
- [ ] Generate route documentation comments

---

### **Phase 7: DataLoader Generation** 🟢 MEDIUM PRIORITY
**Effort:** 4-6 hours

#### 7.1 N+1 Query Prevention

**Current:**
```typescript
export const todoLoader = {}
```

**Needed:**
```typescript
import DataLoader from 'dataloader'
import prisma from '@/db'
import type { Todo } from '@prisma/client'

export const todoLoader = {
  byId: new DataLoader<number, Todo | null>(async (ids) => {
    const todos = await prisma.todo.findMany({
      where: { id: { in: [...ids] } }
    })
    
    const todoMap = new Map(todos.map(t => [t.id, t]))
    return ids.map(id => todoMap.get(id) || null)
  }),
  
  byUserId: new DataLoader<number, Todo[]>(async (userIds) => {
    const todos = await prisma.todo.findMany({
      where: { userId: { in: [...userIds] } }
    })
    
    const grouped = new Map<number, Todo[]>()
    for (const todo of todos) {
      if (!grouped.has(todo.userId)) {
        grouped.set(todo.userId, [])
      }
      grouped.get(todo.userId)!.push(todo)
    }
    
    return userIds.map(id => grouped.get(id) || [])
  })
}
```

**Work Items:**
- [ ] Generate byId loader
- [ ] Generate loaders for foreign keys
- [ ] Generate loaders for unique fields
- [ ] Add batching logic
- [ ] Add caching configuration
- [ ] Handle null results
- [ ] Generate loader factory
- [ ] Add loader context helper

---

### **Phase 8: Test Generation** 🔴 CRITICAL
**Effort:** 12-15 hours

#### 8.1 Integration Tests

**Current:**
None

**Needed:**
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '@/app'
import prisma from '@/db'

describe('Todo API', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect()
  })
  
  afterAll(async () => {
    // Cleanup
    await prisma.todo.deleteMany()
    await prisma.$disconnect()
  })
  
  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({
          title: 'Test Todo',
          completed: false
        })
        .expect(201)
      
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        title: 'Test Todo',
        completed: false,
        createdAt: expect.any(String)
      })
    })
    
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({})
        .expect(400)
      
      expect(response.body.error).toBeDefined()
    })
  })
  
  describe('GET /api/todos', () => {
    it('should list todos with pagination', async () => {
      // Create test data
      await prisma.todo.createMany({
        data: [
          { title: 'Todo 1', completed: false },
          { title: 'Todo 2', completed: true }
        ]
      })
      
      const response = await request(app)
        .get('/api/todos?take=10&skip=0')
        .expect(200)
      
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.meta).toMatchObject({
        total: expect.any(Number),
        skip: 0,
        take: 10
      })
    })
  })
  
  describe('GET /api/todos/:id', () => {
    it('should get a todo by id', async () => {
      const todo = await prisma.todo.create({
        data: { title: 'Test', completed: false }
      })
      
      const response = await request(app)
        .get(`/api/todos/${todo.id}`)
        .expect(200)
      
      expect(response.body.id).toBe(todo.id)
    })
    
    it('should return 404 for non-existent todo', async () => {
      await request(app)
        .get('/api/todos/99999')
        .expect(404)
    })
  })
  
  describe('PUT /api/todos/:id', () => {
    it('should update a todo', async () => {
      const todo = await prisma.todo.create({
        data: { title: 'Test', completed: false }
      })
      
      const response = await request(app)
        .put(`/api/todos/${todo.id}`)
        .send({ completed: true })
        .expect(200)
      
      expect(response.body.completed).toBe(true)
    })
  })
  
  describe('DELETE /api/todos/:id', () => {
    it('should delete a todo', async () => {
      const todo = await prisma.todo.create({
        data: { title: 'Test', completed: false }
      })
      
      await request(app)
        .delete(`/api/todos/${todo.id}`)
        .expect(204)
      
      const deleted = await prisma.todo.findUnique({
        where: { id: todo.id }
      })
      expect(deleted).toBeNull()
    })
  })
})
```

**Unit Tests:**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { todoService } from '@gen/services/todo'
import prisma from '@/db'

vi.mock('@/db', () => ({
  default: {
    todo: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    }
  }
}))

describe('TodoService', () => {
  describe('list', () => {
    it('should return paginated results', async () => {
      const mockTodos = [
        { id: 1, title: 'Test', completed: false }
      ]
      
      vi.mocked(prisma.todo.findMany).mockResolvedValue(mockTodos)
      vi.mocked(prisma.todo.count).mockResolvedValue(1)
      
      const result = await todoService.list({ skip: 0, take: 20 })
      
      expect(result.data).toEqual(mockTodos)
      expect(result.meta.total).toBe(1)
    })
  })
})
```

**Work Items:**
- [ ] Generate integration tests for each endpoint
- [ ] Generate unit tests for services
- [ ] Generate test fixtures/factories
- [ ] Generate test database setup
- [ ] Generate mock data builders
- [ ] Test CRUD operations
- [ ] Test validation errors
- [ ] Test 404 errors
- [ ] Test authentication (if enabled)
- [ ] Test relationships
- [ ] Test pagination
- [ ] Test filtering
- [ ] Test sorting
- [ ] Generate performance tests
- [ ] Generate load tests

---

### **Phase 9: OpenAPI Generation** 🟡 HIGH PRIORITY
**Effort:** 6-8 hours

#### 9.1 Complete OpenAPI Spec

**Current:**
```json
{
  "openapi": "3.1.0",
  "paths": {
    "/todo": {
      "get": { "summary": "List Todo" }
    }
  }
}
```

**Needed:**
```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Generated API",
    "version": "1.0.0",
    "description": "Auto-generated from Prisma schema"
  },
  "servers": [
    { "url": "http://localhost:3000/api", "description": "Development" }
  ],
  "paths": {
    "/todos": {
      "get": {
        "operationId": "listTodos",
        "summary": "List all todos",
        "tags": ["Todo"],
        "parameters": [
          {
            "name": "skip",
            "in": "query",
            "schema": { "type": "integer", "minimum": 0, "default": 0 }
          },
          {
            "name": "take",
            "in": "query",
            "schema": { "type": "integer", "minimum": 1, "maximum": 100, "default": 20 }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": { "$ref": "#/components/schemas/TodoReadDTO" }
                    },
                    "meta": { "$ref": "#/components/schemas/PaginationMeta" }
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "operationId": "createTodo",
        "summary": "Create a new todo",
        "tags": ["Todo"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/TodoCreateDTO" }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Created",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/TodoReadDTO" }
              }
            }
          },
          "400": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/todos/{id}": {
      "get": {
        "operationId": "getTodo",
        "summary": "Get a todo by ID",
        "tags": ["Todo"],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "integer" }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/TodoReadDTO" }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "TodoCreateDTO": {
        "type": "object",
        "required": ["title"],
        "properties": {
          "title": { "type": "string", "minLength": 1, "maxLength": 200 },
          "completed": { "type": "boolean", "default": false },
          "description": { "type": "string", "maxLength": 1000, "nullable": true },
          "dueDate": { "type": "string", "format": "date-time", "nullable": true }
        }
      },
      "TodoReadDTO": {
        "type": "object",
        "required": ["id", "title", "completed", "createdAt", "updatedAt"],
        "properties": {
          "id": { "type": "integer" },
          "title": { "type": "string" },
          "completed": { "type": "boolean" },
          "description": { "type": "string", "nullable": true },
          "dueDate": { "type": "string", "format": "date-time", "nullable": true },
          "createdAt": { "type": "string", "format": "date-time" },
          "updatedAt": { "type": "string", "format": "date-time" }
        }
      },
      "PaginationMeta": {
        "type": "object",
        "properties": {
          "total": { "type": "integer" },
          "skip": { "type": "integer" },
          "take": { "type": "integer" },
          "hasMore": { "type": "boolean" }
        }
      },
      "ErrorResponse": {
        "type": "object",
        "properties": {
          "error": { "type": "string" },
          "details": { "type": "array", "items": { "type": "object" } }
        }
      }
    }
  }
}
```

**Work Items:**
- [ ] Generate complete paths for all CRUD operations
- [ ] Generate all request/response schemas
- [ ] Generate parameter definitions
- [ ] Generate error responses
- [ ] Generate examples
- [ ] Generate security schemes
- [ ] Generate tags
- [ ] Add operation IDs
- [ ] Add descriptions from schema comments
- [ ] Generate pagination schemas
- [ ] Generate filter schemas
- [ ] Validate OpenAPI spec

---

### **Phase 10: Template System Integration** 🔴 CRITICAL
**Effort:** 8-10 hours

#### 10.1 Use Handlebars Templates

**Current:** Hardcoded strings in code
**Needed:** Use templates in `packages/templates-default/src/`

**Template Structure:**
```
packages/templates-default/src/
├── contracts/
│   └── dto.hbs           ← Use this
├── validators/
│   └── zod.hbs           ← Use this
├── controllers/
│   └── controller.hbs    ← Use this
├── services/
│   └── service.hbs       ← Use this
└── tests/
    └── contracts.hbs     ← Use this
```

**Implementation:**
```typescript
import Handlebars from 'handlebars'
import fs from 'node:fs'
import path from 'node:path'

// Load templates
const templates = {
  dto: Handlebars.compile(
    fs.readFileSync('./templates/contracts/dto.hbs', 'utf8')
  ),
  validator: Handlebars.compile(
    fs.readFileSync('./templates/validators/zod.hbs', 'utf8')
  ),
  controller: Handlebars.compile(
    fs.readFileSync('./templates/controllers/controller.hbs', 'utf8')
  ),
  service: Handlebars.compile(
    fs.readFileSync('./templates/services/service.hbs', 'utf8')
  )
}

// Use templates
function generateDTO(model: ParsedModel): string {
  return templates.dto({
    modelName: model.name,
    fields: model.fields.map(f => ({
      name: f.name,
      type: mapType(f.type),
      optional: !f.isRequired,
      nullable: !f.isRequired
    }))
  })
}
```

**Work Items:**
- [ ] Integrate Handlebars
- [ ] Create template loader
- [ ] Update all generators to use templates
- [ ] Create template helpers
- [ ] Create template partials
- [ ] Add template caching
- [ ] Support custom templates
- [ ] Template validation

---

## 📊 Summary: Work Breakdown

### By Phase (Priority Order)

| Phase | Priority | Effort | Dependencies |
|-------|----------|--------|--------------|
| 1. DMMF Integration | 🔴 Critical | 8-12h | None |
| 2. DTO Generation | 🟡 High | 6-8h | Phase 1 |
| 3. Zod Validators | 🟡 High | 8-10h | Phase 1, 2 |
| 4. Controllers | 🔴 Critical | 10-12h | Phase 2, 3 |
| 5. Services | 🟡 High | 10-12h | Phase 1, 2 |
| 6. Routes | 🟢 Medium | 4-6h | Phase 4 |
| 7. DataLoaders | 🟢 Medium | 4-6h | Phase 1 |
| 8. Tests | 🔴 Critical | 12-15h | All above |
| 9. OpenAPI | 🟡 High | 6-8h | Phase 1, 2 |
| 10. Templates | 🔴 Critical | 8-10h | Can parallel with others |

**Total Estimated Effort:** 76-99 hours

### By File Count

- **Core Infrastructure:** 5 new files
- **Generators:** 8 new files
- **Templates:** 6 template files to update
- **Tests:** Test generators
- **Documentation:** Updated guides

**Total New Files:** ~20-25 files

---

## 🎯 Recommended Implementation Order

### **Sprint 1: Foundation** (20-24 hours)
1. ✅ DMMF Integration (Phase 1)
2. ✅ DTO Generation (Phase 2)
3. ✅ Template System (Phase 10)

**Deliverable:** Generate real DTOs with actual fields

### **Sprint 2: Validation & Logic** (26-32 hours)
4. ✅ Zod Validators (Phase 3)
5. ✅ Service Layer (Phase 5)
6. ✅ Controllers (Phase 4)

**Deliverable:** Generate working CRUD operations

### **Sprint 3: Routes & Testing** (20-26 hours)
7. ✅ Routes (Phase 6)
8. ✅ Tests (Phase 8)
9. ✅ DataLoaders (Phase 7)

**Deliverable:** Complete, tested API

### **Sprint 4: Polish** (10-12 hours)
10. ✅ OpenAPI Complete (Phase 9)
11. ✅ Documentation
12. ✅ Examples

**Deliverable:** Production-ready generator

---

## 🚀 Quick Wins (MVP in 2-3 days)

To get a **minimally working generator** fast:

### Day 1 (8 hours)
1. Real DMMF parsing (4h)
2. Basic DTO generation (4h)

### Day 2 (8 hours)
3. Basic Zod validators (4h)
4. Basic Service with Prisma queries (4h)

### Day 3 (8 hours)
5. Basic Controllers (4h)
6. Basic Routes (2h)
7. Wire it all together (2h)

**Result:** Generate actual working CRUD code!

---

## 📝 Implementation Notes

### Key Principles

1. **Parse First, Generate Second**
   - Fully parse DMMF before any generation
   - Build complete type mappings
   - Analyze all relationships

2. **Template-Driven**
   - Use Handlebars for all code generation
   - Avoid string concatenation
   - Support custom templates

3. **Type-Safe**
   - Generate correct TypeScript types
   - Match Prisma types exactly
   - Handle nullable/optional properly

4. **Production-Ready**
   - Error handling everywhere
   - Proper HTTP status codes
   - Transaction support
   - N+1 prevention

5. **Testable**
   - Generate tests for everything
   - Mock-friendly architecture
   - Integration test coverage

---

## ✅ Success Criteria

Generated code should:

- [ ] Compile without errors
- [ ] Pass all linting
- [ ] Pass all generated tests
- [ ] Handle all CRUD operations
- [ ] Validate all inputs
- [ ] Return proper HTTP codes
- [ ] Handle errors gracefully
- [ ] Prevent N+1 queries
- [ ] Support relationships
- [ ] Support pagination
- [ ] Support filtering
- [ ] Support sorting
- [ ] Match OpenAPI spec
- [ ] Be production-ready

---

## 🎓 Conclusion

**Current State:** 85% infrastructure ready, 15% code generation  
**After This Work:** 100% production-ready code generation

**The path forward:**
1. Parse real Prisma schemas
2. Map types correctly
3. Use templates properly
4. Generate full CRUD with validation
5. Generate comprehensive tests
6. Polish OpenAPI spec

**Estimated Timeline:**
- MVP (basic working): 2-3 days
- Complete: 2-3 weeks
- Production-ready: 3-4 weeks

**This transforms SSOT Codegen from a POC into a REAL code generator!**

