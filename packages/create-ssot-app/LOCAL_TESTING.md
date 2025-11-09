# Local Testing Guide for create-ssot-app

## Quick Test Without Installation

Since the packages aren't published yet, here's how to test locally:

### Step 1: Create Project Structure Only

Modify the tool temporarily to skip installation, OR:

Create a project manually:

```powershell
cd C:\wamp64\www\test-ssot
mkdir my-api
cd my-api

# Copy the generated files from a failed attempt:
# - package.json
# - prisma/schema.prisma
# - src/app.ts, src/server.ts, src/db.ts
# - .env
# - tsconfig.json
```

### Step 2: Link Local Packages

```powershell
# Link all ssot-codegen packages
pnpm link C:\wamp64\www\ssot-codegen\packages\cli
pnpm link C:\wamp64\www\ssot-codegen\packages\gen
pnpm link C:\wamp64\www\ssot-codegen\packages\sdk-runtime
pnpm link C:\wamp64\www\ssot-codegen\packages\templates-default

# Install other dependencies
pnpm install
```

### Step 3: Generate and Test

```powershell
# Generate Prisma client
pnpm prisma generate

# Generate API
pnpm exec ssot-codegen generate

# Start dev server
pnpm dev
```

## Alternative: Use Mock Package References

For testing without workspace issues, we can install from packed tarballs.

From ssot-codegen root:

```powershell
# Pack all packages
cd packages/cli && pnpm pack
cd ../gen && pnpm pack
cd ../sdk-runtime && pnpm pack
cd ../templates-default && pnpm pack
```

Then modify the generated package.json to use:
```json
"@ssot-codegen/cli": "file:../../ssot-codegen/packages/cli/ssot-codegen-cli-0.4.0.tgz"
```

