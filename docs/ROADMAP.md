# SSOT Codegen Roadmap

Implementation plan for future milestones beyond v0.4.0 POC.

## Step 79: Real Prisma DMMF Ingestion

**Objective**: Replace stubbed DMMF with actual Prisma schema parsing.

**Implementation**:
```typescript
// packages/gen/src/dmmf-loader.ts
import { getDMMF } from '@prisma/internals'
import { generatorHandler } from '@prisma/generator-helper'

export const loadDMMF = async (schemaPath: string) => {
  const dmmf = await getDMMF({ datamodelPath: schemaPath })
  return {
    models: dmmf.datamodel.models.map(model => ({
      name: model.name,
      fields: model.fields.map(field => ({
        name: field.name,
        type: mapPrismaType(field.type),
        isList: field.isList,
        isNullable: !field.isRequired,
        readonly: field.isReadOnly,
        isRelation: field.relationName !== undefined,
        annotations: parseFieldDocs(field.documentation)
      }))
    }))
  }
}
```

**Tasks**:
- [ ] Add `@prisma/generator-helper` and `@prisma/internals` as dependencies
- [ ] Implement `getDMMF` wrapper
- [ ] Map Prisma types to TypeScript types (String→string, Int→number, DateTime→Date)
- [ ] Handle scalar lists (`String[]`)
- [ ] Parse `@@` model-level annotations
- [ ] Extract field-level documentation comments

**Testing**:
- Real schema with all Prisma types
- Relations (1:1, 1:N, M:N)
- Enums
- Composite types (if supported)

---

## Step 80: Schema Comment Tag Parsing

**Objective**: Parse custom tags in schema comments to control generation.

**Syntax**:
```prisma
/// @route /api/v1/users
/// @auth required roles=admin,user
/// @expose list,read,create,update
model User {
  id Int @id @default(autoincrement())
  /// @readonly
  /// @example "john.doe@example.com"
  email String @unique
  /// @expose read,update
  password String
}
```

**Implementation**:
```typescript
// packages/core/src/tag-parser.ts
export interface TagSet {
  route?: string
  auth?: { required: boolean; roles?: string[] }
  expose?: ('list'|'read'|'create'|'update'|'delete')[]
  readonly?: boolean
  example?: string
}

export const parseT (@route, @auth, @expose, @readonly, @example)
- Merge model-level and field-level tags
- Validate tag syntax and values
- Fail on unknown tags (or warn)

**Testing**:
- All tag combinations
- Invalid syntax handling
- Tag inheritance rules

---

## Step 81: Auth Policy Compiler

**Objective**: Compile auth policies to Prisma `where` filters and field masks.

**Policy DSL** (in schema):
```prisma
/// @auth policy=owner
/// WHERE: ownerId = $userId
/// ROLES: user, admin
model Post {
  id Int @id
  ownerId Int
  /// @auth visible=admin
  secretField String?
}
```

**Compiled Output**:
```typescript
// gen/auth/post/post.policy.ts
export const postPolicies = {
  owner: (userId: number) => ({ ownerId: userId }),
  admin: () => ({}),
  fieldMask: (role: string) => ({
    secretField: role === 'admin'
  })
}
```

**Implementation**:
- [ ] Design policy DSL syntax
- [ ] Parse WHERE clauses
- [ ] Compile to Prisma filter objects
- [ ] Generate field-level visibility functions
- [ ] Support RBAC and ABAC patterns
- [ ] Handle role hierarchies

**Complexity**: HIGH - requires careful security validation.

---

## Step 82: Projection Presets

**Objective**: Define reusable field selection sets for list/read/detail views.

**Schema**:
```prisma
/// @projection list: id,title,createdAt
/// @projection read: id,title,content,createdAt,author
/// @projection detail: *
model Post {
  id Int @id
  title String
  content String
  createdAt DateTime
  author User @relation(...)
}
```

**Generated**:
```typescript
// gen/contracts/post/post.projections.ts
export const postProjections = {
  list: { id: true, title: true, createdAt: true },
  read: { id: true, title: true, content: true, createdAt: true, author: true },
  detail: {} // all fields
}

export type PostListDTO = Pick<Post, 'id'|'title'|'createdAt'>
export type PostReadDTO = Pick<Post, 'id'|'title'|'content'|'createdAt'|'author'>
export type PostDetailDTO = Post
```

**Tasks**:
- [ ] Parse projection definitions
- [ ] Generate Prisma `select` objects
- [ ] Generate typed DTOs for each projection
- [ ] Align with OpenAPI responses

---

## Step 83: Filter/Sort Allowlists

**Objective**: Generate safe filter and sort options based on indexes and types.

**Strategy**:
- Allow filters only on indexed fields (or explicitly marked)
- Type-aware operators (eq, contains, gt, lt, in, etc.)
- Safe ORDER BY sets

**Generated**:
```typescript
// gen/validators/post/post.filters.ts
export const postFilters = z.object({
  id: z.number().optional(),
  title: z.string().optional(), // indexed
  createdAt: z.object({
    gte: z.date().optional(),
    lte: z.date().optional()
  }).optional()
})

export const postSort = z.enum(['id', 'title', 'createdAt', '-id', '-title', '-createdAt'])
```

---

## Step 84: Zod Parity with DTOs

**Objective**: Generate Zod schemas matching DTO shape exactly.

**Requirements**:
- Optional vs nullable semantics (`field?` vs `field: T | null`)
- PATCH shapes (all fields optional)
- Nested object validation
- Custom error messages with field paths

**Implementation**:
```typescript
// gen/validators/user/user.create.zod.ts
import { z } from 'zod'

