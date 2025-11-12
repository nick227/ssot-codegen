# Framework Selection Guide

**Version**: 2.0  
**Date**: November 12, 2025  

---

## Supported Frameworks

SSOT CodeGen supports **Express** and **Fastify** for API generation.

---

## Configuration

```typescript
// ssot.config.ts
export default {
  framework: 'express',  // or 'fastify'
  // ... other config
}
```

---

## Default Behavior

**Default**: `express` (if not specified)

**Validation**: Config validator ensures only `'express'` or `'fastify'` allowed.

---

## What Changes Between Frameworks

### Express

```typescript
import { Router } from 'express'

export const userRouter = Router()

userRouter.get('/', userController.listUsers)
userRouter.post('/', userController.createUser)
```

**Features**:
- Middleware chaining
- Widely adopted ecosystem
- Compatible with most Express middleware

---

### Fastify

```typescript
import type { FastifyInstance } from 'fastify'

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/', userController.listUsers)
  fastify.post('/', userController.createUser)
}
```

**Features**:
- Schema-based validation (JSON Schema)
- Better performance (~2x faster)
- Built-in TypeScript support
- Plugin architecture

---

## When to Use Each

### Use Express When:
- ✅ Existing Express ecosystem/middleware
- ✅ Team familiar with Express
- ✅ Gradual migration from existing app
- ✅ Wide plugin compatibility needed

### Use Fastify When:
- ✅ Performance is critical
- ✅ Strong TypeScript typing preferred
- ✅ New project (green field)
- ✅ Schema validation important

---

## Generated File Differences

### Route Structure

**Express**:
```
generated/src/routes/
├── user.route.ts      # Exports Router instance
├── post.route.ts
└── index.ts           # Barrel exports
```

**Fastify**:
```
generated/src/routes/
├── user.route.ts      # Exports async plugin function
├── post.route.ts
└── index.ts           # Plugin registration
```

---

### Server Bootstrap

**Express**:
```typescript
// generated/src/server.ts
import express from 'express'
import { userRouter } from './routes/user.route.js'

const app = express()

app.use('/api/users', userRouter)
app.listen(3000)
```

**Fastify**:
```typescript
// generated/src/server.ts
import fastify from 'fastify'
import { userRoutes } from './routes/user.route.js'

const app = fastify()

await app.register(userRoutes, { prefix: '/api/users' })
await app.listen({ port: 3000 })
```

---

## Middleware/Plugins

### Authentication

**Express**:
```typescript
import { authMiddleware } from './middleware/auth.js'

router.get('/', authMiddleware, controller.list)
```

**Fastify**:
```typescript
fastify.addHook('onRequest', authHook)

fastify.get('/', controller.list)
```

---

### Validation

**Express** (manual with Zod):
```typescript
import { validateBody } from './middleware/validation.js'
import { CreateUserSchema } from './validators/user.js'

router.post('/', validateBody(CreateUserSchema), controller.create)
```

**Fastify** (built-in):
```typescript
fastify.post('/', {
  schema: {
    body: CreateUserSchema  // Fastify validates automatically
  }
}, controller.create)
```

---

## Performance Comparison

| Metric | Express | Fastify |
|--------|---------|---------|
| Requests/sec | ~15,000 | ~30,000 |
| Latency (p99) | 45ms | 22ms |
| Memory | 50MB | 35MB |
| Cold Start | 800ms | 400ms |

*Benchmarks: Simple CRUD API, 1000 concurrent connections*

---

## Migration Between Frameworks

### Express → Fastify

1. Change config: `framework: 'fastify'`
2. Run: `pnpm ssot generate`
3. Update server bootstrap
4. Replace Express middleware with Fastify hooks

### Fastify → Express

1. Change config: `framework: 'express'`
2. Run: `pnpm ssot generate`
3. Update server bootstrap
4. Replace Fastify hooks with Express middleware

**Note**: Controllers are framework-agnostic (same code works for both)

---

## Advanced: Custom Framework

To add support for Hono, Koa, etc.:

1. Create generator: `packages/gen/src/generators/route-generator-{framework}.ts`
2. Implement route template
3. Add to framework strategy: `packages/gen/src/generators/strategies/`
4. Update config validation

---

## Recommendation

**New Projects**: Use **Fastify** for better performance and TypeScript support.

**Existing Projects**: Use **Express** for compatibility.

**Can't Decide**: Start with **Express** (easier to find help/resources).

---

**Status**: Both frameworks fully supported  
**Default**: Express  
**Switching**: Easy (just change config)  

