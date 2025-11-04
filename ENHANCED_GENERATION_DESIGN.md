# Enhanced Code Generation - Authorization & Relationships

**Goal:** Generate production-ready code with authorization and relationships built-in  
**Approach:** Encode logic in Prisma schema, generate smart code, show extension patterns  
**Status:** Design Document

---

## 🎯 The Solution: Triple-Layer Approach

### **Layer 1: Smart Schema Annotations** (80% auto-generated)
Encode authorization and behavior in Prisma schema using special comments

### **Layer 2: Intelligent Analysis** (15% auto-generated)
Detect patterns and relationships automatically

### **Layer 3: Extension Examples** (5% manual, shown in examples)
Real-world customizations developers make

---

## 📝 Layer 1: Enhanced Prisma Schema Annotations

### **Authorization Annotations:**

```prisma
/// Blog post model
/// @auth required
/// @ownerField authorId
/// @roles create:AUTHOR,EDITOR,ADMIN update:OWNER,ADMIN delete:OWNER,ADMIN
/// @public list,get
model Post {
  id          Int      @id @default(autoincrement())
  title       String
  slug        String   @unique
  content     String
  published   Boolean  @default(false)
  authorId    Int
  
  author      Author   @relation(fields: [authorId], references: [id])
  categories  PostCategory[]
  tags        PostTag[]
  comments    Comment[]
}
```

**What Generator Reads:**
- `@auth required` → All endpoints need authentication
- `@ownerField authorId` → Check ownership against this field
- `@roles create:AUTHOR` → Only AUTHORS can create
- `@roles update:OWNER,ADMIN` → Only owner or admin can update
- `@roles delete:OWNER,ADMIN` → Only owner or admin can delete
- `@public list,get` → List and get are public (no auth required)

---

### **Relationship Annotations:**

```prisma
/// @include author:summary categories:full tags:full
/// @count comments
/// @virtual commentCount
model Post {
  id          Int      @id @default(autoincrement())
  // ...
  author      Author   @relation(fields: [authorId], references: [id])
  categories  PostCategory[]
  tags        PostTag[]
  comments    Comment[]
}
```

**What Generator Reads:**
- `@include author:summary` → Always include author (with select for summary)
- `@include categories:full` → Always include full category objects
- `@count comments` → Include count of comments
- `@virtual commentCount` → Add virtual field for comment count

---

### **Domain Pattern Annotations:**

```prisma
/// @slug title
/// @search title,content,excerpt
/// @published published,publishedAt
/// @views views
/// @likes likes
model Post {
  id            Int       @id @default(autoincrement())
  title         String
  slug          String    @unique     /// @slug
  content       String                /// @searchable
  excerpt       String?               /// @searchable
  published     Boolean   @default(false)
  publishedAt   DateTime?
  views         Int       @default(0) /// @incrementable
  likes         Int       @default(0) /// @incrementable
}
```

**What Generator Reads:**
- `@slug title` → Generate `findBySlug()`, `generateSlug(title)`
- `@search title,content` → Generate search method
- `@published published,publishedAt` → Generate `listPublished()`, `publish()`, `unpublish()`
- `@views` → Generate `incrementViews()`
- `@likes` → Generate `like()`, `unlike()`, `getLikes()`

---

### **Junction Table Annotations:**

```prisma
/// @internal
/// @expose false
/// @managed post
model PostCategory {
  postId     Int
  categoryId Int
  
  post       Post     @relation(...)
  category   Category @relation(...)
  
  @@id([postId, categoryId])
}
```

**What Generator Reads:**
- `@internal` → This is an implementation detail
- `@expose false` → Don't generate public API
- `@managed post` → Manage via Post API

**Generated Code:**
```typescript
// NO /api/postcategory routes generated

// Instead, in post.service.ts:
async updateCategories(postId: number, categoryIds: number[]) {
  await prisma.postCategory.deleteMany({ where: { postId } })
  await prisma.postCategory.createMany({
    data: categoryIds.map(categoryId => ({ postId, categoryId }))
  })
}

// post.controller.ts:
PUT /api/posts/:id/categories
{ "categoryIds": [1, 3, 5] }
```

---

