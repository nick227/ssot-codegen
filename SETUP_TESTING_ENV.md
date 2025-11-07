# 🔐 Setting Up Your Testing Environment

## Quick Start (2 minutes)

### 1. Create Workspace .env

```bash
# In the workspace root (ssot-codegen/)
cp .env.development.template .env
```

### 2. Add Your API Keys

Edit `.env` and add keys for the providers you want to test:

```env
# Minimum for basic testing
DATABASE_URL="postgresql://user:pass@localhost:5432/test_db"

# Add keys for providers you want to test
OPENAI_API_KEY="sk-your-actual-key"
STRIPE_SECRET_KEY="sk_test_your-actual-key"
# ... etc
```

### 3. Generate & Test Immediately

```bash
# Generate project with plugins
pnpm gen --schema examples/ai-chat-example/schema.prisma

# Generated project automatically uses workspace .env!
cd generated/ai-chat-example-1
pnpm install
pnpm dev  # Works immediately! ✅
```

---

## Testing Levels

### Level 1: No API Keys Needed ✅

```bash
# Test plugin generation (no API calls)
cd packages/gen
pnpm test:plugins

# These tests verify code generation, not API functionality
```

**What's tested:**
- Plugin metadata
- File generation
- Code structure
- TypeScript validity
- No hardcoded credentials

**Result:** Pass without any API keys! 🎉

### Level 2: Optional API Keys 🔄

```bash
# Test generated code structure
cd generated/your-project
pnpm test

# These tests check generated code, use mocks for APIs
```

**What's tested:**
- Generated code compiles
- Imports work correctly
- Mocked API responses
- Error handling

**Result:** Pass without real API keys (uses mocks)

### Level 3: Real API Keys Required 🔑

```bash
# Enable integration tests
export ENABLE_INTEGRATION_TESTS=true

# Run integration tests
cd generated/your-project
pnpm test:integration
```

**What's tested:**
- Real API calls
- Actual responses
- Rate limiting
- Error scenarios

**Result:** Requires real API keys

---

## API Key Sources

### Free Tiers Available

| Provider | Free Tier | Sign Up |
|----------|-----------|---------|
| **OpenAI** | $5 credit | https://platform.openai.com/ |
| **Anthropic** | Limited free | https://console.anthropic.com/ |
| **Gemini** | Free quota | https://makersuite.google.com/ |
| **Deepgram** | $200 credit | https://console.deepgram.com/ |
| **Stripe** | Test mode free | https://dashboard.stripe.com/ |
| **SendGrid** | 100 emails/day | https://sendgrid.com/ |
| **Cloudinary** | Free tier | https://cloudinary.com/ |

### Local (No Keys)

| Provider | Setup | Cost |
|----------|-------|------|
| **LM Studio** | Download from lmstudio.ai | FREE |
| **Ollama** | `brew install ollama` | FREE |
| **PostgreSQL** | Local install | FREE |

---

## Workflow Examples

### Scenario 1: Just Starting (No Keys)

```bash
# 1. Generate without plugins
pnpm gen --schema examples/blog-example/schema.prisma

# 2. Test (no API calls)
cd generated/blog-example-1
pnpm test

# ✅ Everything works!
```

### Scenario 2: Testing One Provider (e.g., OpenAI)

```bash
# 1. Get OpenAI key
# Sign up at https://platform.openai.com/

# 2. Add to workspace .env
echo 'OPENAI_API_KEY="sk-your-key"' >> .env

# 3. Generate with OpenAI
pnpm gen --schema schema.prisma

# 4. Test immediately
cd generated/project-1
pnpm dev  # OpenAI works! ✅
```

### Scenario 3: Testing All Providers

```bash
# 1. Fill in .env with all your keys
cp .env.development.template .env
# Edit .env with all your keys

# 2. Enable integration tests
echo 'ENABLE_INTEGRATION_TESTS=true' >> .env

# 3. Generate with all plugins
pnpm gen --schema examples/ai-chat-example/schema.prisma

# 4. Run full test suite
cd generated/ai-chat-example-1
pnpm test:all  # All providers tested! ✅
```

---

## Environment File Locations

The generator looks for `.env` in this order:

```
1. generated/project/.env          (project-specific)
2. generated/.env                  (all generated projects)
3. .env                            (workspace root) ← RECOMMENDED
```

**Best Practice:** Use workspace root `.env` (option 3)

---

## Security Best Practices

### ✅ DO

- ✅ Use `.env` in workspace root
- ✅ Add `.env` to `.gitignore`
- ✅ Use test API keys for development
- ✅ Rotate keys regularly
- ✅ Use different keys per environment

### ❌ DON'T

- ❌ Commit `.env` to git
- ❌ Use production keys for testing
- ❌ Share keys in Slack/email
- ❌ Hardcode keys in code
- ❌ Use same key across all projects

---

## Troubleshooting

### Problem: "DATABASE_URL is required"

**Solution:**
```bash
# Add to .env
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
```

### Problem: "OPENAI_API_KEY not found"

**Solution:**
```bash
# Check .env location
ls -la .env

# Verify .env is loaded
cd generated/your-project
node -e "require('./src/config')"
```

### Problem: "Integration tests failing"

**Solution:**
```bash
# Verify API key is valid
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Enable debug logging
DEBUG=* pnpm test:integration
```

### Problem: "Can't find .env"

**Solution:**
```bash
# Generator looks up the tree
# Put .env in workspace root
cd ../../  # Go to workspace root
cp .env.development.template .env
```

---

## CI/CD Setup

### GitHub Actions

```yaml
name: Test with API Keys

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Create .env from secrets
      - name: Create .env
        run: |
          echo "DATABASE_URL=${{ secrets.DATABASE_URL }}" >> .env
          echo "OPENAI_API_KEY=${{ secrets.OPENAI_API_KEY }}" >> .env
          echo "STRIPE_SECRET_KEY=${{ secrets.STRIPE_TEST_KEY }}" >> .env
      
      - run: pnpm install
      - run: pnpm gen --schema examples/ai-chat-example/schema.prisma
      - run: cd generated/ai-chat-example-1 && pnpm test:integration
```

**Add secrets in:** GitHub → Settings → Secrets → Actions

---

## Quick Reference

### Essential Commands

```bash
# Setup
cp .env.development.template .env

# Generate
pnpm gen --schema schema.prisma

# Test (no keys)
pnpm test:plugins

# Test (with keys)
cd generated/project
pnpm test:integration

# Run server
pnpm dev
```

### Essential Files

```
.env                          # Your API keys (gitignored)
.env.development.template     # Template with placeholders
.env.example                  # Example for others
```

---

## Summary

**To test plugins WITHOUT API keys:**
```bash
cd packages/gen
pnpm test:plugins  # Unit tests ✅
```

**To test generated code WITH API keys:**
```bash
# 1. Create workspace .env with your keys
cp .env.development.template .env

# 2. Generate project
pnpm gen --schema schema.prisma

# 3. Test immediately (uses workspace .env automatically!)
cd generated/project-1
pnpm dev  # ✅ Works!
```

**Key insight:** Workspace `.env` is shared by all generated projects, so you only need to set up API keys once! 🎉

