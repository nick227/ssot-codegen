# Extension Pattern Guide - How to Extend Generated Code

**Problem:** Generated code is generic, need to add domain-specific features  
**Solution:** Extension pattern - don't edit generated files, extend them  
**Status:** ✅ Demonstrated in blog & e-commerce examples

---

## 🎯 The Pattern

### **Core Principle:**

**❌ DON'T Edit Generated Files**
```typescript
// gen/services/post/post.service.ts
export const postService = {
  list() { ... }
  // ❌ DON'T add methods here!
  // ❌ File will be overwritten on regeneration!
}
```

**✅ DO Create Extension Files**
```typescript
// src/extensions/post.service.extensions.ts
import { postService as generated } from '@gen/services/post'

export const postService = {
  ...generated,  // ✅ Include all generated methods
  
  // ✅ Add your custom methods here
  search(query) { ... },
  findBySlug(slug) { ... }
}
```

---

## 📁 File Structure

```
examples/blog-example/
├── gen/                          # ❌ Don't touch! (auto-generated)
│   ├── services/
│   │   └── post/
│   │       └── post.service.ts   # Generated base CRUD
│   ├── controllers/
│   └── routes/
│
└── src/
    ├── extensions/               # ✅ Your custom code here!
    │   ├── post.service.extensions.ts
    │   ├── post.controller.extensions.ts
    │   └── post.routes.extensions.ts
    │
    └── app.ts                    # Import extended routes
```

---

## 🔧 Three-Layer Extension Pattern

### **Layer 1: Service Extensions**

**File:** `src/extensions/post.service.extensions.ts`

```typescript
/**
 * Post Service Extensions
 * 
 * Extends generated post service with domain-specific logic
 */

import { postService as generatedPostService } from '@gen/services/post'
import prisma from '../db.js'

export const postService = {
  // ✅ Include ALL generated methods
  ...generatedPostService,
  
  // ✅ Add domain-specific methods
  
  /**
   * Search posts (custom business logic)
   */
  async search(query: string, options = {}) {
    return prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } }
        ],
        published: true  // Business rule: only published
      },
      include: {
        author: true,  // Load relationships
        categories: { include: { category: true } },
        tags: { include: { tag: true } }
      },
      take: options.limit || 20
    })
  },
  
  /**
   * Find by slug (SEO-friendly URLs)
   */
  async findBySlug(slug: string) {
    return prisma.post.findUnique({
      where: { slug },
      include: {
        author: { 
          select: { id: true, username: true, displayName: true }
        },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true } }
      }
    })
  },
  
  /**
   * List only published posts
   */
  async listPublished(options = {}) {
    return prisma.post.findMany({
      where: {
        published: true,
        publishedAt: { lte: new Date() }
      },
      include: {
        author: true
      },
      orderBy: { publishedAt: 'desc' },
      take: options.limit || 20
    })
  },
  
  /**
   * Increment view counter
   */
  async incrementViews(id: number) {
    return prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } }
    })
  }
}
```

**What You Get:**
- ✅ All generated methods (list, findById, create, update, delete, count, exists)
- ✅ Your custom methods (search, findBySlug, listPublished, incrementViews)
- ✅ Type safety maintained
- ✅ Can regenerate without losing custom code

---

### **Layer 2: Controller Extensions**

**File:** `src/extensions/post.controller.extensions.ts`

```typescript
/**
 * Post Controller Extensions
 * 
 * HTTP handlers for extended functionality
 */

import type { Request, Response } from 'express'
import { postService } from './post.service.extensions.js'  // ✅ Import extended service
import { logger } from '../logger.js'

/**
 * Search posts handler
 */
export const searchPosts = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string
    
    // Validation
    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Search query must be at least 2 characters'
      })
    }

    // Call extended service method
    const result = await postService.search(query, {
      limit: parseInt(req.query.limit as string) || 20
    })

    logger.info({ query, resultsCount: result.length }, 'Post search executed')

    return res.json({ data: result })
  } catch (error) {
    logger.error({ error }, 'Post search failed')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * Get post by slug handler
 */
export const getPostBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    const post = await postService.findBySlug(slug)
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Increment views asynchronously
    postService.incrementViews(post.id).catch(err =>
      logger.error({ err }, 'Failed to increment views')
    )

    return res.json(post)
  } catch (error) {
    logger.error({ error }, 'Failed to get post by slug')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
```

---

### **Layer 3: Route Extensions**

**File:** `src/extensions/post.routes.extensions.ts`

