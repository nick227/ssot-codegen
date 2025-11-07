# 🔐 Environment Variable Management & Testing Strategy

## 🎯 The Problem

**Current Workflow:**
```
1. Generate project → Creates .env.example with placeholders
2. Developer manually: cp .env.example .env
3. Developer manually: Edit .env with real API keys
4. Developer can now test
```

**Issues:**
- ❌ Manual setup required before testing
- ❌ Difficult to test generated projects immediately
- ❌ API keys scattered across multiple .env files
- ❌ No centralized key management
- ❌ Can't test plugins without manual setup

---

## 💡 Proposed Solutions

### Solution 1: **Central .env for Development** (Recommended)

Create a **workspace-level** `.env` file that ALL generated projects can use:

```
ssot-codegen/
├── .env                    # ← CENTRAL env file (gitignored)
├── .env.development        # ← Template with YOUR keys
├── .env.example            # ← Template with placeholders
├── generated/
│   ├── project-1/          # Uses workspace .env
│   ├── project-2/          # Uses workspace .env
│   └── project-3/          # Uses workspace .env
```

**Benefits:**
- ✅ One place for all API keys
- ✅ Generated projects work immediately
- ✅ Easy testing
- ✅ No duplication

### Solution 2: **Auto-copy .env on Generation**

Generator automatically copies `.env` from workspace root to generated project:

```typescript
// After generation
if (fs.existsSync(path.join(workspaceRoot, '.env'))) {
  fs.copyFileSync(
    path.join(workspaceRoot, '.env'),
    path.join(outputDir, '.env')
  )
  console.log('✅ Copied .env from workspace root')
}
```

### Solution 3: **Environment Profiles**

Support multiple environment profiles:

```bash
# Generate with dev profile
pnpm gen --schema schema.prisma --env development

# Generate with test profile  
pnpm gen --schema schema.prisma --env test

# Generate with production profile
pnpm gen --schema schema.prisma --env production
```

### Solution 4: **Dotenv Preload** (Immediate Fix)

Load workspace `.env` before running any tests:

```json
{
  "scripts": {
    "test": "dotenv -e ../../.env -- vitest",
    "test:generated": "dotenv -e ../../.env -- node test-generated.js"
  }
}
```

---

## 🚀 Recommended Implementation

### Phase 1: Workspace-Level .env (Immediate)

**1. Create workspace .env structure:**

```bash
# In workspace root
cp .env.example .env.development
# Edit .env.development with YOUR real API keys

# Symlink for convenience
ln -s .env.development .env
```

**2. Update .gitignore:**

```gitignore
# API Keys
.env
.env.local
.env.development
.env.test
.env.production

# But keep examples
!.env.example
!.env.development.template
```

**3. Generator looks up the tree for .env:**

```typescript
// In generator
function findWorkspaceEnv(): string | null {
  let dir = process.cwd()
  
  while (dir !== path.parse(dir).root) {
    const envPath = path.join(dir, '.env')
    if (fs.existsSync(envPath)) {
      return envPath
    }
    dir = path.dirname(dir)
  }
  
  return null
}
```

**4. Generated projects use dotenv with path option:**

```typescript
// In generated src/config.ts
import { config as loadEnv } from 'dotenv'
import path from 'path'
import fs from 'fs'

// Look for .env in multiple locations
const envPaths = [
  path.join(__dirname, '../.env'),                    // Project root
  path.join(__dirname, '../../.env'),                 // Workspace root
  path.join(__dirname, '../../../.env'),              // Higher up
]

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    loadEnv({ path: envPath })
    console.log(`✅ Loaded environment from: ${envPath}`)
    break
  }
}

// Fallback to default
if (!process.env.DATABASE_URL) {
  loadEnv() // Load from default location
}
```

---

## 📋 Testing Levels & Key Requirements

### Level 1: Plugin Generation Tests (No Keys Needed) ✅

**What:** Test plugin code generation  
**Keys:** None required  
**Location:** `packages/gen/src/plugins/__tests__/`

```typescript
// These tests run WITHOUT API keys
it('should generate OpenAI provider', () => {
  const plugin = new OpenAIPlugin()
  const output = plugin.generate(context)
  expect(output.files.size).toBeGreaterThan(0)
})
```

### Level 2: Generated Code Tests (Keys Optional)

**What:** Test generated code compiles and structure is correct  
**Keys:** Not required (mock data)  
**Location:** Generated project's `tests/`

