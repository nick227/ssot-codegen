# 🧪 Test Utilities & Fixtures Guide

**Date:** November 5, 2025  
**Version:** 0.4.0

---

## 📚 Overview

This guide documents the comprehensive test utilities and fixtures created to improve test quality, maintainability, and developer experience across the SSOT Codegen project.

---

## 🗂️ Structure

```
packages/gen/src/__tests__/
├── test-helpers.ts           # Core testing utilities
├── fixture-builders.ts       # Fluent API for building test data
├── snapshot-helpers.ts       # Snapshot testing utilities
└── index.ts                  # Barrel export

packages/gen/src/generators/__tests__/
└── fixtures.ts              # Existing fixtures (maintained)

examples/blog-example/tests/
├── helpers/
│   ├── db-helper.ts         # Database management
│   ├── http-helper.ts       # HTTP request helpers
│   ├── factory.ts           # Test data factories
│   └── index.ts             # Barrel export
├── setup.ts                 # Global test setup
└── integration/
    └── setup.ts             # Integration test setup

examples/ecommerce-example/tests/
└── helpers/
    ├── db-helper.ts         # Database management
    ├── factory.ts           # Test data factories
    └── index.ts             # Barrel export
```

---

## 🔧 Core Test Utilities

### Location
`packages/gen/src/__tests__/test-helpers.ts`

### Features

#### Content Assertions
```typescript
import { assertIncludes, assertExcludes } from '@/test-helpers'

// Assert content includes all expected strings
assertIncludes(generatedCode, [
  'export const',
  'import type',
  'async function'
])

// Assert content excludes forbidden patterns
assertExcludes(generatedCode, [
  'console.log',
  'debugger',
  'any;'
])
```

#### Code Validation
```typescript
import { assertValidTypeScript, assertReasonableComplexity } from '@/test-helpers'

// Basic syntax validation
assertValidTypeScript(generatedCode)

// Complexity checks
assertReasonableComplexity(generatedCode, 200) // max 200 LOC
```

#### Code Analysis
```typescript
import { extractImports, extractExports, countLOC } from '@/test-helpers'

const imports = extractImports(code)
// ['express', 'zod', '@prisma/client']

const exports = extractExports(code)
// ['createTodo', 'getTodo', 'TodoService']

const lines = countLOC(code)
// 142 (excluding comments and blank lines)
```

#### Mock Console
```typescript
import { mockConsole } from '@/test-helpers'

const console = mockConsole()

// Run code that logs
myFunction()

expect(console.logs).toContain('Processing...')
expect(console.errors).toHaveLength(0)

console.restore()
```

---

## 🏗️ Fixture Builders

### Location
`packages/gen/src/__tests__/fixture-builders.ts`

### Fluent API for Fields

```typescript
import { FieldBuilder, field } from '@/fixture-builders'

// Using builder
const nameField = new FieldBuilder()
  .name('name')
  .type('String')
  .scalar()
  .required()
  .build()

// Using shortcuts
const emailField = field.string('email')
const ageField = field.int('age')
const activeField = field.boolean('active', true)
const createdField = field.datetime('createdAt', true)
const postsField = field.relation('posts', 'Post', true)
```

### Fluent API for Models

```typescript
import { ModelBuilder, models } from '@/fixture-builders'

// Custom model
const customModel = new ModelBuilder()
  .name('Product')
  .withIntId()
  .addField(field.string('name'))
  .addField(field.int('price'))
  .addField(field.boolean('inStock', true))
  .withTimestamps()
  .build()

// Pre-built templates
const todoModel = models.todo()
const userModel = models.user()
const postModel = models.post()
```

### Advanced Builder Example

```typescript
const complexModel = new ModelBuilder()
  .name('Article')
  .withStringId() // UUID
  .addField(field.string('title'))
  .addField(field.string('slug'))
  .addField(field.string('content', false)) // optional
  .addField(field.boolean('published', false))
  .addField(
    new FieldBuilder()
      .name('status')
      .type('ArticleStatus')
      .enum()
      .required()
      .build()
  )
  .addField(field.relation('author', 'User'))
  .addField(field.relation('comments', 'Comment', true))
  .withTimestamps()
  .build()
```

---

## 📸 Snapshot Helpers

### Location
`packages/gen/src/__tests__/snapshot-helpers.ts`

### Normalize Generated Code

```typescript
import { normalizeGenerated } from '@/snapshot-helpers'

const normalized = normalizeGenerated(generatedCode)
// Removes timestamps, hashes, versions
// Normalizes line endings and whitespace
```

### Extract Code Blocks

```typescript
import { extractCodeBlock } from '@/snapshot-helpers'

const functionBlock = extractCodeBlock(
  code,
  'export const createTodo'
)
```

### Minimal Snapshots

