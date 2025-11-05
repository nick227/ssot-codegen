# Examples Distribution Strategy

## Current State ✅

### What's Distributed via NPM
```json
// packages/gen/package.json
"files": [
  "dist",        ← Only compiled code
  "README.md"    ← Only documentation
]
```

**Examples are NOT distributed** - they're only in the GitHub repository.

---

## 🎯 Two Use Cases

### Use Case 1: Normal Users (Primary)
```
user-project/
├── package.json
├── prisma/
│   └── schema.prisma        ← User's schema
├── src/                     ← User's code
└── [installs @ssot-codegen/gen]

# User runs:
npx ssot generate

# Creates:
user-project/
└── gen/                     ← Generated into user's project
    ├── contracts/
    ├── services/
    └── ...
```

**Status**: ✅ Works perfectly - generates into user's project

---

### Use Case 2: Examples (Secondary)

**Question**: Should examples be distributed?

#### Option A: Examples in Git Only (Current) ✅ RECOMMENDED

**Distribution**:
- NPM package: No examples (only code)
- GitHub repo: Has examples

**User Experience**:
```bash
# Users who want examples clone from GitHub
git clone https://github.com/your-org/ssot-codegen
cd ssot-codegen/examples/blog-example
pnpm setup              # Generates clean gen/ folder
pnpm dev
```

**Pros**:
- ✅ Keeps npm package small and focused
- ✅ Examples can be large (safe in git, not in npm)
- ✅ Examples show real-world usage in git
- ✅ No distribution contamination concerns
- ✅ Users clone and experiment freely

**Cons**:
- ⚠️ Requires GitHub access to see examples
- ⚠️ Not available offline (after npm install)

**Recommendation**: ✅ **This is the standard approach**

---

#### Option B: Distribute Examples as Separate Package

**Structure**:
```
@ssot-codegen/gen              ← Main package
@ssot-codegen/examples         ← Separate examples package
```

**package.json**:
```json
{
  "name": "@ssot-codegen/examples",
  "files": [
    "blog-example/",
    "ecommerce-example/",
    "!*/gen/",           ← Exclude generated folders
    "!*/node_modules/",
    "!*/dist/"
  ]
}
```

**User Experience**:
```bash
# Install examples package
npm install -D @ssot-codegen/examples

# Copy example to workspace
cp -r node_modules/@ssot-codegen/examples/blog-example my-blog
cd my-blog
pnpm install
pnpm generate           # Generates fresh gen/ folder
pnpm dev
```

**Pros**:
- ✅ Examples available via npm
- ✅ Offline access
- ✅ Pristine examples (no gen/ committed)
- ✅ Users can copy and modify

**Cons**:
- ⚠️ Separate package to maintain
- ⚠️ Examples packaged but still need generation
- ⚠️ More complex distribution

---

#### Option C: Examples in Main Package

**NOT RECOMMENDED** ❌

