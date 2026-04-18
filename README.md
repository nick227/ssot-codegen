# SSOT Codegen

Generate full-stack apps from a single source of truth (SSOT). This monorepo turns
your Prisma schema plus optional UI config into SDKs, API scaffolding, and a complete
UI (pages, layouts, and components).

## What it does

- Parses Prisma schemas into a normalized model.
- Generates UI pages (CRUD + custom), component libraries, and site templates.
- Provides runtime primitives for SDKs and data access.
- Supports policy-based access control (RLS + field permissions).
- Includes examples and ready-to-run website templates.

## Repo layout

- `packages/`
  - `cli`: CLI entrypoint (`pnpm ssot ...`).
  - `gen`: core generators (UI/site, API, scaffolding).
  - `core`: normalization helpers.
  - `ui`: component library + UI schemas.
  - `sdk-runtime`: HTTP runtime primitives.
  - `policy-engine`: row/field-level permissions.
  - `schema-lint`: schema tag validation (stub).
  - `prisma-to-models`: Prisma schema -> `models.json` for templates.
  - `create-ssot-app`: app scaffolding.
- `docs/`: deeper guides (UI config/workflow).
- `examples/`: working sample projects.
- `templates-default/`: built-in UI templates.
- `websites/`: generated or curated site outputs.

## Quick start (local)

The CLI is not published yet. Use workspace scripts from the repo root:

```bash
pnpm install
pnpm build

# Generate a project or SDK from schema
pnpm ssot generate ./prisma/schema.prisma

# Generate UI from schema (auto CRUD)
pnpm ssot ui --schema ./prisma/schema.prisma --output ./src

# Generate UI from a template
pnpm ssot ui --template blog --output ./src
```

## UI generation modes

- Zero config: CRUD pages and components from your schema.
- Template-based: blog/dashboard/ecommerce/landing templates.
- Declarative config: customize theme, navigation, and pages via `ssot.ui.config.ts`.

Start here:

- `QUICK_START_UI.md`
- `docs/UI_CONFIGURATION_GUIDE.md`
- `docs/UI_DEVELOPER_WORKFLOW.md`

## Examples

- `examples/blog-with-ui/`
- `examples/ai-chat-example/`
- `examples/ecommerce-example/`

## Scripts

See `package.json` for full script list. Common ones:

- `pnpm build`
- `pnpm lint`
- `pnpm test:generator`
- `pnpm ssot ui --list-templates`
