# CLI Usage Guide

Complete reference for the SSOT Codegen command-line interface.

---

## Installation

```bash
# From workspace root
pnpm install
pnpm build
```

The `ssot` command is aliased in `package.json`:
```bash
pnpm ssot <command>
```

---

## Commands

### `ssot list`

List all available example schemas.

```bash
pnpm ssot list
```

**Output:**
```
Available examples:
  • minimal              - Simple schema (User, Post)
  • blog-example         - Full blog platform
  • ecommerce-example    - Online store
  • ai-chat-example      - AI integration showcase
```

---

### `ssot generate <name>`

Generate a standalone project from a schema.

**Usage:**
```bash
# Generate from example name
pnpm ssot generate <example-name> [options]

# Generate from schema file path
pnpm ssot generate path/to/schema.prisma [options]
```

**Options:**
- `--name <projectName>` - Custom project name (default: derived from schema)
- `--framework <framework>` - Target framework: `express` or `fastify` (default: `express`)
- `--output <directory>` - Output directory (default: `generated/<name>-<increment>`)

**Examples:**
```bash
# Basic generation
pnpm ssot generate minimal

# With custom name
pnpm ssot generate blog-example --name my-blog-api

# With Fastify
pnpm ssot generate ecommerce-example --framework fastify

# From custom schema
pnpm ssot generate ./my-schema.prisma --name my-api
```

---

## Example Schemas

### minimal

**Location:** `examples/minimal/schema.prisma`

**Models:** 2 (User, Post)

**Use For:** Learning, quick tests

```bash
pnpm ssot generate minimal
cd generated/minimal-1
pnpm install
pnpm dev
```

---

### blog-example

**Location:** `examples/blog-example/schema.prisma`

**Models:** 5 (User, Post, Comment, Category, Tag)

**Features:**
- Many-to-many relationships
- Enums
- Complex queries
- Full CRUD

```bash
pnpm ssot generate blog-example
cd generated/blog-example-1
pnpm install
npx prisma migrate dev
pnpm dev
```

---

### ecommerce-example

**Location:** `examples/ecommerce-example/schema.prisma`

**Models:** 10+ (Product, Order, Cart, Payment, etc.)

**Features:**
- Complex business logic
- Transaction handling
- Inventory management
- Order workflows

```bash
pnpm ssot generate ecommerce-example
cd generated/ecommerce-example-1
pnpm install
npx prisma migrate dev
pnpm dev
```

---

### ai-chat-example

**Location:** `examples/ai-chat-example/schema.prisma`

**Models:** 11 (User, Conversation, Message, AIPrompt, etc.)

**Features:**
- Service integrations (`@service` annotations)
- OpenAI plugin
- Google OAuth plugin
- File uploads
- Email queuing
- Payment processing

**Plugins:** OpenAI, Google Auth, Storage, Payments, Email

```bash
# Requires API credentials in .env
pnpm ssot generate ai-chat-example
cd generated/ai-chat-example-1
pnpm install
npx prisma migrate dev
pnpm dev

# Test at: http://localhost:3000/checklist.html
```

---

## Generated Project Structure

After running `ssot generate`, you get:

```
generated/<project-name>-<n>/
├── package.json          # Complete dependencies
├── tsconfig.json         # TypeScript config
├── .env.example          # Environment template
├── .gitignore            # Git ignore rules
├── README.md             # Project-specific docs
│
├── prisma/
│   └── schema.prisma     # Copy of source schema
│
├── src/
│   ├── app.ts            # Express application
│   ├── server.ts         # HTTP server
│   ├── config.ts         # Configuration (multi-path .env loading)
│   ├── db.ts             # Prisma client
│   ├── logger.ts         # Pino logger
│   ├── middleware.ts     # Global middleware
│   │
│   ├── contracts/        # DTOs (one directory per model)
│   ├── validators/       # Zod schemas
│   ├── services/         # Prisma CRUD + custom services
│   ├── controllers/      # HTTP handlers
│   ├── routes/           # Express routes
│   │
│   ├── sdk/              # TypeScript client SDK
│   │   ├── core/         # Query builders
│   │   ├── models/       # Model clients
│   │   ├── react/        # React Query hooks
│   │   └── services/     # Service clients
│   │
│   ├── auth/             # OAuth/JWT (if plugins enabled)
│   ├── checklist/        # Health check dashboard
│   └── openapi/          # OpenAPI spec
│
├── public/
│   └── checklist.html    # Interactive test dashboard
│
└── tests/
    ├── setup.ts
    └── self-validation.test.ts
```

