# Simplified Generated APIs - Analysis & Strategy

**Date:** November 7, 2025  
**Objective:** Only expose service methods that have corresponding routes (or are explicitly requested)

---

## 🔍 Current State Analysis

### Service Methods Generated

**Base CRUD (has routes ✅):**
- `list()` → Route: `GET /`
- `getById(id)` → Route: `GET /:id`
- `create(data)` → Route: `POST /`
- `update(id, data)` → Route: `PUT /:id`, `PATCH /:id`
- `delete(id)` → Route: `DELETE /:id`
- `count(where)` → Route: `GET /meta/count`

**Bulk Operations (NO routes ❌):**
- `createMany(data[])` → No route
- `updateMany(where, data)` → No route  
- `deleteMany(where)` → No route

**Enhanced Methods (has routes ✅):**
- `search(query)` → Route: `POST /search`
- `findBySlug(slug)` → Route: `GET /slug/:slug` (if slug field exists)
- `getPublished()` → Route: `GET /published` (if published field exists)
- `getFeatured()` → Route: `GET /featured` (if featured field exists)
- etc.

###Status Summary

| Method Category | Has Routes? | Should Generate? |
|----------------|-------------|------------------|
| Base CRUD | ✅ Yes | ✅ Yes (always) |
| Search | ✅ Yes | ✅ Yes (always) |
| Enhanced (slug, published, etc.) | ✅ Yes | ✅ Yes (conditional) |
| Bulk Operations | ❌ No | ⚠️ Optional only |

---

## 🎯 Problem Statement

Currently, services expose methods that don't have corresponding HTTP endpoints:

```ts
// Service has these methods:
userService.createMany([...])  // ❌ No route!
userService.updateMany(where, data)  // ❌ No route!
userService.deleteMany(where)  // ❌ No route!

// But routes don't expose them:
POST /users/bulk-create  // ❌ Doesn't exist
PUT /users/bulk-update   // ❌ Doesn't exist
DELETE /users/bulk-delete  // ❌ Doesn't exist
```

This causes confusion:
1. **Documentation mismatch:** OpenAPI doesn't show bulk endpoints
2. **Unused code:** Methods exist but can't be called via API
3. **Maintenance burden:** Code to maintain that's never used via HTTP

---

## 💡 Solution Strategy

### Option A: Add Routes for Bulk Operations (Recommended)

**Pros:**
- Makes all service methods accessible via API
- Useful for admin panels, data migration scripts
- Complete feature set

**Cons:**
- Slightly more code generated
- May not be needed for simple APIs

**Implementation:**
```ts
// Add to route generator:
${modelCamel}Router.post('/bulk-create', ${modelCamel}Controller.bulkCreate${model.name}s)
${modelCamel}Router.put('/bulk-update', ${modelCamel}Controller.bulkUpdate${model.name}s)
${modelCamel}Router.delete('/bulk-delete', ${modelCamel}Controller.bulkDelete${model.name}s)
```

### Option B: Make Bulk Operations Opt-In (Conservative)

**Pros:**
- Simpler default generated code
- Only generate what's needed
- Less maintenance burden

**Cons:**
- Loses useful functionality by default
- Users must know to enable bulk operations

**Implementation:**
```ts
export interface CodeGeneratorConfig {
  // ...
  enableBulkOperations?: boolean  // Default: false
}

// Only generate bulk methods if enabled:
if (config.enableBulkOperations) {
  methods.push(generateBulkOperations(model))
}
```

### Option C: Document What Has Routes (No Code Changes)

**Pros:**
- Zero breaking changes
- Bulk operations still available for internal use
- Clear documentation

**Cons:**
- Doesn't solve the "unused via HTTP" problem
- Still generates code that's not exposed

**Implementation:**
- Add JSDoc comments indicating which methods have HTTP endpoints
- Generate API reference showing route mappings
- Add "Internal Use Only" markers

---

## 📋 Recommended Approach

**Hybrid Strategy:** Option A + Option B

1. **Add bulk operation routes** (enabled by default)
2. **Make configurable** via `enableBulkOperations` flag
3. **Document clearly** which methods map to which routes

### Implementation Plan

#### Step 1: Add Bulk Operation Routes

```ts
// In route-generator-enhanced.ts:
function generateBulkRoutes(model: ParsedModel, modelCamel: string): string {
  return `
// Bulk create ${model.name} records
${modelCamel}Router.post('/bulk-create', ${modelCamel}Controller.bulkCreate${model.name}s)

// Bulk update ${model.name} records
${modelCamel}Router.put('/bulk-update', ${modelCamel}Controller.bulkUpdate${model.name}s)

// Bulk delete ${model.name} records
${modelCamel}Router.delete('/bulk-delete', ${modelCamel}Controller.bulkDelete${model.name}s)
`
}
```

#### Step 2: Add Bulk Operation Controllers

```ts
// In controller-generator-enhanced.ts:
export function generateBulkController(model: ParsedModel): string {
  return `