## 🤖 Layer 2: Intelligent Schema Analysis

### **Auto-Detect Patterns (No Annotations Needed):**

**1. Relationship Detection:**
```typescript
// Generator analyzes schema:
model Post {
  author      Author   @relation(...)  // ← Detects this
  categories  PostCategory[]           // ← Detects this
  comments    Comment[]                // ← Detects this
}

// Auto-generates:
interface PostReadDTO {
  id: number
  title: string
  author: {                    // ✅ Auto-included!
    id: number
    username: string
    displayName: string
  }
  categories: Category[]       // ✅ Auto-included!
  tags: Tag[]                  // ✅ Auto-included!
  commentCount: number         // ✅ Auto-counted!
}
```

---

**2. Pattern Detection:**

```typescript
// Detect common field patterns:

// Field named "slug" + @unique
slug String @unique
→ Generate: findBySlug(), generateUniqueSlug()

// Boolean field "published" or "isPublished"
published Boolean
→ Generate: listPublished(), publish(), unpublish()

// Field named "views" or "viewCount"
views Int @default(0)
→ Generate: incrementViews()

// Field named "likes" or "likeCount"
likes Int @default(0)
→ Generate: like(), unlike(), isLiked()

// Self-referencing relation
parent   Comment? @relation(...)
replies  Comment[] @relation(...)
→ Generate: getWithReplies(), getThread()

// Field named "*At" with DateTime
deletedAt DateTime?
→ Generate: softDelete(), restore(), listNonDeleted()
```

---

**3. Junction Table Detection:**

```typescript
// Detect junction tables automatically:
model PostCategory {
  postId     Int
  categoryId Int
  @@id([postId, categoryId])  // ← Composite key = junction!
}

// Auto-decision:
// ✅ Don't generate public API
// ✅ Manage via parent resource (Post)
// ✅ Generate helper methods
```

---

## 🛠️ Layer 3: Extension Examples (Manual Customizations)

### **Show Real-World Extensions in Examples:**

**File:** `examples/blog-example/src/extensions/post.service.extensions.ts`

```typescript
/**
 * Post Service Extensions
 * 
 * These are MANUAL extensions to the generated post service.
 * They demonstrate real-world customizations you might add.
 * 
 * Generated code in: gen/services/post/post.service.ts
 * Extended code: src/extensions/post.service.extensions.ts
 */

import { postService as generatedPostService } from '@gen/services/post'
import prisma from '@/db'

// Extend the generated service
export const postService = {
  // ✅ Include all generated methods
  ...generatedPostService,
  
  // ✅ Add domain-specific extensions
  
  /**
   * Get post by slug (SEO-friendly URLs)
   * Extension: Adds slug lookup missing from generated code
   */
  async findBySlug(slug: string) {
    return prisma.post.findUnique({
      where: { slug },
      include: {
        author: { 
          select: { id: true, username: true, displayName: true, avatarUrl: true }
        },
        categories: { 
          include: { category: true }
        },
        tags: {
          include: { tag: true }
        },
        _count: {
          select: { comments: true }
        }
      }
    })
  },
  
  /**
   * List only published posts (protect drafts)
   * Extension: Adds published filtering
   */
  async listPublished(query: any) {
    return prisma.post.findMany({
      where: {
        published: true,
        publishedAt: { lte: new Date() }
      },
      include: {
        author: { select: { id: true, username: true, displayName: true } },
        _count: { select: { comments: true } }
      },
      skip: query.skip,
      take: query.take,
      orderBy: query.orderBy || { publishedAt: 'desc' }
    })
  },
  
  /**
   * Publish a post (authorization handled in controller)
   * Extension: Adds publishing workflow
   */
  async publish(id: number) {
    return prisma.post.update({
      where: { id },
      data: {
        published: true,
        publishedAt: new Date()
      }
    })
  },
  
  /**
   * Increment view counter (for analytics)
   * Extension: Adds view tracking
   */
  async incrementViews(id: number) {
    return prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
      select: { id: true, views: true }
    })
  },
  
  /**
   * Search posts (full-text search)
   * Extension: Adds search functionality
   */
  async search(searchQuery: string) {
    return prisma.post.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: searchQuery } },
          { content: { contains: searchQuery } },
          { excerpt: { contains: searchQuery } }
        ]
      },
      include: {
        author: { select: { id: true, username: true, displayName: true } },
        _count: { select: { comments: true } }
      },
      take: 20
    })
  },
  
  /**
   * Get popular posts (sorted by views)
   * Extension: Adds analytics query
   */
  async getPopular(limit: number = 10) {
    return prisma.post.findMany({
      where: { published: true },
      include: {
        author: { select: { id: true, username: true, displayName: true } }
      },
      orderBy: { views: 'desc' },
      take: limit
    })
  }
}
```

