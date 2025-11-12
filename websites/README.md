# Website Projects

This directory contains all website project starters. Each project folder contains:

- `schema.prisma` - Prisma schema defining the data model
- `ui.config.ts` - UI configuration (pages, theme, components)
- `ssot.config.ts` - SSOT Codegen plugin configuration (optional)
- `starter.json` - Project metadata and settings
- `README.md` - Project-specific documentation (optional)

## Structure

```
websites/
├── ai-chat/          # AI Chat SPA project
├── blog/             # Blog website project
├── ecommerce/        # E-commerce project
└── config/
    └── bulk-generate.json  # Bulk generation config
```

## Generating Projects

**Important:** The CLI package is not published to npm. Use `pnpm ssot` instead of `npx ssot-gen`.

### Build CLI First (First Time Only)

```bash
# From project root
pnpm build
```

### Generate Projects

```bash
# Generate all projects listed in bulk-generate.json
pnpm ssot bulk --config websites/config/bulk-generate.json

# Or run CLI directly
node packages/cli/dist/cli.js bulk --config websites/config/bulk-generate.json
```

## Adding a New Project

1. Create a new folder in `websites/` (e.g., `websites/my-project/`)
2. Add `schema.prisma`, `ui.config.ts`, and optionally `ssot.config.ts`
3. Create `starter.json` with project metadata
4. Add project ID to `websites/config/bulk-generate.json`

## Starter.json Format

```json
{
  "id": "project-id",
  "name": "Project Name",
  "description": "Project description",
  "schema": "schema.prisma",
  "uiConfig": "ui.config.ts",
  "ssotConfig": "ssot.config.ts",
  "outputDir": "generated",
  "features": ["feature1", "feature2"],
  "requiredEnvVars": ["DATABASE_URL"]
}
```
