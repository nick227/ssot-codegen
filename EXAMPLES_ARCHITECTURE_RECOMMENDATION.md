# Examples Architecture - Best Practices for Distribution

## Current State Analysis

### What's Happening Now
```
examples/blog-example/
├── gen/              ← Generated code (may be committed)
├── dist/             ← Compiled JavaScript
├── src/              ← User's source code
├── prisma/           ← Prisma schema
└── scripts/          ← Generation scripts
```

**Issue**: Generated `gen/` folders may be committed to git, making the repo bloated and causing merge conflicts.

**Root .gitignore has**: `/examples/*/gen/` ✅ (correct)
**But**: Some gen folders may have been committed before this rule was added.

---

## ✅ Recommended Architecture

### For Distributed Library

```
examples/blog-example/
├── src/              ← Pristine user code (committed)
├── prisma/           ← Schema (committed)
├── scripts/          ← Helper scripts (committed)
├── tests/            ← Tests (committed)
├── .gitignore        ← Excludes gen/ and dist/ (committed)
├── package.json      ← With setup script (committed)
├── README.md         ← Usage instructions (committed)
├── gen/              ← Generated code (IGNORED)
└── dist/             ← Compiled code (IGNORED)
```

**Key Principles**:
1. ✅ **Commit**: Source code, schemas, tests, configs
2. ❌ **Ignore**: Generated code, compiled code, node_modules
3. 📝 **Document**: Clear setup instructions
4. 🔄 **Automate**: Setup scripts for first-time users

---

## 🛠️ Implementation Plan

### 1. Add .gitignore to Each Example

**Create**: `examples/*/[.gitignore` (if not exists)

```gitignore
# Dependencies
node_modules/

# Generated Code (DO NOT COMMIT)
gen/

# Build Output
dist/
build/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# Database
prisma/*.db
prisma/*.db-journal

# Testing
coverage/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
```

### 2. Remove Committed Generated Files

```bash
# One-time cleanup
git rm -r --cached examples/*/gen/
git commit -m "Remove generated code from examples (should be gitignored)"
```

### 3. Add Setup Scripts to package.json

**Update**: `examples/blog-example/package.json`

```json
{
  "scripts": {
    "setup": "pnpm install && pnpm generate && pnpm db:setup",
    "generate": "node scripts/generate.js",
    "build": "tsc",
    "dev": "tsx watch src/server.ts",
    "start": "node dist/src/server.js",
    "db:setup": "node scripts/db-setup.js",
    "db:seed": "tsx scripts/seed.ts",
    "test": "vitest run",
    "test:integration": "vitest run --config vitest.integration.config.ts"
  }
}
```

### 4. Update README with Setup Instructions

**Update**: `examples/blog-example/README.md`

```markdown
## Quick Start

### First Time Setup
\`\`\`bash
# 1. Install dependencies
pnpm install

# 2. Generate code from Prisma schema
pnpm generate

# 3. Setup database
pnpm db:setup

# 4. (Optional) Seed with sample data
pnpm db:seed

# 5. Start development server
pnpm dev
\`\`\`

### What Gets Generated
Running `pnpm generate` creates:
- `gen/contracts/` - TypeScript DTOs
- `gen/validators/` - Zod validation schemas
- `gen/services/` - Prisma service layer
- `gen/controllers/` - Express/Fastify controllers
- `gen/routes/` - Route definitions
- `gen/sdk/` - Type-safe client SDK

**Note**: The `gen/` folder is gitignored and regenerated on demand.
```

### 5. Add Postinstall Hook (Optional)

For automatic generation after `pnpm install`:

```json
{
  "scripts": {
    "postinstall": "pnpm generate"
  }
}
```

**Pros**: Users don't need to remember to generate
**Cons**: Adds time to install, may surprise users

**Recommendation**: Document manual generation, add postinstall only if needed.

---

## 📋 Distribution Checklist

### Before Publishing

- [ ] Remove all `gen/` folders from git
  ```bash
  git rm -r --cached examples/*/gen/
  ```

- [ ] Ensure each example has `.gitignore`
  ```bash
  # Check each example has .gitignore with gen/
  ls examples/*/.gitignore
  ```