```typescript
import { minimalSnapshot } from '@/snapshot-helpers'

const snapshot = minimalSnapshot(generatedCode)
/*
{
  imports: ['express', 'zod', '@prisma/client'],
  exports: ['createTodo', 'getTodo', 'TodoService'],
  types: ['TodoDTO', 'CreateTodoInput'],
  functions: ['createTodo', 'getTodo', 'listTodos']
}
*/

expect(snapshot).toMatchSnapshot()
```

### Structural Comparison

```typescript
import { structurallyEqual } from '@/snapshot-helpers'

const result = structurallyEqual(actual, expected, {
  ignoreWhitespace: true,
  ignoreComments: true
})

expect(result.equal).toBe(true)
```

---

## 🗄️ Database Helpers

### Location
`examples/*/tests/helpers/db-helper.ts`

### Prisma Management

```typescript
import { getTestPrisma, cleanDatabase, disconnectDatabase } from './helpers'

// Get test instance
const prisma = getTestPrisma()

// Clean all tables (in correct order)
await cleanDatabase(prisma)

// Disconnect
await disconnectDatabase(prisma)
```

### Seed Test Data

```typescript
import { seedTestData } from './helpers'

const { author, category, tag, post } = await seedTestData(prisma)
```

### Transactions

```typescript
import { withTransaction } from './helpers/db-helper'

await withTransaction(prisma, async (tx) => {
  const user = await tx.user.create({ data: { ... } })
  const post = await tx.post.create({ data: { ... } })
  // Auto-rollback on error
})
```

### Reset Sequences

```typescript
import { resetSequences } from './helpers/db-helper'

// Reset auto-increment to 1 (for consistent IDs)
await resetSequences(prisma)
```

---

## 🌐 HTTP Helpers

### Location
`examples/blog-example/tests/helpers/http-helper.ts`

### Authenticated Requests

```typescript
import { createAuthRequest } from './helpers'

const authRequest = createAuthRequest(app, accessToken)

await authRequest.get('/api/posts').expect(200)
await authRequest.post('/api/posts').send({ ... }).expect(201)
await authRequest.delete(`/api/posts/${id}`).expect(204)
```

### User Registration & Login

```typescript
import { registerTestUser, loginUser } from './helpers'

// Register
const { user, tokens } = await registerTestUser(app, {
  email: 'test@example.com',
  password: 'Test123!@#',
  name: 'Test User'
})

// Login
const tokens = await loginUser(app, {
  email: 'test@example.com',
  password: 'Test123!@#'
})
```

### Common Assertions

```typescript
import { assertions } from './helpers'

// Paged response
assertions.hasPagedResponse(response.body)

// Error response
assertions.hasErrorResponse(response.body)

// Pagination metadata
assertions.hasPagination(response.body.meta)

// Valid timestamp
assertions.isValidTimestamp(post.createdAt)
```

### Retry Logic

```typescript
import { retryRequest, wait } from './helpers'

// Retry on failure
const response = await retryRequest(
  () => request(app).get('/api/health'),
  3, // max attempts
  100 // delay ms
)

// Simple delay
await wait(1000)
```

---

## 🏭 Test Data Factories

### Location
`examples/*/tests/helpers/factory.ts`

### Blog Example

```typescript
import { 
  createAuthor, 
  createPost, 
  createCategory, 
  createTag, 
  createComment 
} from './helpers'

// Simple creation
const author = await createAuthor(prisma)
const post = await createPost(prisma, author.id)

// With overrides
const admin = await createAuthor(prisma, {
  email: 'admin@blog.com',
  role: 'ADMIN'
})

const publishedPost = await createPost(prisma, author.id, {
  title: 'My Post',
  published: true
})
```

### Complex Relationships

```typescript
import { createFullPost } from './helpers'

const { author, post, categories, tags, comments } = await createFullPost(
  prisma,
  {
    authorRole: 'ADMIN',
    categoryCount: 3,
    tagCount: 5,
    commentCount: 10,
    published: true
  }
)
```

### E-commerce Example

```typescript
import { 
  createCustomer, 
  createProduct, 
  createCart, 
  addProductToCart,
  createOrder 
} from './helpers'

const customer = await createCustomer(prisma)
const product = await createProduct(prisma, {
  name: 'Laptop',
  price: 999.99,
  stock: 5
})

const cart = await createCart(prisma, customer.id)
await addProductToCart(prisma, cart.id, product.id, 2)

const order = await createOrder(prisma, customer.id, [product.id])
```

---

## 🎯 Usage Examples

### Unit Test with Builders

```typescript
import { describe, it, expect } from 'vitest'
import { models, field } from '@/__tests__'
import { ControllerGeneratorV2 } from '../controller-generator-v2'

describe('ControllerGenerator', () => {
  it('should generate CRUD controller', () => {
    const model = models.todo()
    const generator = new ControllerGeneratorV2(model, 'express')
    const outputs = generator.generate()
    
    expect(outputs).toHaveLength(1)
    expect(outputs[0].filename).toBe('todo.controller.ts')
  })
})
```