```typescript
// Test generated code structure
it('should have valid OpenAI provider', () => {
  const provider = require('./src/ai/providers/openai.provider')
  expect(provider.openaiProvider).toBeDefined()
})
```

### Level 3: Integration Tests (Keys Required) 🔑

**What:** Test actual API calls work  
**Keys:** REQUIRED  
**Location:** Generated project's `tests/integration/`

```typescript
describe('OpenAI Integration (requires API key)', () => {
  beforeAll(() => {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY not set, skipping integration tests')
      return
    }
  })
  
  it('should make real API call', async () => {
    if (!process.env.OPENAI_API_KEY) return
    
    const response = await openaiProvider.chat([
      { role: 'user', content: 'Hello' }
    ])
    expect(response.content).toBeTruthy()
  })
})
```

---

## 🔧 Implementation Files

### 1. Workspace .env.development Template

```bash
# ssot-codegen/.env.development
# Copy this to .env and add your real API keys

# ============================================================
# DEVELOPMENT ENVIRONMENT
# These keys are used by ALL generated projects for testing
# ============================================================

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dev"

# AI Providers (Get keys from respective providers)
OPENAI_API_KEY="sk-your-key-here"
ANTHROPIC_API_KEY="sk-ant-your-key-here"
GOOGLE_AI_API_KEY="your-gemini-key-here"
XAI_API_KEY="your-grok-key-here"
OPENROUTER_API_KEY="sk-or-your-key-here"

# Local AI (No keys needed)
LMSTUDIO_ENDPOINT="http://localhost:1234"
OLLAMA_ENDPOINT="http://localhost:11434"

# Voice AI
DEEPGRAM_API_KEY="your-deepgram-key-here"
ELEVENLABS_API_KEY="your-elevenlabs-key-here"

# Storage
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="dev-bucket"

R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_ACCOUNT_ID="your-cf-account-id"
R2_BUCKET="dev-bucket"

CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"

# Payments
STRIPE_SECRET_KEY="sk_test_your-test-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-test-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-secret"
PAYPAL_MODE="sandbox"

# Email
SENDGRID_API_KEY="SG.your-sendgrid-key"
SENDGRID_FROM_EMAIL="dev@example.com"

MAILGUN_API_KEY="your-mailgun-key"
MAILGUN_DOMAIN="mg.example.com"

# Auth
GOOGLE_CLIENT_ID="your-google-oauth-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

JWT_SECRET="dev-jwt-secret-change-in-production"
JWT_EXPIRES_IN="7d"

# ============================================================
# TESTING FLAGS
# ============================================================

# Enable E2E tests (requires real API keys)
ENABLE_E2E_TESTS=false

# Enable integration tests per provider
ENABLE_OPENAI_INTEGRATION_TESTS=false
ENABLE_STRIPE_INTEGRATION_TESTS=false
ENABLE_DEEPGRAM_INTEGRATION_TESTS=false
```

### 2. Update Generated config.ts

```typescript
// packages/gen/src/templates/standalone-project.template.ts

export const configTemplate = () => `import { config as loadEnv } from 'dotenv'
import path from 'path'
import fs from 'fs'

// Multi-location .env loading
const envPaths = [
  path.join(__dirname, '../.env'),                    // Project .env
  path.join(__dirname, '../../.env'),                 // Workspace root
  path.join(__dirname, '../../../.env'),              // Generated folder parent
]