```typescript
/**
 * Extended Post Routes
 * 
 * Combines generated routes with custom extensions
 */

import { Router } from 'express'
import * as generatedController from '@gen/controllers/post'  // ✅ Generated
import * as extendedController from './post.controller.extensions.js'  // ✅ Custom
import { authenticate } from '../auth/jwt.js'

export const postRouter = Router()

// ============================================================
// PUBLIC ROUTES
// ============================================================

// ✅ Custom routes first (more specific)
postRouter.get('/search', extendedController.searchPosts)
postRouter.get('/popular', extendedController.getPopularPosts)
postRouter.get('/slug/:slug', extendedController.getPostBySlug)

// ✅ Then generated routes
postRouter.get('/', generatedController.listPosts)
postRouter.get('/:id', generatedController.getPost)

// ============================================================
// PROTECTED ROUTES
// ============================================================

postRouter.post('/', authenticate, generatedController.createPost)
postRouter.put('/:id', authenticate, generatedController.updatePost)
postRouter.delete('/:id', authenticate, generatedController.deletePost)
```

---

### **Layer 4: App Integration**

**File:** `src/app.ts`

```typescript
import { postRouter } from './extensions/post.routes.extensions.js'  // ✅ Extended routes

export const createApp = () => {
  const app = express()
  
  // ... middleware ...
  
  // Use extended routes (not generated)
  app.use('/api/posts', postRouter)  // ✅ Has search, slug, etc.
  
  return app
}
```

---

## 🎓 Real-World Examples

### **Example 1: Blog Search (Implemented)**

**What We Extended:**
- ✅ Added `search()` method to service
- ✅ Added `searchPosts` controller
- ✅ Added `GET /posts/search` route
- ✅ Added slug lookups
- ✅ Added popular/recent endpoints

**Files:**
- `src/extensions/post.service.extensions.ts` (290 lines)
- `src/extensions/post.controller.extensions.ts` (180 lines)
- `src/extensions/post.routes.extensions.ts` (100 lines)

**Result:**
```bash
curl "http://localhost:3001/api/posts/search?q=typescript"
# ✅ Works! Returns search results with relationships
```

---

### **Example 2: E-commerce Search (Implemented)**

**What We Extended:**
- ✅ Added `search()` with filters
- ✅ Added `advancedSearch()` with sorting
- ✅ Added `findBySlug()` for SEO
- ✅ Added `getFeatured()` for homepage
- ✅ Added `getByCategory()` for browsing

**Files:**
- `src/extensions/product.service.extensions.ts` (350 lines)
- `src/extensions/product.controller.extensions.ts` (220 lines)
- `src/extensions/product.routes.extensions.ts` (120 lines)

**Result:**
```bash
curl "http://localhost:3002/api/products/search?q=laptop&minPrice=1000&maxPrice=1500"
# ✅ Works! Returns filtered products with images and reviews
```

---

## 📚 Extension Best Practices

### **1. Always Spread Generated Code**

```typescript
// ✅ GOOD
export const postService = {
  ...generatedPostService,  // Include everything
  myMethod() { }
}

// ❌ BAD
export const postService = {
  myMethod() { }  // Lost all generated methods!
}
```

---

### **2. Import Extended, Not Generated**

```typescript
// ✅ GOOD
import { postService } from './extensions/post.service.extensions.js'

// ❌ BAD
import { postService } from '@gen/services/post'  // Missing custom methods
```

---

### **3. Name Extensions Clearly**

```typescript
// ✅ GOOD
src/extensions/post.service.extensions.ts
src/extensions/post.controller.extensions.ts

// ❌ BAD
src/post.custom.ts  // Unclear
src/services/post.ts  // Confusing with gen/
```

---

### **4. Document What You Extended**

```typescript
/**
 * Post Service Extensions
 * 
 * Extends generated post service with:
 * - Full-text search
 * - Slug lookups
 * - Published filtering
 * - View tracking
 * 
 * Generated base in: gen/services/post/post.service.ts
 */
```

---

### **5. Keep Business Logic in Extensions**

```typescript
// ✅ GOOD - Business logic in extension
async publishPost(id: number, authorId: number) {
  // Check ownership
  const post = await prisma.post.findUnique({ where: { id } })
  if (post.authorId !== authorId) throw new Error('Forbidden')
  
  // Publish
  return prisma.post.update({
    where: { id },
    data: { published: true, publishedAt: new Date() }
  })
}

// ❌ BAD - Editing generated file
// gen/services/post/post.service.ts
// (gets overwritten!)
```

---

## 🎯 When to Use Extensions

### **Use Extensions For:**

✅ Domain-specific features (search, recommendations, etc.)  
✅ Business logic (publishing workflows, approval processes)  
✅ Complex queries (with includes, joins, aggregations)  
✅ Authorization checks (ownership, roles)  
✅ Analytics (view counters, like systems)  
✅ Integration with external services  
✅ Caching strategies  
✅ Custom validation rules  