- [ ] Update all example READMEs with:
  - [ ] Setup instructions
  - [ ] Generation step
  - [ ] What gets generated
  - [ ] Prerequisites

- [ ] Add setup scripts to package.json:
  - [ ] `pnpm setup` - Full setup
  - [ ] `pnpm generate` - Generate code
  - [ ] `pnpm db:setup` - Setup database

- [ ] Test fresh installation:
  ```bash
  # Clone to new directory
  git clone <repo> test-fresh
  cd test-fresh/examples/blog-example
  pnpm install
  pnpm setup
  pnpm dev
  ```

### Documentation Updates

- [ ] Main README explains example structure
- [ ] Each example README has setup guide
- [ ] CONTRIBUTING.md explains gen/ is ignored
- [ ] Document what to commit vs ignore

---

## 🎯 Benefits of This Approach

### For Users
✅ **Clean Repo**: No generated code bloat (thousands of files)
✅ **Clear Separation**: Source vs generated code
✅ **Easy Updates**: Just re-run generate after schema changes
✅ **No Conflicts**: Generated code never causes merge conflicts
✅ **Fresh Generation**: Always matches current schema

### For Maintainers
✅ **Smaller Repo**: Significantly smaller git repository
✅ **Faster Clones**: No thousands of generated files
✅ **No Review Overhead**: Don't review generated code in PRs
✅ **Clear Intent**: Only source changes in commits
✅ **Easier Testing**: Can test generation process itself

### For Distribution
✅ **Professional**: Industry-standard approach
✅ **Scalable**: Works for any size schema
✅ **Clear Workflow**: Generate → Build → Run
✅ **Version Safe**: Generated code always matches library version

---

## 🔄 Migration Strategy

### Step 1: Cleanup (One-time)

```bash
# Remove all generated code from git
git rm -r --cached examples/blog-example/gen/
git rm -r --cached examples/demo-example/gen/
git rm -r --cached examples/ecommerce-example/gen/
git rm -r --cached examples/ai-chat-example/gen/
git rm -r --cached examples/minimal/gen/

# Commit the removal
git commit -m "Remove generated code from examples

Generated code should not be committed:
- Bloats repository
- Causes merge conflicts
- Always regenerated from schema

Users should run 'pnpm generate' to create gen/ folder."
```

### Step 2: Add .gitignore to Each Example

```bash
# For each example without .gitignore
examples/blog-example/.gitignore
examples/ecommerce-example/.gitignore
examples/ai-chat-example/.gitignore
examples/minimal/.gitignore
```

### Step 3: Update Documentation

```bash
# Update each README with setup instructions
examples/blog-example/README.md
examples/demo-example/README.md
examples/ecommerce-example/README.md
examples/ai-chat-example/README.md
examples/minimal/README.md
```

### Step 4: Add Setup Scripts

```json
// Each example's package.json
{
  "scripts": {
    "setup": "pnpm install && pnpm generate && pnpm db:setup",
    "generate": "node scripts/generate.js"
  }
}
```

---

## 📝 Example-Specific Recommendations

### Blog Example

**Current**: gen/ folder with ~100 files  
**Recommendation**: Gitignore gen/, keep pristine

```bash
cd examples/blog-example

# Remove from git
git rm -r --cached gen/

# Create .gitignore (if doesn't exist)
echo "gen/" >> .gitignore
echo "dist/" >> .gitignore
echo "node_modules/" >> .gitignore
echo "*.log" >> .gitignore
echo ".env.local" >> .gitignore
echo "coverage/" >> .gitignore

# Update README
# Add "First Time Setup" section
```

### Demo Example

**Current**: Has .gitignore with gen/ ✅  
**Status**: Already following best practices

### Ecommerce Example

**Current**: gen/ folder with ~387 files  
**Recommendation**: Same as blog example

### Minimal Example

**Current**: Small gen/ folder  
**Recommendation**: Even minimal should gitignore for consistency

---

## 🎯 Recommended File Structure

### What Users See After Clone

```
examples/blog-example/
├── prisma/
│   └── schema.prisma          ← Schema definition
├── src/
│   ├── app.ts                 ← Application setup
│   ├── server.ts              ← Server entry
│   └── extensions/            ← Custom logic
├── scripts/
│   ├── generate.js            ← Generation script
│   ├── db-setup.js            ← Database setup
│   └── seed.ts                ← Seed data
├── tests/                     ← Tests
├── .gitignore                 ← Ignores gen/
├── package.json               ← With setup script
├── README.md                  ← Setup instructions
└── tsconfig.paths.json        ← Points to gen/
```

