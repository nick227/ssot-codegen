# Project Structure

## Overview

SSOT Codegen follows a **total separation** model: source schemas are completely isolated from generated projects.

```
ssot-codegen/                     ← Repository root
│
├── examples/                     ← Source schemas (version controlled)
│   ├── minimal/
│   │   ├── schema.prisma        ← 2 models: User, Post
│   │   └── README.md
│   │
│   ├── blog-example/
│   │   ├── schema.prisma        ← 7 models: Author, Post, Comment, etc.
│   │   ├── extensions/          ← Example custom code
│   │   │   ├── post.service.extension.ts
│   │   │   └── README.md
│   │   └── README.md
│   │
│   ├── ecommerce-example/
│   │   ├── schema.prisma        ← 15+ models
│   │   ├── extensions/
│   │   │   ├── product.service.extensions.ts
│   │   │   └── README.md
│   │   └── README.md
│   │
│   └── ai-chat-example/
│       ├── schema.prisma        ← With @service annotations
│       ├── extensions/
│       │   ├── ai-agent.service.integration.ts
│       │   └── README.md
│       └── README.md
│
├── generated/                    ← Generated projects (gitignored)
│   ├── blog-example-1/          ← Complete standalone project
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   ├── prisma/schema.prisma
│   │   ├── src/
│   │   ├── tests/
│   │   └── gen/
│   ├── blog-example-2/          ← Next generation
│   ├── minimal-1/
│   └── ecommerce-1/
│
└── packages/                     ← Core tools
    ├── gen/                     ← Code generator
    ├── cli/                     ← CLI tool
    ├── sdk-runtime/             ← SDK runtime
    └── templates-default/       ← Templates
```

## Key Principles

### 1. **Source of Truth: `examples/`**
- ✅ Version controlled (in git)
- ✅ Clean schemas only
- ✅ Optional extension examples
- ✅ No dependencies, no builds
- ✅ Stable and maintainable

### 2. **Generated Output: `generated/`**
- ✅ Gitignored (not committed)
- ✅ Fully standalone projects
- ✅ Incremental per schema
- ✅ Safe to delete entire folder
- ✅ Each project is self-contained

### 3. **Total Separation**
```
examples/blog-example/schema.prisma
    ↓ (generate)
generated/blog-example-1/
    ← Completely independent!
    ← Has its own package.json, node_modules, tests
    ← Safe to delete
    ← Doesn't affect source schema
```

## Generated Project Structure

Each folder in `generated/` is a complete, runnable project:

```
generated/blog-example-1/
├── package.json              # All dependencies listed
├── tsconfig.json             # TypeScript config
├── vitest.config.ts          # Test config
├── .env.example              # Environment template
├── .gitignore                # Proper ignores
├── README.md                 # Setup instructions
│
├── prisma/
│   └── schema.prisma         # Copy of source schema
│
├── src/                      # Application code
│   ├── app.ts                # Express app
│   ├── server.ts             # Entry point
│   ├── config.ts             # Configuration
│   ├── db.ts                 # Prisma client
│   ├── logger.ts             # Pino logger
│   └── middleware.ts         # Error handlers
│
├── tests/                    # Self-validation tests
│   ├── self-validation.test.ts  # Full integration tests
│   └── setup.ts              # Test configuration
│
└── gen/                      # Generated API code
    ├── base/                 # Base controllers
    ├── contracts/            # DTOs
    ├── validators/           # Zod validators
    ├── services/             # Prisma services
    ├── controllers/          # CRUD controllers
    ├── routes/               # Express routes
    ├── sdk/                  # TypeScript SDK + React hooks
    ├── openapi/              # OpenAPI spec
    └── manifests/            # Build manifest
```

## Workflow

### Generate a Project

```bash
# From repository root
pnpm ssot generate blog-example

# Output: generated/blog-example-1/
```

### Test the Generated Project

```bash
cd generated/blog-example-1
pnpm install
pnpm test:validate    # Full integration tests
pnpm dev              # Run the server
```

### Generate Again (Keeps Previous!)

```bash
cd ../..              # Back to root
pnpm ssot generate blog-example

# Output: generated/blog-example-2/
# blog-example-1 still exists!
```

### Compare Generations

```bash
# Compare bundle sizes
du -sh generated/blog-example-1
du -sh generated/blog-example-2

# Diff the code
diff -r generated/blog-example-1/gen generated/blog-example-2/gen
```

## File Organization Principles

### Examples: **Schema + Extensions**
- `schema.prisma` - Source of truth
- `extensions/` - Example patterns (optional)
- `README.md` - Documentation
- **Nothing else!**

### Generated Projects: **Complete & Standalone**
- All files needed to run
- Own package.json and dependencies
- Complete test suite
- Ready to: install → test → run
- Safe to delete

### Clean Separation
```
┌─────────────┐          ┌──────────────────┐
│  examples/  │          │   generated/     │
│             │          │                  │
│ (source of  │  ──────> │  (output, can    │
│  truth)     │ generate │   be deleted)    │
│             │          │                  │
└─────────────┘          └──────────────────┘
     git ✅                    gitignored ❌
   permanent                    temporary
```

## Benefits

1. **Clean Repository**
   - Source schemas stay clean
   - No build artifacts in examples
   - Clear what's tracked in git

2. **Developer Experience**
   - All generated projects in one place
   - Easy to find and compare
   - Simple cleanup (delete `generated/`)

3. **Testing & Iteration**
   - Keep multiple generations
   - Compare performance
   - Test schema changes safely

4. **Total Independence**
   - Each generated project is standalone
   - Can be moved anywhere
   - Can be deployed independently
   - Source schema stays pristine