### Integration Test with Helpers

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createApp } from '../src/app'
import { 
  getTestPrisma, 
  cleanDatabase, 
  createAuthor, 
  createPost,
  registerTestUser,
  createAuthRequest 
} from './helpers'

describe('Blog API', () => {
  let app: Express
  let prisma: PrismaClient
  
  beforeEach(async () => {
    app = createApp()
    prisma = getTestPrisma()
    await cleanDatabase(prisma)
  })
  
  it('should create post', async () => {
    const { tokens } = await registerTestUser(app, {
      email: 'author@test.com',
      password: 'Pass123!@#'
    })
    
    const authRequest = createAuthRequest(app, tokens.accessToken)
    
    const response = await authRequest
      .post('/api/posts')
      .send({ title: 'Test Post', content: 'Content' })
      .expect(201)
    
    expect(response.body).toHaveProperty('id')
    expect(response.body.title).toBe('Test Post')
  })
})
```

### Snapshot Test

```typescript
import { describe, it, expect } from 'vitest'
import { models, normalizeGenerated, minimalSnapshot } from '@/__tests__'
import { ServiceGenerator } from '../service-generator'

describe('ServiceGenerator Snapshots', () => {
  it('should match service snapshot', () => {
    const model = models.todo()
    const generator = new ServiceGenerator(model)
    const output = generator.generate()[0]
    
    const normalized = normalizeGenerated(output.content)
    expect(normalized).toMatchSnapshot()
  })
  
  it('should match structure snapshot', () => {
    const model = models.user()
    const generator = new ServiceGenerator(model)
    const output = generator.generate()[0]
    
    const snapshot = minimalSnapshot(output.content)
    expect(snapshot).toMatchSnapshot()
  })
})
```

---

## 📋 Best Practices

### 1. Use Builders for Complex Models
```typescript
// ❌ Don't manually create complex mock objects
const model = { name: 'Todo', fields: [...], idField: { ... } }

// ✅ Use builders
const model = new ModelBuilder()
  .name('Todo')
  .withIntId()
  .addField(field.string('title'))
  .build()
```

### 2. Use Factories for Test Data
```typescript
// ❌ Don't manually create DB records
await prisma.author.create({ data: { email: '...', username: '...', ... } })

// ✅ Use factories
const author = await createAuthor(prisma)
```

### 3. Clean Database Between Tests
```typescript
// ✅ Always clean database
beforeEach(async () => {
  await cleanDatabase(prisma)
})
```

### 4. Use Authenticated Request Helper
```typescript
// ❌ Don't repeat auth headers
request(app)
  .get('/api/posts')
  .set('Authorization', `Bearer ${token}`)

// ✅ Use helper
const authRequest = createAuthRequest(app, token)
authRequest.get('/api/posts')
```

### 5. Normalize Generated Code for Snapshots
```typescript
// ❌ Don't snapshot with timestamps
expect(generatedCode).toMatchSnapshot()

// ✅ Normalize first
expect(normalizeGenerated(generatedCode)).toMatchSnapshot()
```

---

## 🔗 Integration with Existing Tests

### Update Generator Tests

```typescript
// Before
import { TODO_MODEL } from './fixtures'

// After
import { models } from '@/__tests__'
const TODO_MODEL = models.todo()
```

### Update Integration Tests

```typescript
// Before
beforeAll(async () => {
  await prisma.author.deleteMany()
  await prisma.post.deleteMany()
  // ...
})

// After
import { cleanDatabase } from './helpers'

beforeEach(async () => {
  await cleanDatabase(prisma)
})
```

---

## 🚀 Running Tests

### With New Utilities

```bash
# Unit tests (generator)
cd packages/gen
pnpm test

# Integration tests (blog)
cd examples/blog-example
pnpm test:integration

# With coverage
pnpm test -- --coverage
```

---

## 📊 Benefits

### Before
- ❌ Duplicated test setup code
- ❌ Manual mock data creation
- ❌ Inconsistent test patterns
- ❌ Hard to maintain tests
- ❌ No reusability

### After
- ✅ DRY test code
- ✅ Fluent API for fixtures
- ✅ Consistent patterns
- ✅ Easy to maintain
- ✅ Highly reusable
- ✅ Better developer experience
- ✅ Faster test writing

---

## 🎯 Next Steps

1. **Update Existing Tests** - Refactor to use new utilities
2. **Add More Factories** - Create factories for all models
3. **Document Examples** - Add more usage examples
4. **Create Video Tutorial** - Show utilities in action
5. **Add to CI/CD** - Integrate with automated testing

---

## 📖 Related Documentation

- [`TEST_INFRASTRUCTURE_ANALYSIS.md`](TEST_INFRASTRUCTURE_ANALYSIS.md)
- [`packages/gen/src/__tests__/`](packages/gen/src/__tests__/)
- [`examples/blog-example/tests/helpers/`](examples/blog-example/tests/helpers/)

---

**Created:** November 5, 2025  
**Last Updated:** November 5, 2025  
**Status:** ✅ Complete