export const UserCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().positive().optional()
})

export const UserPatchSchema = UserCreateSchema.partial()

export type UserCreateInput = z.infer<typeof UserCreateSchema>
```

**Tasks**:
- [ ] Map Prisma types to Zod types
- [ ] Handle `@default`, `@unique` constraints
- [ ] Generate validators for all CRUD shapes
- [ ] Custom error messages from `/// @error` tags

---

## Step 85: Complete OpenAPI

**Objective**: Full OpenAPI 3.1 spec with all DTOs, security, examples.

**Features**:
- Component schemas for all DTOs (Create, Read, Update, Patch, List)
- Security schemes (Bearer, API Key, OAuth2)
- Operation IDs
- Request/response examples from `@example` tags
- RFC 7807 error model
- Pagination metadata

**Generated Spec**:
```yaml
paths:
  /users:
    get:
      operationId: listUsers
      parameters:
        - name: page
          in: query
          schema: { type: integer }
      responses:
        200:
          description: User list
          content:
            application/json:
              schema:
                type: object
                properties:
                  data: { type: array, items: { $ref: '#/components/schemas/UserReadDTO' } }
                  meta: { $ref: '#/components/schemas/PaginationMeta' }
    post:
      operationId: createUser
      requestBody:
        content:
          application/json:
            schema: { $ref: '#/components/schemas/UserCreateDTO' }
            examples:
              example1: { value: { email: "user@example.com", name: "John" } }
      responses:
        201: { ... }
        400: { $ref: '#/components/schemas/ErrorResponse' }
```

---

## Step 86: SDK Generation

**Objective**: Generate typed client SDK from OpenAPI spec.

**Approach**:
- Use `openapi-typescript` to generate types
- Wrap `@ssot-codegen/sdk-runtime` fetch client
- Optional React Query hooks

**Generated SDK**:
```typescript
// gen/sdk/client.ts
import { createClient } from '@ssot-codegen/sdk-runtime'
import type { operations } from './generated-types'

export const sdk = createClient<operations>({ baseUrl: '/api' })

// Usage:
const users = await sdk.get('/users', { query: { page: 1 } })
//    ^? { data: UserReadDTO[], meta: PaginationMeta }
```

**React Query Integration**:
```typescript
// gen/sdk/react-query/user.hooks.ts
export const useUsers = (page: number) =>
  useQuery({
    queryKey: ['users', page],
    queryFn: () => sdk.get('/users', { query: { page } })
  })
```

**Tasks**:
- [ ] Integrate openapi-typescript
- [ ] Generate typed fetch wrappers
- [ ] Support ETag / If-None-Match
- [ ] Idempotency-Key header support
- [ ] Optional React Query hooks package

---

## Step 87: Schema Lint Rules

**Objective**: Validate schema for best practices and safety.

**Rules**:
- **Naming**: PascalCase models, camelCase fields
- **Tag validation**: Unknown tags, invalid syntax
- **Exposure safety**: Sensitive fields not exposed without auth
- **Index coverage**: Filterable fields should be indexed
- **Deprecation markers**: `@deprecated` tag support

**Implementation**:
```typescript
// packages/schema-lint/src/rules/*.ts
export const namingRule: LintRule = {
  name: 'naming-convention',
  check: (model) => {
    if (!/^[A-Z]/.test(model.name)) {
      return { severity: 'error', message: `Model ${model.name} should be PascalCase` }
    }
  }
}
```

**CLI**:
```bash
npx ssot-lint prisma/schema.prisma
# ✅ 15 models checked
# ⚠️  3 warnings
# ❌ 1 error
```

---

## Step 88: Performance Features

**Objective**: Optimize for large schemas and fast regeneration.

**Features**:

### Hash-Based Skip Writes
```typescript
const writeIfChanged = (file: string, content: string) => {
  const newHash = hash(content)
  const existingHash = fs.existsSync(file) ? hash(fs.readFileSync(file, 'utf8')) : null
  if (newHash !== existingHash) {
    fs.writeFileSync(file, content)
    return true
  }
  return false
}
```

### Batched FS I/O
```typescript
const pendingWrites: Array<{ file: string; content: string }> = []
const flushWrites = async () => {
  await Promise.all(pendingWrites.map(({ file, content }) =>
    fs.promises.writeFile(file, content)
  ))
}
```

### Parallel Per-Model Generation
```typescript
await Promise.all(models.map(model => renderModel(cfg, model)))
```

### Unchanged Layer Short-Circuit
```typescript
const layerHash = hash(JSON.stringify(models.map(m => m.name).sort()))
if (manifest.layerHashes?.contracts === layerHash) {
  console.log('Skipping unchanged contracts layer')
  return
}
```

**Performance Targets**:
- 5 models: < 100ms
- 50 models: < 1s  
- 200 models: < 5s
- Unchanged: < 50ms

---

## Implementation Priority

1. **v0.5.0**: DMMF ingestion (Steps 79-80) - Foundation for real schema parsing
2. **v0.6.0**: Templates (not in steps, but critical path)
3. **v0.7.0**: Validators (Step 84) - Type safety
4. **v0.8.0**: Auth (Step 81) - Security
5. **v0.9.0**: SDK (Steps 85-86) - Client generation
6. **v1.0.0**: Performance (Step 88) + Polish

---

## Notes

- Steps 82-83 (projections, filters) can be integrated during v0.7.0 alongside validators
- Step 87 (linting) can be developed in parallel at any time
- Template engine integration is a prerequisite for most features
- All features should maintain deterministic output
- Performance optimizations should not break determinism

