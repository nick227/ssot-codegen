# Blog Example - Full-Featured Blog Platform

Complete, production-ready blog platform schema with all modern features.

## What This Demonstrates

- ✅ Multi-model relationships (1-to-many, many-to-many)
- ✅ User roles and authentication
- ✅ Content publishing workflow
- ✅ Nested comments with replies
- ✅ Categorization and tagging system
- ✅ Junction tables for many-to-many
- ✅ Proper indexing strategy
- ✅ Cascading deletes

## Schema Overview

### Core Models
- **Author**: User accounts with roles (Admin, Editor, Author, Subscriber)
- **Post**: Blog articles with publishing workflow
- **Comment**: Nested comments with reply support
- **Category**: Hierarchical content organization
- **Tag**: Flexible content tagging

### Junction Models
- **PostCategory**: Post ↔ Category many-to-many
- **PostTag**: Post ↔ Tag many-to-many

## Features Included

### Author Management
- User authentication and profiles
- Role-based access control (RBAC)
- Author bios and avatars
- Activity tracking

### Content Publishing
- Draft and publish workflow
- Post scheduling (publishedAt)
- SEO-friendly slugs
- Cover images
- View and like counters

### Engagement
- Nested comment system
- Comment approval workflow
- Reply to comments
- Guest and authenticated commenting

### Organization
- Multiple categories per post
- Unlimited tags per post
- Category descriptions
- Auto-generated slugs

## Quick Start

```bash
# Generate code
pnpm run generate

# Run tests
pnpm run test
```

## Generated API Endpoints

```
POST   /authors          # Register author
GET    /authors/:id      # Get author profile
GET    /posts            # List posts (published)
GET    /posts/:slug      # Get post by slug
POST   /posts            # Create post (auth required)
PUT    /posts/:id        # Update post
GET    /comments?postId  # Get comments for post
POST   /comments         # Add comment
GET    /categories       # List categories
GET    /tags             # List tags
GET    /posts?tag=:slug  # Filter posts by tag
```

## Database Schema

```
Author (1) ──→ (∞) Post
Post (1) ──→ (∞) Comment
Comment (1) ──→ (∞) Comment (nested replies)
Post (∞) ←→ (∞) Category (via PostCategory)
Post (∞) ←→ (∞) Tag (via PostTag)
```

## Use Cases

Perfect for:
- Full-featured blog websites
- Content management systems (CMS)
- News and magazine platforms
- Personal blogs with community features
- Learning complex schema relationships
- Testing SSOT Codegen with realistic data

## Environment Setup

```env
DATABASE_URL="postgresql://user:password@localhost:5432/blog_db"
```

## Next Steps

1. Set up PostgreSQL database
2. Run `npx prisma migrate dev`
3. Generate code with `pnpm run generate`
4. Import generated code: `import { PostCreateDTO } from '@gen/contracts/post'`
5. Build your blog API!

## Generated Structure

```
gen/
├── contracts/         # DTOs for all 7 models
├── validators/        # Zod schemas
├── routes/           # Express routes with auth
├── controllers/      # CRUD handlers
├── services/         # Business logic
├── loaders/          # DataLoader for N+1 prevention
├── auth/             # Role-based policies
└── openapi/          # Complete API specification
```

This is a **complete blog in a box** - just add your UI!

