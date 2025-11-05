# SSOT Codegen CLI

Simple CLI tool to generate standalone projects from Prisma schemas.

## Installation

From the project root:

```bash
pnpm build
```

## Usage

### List Available Examples

```bash
pnpm ssot list
```

Output:
```
📚 Available Examples:

  • minimal
    ssot generate minimal

  • blog-example
    ssot generate blog-example

  • ecommerce-example
    ssot generate ecommerce-example

  • ai-chat-example
    ssot generate ai-chat-example
```

### Generate from Example Name

```bash
pnpm ssot generate minimal
pnpm ssot generate blog-example
```

This will:
1. Find the schema in `examples/{name}/schema.prisma` or `examples/{name}/prisma/schema.prisma`
2. Generate a standalone project in an incremental `gen-N` folder
3. Include complete package.json, tests, and all dependencies

### Generate from Schema Path

```bash
pnpm ssot generate path/to/schema.prisma
pnpm ssot generate ../my-project/prisma/schema.prisma
```

### Options

```bash
pnpm ssot generate minimal \
  --output ./custom-output \        # Custom output directory
  --name my-project \                # Custom project name
  --framework fastify \              # Framework (express or fastify)
  --no-standalone                    # Disable incremental gen-N folders
```

## What Gets Generated

Each `gen-N` folder is a complete, standalone project:

```
gen-1/
├── package.json          # Complete with all dependencies
├── tsconfig.json         # TypeScript configuration
├── vitest.config.ts      # Test configuration
├── .env.example          # Environment template
├── .gitignore            # Proper ignores
├── README.md             # Setup instructions
├── prisma/
│   └── schema.prisma     # Copy of source schema
├── src/
│   ├── app.ts            # Express app
│   ├── server.ts         # Server entry point
│   ├── config.ts         # Configuration
│   ├── db.ts             # Prisma client
│   ├── logger.ts         # Pino logger
│   └── middleware.ts     # Error handlers
├── tests/
│   ├── self-validation.test.ts  # Integration tests
│   └── setup.ts          # Test configuration
└── gen/
    ├── contracts/        # DTOs
    ├── validators/       # Zod validators
    ├── services/         # Prisma services
    ├── controllers/      # CRUD controllers
    ├── routes/           # Express routes
    └── sdk/              # TypeScript SDK + React hooks
```

## Testing Generated Projects

```bash
cd gen-1
pnpm install
pnpm test:validate        # Run full validation suite
pnpm dev                  # Start development server
```

## Simplifying Examples

With this CLI, example folders can be simplified to just:

```
examples/
├── minimal/
│   └── schema.prisma     # Just the schema!
├── blog/
│   └── schema.prisma
└── ecommerce/
    └── schema.prisma
```

No need for:
- ❌ package.json
- ❌ node_modules
- ❌ scripts/generate.js
- ❌ src/ (unless custom extensions)

## Benefits

1. **Simpler Examples** - Just schemas, no boilerplate
2. **Clean Separation** - Generated code lives in isolated gen-N folders
3. **Easy Comparison** - Keep multiple generations side-by-side
4. **Root-Level Control** - Generate from anywhere in the project
5. **Consistent Interface** - Same command for all examples

