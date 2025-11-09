/**
 * SDK Documentation Generator
 * 
 * Generates helpful documentation files for SDK users
 */

import type { ParsedModel, ParsedSchema } from '../dmmf-parser.js'
import { analyzeModel } from '@/utils/relationship-analyzer.js'

/**
 * Generate SDK README
 */
export function generateSDKReadme(models: readonly ParsedModel[], schema: ParsedSchema): string {
  const nonJunctionModels = models.filter(m => {
    const analysis = analyzeModel(m, schema)
    return !analysis.isJunctionTable
  })
  
  const modelList = nonJunctionModels.map(m => `- \`api.${m.name.toLowerCase()}\` - ${m.name} operations`).join('\n')
  
  return `# API SDK

Type-safe TypeScript client for your API.

## ⚡ Quick Start (30 seconds)

\`\`\`typescript
import { quickSDK } from './gen/sdk'

// 1. Create client
const api = quickSDK('http://localhost:3000')

// 2. Use it!
const records = await api.post.list()
console.log(records.data)
\`\`\`

**That's it!** You're ready to go.

---

## 📚 Every Model Has 7 Core Methods

All models (\`${nonJunctionModels.map(m => m.name.toLowerCase()).join('`, `')}\`) provide the same interface:

| Method | Purpose | Example |
|--------|---------|---------|
| \`.list(query?)\` | Get multiple records | \`api.post.list({ take: 20 })\` |
| \`.get(id)\` | Get one by ID | \`api.post.get(123)\` |
| \`.create(data)\` | Create new | \`api.post.create({ ... })\` |
| \`.update(id, data)\` | Update existing | \`api.post.update(123, { ... })\` |
| \`.delete(id)\` | Remove | \`api.post.delete(123)\` |
| \`.findOne(where)\` | Find by any field | \`api.post.findOne({ slug: 'hello' })\` |
| \`.count(query?)\` | Count records | \`api.post.count()\` |

**Learn these 7, know the entire API!**

---

## 🎯 Available Models

${modelList}

Each model follows the same 7-method pattern above.

---

## 🔐 With Authentication

\`\`\`typescript
import { quickSDKWithAuth } from './gen/sdk'

const api = quickSDKWithAuth('http://localhost:3000', myToken)

// All calls include: Authorization: Bearer <token>
await api.post.create({ ... })
\`\`\`

---

## 🎨 Domain Helpers

Some models have optional shortcuts in \`.helpers\`:

\`\`\`typescript
// Core method (works everywhere)
const post = await api.post.findOne({ slug: 'hello' })

// Helper shortcut (optional sugar)
const post = await api.post.helpers.findBySlug('hello')
\`\`\`

Type \`api.post.helpers.\` in your IDE to see available shortcuts.

---

## 📖 Full Documentation

- **[API Reference](./API-REFERENCE.md)** - Complete method list
- **[Architecture](./ARCHITECTURE.md)** - Design philosophy
- **[Recipes](./recipes.ts)** - Common patterns

---

## 💡 Questions?

Your IDE autocomplete has all the answers! Just type \`api.\` and explore.
`
}

/**
 * Generate API Reference (Table of Contents)
 */
