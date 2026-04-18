# SDK Architecture Philosophy

## Core Principle: Thin, Consistent, Discoverable

Every model client follows the **same 7-method interface**, making the SDK predictable and easy to learn.

## The Interface Contract

Every model (`post`, `comment`, `author`, etc.) provides:

### 1. Core CRUD (5 methods)
```typescript
.list(query?)     // Get multiple records
.get(id)          // Get one by ID
.create(data)     // Create new
.update(id, data) // Update existing  
.delete(id)       // Remove
```

### 2. Advanced Query (2 methods)
```typescript
.findOne(where)   // Find single record by any field
.count(query?)    // Count records with optional filter
```

## Generic Over Specific

### ❌ Bad: Too Many Specific Methods
```typescript
api.post.findBySlug('hello')        // Specific to Post
api.post.listPublished({ take: 10 }) // Specific to Post
api.post.publish(123)                // Specific to Post
api.post.unpublish(123)              // Specific to Post

api.comment.approve(456)             // Different from Post!
api.comment.reject(456)              // Inconsistent!
```

### ✅ Good: Consistent Generic Interface
```typescript
// Same pattern works for ALL models:
api.post.findOne({ slug: 'hello' })
api.post.list({ where: { published: true }, take: 10 })
api.post.update(123, { published: true })
api.post.update(123, { published: false })

api.comment.update(456, { approved: true })
api.comment.update(456, { approved: false })
```

**Plus optional helpers for convenience:**
```typescript
api.post.helpers.findBySlug('hello')  // Sugar over findOne
api.post.helpers.publish(123)         // Sugar over update
api.comment.helpers.approve(456)      // Sugar over update
```

## Benefits

### ✅ Consistency
All models work the same way. Learn once, use everywhere.

### ✅ Discoverability
Type `api.post.` and you see 7 methods. Easy to remember.

### ✅ Predictability
You already know how `api.category` works without docs.

### ✅ Extensibility
`.helpers` namespace keeps domain shortcuts organized.

### ✅ Simplicity
Less code, less cognitive load, faster onboarding.

## The 7-Method Mental Model

Every developer needs to learn just **7 methods × 1 pattern**:

```typescript
// These 7 methods work on EVERY model
.list(query?)       // → { data: T[], meta: { total, hasMore } }
.get(id)            // → T | null
.create(data)       // → T
.update(id, data)   // → T | null
.delete(id)         // → boolean
.findOne(where)     // → T | null
.count(query?)      // → number
```

That's it! No more learning 15+ different methods per model.

## Data-Driven State Management

State changes happen through **data updates**, not **method names**:

```typescript
// State is just data
await api.post.update(id, { published: true })    // Publish
await api.post.update(id, { published: false })   // Unpublish
await api.comment.update(id, { approved: true })  // Approve
await api.comment.update(id, { approved: false }) // Reject

// This teaches developers the data model!
```

## Implementation

1. **BaseModelClient** provides 7 core methods
2. **Generated clients** extend base with proper typing
3. **Helpers namespace** provides optional shortcuts
4. **Documentation** teaches core methods first

Result: Predictable, consistent, easy-to-use SDK! 🎉
