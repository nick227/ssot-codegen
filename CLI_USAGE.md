# CLI Usage Guide

## Important: Package Not Published

The `@ssot-codegen/cli` package is **not published to npm**, so you cannot use `npx ssot-gen`.

## Correct Usage

### Option 1: Use Workspace Script (Recommended)

```bash
# From project root
cd C:\wamp64\www\ssot-codegen

# Build CLI first (first time only)
pnpm build

# Run commands
pnpm ssot bulk --config websites/config/bulk-generate.json
pnpm ssot generate schema.prisma
pnpm ssot ui --schema schema.prisma
```

### Option 2: Run CLI Directly

```bash
# From project root
node packages/cli/dist/cli.js bulk --config websites/config/bulk-generate.json
```

### Option 3: Build and Link Locally

If you want to use `ssot` command globally:

```bash
# Build CLI
cd packages/cli
pnpm build

# Link globally (optional)
pnpm link --global
```

Then you can use:
```bash
ssot bulk --config websites/config/bulk-generate.json
```

## Available Commands

- `pnpm ssot bulk` - Generate multiple websites from bulk config
- `pnpm ssot generate` - Generate a single project from schema
- `pnpm ssot ui` - Generate UI components from schema

## Why Not Published?

This is a development tool used within the monorepo. Publishing to npm is planned for future releases.