export function generateAPIReference(models: readonly ParsedModel[], schema: ParsedSchema): string {
  const nonJunctionModels = models.filter(m => {
    const analysis = analyzeModel(m, schema)
    return !analysis.isJunctionTable
  })
  
  const sections = nonJunctionModels.map(model => {
    const analysis = analyzeModel(model, schema)
    const modelLower = model.name.toLowerCase()
    const idType = model.idField?.type || 'Int'
    const idExample = idType === 'String' ? "'abc123'" : '123'
    
    const helpersList: string[] = []
    
    if (analysis.specialFields.slug) {
      helpersList.push(`\`.helpers.findBySlug(slug)\` - Find by slug`)
    }
    if (analysis.specialFields.published) {
      helpersList.push(`\`.helpers.listPublished(query?)\` - List published only`)
      helpersList.push(`\`.helpers.publish(id)\` - Publish record`)
      helpersList.push(`\`.helpers.unpublish(id)\` - Unpublish record`)
    }
    if (analysis.specialFields.approved) {
      helpersList.push(`\`.helpers.approve(id)\` - Approve record`)
      helpersList.push(`\`.helpers.reject(id)\` - Reject record`)
      helpersList.push(`\`.helpers.listPending()\` - List pending records`)
    }
    if (analysis.specialFields.views) {
      helpersList.push(`\`.helpers.incrementViews(id)\` - Increment view count`)
    }
    if (analysis.specialFields.deletedAt) {
      helpersList.push(`\`.helpers.softDelete(id)\` - Soft delete`)
      helpersList.push(`\`.helpers.restore(id)\` - Restore deleted`)
    }
    if (analysis.specialFields.parentId) {
      helpersList.push(`\`.helpers.getThread(id)\` - Get with nested replies`)
    }
    
    const helpersSection = helpersList.length > 0 
      ? `\n\n### Helpers (Optional Shortcuts)\n${helpersList.map(h => `- ${h}`).join('\n')}`
      : ''
    
    return `## ${model.name} Client (\`api.${modelLower}\`)

### Core Methods (Inherited)
\`\`\`typescript
api.${modelLower}.list({ take: 20, orderBy: { id: 'desc' } })
api.${modelLower}.get(${idExample})
api.${modelLower}.create({ /* ... */ })
api.${modelLower}.update(${idExample}, { /* ... */ })
api.${modelLower}.delete(${idExample})
api.${modelLower}.findOne({ /* any field */ })
api.${modelLower}.count({ where: { /* filter */ } })
\`\`\`${helpersSection}`
  }).join('\n\n---\n\n')
  
  return `# SDK API Reference

Quick reference for all available SDK methods.

## 🎯 The 7 Core Methods (Every Model)

Every model client provides these **exact same methods**:

| Method | Purpose | Returns |
|--------|---------|---------|
| \`.list(query?)\` | Get multiple records | \`{ data: T[], meta: {...} }\` |
| \`.get(id)\` | Get one by ID | \`T \\| null\` |
| \`.create(data)\` | Create new | \`T\` |
| \`.update(id, data)\` | Update existing | \`T \\| null\` |
| \`.delete(id)\` | Remove | \`boolean\` |
| \`.findOne(where)\` | Find by any field | \`T \\| null\` |
| \`.count(query?)\` | Count records | \`number\` |

**Learn these 7, know the entire API!**

---

${sections}

---

## 🎨 Common Patterns

### Pagination
\`\`\`typescript
// Same pattern for ALL models
const page1 = await api.post.list({ skip: 0, take: 20 })
const page2 = await api.post.list({ skip: 20, take: 20 })
\`\`\`

### Filtering
\`\`\`typescript
// Generic where clause (works everywhere)
await api.post.list({ where: { published: true } })
\`\`\`

### Find by Field
\`\`\`typescript
// Works with ANY unique field
await api.post.findOne({ slug: 'hello' })
await api.author.findOne({ email: 'john@example.com' })
\`\`\`

### State Changes
\`\`\`typescript
// All state changes via update (consistent!)
await api.post.update(123, { published: true })
await api.comment.update(456, { approved: true })
\`\`\`

---

## 🔐 Authentication

All methods automatically include auth headers if configured:

\`\`\`typescript
import { quickSDKWithAuth } from './gen/sdk'

const api = quickSDKWithAuth('http://localhost:3000', myToken)

// All calls include: Authorization: Bearer <token>
await api.post.create({ ... })
\`\`\`

---

## 💡 Remember

1. **7 core methods work on EVERY model** - Learn once, use everywhere
2. **Helpers are optional sugar** - Use when convenient
3. **Consistent patterns** - If it works on one model, it works on all
4. **Type-safe** - TypeScript guides you with autocomplete

**You now know the entire API!** 🎉
`
}

/**
 * Generate Architecture philosophy doc
 */