---

**File:** `examples/blog-example/src/extensions/post.controller.extensions.ts`

```typescript
/**
 * Post Controller Extensions
 * 
 * Manual extensions showing authorization patterns
 */

import type { Response } from 'express'
import type { AuthRequest } from '../auth/jwt.js'
import { postService } from './post.service.extensions.js'
import { logger } from '../logger.js'

/**
 * Get post by slug (public, no auth required)
 * Extension: SEO-friendly URLs
 */
export const getPostBySlug = async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params
    const post = await postService.findBySlug(slug)
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }
    
    // Increment views asynchronously (don't wait)
    postService.incrementViews(post.id).catch(err => 
      logger.error({ err, postId: post.id }, 'Failed to increment views')
    )
    
    return res.json(post)
  } catch (error) {
    logger.error({ error }, 'Failed to get post by slug')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * Publish a post (authorization required)
 * Extension: Publishing workflow with auth
 */
export const publishPost = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' })
    
    // Get post to check ownership
    const post = await postService.findById(id)
    if (!post) return res.status(404).json({ error: 'Post not found' })
    
    // Authorization: Only owner or admin/editor can publish
    const canPublish = 
      post.authorId === req.user.userId ||
      ['ADMIN', 'EDITOR'].includes(req.user.role)
    
    if (!canPublish) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Only post author or editors can publish posts'
      })
    }
    
    const updated = await postService.publish(id)
    logger.info({ postId: id, userId: req.user.userId }, 'Post published')
    
    return res.json(updated)
  } catch (error) {
    logger.error({ error }, 'Failed to publish post')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * Delete post (authorization required)
 * Extension: Ownership verification
 */
export const deletePostWithAuth = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' })
    
    // Get post to check ownership
    const post = await postService.findById(id)
    if (!post) return res.status(404).json({ error: 'Post not found' })
    
    // Authorization: Only owner or admin can delete
    const canDelete = 
      post.authorId === req.user.userId ||
      req.user.role === 'ADMIN'
    
    if (!canDelete) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only delete your own posts'
      })
    }
    
    await postService.delete(id)
    logger.info({ postId: id, userId: req.user.userId }, 'Post deleted')
    
    return res.status(204).send()
  } catch (error) {
    logger.error({ error }, 'Failed to delete post')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
```

---

## 🔧 Implementation Plan

### **Phase 1: Schema Parser Enhancement**

**File:** `packages/gen/src/schema-annotations.ts`

```typescript
export interface AuthAnnotations {
  required: boolean          // @auth required
  ownerField?: string        // @ownerField authorId
  roles?: {
    create?: string[]        // @roles create:AUTHOR,EDITOR
    update?: string[]
    delete?: string[]
    list?: string[]
    get?: string[]
  }
  public?: string[]          // @public list,get
}

export interface RelationshipAnnotations {
  include?: {
    [relation: string]: 'summary' | 'full' | 'count'
  }
  count?: string[]           // @count comments,likes
  virtual?: string[]         // @virtual commentCount
}

export interface DomainAnnotations {
  slug?: string              // @slug title
  search?: string[]          // @search title,content
  published?: string[]       // @published published,publishedAt
  incrementable?: string[]   // @incrementable views,likes
  softDelete?: boolean       // @softDelete
}

/**
 * Parse annotations from model documentation
 */
export function parseModelAnnotations(doc?: string): {
  auth: AuthAnnotations
  relationships: RelationshipAnnotations
  domain: DomainAnnotations
} {
  // Parse /// @annotation comments
  // Return structured metadata
}
```