export const bulkCreate${model.name}s = asyncHandler(async (req, res) => {
  const data = req.body  // Array of CreateDTO
  const result = await ${modelCamel}Service.createMany(data)
  res.status(201).json({ count: result.count })
})

export const bulkUpdate${model.name}s = asyncHandler(async (req, res) => {
  const { where, data } = req.body
  const result = await ${modelCamel}Service.updateMany(where, data)
  res.json({ count: result.count })
})

export const bulkDelete${model.name}s = asyncHandler(async (req, res) => {
  const { where } = req.body
  const result = await ${modelCamel}Service.deleteMany(where)
  res.json({ count: result.count })
})
`
}
```

#### Step 3: Make Configurable

```ts
export interface CodeGeneratorConfig {
  framework: 'express' | 'fastify'
  // ...
  enableBulkOperations?: boolean  // Default: true (for backward compatibility)
}
```

#### Step 4: Update Documentation

Add to generated SDK README:

```markdown
## API Endpoints

### Base CRUD Operations
- `GET /users` → `userService.list()`
- `GET /users/:id` → `userService.getById(id)`
- `POST /users` → `userService.create(data)`
- `PUT /users/:id` → `userService.update(id, data)`
- `DELETE /users/:id` → `userService.delete(id)`
- `GET /users/meta/count` → `userService.count()`

### Bulk Operations
- `POST /users/bulk-create` → `userService.createMany(data[])`
- `PUT /users/bulk-update` → `userService.updateMany(where, data)`
- `DELETE /users/bulk-delete` → `userService.deleteMany(where)`

### Enhanced Endpoints (conditionally generated)
- `POST /users/search` → `userService.search(query)`
- `GET /users/slug/:slug` → `userService.findBySlug(slug)`
- `GET /users/published` → `userService.getPublished()`
```

---

## 🎯 Implementation Steps

### Phase 1: Analysis (Current)
- [x] Identify service methods without routes
- [x] Document current state
- [x] Design solution strategy

### Phase 2: Add Bulk Routes (1-2 hours)
- [ ] Update route generators to include bulk endpoints
- [ ] Update controller generators for bulk operations
- [ ] Update OpenAPI spec with bulk endpoints
- [ ] Add bulk operation examples to SDK

### Phase 3: Make Configurable (30 min)
- [ ] Add `enableBulkOperations` to CodeGeneratorConfig
- [ ] Conditionally generate bulk methods
- [ ] Update documentation

### Phase 4: Test & Verify (30 min)
- [ ] Generate test project with bulk operations
- [ ] Verify all routes work
- [ ] Test with bulk operations disabled
- [ ] Update snapshots

---

## 📊 Impact Analysis

### With Bulk Routes Added

**Before:**
- Service methods: 12 (6 base + 3 bulk + 3 enhanced)
- HTTP endpoints: 9 (6 base + 3 enhanced)
- **Gap:** 3 methods without routes

**After:**
- Service methods: 12 (6 base + 3 bulk + 3 enhanced)
- HTTP endpoints: 12 (6 base + 3 bulk + 3 enhanced)  
- **Gap:** 0 methods without routes ✅

### Code Size Impact

**Additional Code:**
- 3 bulk route definitions (~15 lines per model)
- 3 bulk controller methods (~20 lines per model)
- OpenAPI spec entries (~30 lines per model)

**Total:** ~65 lines per model (acceptable for complete feature)

---

## ⚠️ Breaking Changes Analysis

### If We Remove Bulk Methods (Bad Idea)

**Breaking Change:** ❌ YES
- Existing code might call `userService.createMany()`
- Internal scripts might use bulk operations
- Would break backward compatibility

**Recommendation:** DON'T remove, add routes instead

### If We Add Bulk Routes (Recommended)

**Breaking Change:** ❌ NO
- Additive only (new endpoints)
- Existing endpoints unchanged
- Services remain the same
- Fully backward compatible ✅

**Recommendation:** DO this approach

---

## 🚀 Next Steps

1. **Implement bulk routes** (add missing HTTP endpoints)
2. **Make configurable** via `enableBulkOperations` flag (default: true)
3. **Document clearly** in generated README and OpenAPI spec
4. **Test thoroughly** with integration tests

---

## 📝 Alternative: Document-Only Approach

If adding routes is too much, we could:

1. **Add JSDoc tags:**
```ts
/**
 * Create multiple records (bulk operation)
 * 
 * @internal - No HTTP endpoint, use for internal batch processing only
 */
async createMany(data: CreateDTO[]) { }
```

2. **Generate API reference** showing route mappings
3. **Warn in OpenAPI** spec that bulk operations are service-only

But this is less ideal than just adding the routes.

---

## ✅ Recommendation

**Proceed with Option A (Add Bulk Routes):**
- Complete feature set
- No breaking changes
- Better DX (all methods accessible)
- Makes sense for admin panels and data migration

Estimated effort: ~2-3 hours

