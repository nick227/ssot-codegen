# Blog Example - Full-Featured Blog Platform

Complete, production-ready blog platform demonstrating relationships, authentication, and complex workflows.

## What This Demonstrates

- ✅ Multi-model relationships (1-to-many, many-to-many)
- ✅ Role-based access control (RBAC)
- ✅ Content publishing workflow
- ✅ Nested comments with replies
- ✅ Categorization and tagging system
- ✅ Junction tables
- ✅ Proper indexing
- ✅ Cascading deletes
- ✅ Full integration tests

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Generate code from schema
pnpm generate

# 3. Setup database
pnpm db:setup

# 4. (Optional) Seed sample data
pnpm db:seed

# 5. Start development server
pnpm dev
```

Server runs on `http://localhost:3000`

## Schema Overview

### 7 Models
- **Author**: User accounts with roles (Admin, Editor, Author, Subscriber)
- **Post**: Blog articles with publishing workflow, slugs, views, likes
- **Comment**: Nested comments with approval workflow
- **Category**: Hierarchical content organization
- **Tag**: Flexible content tagging
- **PostCategory**: Post ↔ Category many-to-many junction
- **PostTag**: Post ↔ Tag many-to-many junction

**Generated**: ~100 files providing complete CRUD API

## Features

### Authentication & Authorization
- JWT-based authentication
- Role-based permissions (Admin, Editor, Author, Subscriber)
- Protected routes
- Owner-based access control

### Publishing Workflow
- Draft → Published state management
- Scheduled publishing (`publishedAt`)
- SEO-friendly slugs
- View and like counters
- Cover images

### Engagement
- Nested comment threads
- Comment approval workflow
- Reply to comments
- Guest and authenticated commenting

### Organization
- Multiple categories per post
- Unlimited tags per post  
- Category descriptions and hierarchy
- Auto-generated category/tag slugs

## Generated API Endpoints

### Authors
```
POST   /api/authors              # Register author
GET    /api/authors/:id          # Get author profile
PUT    /api/authors/:id          # Update profile
GET    /api/authors/:id/posts    # Get author's posts
```

### Posts
```
GET    /api/posts                # List posts (with pagination)
GET    /api/posts/:id            # Get post by ID
GET    /api/posts/slug/:slug     # Get post by slug
POST   /api/posts                # Create post (auth required)
PUT    /api/posts/:id            # Update post
DELETE /api/posts/:id            # Delete post
POST   /api/posts/:id/publish    # Publish post
POST   /api/posts/:id/unpublish  # Unpublish post
POST   /api/posts/:id/views      # Increment view count
```

### Comments
```
GET    /api/comments             # List comments
POST   /api/comments             # Add comment
GET    /api/comments/:id/thread  # Get comment thread (with replies)
POST   /api/comments/:id/approve # Approve comment
POST   /api/comments/:id/reject  # Reject comment
```

### Categories & Tags
```
GET    /api/categories           # List categories
POST   /api/categories           # Create category
GET    /api/tags                 # List tags
POST   /api/tags                 # Create tag
```

## Testing

### Run All Tests
```bash
pnpm test:all
```

### Unit Tests
```bash
pnpm test
```

### Integration Tests
```bash
pnpm test:integration
```

**Coverage**: Comprehensive integration tests for all API endpoints

## File Structure

```
blog-example/
├── prisma/
│   └── schema.prisma           ← Schema (7 models)
├── src/
│   ├── app.ts                  ← Express app
│   ├── server.ts               ← Server entry
│   ├── db.ts                   ← Prisma client
│   ├── auth/                   ← JWT, passwords, authorization
│   ├── extensions/             ← Custom post/comment logic
│   └── utils/                  ← Helper utilities
├── tests/
│   ├── helpers/                ← Test utilities
│   └── integration/            ← API tests
├── scripts/
│   ├── generate.js             ← Code generation
│   ├── db-setup.js             ← Database setup
│   └── seed.ts                 ← Sample data
├── gen/                        ← Generated code (gitignored)
└── package.json
```

## What Gets Generated

From **7 models** → **~100 files**:

```
gen/
├── contracts/          ← DTOs for all models (28 files)
├── validators/         ← Zod schemas (29 files)
├── services/           ← Database operations (11 files)
├── controllers/        ← Request handlers (11 files)
├── routes/             ← Route definitions (11 files)
├── sdk/                ← Type-safe client (7 files)
└── base/               ← Base classes (3 files)
```

## Customization

### Extend Generated Services

```typescript
// src/extensions/post/enhanced-service.ts
import { postService } from '../../gen/services/post/post.service.js'

export const enhancedPostService = {
  ...postService,
  
  // Custom method
  async getPopularPosts(limit = 10) {
    return postService.findMany({
      where: { published: true },
      orderBy: 'views:desc',
      take: limit
    })
  }
}
```

### Custom Routes

```typescript
// src/routes/custom.ts
import { Router } from 'express'
import { enhancedPostService } from '../extensions/post/enhanced-service.js'

export const customRoutes = Router()

customRoutes.get('/popular', async (req, res) => {
  const posts = await enhancedPostService.getPopularPosts()
  res.json({ data: posts })
})
```

## Learn More

- [Authorization Guide](./AUTHORIZATION_GUIDE.md) - RBAC implementation
- [Search API Docs](./SEARCH_API_DOCUMENTATION.md) - Search functionality
- [Main Documentation](../../README.md)

---

**This example shows a production-ready blog platform in < 500 lines of schema** 🚀