### What Users Create via `pnpm setup`

```
examples/blog-example/
├── ... (above files)
├── node_modules/              ← Dependencies
├── gen/                       ← Generated code
│   ├── contracts/
│   ├── validators/
│   ├── services/
│   ├── controllers/
│   ├── routes/
│   └── sdk/
└── dist/                      ← Compiled code
```

---

## 📚 Documentation Template

### README.md Template for Each Example

````markdown
# [Example Name]

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- PostgreSQL running

### First Time Setup

\`\`\`bash
# 1. Install dependencies
pnpm install

# 2. Generate code from Prisma schema
pnpm generate

# 3. Setup database
pnpm db:setup

# 4. Start development server
pnpm dev
\`\`\`

### What `pnpm generate` Creates

The `gen/` folder is created with:
- **contracts/**: TypeScript DTOs for all models
- **validators/**: Zod validation schemas
- **services/**: Database service layer
- **controllers/**: Express/Fastify request handlers
- **routes/**: Route definitions
- **sdk/**: Type-safe client SDK

**Note**: This folder is gitignored and regenerated on demand.

### Development Workflow

\`\`\`bash
# After changing schema.prisma
pnpm generate          # Regenerate code
pnpm db:push           # Push schema changes
pnpm dev               # Restart server
\`\`\`

### Project Structure

\`\`\`
├── prisma/schema.prisma    ← Your schema (COMMIT)
├── src/                    ← Your code (COMMIT)
├── scripts/                ← Helper scripts (COMMIT)
├── gen/                    ← Generated code (IGNORE)
└── dist/                   ← Compiled code (IGNORE)
\`\`\`
````

---

## 🚀 Immediate Actions

### 1. Create .gitignore Files

```bash
# For blog-example
cat > examples/blog-example/.gitignore << 'EOF'
node_modules/
gen/
dist/
*.log
.env.local
coverage/
*.tsbuildinfo
prisma/*.db
prisma/*.db-journal
EOF

# For ecommerce-example
cat > examples/ecommerce-example/.gitignore << 'EOF'
node_modules/
gen/
dist/
*.log
.env.local
coverage/
*.tsbuildinfo
prisma/*.db
prisma/*.db-journal
EOF

# For ai-chat-example
cat > examples/ai-chat-example/.gitignore << 'EOF'
node_modules/
gen/
dist/
*.log
.env.local
coverage/
*.tsbuildinfo
prisma/*.db
prisma/*.db-journal
EOF

# For minimal
cat > examples/minimal/.gitignore << 'EOF'
node_modules/
gen/
dist/
*.log
EOF
```

### 2. Remove Committed Generated Files

```bash
# Remove from git (keeps local files)
git rm -r --cached examples/blog-example/gen/
git rm -r --cached examples/ecommerce-example/gen/
git rm -r --cached examples/ai-chat-example/gen/
git rm -r --cached examples/minimal/gen/

git commit -m "Remove generated code from examples

Generated code should not be committed:
- Bloats repository (thousands of files)
- Causes merge conflicts
- Always regenerated from schema
- Changes with every schema update

Users run 'pnpm generate' to create gen/ folder."
```

### 3. Update package.json Scripts

Add to each example:
```json
{
  "scripts": {
    "setup": "pnpm install && pnpm generate && pnpm db:setup",
    "generate": "node scripts/generate.js",
    "clean": "rm -rf gen/ dist/ node_modules/",
    "reset": "pnpm clean && pnpm setup"
  }
}
```

### 4. Update READMEs

Add prominent "First Time Setup" section to each example's README.

---

## 💡 Alternative Approaches

### Option A: Current Approach (Improved)
```
examples/blog-example/
└── gen/              ← Generated here, gitignored
```

**Pros**: Simple, code where you expect it  
**Cons**: None with proper .gitignore

### Option B: Separate Output Directory
```
examples/blog-example/
└── .generated/       ← Hidden folder, gitignored
```

**Pros**: Visually distinct (hidden folder)  
**Cons**: Less discoverable

### Option C: Build-Time Generation
```
examples/blog-example/
└── dist/
    └── gen/          ← Generated during build
```

**Pros**: Integrated with build process  
**Cons**: Mixes generated TS with compiled JS

### Recommendation: **Option A** (Current)

Keep `gen/` but ensure it's:
1. ✅ Always gitignored
2. ✅ Clearly documented
3. ✅ Easy to regenerate
4. ✅ Never committed

---

## 📋 Implementation Checklist

### Immediate (Before Next Release)

- [ ] Remove gen/ from git history
  ```bash
  git rm -r --cached examples/*/gen/
  ```

- [ ] Create .gitignore for each example
  ```bash
  # Ensure gen/ is ignored in all examples
  ```

- [ ] Verify root .gitignore has `/examples/*/gen/` ✅ (already done)

- [ ] Update all example READMEs with:
  - [ ] "First Time Setup" section
  - [ ] `pnpm generate` step clearly documented
  - [ ] Explanation of gen/ folder

- [ ] Add setup scripts to all example package.json files

### Nice to Have

- [ ] Add `postinstall` hook to run generate automatically
- [ ] Create global examples/README.md explaining structure
- [ ] Add --clean flag to generate script
- [ ] Create validate-examples.sh script for CI

---

## 🎯 Benefits

### Repository
- ✅ **Smaller**: Thousands fewer files in git
- ✅ **Faster**: Quicker clones and pulls
- ✅ **Cleaner**: No generated code in diffs
- ✅ **Professional**: Industry-standard approach

### User Experience
- ✅ **Clear**: Obvious what's source vs generated
- ✅ **Safe**: Can't accidentally modify generated code
- ✅ **Simple**: Run `pnpm setup` and you're ready
- ✅ **Fresh**: Always use latest codegen version

### Development
- ✅ **No Conflicts**: Generated code never conflicts in git
- ✅ **Easy Testing**: Test generation process separately
- ✅ **Clear PRs**: Only review actual code changes
- ✅ **Flexible**: Easy to change code generation

---

## 📝 Communication to Users

### In Main README

````markdown
## Running Examples

Each example demonstrates different features. To run an example:

\`\`\`bash
# Navigate to example
cd examples/blog-example

# First time setup (generates code + sets up DB)
pnpm setup

# Start development server
pnpm dev
\`\`\`

**Note**: Examples use code generation. The `gen/` folder is created automatically and gitignored. You'll need to run `pnpm generate` after any schema changes.
````

### In Example READMEs

````markdown
## ⚠️ Important: Generated Code

This example uses **@ssot-codegen** to generate:
- DTOs, validators, services, controllers, routes

The `gen/` folder is **gitignored** and created by running:
\`\`\`bash
pnpm generate
\`\`\`

**First time using this example?** Run `pnpm setup` to generate code and setup the database.
````

---

## 🎉 Recommended Implementation

### Priority 1: Prevent Future Commits

✅ **Already Done**: Root .gitignore has `/examples/*/gen/`

### Priority 2: Clean Up Git History

```bash
git rm -r --cached examples/*/gen/
git commit -m "Remove generated code from examples"
```

### Priority 3: Add Per-Example .gitignore

Create `.gitignore` in each example with standard exclusions.

### Priority 4: Update Documentation

Add "First Time Setup" section to each example README.

### Priority 5: Add Setup Scripts

Add `setup` and `generate` scripts to each package.json.

---

## ✅ Final Recommendation

**YES** - Keep examples pristine:

1. ✅ **Gitignore gen/ in all examples** (root .gitignore already does this)
2. ✅ **Remove committed gen/ folders** from git history
3. ✅ **Document setup process** in each example README
4. ✅ **Add setup scripts** to package.json
5. ✅ **Test fresh installation** before release

**This is the professional, industry-standard approach** used by:
- Prisma (generated client is gitignored)
- GraphQL Codegen (generated types are gitignored)
- Swagger Codegen (generated code is gitignored)
- OpenAPI Generator (generated code is gitignored)

---

**Status**: Recommendation ready for implementation  
**Impact**: Cleaner repo, better UX, industry-standard  
**Effort**: Low (mostly git cleanup + documentation)