---

### **Phase 2: Smart Service Generation**

**File:** `packages/gen/src/generators/service-generator-v3.ts`

```typescript
export class EnhancedServiceGenerator extends ServiceGeneratorV2 {
  private annotations: ModelAnnotations
  
  generate(): GeneratorOutput[] {
    const outputs = []
    
    // 1. Generate base CRUD (existing)
    outputs.push(...super.generate())
    
    // 2. Add relationship-aware methods
    if (this.hasRelationships()) {
      outputs.push(this.generateRelationshipMethods())
    }
    
    // 3. Add slug methods
    if (this.annotations.domain.slug) {
      outputs.push(this.generateSlugMethods())
    }
    
    // 4. Add published filtering
    if (this.annotations.domain.published) {
      outputs.push(this.generatePublishedMethods())
    }
    
    // 5. Add search
    if (this.annotations.domain.search) {
      outputs.push(this.generateSearchMethods())
    }
    
    // 6. Add counters
    if (this.annotations.domain.incrementable) {
      outputs.push(this.generateIncrementMethods())
    }
    
    return outputs
  }
  
  private generateRelationshipMethods(): string {
    return `
  /**
   * Find ${this.model.name} with relationships
   * Auto-generated based on @include annotations
   */
  async findByIdWithRelations(id: number) {
    return prisma.${this.metadata.lower}.findUnique({
      where: { id },
      include: {
        ${this.generateIncludes()}
      }
    })
  },
  
  /**
   * List with relationships
   */
  async listWithRelations(query: ${this.model.name}QueryDTO) {
    const { skip = 0, take = 20, orderBy, where } = query
    
    const [items, total] = await Promise.all([
      prisma.${this.metadata.lower}.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          ${this.generateIncludes()}
        }
      }),
      prisma.${this.metadata.lower}.count({ where })
    ])
    
    return { data: items, meta: { total, skip, take, hasMore: skip + take < total } }
  }
    `
  }
  
  private generateSlugMethods(): string {
    const slugField = this.annotations.domain.slug
    return `
  /**
   * Find by slug (SEO-friendly)
   * Auto-generated based on @slug annotation
   */
  async findBySlug(slug: string) {
    return prisma.${this.metadata.lower}.findUnique({
      where: { slug },
      include: {
        ${this.generateIncludes()}
      }
    })
  },
  
  /**
   * Generate unique slug from ${slugField}
   */
  async generateUniqueSlug(${slugField}: string): Promise<string> {
    let slug = ${slugField}.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    let counter = 1
    
    while (await prisma.${this.metadata.lower}.findUnique({ where: { slug } })) {
      slug = \`\${${slugField}}-\${counter}\`
      counter++
    }
    
    return slug
  }
    `
  }
  
  private generatePublishedMethods(): string {
    return `
  /**
   * List only published records
   * Auto-generated based on @published annotation
   */
  async listPublished(query: ${this.model.name}QueryDTO) {
    return this.list({
      ...query,
      where: {
        ...query.where,
        published: true,
        publishedAt: { lte: new Date() }
      }
    })
  },
  
  /**
   * Publish a record
   */
  async publish(id: number) {
    return prisma.${this.metadata.lower}.update({
      where: { id },
      data: {
        published: true,
        publishedAt: new Date()
      }
    })
  },
  
  /**
   * Unpublish a record
   */
  async unpublish(id: number) {
    return prisma.${this.metadata.lower}.update({
      where: { id },
      data: {
        published: false,
        publishedAt: null
      }
    })
  }
    `
  }
}
```

---

### **Phase 3: Authorization-Aware Controller Generation**

**File:** `packages/gen/src/generators/controller-generator-v3.ts`

```typescript
export class AuthorizedControllerGenerator extends ControllerGeneratorV2 {
  private annotations: AuthAnnotations
  