export function generateSDKArchitecture(): string {
  return `# SDK Architecture Philosophy

## Core Principle: Thin, Consistent, Discoverable

Every model client follows the **same 7-method interface**, making the SDK predictable and easy to learn.

## The Interface Contract

Every model (\`post\`, \`comment\`, \`author\`, etc.) provides:

### 1. Core CRUD (5 methods)
\`\`\`typescript
.list(query?)     // Get multiple records
.get(id)          // Get one by ID
.create(data)     // Create new
.update(id, data) // Update existing  
.delete(id)       // Remove
\`\`\`

### 2. Advanced Query (2 methods)
\`\`\`typescript
.findOne(where)   // Find single record by any field
.count(query?)    // Count records with optional filter
\`\`\`

## Generic Over Specific

### ❌ Bad: Too Many Specific Methods
\`\`\`typescript
api.post.findBySlug('hello')        // Specific to Post
api.post.listPublished({ take: 10 }) // Specific to Post
api.post.publish(123)                // Specific to Post
api.post.unpublish(123)              // Specific to Post

api.comment.approve(456)             // Different from Post!
api.comment.reject(456)              // Inconsistent!
\`\`\`

### ✅ Good: Consistent Generic Interface
\`\`\`typescript
// Same pattern works for ALL models:
api.post.findOne({ slug: 'hello' })
api.post.list({ where: { published: true }, take: 10 })
api.post.update(123, { published: true })
api.post.update(123, { published: false })

api.comment.update(456, { approved: true })
api.comment.update(456, { approved: false })
\`\`\`

**Plus optional helpers for convenience:**
\`\`\`typescript
api.post.helpers.findBySlug('hello')  // Sugar over findOne
api.post.helpers.publish(123)         // Sugar over update
api.comment.helpers.approve(456)      // Sugar over update
\`\`\`

## Benefits

### ✅ Consistency
All models work the same way. Learn once, use everywhere.

### ✅ Discoverability
Type \`api.post.\` and you see 7 methods. Easy to remember.

### ✅ Predictability
You already know how \`api.category\` works without docs.

### ✅ Extensibility
\`.helpers\` namespace keeps domain shortcuts organized.

### ✅ Simplicity
Less code, less cognitive load, faster onboarding.

## The 7-Method Mental Model

Every developer needs to learn just **7 methods × 1 pattern**:

\`\`\`typescript
// These 7 methods work on EVERY model
.list(query?)       // → { data: T[], meta: { total, hasMore } }
.get(id)            // → T | null
.create(data)       // → T
.update(id, data)   // → T | null
.delete(id)         // → boolean
.findOne(where)     // → T | null
.count(query?)      // → number
\`\`\`

That's it! No more learning 15+ different methods per model.

## Data-Driven State Management

State changes happen through **data updates**, not **method names**:

\`\`\`typescript
// State is just data
await api.post.update(id, { published: true })    // Publish
await api.post.update(id, { published: false })   // Unpublish
await api.comment.update(id, { approved: true })  // Approve
await api.comment.update(id, { approved: false }) // Reject

// This teaches developers the data model!
\`\`\`

## Implementation

1. **BaseModelClient** provides 7 core methods
2. **Generated clients** extend base with proper typing
3. **Helpers namespace** provides optional shortcuts
4. **Documentation** teaches core methods first

Result: Predictable, consistent, easy-to-use SDK! 🎉
`
}

/**
 * Generate quick start helpers
 */
export function generateQuickStart(): string {
  return `// @generated
// Quick Start - Get started in 30 seconds

import { createSDK } from './index.js'

/**
 * Create SDK with minimal config
 * 
 * @example
 * \`\`\`typescript
 * import { quickSDK } from './gen/sdk'
 * 
 * const api = quickSDK('http://localhost:3000')
 * const records = await api.post.list()
 * \`\`\`
 */
export function quickSDK(baseUrl: string) {
  return createSDK({ baseUrl })
}

/**
 * Create SDK with auth token
 * 
 * @example
 * \`\`\`typescript
 * import { quickSDKWithAuth } from './gen/sdk'
 * 
 * const api = quickSDKWithAuth('http://localhost:3000', myToken)
 * const records = await api.post.create({ ... })
 * \`\`\`
 */
export function quickSDKWithAuth(baseUrl: string, token: string) {
  return createSDK({
    baseUrl,
    auth: { token }
  })
}

/**
 * Create SDK with dynamic token (for browsers)
 * 
 * @example
 * \`\`\`typescript
 * import { quickSDKBrowser } from './gen/sdk'
 * 
 * const api = quickSDKBrowser('http://localhost:3000', {
 *   getToken: () => localStorage.getItem('token'),
 *   setToken: (token) => localStorage.setItem('token', token)
 * })
 * \`\`\`
 */
export function quickSDKBrowser(
  baseUrl: string, 
  storage: { 
    getToken: () => string | null,
    setToken: (token: string) => void 
  }
) {
  return createSDK({
    baseUrl,
    auth: {
      token: () => storage.getToken() || '',
      onRefresh: storage.setToken
    }
  })
}

// Re-export for convenience
export { createSDK } from './index.js'
export type { SDK, SDKConfig } from './index.js'
`
}

/**
 * Generate type exports
 */
export function generateSDKTypes(models: readonly ParsedModel[], schema: ParsedSchema): string {
  const nonJunctionModels = models.filter(m => {
    const analysis = analyzeModel(m, schema)
    return !analysis.isJunctionTable
  })
  
  const exports = nonJunctionModels.map(m => {
    const modelLower = m.name.toLowerCase()
    return `export type {
  ${m.name}ReadDTO as ${m.name},
  ${m.name}CreateDTO as ${m.name}Create,
  ${m.name}UpdateDTO as ${m.name}Update,
  ${m.name}QueryDTO as ${m.name}Query
} from '@/contracts/${modelLower}'`
  }).join('\n\n')
  
  return `// @generated
// Type exports - Import just the types you need

/**
 * All DTOs in one place for easy importing
 * 
 * @example
 * \`\`\`typescript
 * import type { Post, Comment, Author } from './gen/sdk/types'
 * 
 * const post: Post = await api.post.get(1)
 * \`\`\`
 */

${exports}

// Common types
export type { ListResponse } from '@ssot-codegen/sdk-runtime'
export type { APIException } from '@ssot-codegen/sdk-runtime'
export type { QueryOptions } from '@ssot-codegen/sdk-runtime'
`
}