---

## Common Workflows

### Test Generation Locally

```bash
# Generate
pnpm ssot generate minimal

# Navigate
cd generated/minimal-1

# Install & test
pnpm install
pnpm test:validate
pnpm dev
```

### Use Custom Schema

```bash
# Create your schema
mkdir my-project
cd my-project
npx prisma init

# Edit prisma/schema.prisma

# Generate
pnpm ssot generate prisma/schema.prisma --name my-api

# Run
cd ../generated/my-api-1
pnpm install
pnpm dev
```

### Multiple Generations

```bash
# Generate v1
pnpm ssot generate blog-example
# Creates: generated/blog-example-1/

# Modify schema
# ... edit examples/blog-example/schema.prisma ...

# Generate v2
pnpm ssot generate blog-example
# Creates: generated/blog-example-2/

# Compare outputs
diff -r generated/blog-example-1 generated/blog-example-2
```

---

## Environment Variables

### Generator Configuration

Control plugin behavior via `.env` at workspace root:

```bash
# Enable plugins
ENABLE_GOOGLE_AUTH=true
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-secret"

# AI providers
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GEMINI_API_KEY="..."

# See: env.development.template for all options
```

### Generated Project Configuration

Each generated project uses **multi-path .env loading**:

```
1. Checks: generated/project-1/.env
2. Falls back: generated/.env
3. Falls back: workspace-root/.env  ← Recommended!
```

This allows **one .env for all generated projects**.

---

## Testing

### Test the Generator

```bash
cd packages/gen
pnpm test
```

### Test Generated Projects

```bash
# Run self-validation tests
cd generated/blog-example-1
pnpm test:validate

# Run all tests
pnpm test
```

### Test All Examples

```bash
# From workspace root
pnpm run examples:all    # Generate all
pnpm run test:examples   # Test all
```

---

## Troubleshooting

### "Schema file not found"

**Problem:** Can't find the schema at the specified path.

**Solution:**
```bash
# Use relative path from workspace root
pnpm ssot generate examples/blog-example/schema.prisma

# Or use example name
pnpm ssot generate blog-example
```

### "Cannot find module" in generated project

**Problem:** Import paths broken after generation.

**Solution:**
```bash
cd generated/your-project-1
pnpm install  # Install all dependencies
pnpm build    # Compile TypeScript
```

### "Database connection failed"

**Problem:** No `DATABASE_URL` in environment.

**Solution:**
```bash
# Copy template
cp .env.example .env

# Or create workspace .env
echo 'DATABASE_URL="mysql://root@localhost:3306/mydb"' > ../../.env

# The generated config.ts will find it automatically
```

### "Plugin not generating files"

**Problem:** Plugin enabled but files missing.

**Solution:**
```bash
# Ensure env var is set
echo 'ENABLE_GOOGLE_AUTH=true' >> .env

# Rebuild generator
cd packages/gen
pnpm build

# Rebuild CLI  
cd ../cli
pnpm build

# Regenerate
cd ../..
pnpm ssot generate ai-chat-example
```

---

## Advanced Usage

### Custom Templates

(Coming soon - plugin API for template overrides)

### Plugin Development

See: `packages/gen/src/plugins/` for examples

**Structure:**
```typescript
export class MyPlugin implements FeaturePlugin {
  name = 'my-plugin'
  version = '1.0.0'
  description = 'My custom plugin'
  
  requirements = {
    models: { required: ['User'] },
    envVars: { required: ['MY_API_KEY'] },
    dependencies: { ... }
  }
  
  validate(context) { ... }
  generate(context) { ... }
  healthCheck(context) { ... }
}
```

Register in `packages/gen/src/plugins/plugin-manager.ts`.

---

## Performance

**Typical Generation Speed:**
- Small schema (2-5 models): ~0.1s, ~500 files
- Medium schema (10-15 models): ~0.17s, ~1000 files  
- Large schema (30+ models): ~0.4s, ~2500 files

**Throughput:** 900-1200 files/second

---

## See Also

- [Quick Start Guide](QUICKSTART.md) - First-time setup
- [Project Structure](PROJECT_STRUCTURE.md) - Architecture details
- [Plugin Index](PROVIDER_PLUGINS_INDEX.md) - All available plugins
- [Google OAuth Setup](GOOGLE_AUTH_SETUP.md) - OAuth credentials guide