  generateDeleteMethod(): string {
    // If @auth required and @ownerField specified
    if (this.annotations.required && this.annotations.ownerField) {
      return `
export const delete${this.model.name} = async (req: AuthRequest, res: Response) => {
  try {
    const id = ${this.metadata.idParamParser}
    
    // Get item to check ownership
    const item = await ${this.metadata.lower}Service.findById(id)
    if (!item) return res.status(404).json({ error: 'Not found' })
    
    // Authorization check
    const isOwner = item.${this.annotations.ownerField} === req.user.userId
    const isAdmin = req.user.role === 'ADMIN'
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only delete your own ${this.metadata.lower}s'
      })
    }
    
    await ${this.metadata.lower}Service.delete(id)
    logger.info({ ${this.metadata.lower}Id: id, userId: req.user.userId }, '${this.model.name} deleted')
    
    return res.status(204).send()
  } catch (error) {
    logger.error({ error }, 'Failed to delete ${this.metadata.lower}')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
      `
    }
    
    // Otherwise generate basic delete
    return super.generateDeleteMethod()
  }
}
```

---

## 📚 Example Schema (Blog with Annotations)

**File:** `examples/blog-example/prisma/schema-enhanced.prisma`

```prisma
/// Blog post model
/// @auth required
/// @ownerField authorId
/// @roles create:AUTHOR,EDITOR,ADMIN update:OWNER,ADMIN delete:OWNER,ADMIN
/// @public list,get
/// @include author:summary categories:full tags:full
/// @count comments
/// @slug title
/// @search title,content,excerpt
/// @published published,publishedAt
/// @incrementable views
model Post {
  id            Int       @id @default(autoincrement())
  title         String
  slug          String    @unique
  excerpt       String?
  content       String
  coverImage    String?
  published     Boolean   @default(false)
  publishedAt   DateTime?
  views         Int       @default(0)
  likes         Int       @default(0)
  authorId      Int
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  author        Author              @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments      Comment[]
  categories    PostCategory[]
  tags          PostTag[]
  
  @@index([slug])
  @@index([publishedAt])
  @@index([authorId])
}

/// Comment model with threading and approval
/// @auth optional
/// @ownerField authorId
/// @roles create:ANY update:OWNER,ADMIN delete:OWNER,ADMIN
/// @roles approve:ADMIN,EDITOR
/// @public list,get
/// @include author:summary post:summary parent:summary replies:summary
/// @threading parentId,replies
/// @approval approved
model Comment {
  id            Int       @id @default(autoincrement())
  content       String
  approved      Boolean   @default(false)
  postId        Int
  authorId      Int?
  parentId      Int?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  post          Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  author        Author?   @relation(fields: [authorId], references: [id], onDelete: SetNull)
  parent        Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies       Comment[] @relation("CommentReplies")
  
  @@index([postId])
  @@index([authorId])
  @@index([approved])
}

/// Junction table for Post-Category relationship
/// @internal
/// @expose false
/// @managed post
model PostCategory {
  postId        Int
  categoryId    Int
  
  post          Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  category      Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  @@id([postId, categoryId])
}
```

---

## 🎯 What Gets Generated

### **From Enhanced Schema:**

**1. Base CRUD** (already working)
- ✅ list(), findById(), create(), update(), delete()

**2. Relationship Methods** (NEW!)
- ✅ findByIdWithRelations()
- ✅ listWithRelations()
- ✅ Auto-includes author, categories, tags

**3. Domain Methods** (NEW!)
- ✅ findBySlug()
- ✅ generateUniqueSlug()
- ✅ listPublished()
- ✅ publish(), unpublish()
- ✅ search()
- ✅ incrementViews()
- ✅ getPopular()

**4. Authorization Controllers** (NEW!)
- ✅ Ownership checks
- ✅ Role-based access
- ✅ Public/protected routes

**5. Smart Routes** (NEW!)
- ✅ GET /posts/slug/:slug
- ✅ POST /posts/:id/publish
- ✅ POST /posts/:id/views
- ✅ GET /posts/search?q=...
- ❌ NO /api/postcategory (hidden!)

---

## 📁 Proposed File Structure

```
examples/blog-example/
├── gen/                          # Generated (don't edit)
│   ├── services/
│   │   └── post/
│   │       └── post.service.ts   # Base CRUD + smart methods
│   ├── controllers/
│   │   └── post/
│   │       └── post.controller.ts # With authorization
│   └── routes/
│       └── post/
│           └── post.routes.ts    # Smart routes
│
└── src/
    └── extensions/               # Manual extensions (examples)
        ├── post.service.extensions.ts    # Custom business logic
        ├── post.controller.extensions.ts # Custom handlers
        └── README.md             # "How to extend generated code"
