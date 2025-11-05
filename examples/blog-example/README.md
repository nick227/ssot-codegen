# Blog Example

Full-featured blog platform with posts, comments, authors, categories, and tags.

## Structure

```
blog-example/
├── schema.prisma    # Source schema (7 models)
├── extensions/      # Example custom code patterns
│   ├── README.md
│   └── post.service.extension.ts
└── README.md
```

## Models

- **Author** - Blog authors/users with roles
- **Post** - Blog posts with SEO fields
- **Comment** - Nested comments on posts
- **Category** - Post categories
- **Tag** - Post tags
- **PostCategory** - Many-to-many junction
- **PostTag** - Many-to-many junction

## Generate

```bash
# From project root
pnpm ssot generate blog-example

# Creates gen-N/ with complete project
cd gen-1
pnpm install
pnpm test:validate
pnpm dev
```

## Extensions

The `extensions/` folder shows how to add custom business logic:
- Search posts by content
- Find by slug
- Track views
- Get popular posts

See `extensions/README.md` for usage patterns.

## Features Demonstrated

- ✅ User roles and authentication
- ✅ Many-to-many relationships
- ✅ SEO-friendly URLs (slugs)
- ✅ Published/draft states
- ✅ View counters and likes
- ✅ Nested comments
- ✅ Content categorization and tagging

## What You Get

Generated project includes:
- Full CRUD API for all models
- TypeScript types and DTOs
- Zod validation
- Express routes
- React Query hooks
- Comprehensive tests
- Complete package.json

**All in a standalone, deletable folder!**