**Why**:
- Bloats npm package (examples aren't library code)
- Users don't need examples to use the library
- Makes package larger for everyone
- Mixes concerns (library code vs examples)

---

## ✅ Recommended Strategy

### For Distribution

**1. Keep Current Approach**: Examples in GitHub only

```
NPM Package (@ssot-codegen/gen):
├── dist/              ← Compiled library code
└── README.md          ← Usage docs

GitHub Repository:
├── packages/          ← Library code
│   └── gen/
└── examples/          ← Examples (git only)
    ├── blog-example/
    ├── ecommerce-example/
    └── ...
```

**2. Document in README**:

```markdown
## Examples

See the [examples](https://github.com/your-org/ssot-codegen/tree/main/examples) directory for:
- **blog-example**: Full-featured blog with comments, categories
- **ecommerce-example**: E-commerce platform
- **ai-chat-example**: AI chat integration
- **minimal**: Minimal setup

Each example includes:
- Prisma schema
- Custom extensions
- Tests
- Setup instructions

To use an example:
\`\`\`bash
git clone https://github.com/your-org/ssot-codegen
cd ssot-codegen/examples/blog-example
pnpm setup
\`\`\`
```

---

## 🛠️ Implementation

### Keep Examples Pristine in Git

**Current Setup** (already done ✅):
- `.gitignore` in each example excludes `gen/`
- Root `.gitignore` has `/examples/*/gen/`
- Users generate fresh code via `pnpm generate`

**Still Needed**:
```bash
# Remove any committed gen/ folders from git history
git rm -r --cached examples/*/gen/
git commit -m "Remove generated code from examples (git only)"
```

### Keep NPM Packages Clean

**Current Setup** (already correct ✅):
```json
// packages/gen/package.json
"files": ["dist", "README.md"]  ← No examples
```

**Status**: ✅ Perfect - examples not distributed via npm

---

## 📋 Final Recommendations

### DO: Keep Examples in Git Only ✅

**Rationale**:
- Examples are **learning tools**, not library code
- Users access via GitHub (standard practice)
- Keeps npm package small and focused
- Allows examples to be large/complex without bloat

**Similar Projects**:
- **Prisma**: Examples only on GitHub
- **Next.js**: Examples only on GitHub  
- **NestJS**: Examples only on GitHub
- **tRPC**: Examples only on GitHub

### DO: Keep Examples Pristine ✅

**Implementation** (already started):
```
examples/blog-example/
├── .gitignore            ✅ Added (excludes gen/)
├── prisma/schema.prisma  ✅ Committed
├── src/                  ✅ Committed
├── scripts/              ✅ Committed
└── gen/                  ❌ Never committed (user generates)
```

**User Workflow**:
```bash
# Clone from GitHub
git clone <repo>
cd examples/blog-example

# Generate fresh code
pnpm setup              # Installs + generates + DB setup
pnpm dev

# Pristine source, fresh generation
```

### DON'T: Distribute Examples via NPM ❌

**Why**:
- Examples are for learning, not production use
- Users fork/copy examples to customize
- Bloats npm package unnecessarily
- GitHub is the right distribution channel

---

## 🎯 Comparison: User Project vs Examples

### User's Project (Primary Use Case)
```
my-awesome-app/
├── package.json
├── prisma/
│   └── schema.prisma     ← User's schema
├── src/
│   └── index.ts          ← User's code
└── [npm install @ssot-codegen/gen]

# User runs:
npx ssot generate

# Creates in THEIR project:
my-awesome-app/
└── gen/                  ← Generated in their project
    ├── contracts/
    ├── services/
    └── ...
```

**User's .gitignore**:
```gitignore
node_modules/
gen/                      ← User decides if they want to commit
dist/
```

**Note**: Some users MAY want to commit gen/ in their own projects (for deployment simplicity). That's their choice.

---

### Examples (Secondary - Learning)
```
ssot-codegen/examples/blog-example/
├── prisma/schema.prisma  ← Example schema (committed)
├── src/                  ← Example code (committed)
├── .gitignore            ← Excludes gen/ (committed)
└── gen/                  ← NEVER committed (user generates)
```

**Our .gitignore**:
```gitignore
gen/                      ← Never commit in examples
```

**Reason**: Examples are templates. They should be pristine so users can:
1. Clone from GitHub
2. Generate fresh code with their version
3. Modify and learn
4. Not deal with outdated generated code

---

## ✅ Action Plan

### 1. Keep Current NPM Distribution ✅

**No changes needed**:
```json
"files": ["dist", "README.md"]  ← Examples NOT included
```

**Status**: ✅ Correct

### 2. Clean Up Git Repository

```bash
# One-time cleanup
git rm -r --cached examples/blog-example/gen/
git rm -r --cached examples/ecommerce-example/gen/
git rm -r --cached examples/ai-chat-example/gen/
git rm -r --cached examples/minimal/gen/

git commit -m "Remove generated code from examples

Examples are in git only (not npm distribution).
gen/ folders should never be committed:
- Keep examples pristine for users to clone
- Allow users to generate with their library version
- Avoid bloat and conflicts in git repository

Users clone from GitHub and run 'pnpm setup' to generate."
```

### 3. Update Documentation

**Main README.md**:
```markdown
## Examples

See [examples](https://github.com/your-org/ssot-codegen/tree/main/examples) for complete projects:

- **blog-example**: Full blog with auth, comments, categories
- **ecommerce-example**: Shopping cart, orders, payments
- **ai-chat-example**: AI integration with OpenAI
- **minimal**: Simplest possible setup

To run an example:
\`\`\`bash
git clone https://github.com/your-org/ssot-codegen
cd ssot-codegen/examples/blog-example
pnpm setup    # Generates code and sets up database
pnpm dev
\`\`\`
```

**Each Example README**:
```markdown
## First Time Setup

\`\`\`bash
pnpm setup    # Installs + generates + DB setup
pnpm dev      # Start server
\`\`\`

**Note**: The `gen/` folder is created during setup and gitignored.
After changing `schema.prisma`, run `pnpm generate` to regenerate.
```

---

## 🎉 Summary

### Your Question
> "Should we keep examples pristine if they're included in distribution?"

### Answer

**Part 1: Are examples distributed?**
✅ **No** - Examples are GitHub-only (not in npm package)

**Part 2: Should examples be pristine?**
✅ **YES** - Even for GitHub-only examples, keep pristine because:
1. Users clone from GitHub to learn
2. Generated code would be outdated immediately
3. Users should generate with THEIR version of the library
4. Keeps git repository clean
5. Follows industry best practices

### What We Did
- ✅ Added .gitignore to all examples (excludes gen/)
- ✅ Verified npm packages don't include examples
- ✅ Created architecture documentation
- ⏸️ Optional: Remove gen/ from git history

### Recommendation
**Keep examples in GitHub only** (current approach):
- NPM: Distributes library code only
- GitHub: Shows examples for learning
- Users: Clone, generate fresh, experiment

**This is exactly how Prisma, Next.js, and NestJS work** ✅

---

**Status**: ✅ **Correct architecture** - Examples pristine in git, not distributed via npm

