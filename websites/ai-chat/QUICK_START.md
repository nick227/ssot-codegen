# Quick Start Guide

## Correct Command

The CLI is **not published** to npm, so you must use the workspace script:

```bash
# From project root
cd C:\wamp64\www\ssot-codegen

# Build CLI first (if not already built)
pnpm build

# Generate projects
pnpm ssot bulk --config websites/config/bulk-generate.json
```

**NOT:** `npx ssot-gen` (this won't work - package isn't published)

---

## Full Workflow

```bash
# 1. Build CLI
pnpm build

# 2. Generate AI Chat project
pnpm ssot bulk --config websites/config/bulk-generate.json

# 3. Navigate to generated project
cd websites/ai-chat/generated

# 4. Install dependencies
pnpm install

# 5. Create .env file (see DEPLOYMENT.md)

# 6. Setup database
npx prisma generate
npx prisma migrate dev --name init

# 7. Start server
pnpm dev

# 8. Open browser
# http://localhost:3000
```

See `DEPLOYMENT.md` for detailed instructions.