let envLoaded = false
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    loadEnv({ path: envPath, override: false })
    console.log(\`✅ Loaded environment from: \${path.relative(process.cwd(), envPath)}\`)
    envLoaded = true
    break
  }
}

if (!envLoaded) {
  console.warn('⚠️  No .env file found, using environment variables')
  loadEnv() // Try default locations
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL!,
  api: {
    prefix: process.env.API_PREFIX || '/api',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
} as const

// Validate required env vars
if (!config.databaseUrl) {
  console.error('❌ DATABASE_URL is required')
  console.error('💡 Create a .env file in the workspace root or project root')
  process.exit(1)
}

export default config
`
```

### 3. Test Runner with Auto-env Loading

```typescript
// packages/gen/scripts/test-generated-with-env.ts

import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'

// Load workspace .env
const workspaceRoot = path.join(__dirname, '..')
const envPath = path.join(workspaceRoot, '.env')

if (fs.existsSync(envPath)) {
  config({ path: envPath })
  console.log('✅ Loaded workspace .env for testing')
} else {
  console.warn('⚠️  No workspace .env found')
  console.warn('💡 Copy .env.development to .env and add your API keys')
}

// Now run tests
import('./test-generated.js')
```

### 4. Update package.json scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:plugins": "vitest --config vitest.plugins.config.ts",
    "test:generated": "dotenv -e .env -- node scripts/test-generated.js",
    "test:integration": "ENABLE_E2E_TESTS=true dotenv -e .env -- vitest run --testNamePattern='Integration'",
    "test:all": "pnpm test:plugins && pnpm test:generated"
  },
  "devDependencies": {
    "dotenv-cli": "^7.3.0"
  }
}
```

---

## 📊 Testing Matrix with Key Requirements

| Test Level | API Keys Required | Purpose | Location |
|-----------|------------------|---------|----------|
| **Unit Tests** | ❌ No | Test plugin generation | `packages/gen/src/plugins/__tests__/` |
| **Structure Tests** | ❌ No | Test generated code structure | Generated `tests/structure.test.ts` |
| **Mock Integration** | ❌ No | Test with mocked APIs | Generated `tests/mocks/` |
| **Integration Tests** | ✅ Yes | Test real API calls | Generated `tests/integration/` |
| **E2E Tests** | ✅ Yes | Full workflow tests | Generated `tests/e2e/` |

---

## 🎯 Developer Workflows

### Workflow 1: Quick Start (No API Keys)

```bash
# 1. Clone repo
git clone ssot-codegen

# 2. Install dependencies
pnpm install

# 3. Generate project
pnpm gen --schema examples/blog-example/schema.prisma

# 4. Test WITHOUT API keys
cd generated/blog-example-1
pnpm test  # Unit tests pass ✅

# 5. Start server (database only)
pnpm dev  # Works with just DATABASE_URL ✅
```

### Workflow 2: Full Testing (With API Keys)

```bash
# 1. Setup workspace .env
cp .env.development .env
# Edit .env with your real API keys

# 2. Generate project with plugins
pnpm gen --schema examples/ai-chat-example/schema.prisma

# 3. Project uses workspace .env automatically
cd generated/ai-chat-example-1
pnpm dev  # All plugins work immediately ✅

# 4. Run integration tests
pnpm test:integration  # Real API calls ✅
```

### Workflow 3: CI/CD (GitHub Actions)

```yaml
name: Test Generated Projects

on: [push, pull_request]

jobs:
  test-without-keys:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm test:plugins
      - run: pnpm gen --schema examples/blog-example/schema.prisma
      - run: cd generated/blog-example-1 && pnpm test
  
  test-with-keys:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      
      # Create .env from secrets
      - run: |
          echo "OPENAI_API_KEY=${{ secrets.OPENAI_API_KEY }}" >> .env
          echo "STRIPE_SECRET_KEY=${{ secrets.STRIPE_TEST_KEY }}" >> .env
      
      - run: pnpm gen --schema examples/ai-chat-example/schema.prisma
      - run: cd generated/ai-chat-example-1 && pnpm test:integration
```

---

## ✅ Immediate Action Items

### 1. Create workspace .env structure

```bash
# In workspace root
touch .env.development
touch .env.example

# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.development" >> .gitignore
```

### 2. Update generator to look up for .env

- Modify config.ts template to search parent directories
- Add helpful error messages if no .env found

### 3. Add test commands

- `test:plugins` - No keys needed
- `test:generated` - Uses workspace .env
- `test:integration` - Requires ENABLE_E2E_TESTS=true

### 4. Document the workflow

- Update README with env setup instructions
- Create TESTING.md with all scenarios
- Add troubleshooting guide

---

## 🎉 Benefits of This Approach

### For Development
- ✅ One `.env` file for all generated projects
- ✅ No manual copying/pasting
- ✅ Immediate testing possible
- ✅ API keys stay centralized

### For Testing
- ✅ Unit tests work without keys
- ✅ Integration tests use workspace keys
- ✅ Easy to skip tests without keys
- ✅ CI/CD friendly

### For Security
- ✅ Single `.env` file to protect
- ✅ Less chance of committing keys
- ✅ Clear separation of templates vs real keys
- ✅ Easy to rotate keys (one place)

---

## 📚 Next Steps

1. **Implement workspace .env lookup** in generator
2. **Update config.ts template** with multi-path loading
3. **Create .env.development template** with all plugin keys
4. **Add test scripts** with dotenv-cli
5. **Update documentation** with new workflow
6. **Test the workflow** end-to-end

---

**With this approach, developers can test generated projects immediately without manual .env setup!** 🚀