```

---

## 🎓 Benefits

### **1. 80% Auto-Generated:**
- Authorization checks
- Relationship loading
- Domain-specific methods
- Smart routing

### **2. 15% Auto-Detected:**
- Slug patterns
- Published/draft patterns
- Soft delete patterns
- Threading patterns

### **3. 5% Manual Extensions:**
- Custom business logic
- Complex workflows
- Integration with external services
- Advanced features

---

## 📊 Before vs After

### **BEFORE (Current - 45/100):**

**Generated:**
- Basic CRUD only
- No relationships
- No authorization
- No domain logic

**Developer Must Add:**
- All authorization (100%)
- All includes (100%)
- All domain methods (100%)
- All smart features (100%)

**Dev says:** "This is 30% done. I have 70% to implement manually."

---

### **AFTER (Enhanced - 85/100):**

**Generated:**
- ✅ CRUD with relationships included
- ✅ Authorization with ownership checks
- ✅ Domain methods (slug, publish, search)
- ✅ Smart routing

**Developer Must Add:**
- Custom business rules (10%)
- Complex workflows (5%)
- External integrations (5%)

**Dev says:** "This is 85% done! I just need to customize for my specific needs."

---

## 🚀 Migration Path

### **Step 1: Update Schema (5 minutes)**
Add annotations to existing schema:

```prisma
/// @auth required
/// @ownerField authorId
/// @include author:summary
model Post {
  // existing fields...
}
```

### **Step 2: Regenerate (5 seconds)**
```bash
npm run generate
```

### **Step 3: Get Enhanced Code**
- ✅ Authorization built-in
- ✅ Relationships included
- ✅ Domain methods generated

### **Step 4: Add Custom Extensions** (30 minutes)
```typescript
// src/extensions/post.service.ts
export const postService = {
  ...generatedPostService,
  
  // Add your custom methods
  async getRecommended(userId: number) {
    // Custom recommendation logic
  }
}
```

---

## 💡 Hybrid Approach

### **Generator Creates:**
1. **Base service** with common patterns
2. **Extension template** showing how to add more

### **Example Shows:**
1. **How to extend** generated code
2. **Real-world patterns** developers need
3. **Best practices** for customization

### **Result:**
- ✅ 80-85% generated
- ✅ 15-20% extension examples
- ✅ Clear separation
- ✅ Easy to customize
- ✅ Production-ready out of the box

---

## 🎯 Recommendation

### **Implement This in 3 Phases:**

**Phase 1 (This Week - 16 hours):**
- Schema annotation parser
- Enhanced service generator
- Relationship auto-detection
- Pattern detection (slug, published, etc.)

**Phase 2 (Next Week - 12 hours):**
- Authorization-aware controller generator
- Smart route generation
- Junction table detection
- Extension template generation

**Phase 3 (Week 3 - 8 hours):**
- Real-world extension examples
- Documentation
- Migration guide
- Best practices

**Total:** 36 hours to transform from 45/100 to 85/100

---

## ✨ Summary

### **Your Question:**
> "How can we build authorization and relationships into our build? We prefer to keep everything logical in the prisma schema but our examples should contain real world extensions usage for absolute realism"

### **Solution:**

✅ **Prisma Schema Annotations** - Encode auth & behavior in comments  
✅ **Smart Pattern Detection** - Auto-detect slug, published, threading  
✅ **Enhanced Generation** - Generate 80% with domain awareness  
✅ **Extension Examples** - Show real-world customizations  
✅ **Hybrid Approach** - Best of both worlds  

### **Result:**
- 80% auto-generated (auth, relationships, domain methods)
- 15% auto-detected (patterns)
- 5% manual extensions (shown in examples)

**From:** 30% done, 70% manual  
**To:** 85% done, 15% manual

**ROI:** 2.8x less manual work!

---

**Want me to implement Phase 1 (schema annotations + enhanced generation)?**

