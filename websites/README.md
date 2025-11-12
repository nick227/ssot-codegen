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

### Single Project

```bash
# Generate a specific project
npx ssot-gen bulk --config websites/config/bulk-generate.json
```

### All Projects

```bash
# Generate all projects listed in bulk-generate.json
npx ssot-gen bulk
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
