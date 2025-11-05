# Minimal Example

This is the simplest possible example - just a schema file!

## Schema

Two models: `User` and `Post` with a one-to-many relationship.

## Generate

From the project root:

```bash
# Build the CLI first (one time)
pnpm build

# Generate from this schema
pnpm ssot generate minimal

# Or specify the schema path directly
pnpm ssot generate examples/minimal/schema.prisma
```

This will create a `gen-N` folder in the project root with a complete standalone project.

## What Gets Generated

- Complete Express API with CRUD endpoints
- TypeScript types and DTOs
- Zod validators
- Prisma service layer
- React Query hooks
- Self-validation tests
- Complete package.json with all dependencies
- README with setup instructions

All in a standalone, deletable folder!