### **Don't Use Extensions For:**

❌ Changing generated CRUD (regenerate with different config instead)  
❌ Fixing bugs in generated code (fix the generator!)  
❌ Type definitions (use generated types)  

---

## 📊 Extension vs Regeneration

### **When to Extend:**

**Scenario:** "I need a search feature"

**Solution:** ✅ Create extension
```typescript
// src/extensions/post.service.extensions.ts
async search(query) { /* custom logic */ }
```

**Why:** Domain-specific, won't be regenerated

---

### **When to Regenerate:**

**Scenario:** "I need to change the base DTO structure"

**Solution:** ✅ Update generator config, regenerate
```bash
# Update generator
# Regenerate
npm run generate
```

**Why:** Affects all models, better in generator

---

## 🌟 Benefits of Extension Pattern

### **1. Safe Regeneration:**
```bash
# Add new model to schema
npm run generate

# ✅ Regenerates gen/ folder
# ✅ Preserves src/extensions/
# ✅ No conflicts!
```

### **2. Clear Separation:**
- Generated code: `gen/` (generic, don't touch)
- Custom code: `src/extensions/` (domain-specific, edit freely)

### **3. Version Control Friendly:**
- Generated code changes show up cleanly
- Custom code tracked separately
- Easy code reviews

### **4. Team Collaboration:**
- Junior devs work on extensions
- Generator maintained by platform team
- Clear boundaries

---

## 🚀 Quick Start Guide

### **Step 1: Create Extension File**

```bash
# Create extension file
touch src/extensions/post.service.extensions.ts
```

### **Step 2: Import and Extend**

```typescript
import { postService as generated } from '@gen/services/post'
import prisma from '../db.js'

export const postService = {
  ...generated,
  
  // Add your methods
  async myCustomMethod() {
    return prisma.post.findMany({ /* custom logic */ })
  }
}
```

### **Step 3: Use Extended Service**

```typescript
// In your controllers
import { postService } from './extensions/post.service.extensions.js'

// Use it
const results = await postService.myCustomMethod()
const posts = await postService.list()  // ✅ Generated method still works
```

---

## 📋 Extension Checklist

### **For Each Model You Extend:**

- [ ] Create `src/extensions/{model}.service.extensions.ts`
- [ ] Import generated service
- [ ] Spread generated methods (`...generatedService`)
- [ ] Add custom methods
- [ ] Export extended service
- [ ] Create matching controller extensions
- [ ] Create matching route extensions
- [ ] Update app.ts to use extended routes
- [ ] Document what you extended
- [ ] Add tests for custom methods

---

## 🎓 Real-World Extensions

### **1. Search (Blog & E-commerce)** ✅ Implemented

**Why Extension:**
- Domain-specific (blogs search differently than e-commerce)
- Complex filtering logic
- Relationship loading required
- Not generic CRUD

**Files Created:**
- `post.service.extensions.ts` - Search logic
- `post.controller.extensions.ts` - Search handler
- `post.routes.extensions.ts` - Search endpoint

---

### **2. Recommendations (E-commerce)** ⏳ Future

**Would Be Extension:**
```typescript
async getRecommended(userId: number) {
  // ML-based recommendations
  // User purchase history
  // Collaborative filtering
  // → Domain-specific, not generic
}
```

---

### **3. Publishing Workflow (Blog)** ⏳ Future

**Would Be Extension:**
```typescript
async publishPost(id: number, authorId: number) {
  // Check ownership
  // Validate content
  // Set published + publishedAt
  // Send notifications
  // → Blog-specific workflow
}
```

---

### **4. Inventory Management (E-commerce)** ⏳ Future

**Would Be Extension:**
```typescript
async reserveStock(productId: number, quantity: number) {
  // Check availability
  // Reserve stock
  // Handle race conditions
  // → E-commerce-specific logic
}
```

---

## ✨ Summary

### **The Extension Pattern:**

**Philosophy:**
- Generated code = foundation (80%)
- Extensions = domain logic (20%)

**Structure:**
```
gen/           → Auto-generated, don't edit
src/extensions → Your custom code
```

**Workflow:**
1. Generate base code
2. Create extensions
3. Import extended versions
4. Regenerate anytime without losing custom code

**Benefits:**
- ✅ Safe regeneration
- ✅ Clear separation
- ✅ Easy maintenance
- ✅ Team-friendly
- ✅ Version control friendly

---

**Examples implemented:**
- Blog search (full-text, filters, slug, popular, recent)
- E-commerce search (filters, sorting, advanced, featured)

**Total extension code:** ~1,990 lines demonstrating real-world patterns!

