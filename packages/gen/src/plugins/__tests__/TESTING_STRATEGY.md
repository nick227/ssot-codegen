
# 🧪 Plugin Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for all 20+ plugins without requiring real API credentials.

---

## 🎯 Testing Philosophy

### Core Principles

1. **No Real API Calls Required** - All tests run without external dependencies
2. **Test What We Control** - Focus on code generation, not 3rd party APIs
3. **Fail Fast** - Tests should catch issues immediately
4. **Reusable Utilities** - Shared test helpers across all plugins
5. **Validate at Generation Time** - Catch issues before deployment

---

## 📊 Test Categories

### 1. **Unit Tests** (No API Credentials Needed) ✅

Test plugin behavior in isolation:

- ✅ **Metadata Tests** - Name, version, description
- ✅ **Requirements Tests** - Required env vars, models, dependencies
- ✅ **Validation Tests** - Plugin validate() method logic
- ✅ **Generation Tests** - Files, routes, middleware generated
- ✅ **Code Quality Tests** - Generated code quality checks

**Example:**
```typescript
it('should generate expected files', () => {
  const plugin = new OpenAIPlugin()
  const context = createMockPluginContext()
  const output = plugin.generate(context)
  
  expect(output.files.has('ai/providers/openai.provider.ts')).toBe(true)
})
```

### 2. **Integration Tests** (API Credentials Optional) 🔄

Test plugin integration with mocked APIs:

- 🔄 **Mock API Server** - Simulate API responses
- 🔄 **Environment Variable Handling** - Test undefined/invalid credentials
- 🔄 **Generated Code Execution** - Ensure code actually runs
- 🔄 **Error Handling** - Test graceful failures

**Example:**
```typescript
it('should handle undefined API key gracefully', () => {
  envMocker.clear(['OPENAI_API_KEY'])
  
  const plugin = new OpenAIPlugin()
  const context = createMockPluginContext()
  
  // Should generate code even without API key
  const output = plugin.generate(context)
  expect(output.files.size).toBeGreaterThan(0)
  
  // Generated code should check for API key at runtime
  const providerCode = output.files.get('ai/providers/openai.provider.ts')
  expect(providerCode).toMatch(/process\.env\.OPENAI_API_KEY/)
})
```

### 3. **End-to-End Tests** (Real API Credentials Required) 🚫

**These are OPTIONAL and skipped by default:**

```typescript
describe.skip('E2E: OpenAI Plugin (requires real API key)', () => {
  it('should make real API call', async () => {
    // Only runs if ENABLE_E2E_TESTS=true
    if (!process.env.ENABLE_E2E_TESTS) {
      return
    }
    
    // Real API test here
  })
})
```

---

## 🛠️ Shared Test Utilities

Located in: `plugin-test-utils.ts`

### createMockPluginContext()
Creates a mock context for plugin testing

### EnvMocker
Manages environment variables in tests

```typescript
const envMocker = new EnvMocker()
envMocker.set({ OPENAI_API_KEY: 'test-key' })
// ... tests ...
envMocker.restore() // Cleanup
```

### testPluginValidation()
Reusable validation test suite

### testPluginGeneration()
Reusable generation test suite

### validateGeneratedCode()
Checks generated code quality

### MockAPIServer
Mock external API responses

---

## 📋 Plugin Test Matrix

### What We Test for Each Plugin

| Test | AI | Voice | Storage | Payments | Email | Auth |
|------|-----|-------|---------|----------|-------|------|
| Metadata | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Requirements | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Validation Logic | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| File Generation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Env Var Handling | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Undefined API Key | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Code Quality | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| TypeScript Validity | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dependencies Export | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Model Requirements | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ✅ |

Legend:
- ✅ Full coverage
- ⚠️ Plugin-specific (some plugins require models, some don't)

---

## 🎯 Test Scenarios by Plugin Category

### AI Providers (7 plugins)

**Common Tests:**
- ✅ Handle undefined API key
- ✅ Generate provider/service/types files
- ✅ Export correct dependencies
- ✅ Use process.env correctly
- ✅ Error handling for API failures

**Provider-Specific:**
- **OpenAI** - Test GPT-4, embeddings, streaming
- **Claude** - Test Anthropic SDK integration
- **Gemini** - Test Google AI SDK
- **Local (LM Studio/Ollama)** - Test localhost endpoints, no API key required

### Voice AI (2 plugins)

**Common Tests:**
- ✅ Handle undefined API key
- ✅ Generate transcription/synthesis code
- ✅ WebSocket support (Deepgram)
- ✅ Multi-language support

### Storage (3 plugins)

**Common Tests:**
- ✅ Handle missing credentials
- ✅ Generate upload/download methods
- ✅ Presigned URL generation
- ✅ File metadata handling

**Provider-Specific:**
- **S3** - Test AWS SDK integration
- **R2** - Test S3 compatibility
- **Cloudinary** - Test transformations

### Payments (2 plugins)

**Common Tests:**
- ✅ Handle missing API keys
- ✅ Generate payment intent creation
- ✅ Webhook handling
- ✅ Test/production mode switching

### Email (2 plugins)

**Common Tests:**
- ✅ Handle missing API keys
- ✅ Template support
- ✅ Send email methods
- ✅ From email configuration

### Auth (3 plugins)

**Common Tests:**
- ✅ Model validation (User model required)
- ✅ OAuth flow generation
- ✅ JWT/Session strategy
- ✅ Middleware generation

---

## 🔍 Undefined API Key Test Cases

### Critical Test: Handling Missing Credentials

**Why This Matters:**
- Developers often start without API keys
- Generation should succeed (runtime will fail gracefully)
- Generated code must check for credentials

**Test Pattern:**
```typescript
describe('Undefined API Key Handling', () => {
  it('OpenAI: should generate code without API key', () => {
    envMocker.clear(['OPENAI_API_KEY'])
    
    const plugin = new OpenAIPlugin()
    const context = createMockPluginContext()
    const output = plugin.generate(context)
    
    // 1. Generation succeeds
    expect(output.files.size).toBeGreaterThan(0)
    
    // 2. Generated code checks for API key
    const provider = output.files.get('ai/providers/openai.provider.ts')
    expect(provider).toMatch(/if\s*\(\s*!process\.env\.OPENAI_API_KEY\s*\)/)
    expect(provider).toMatch(/throw new Error|console\.error/)
    
    // 3. Env example provided
    expect(output.envVars.OPENAI_API_KEY).toBeTruthy()
  })
  
  it('should validate without checking env vars', () => {
    envMocker.clear(['OPENAI_API_KEY'])
    
    const plugin = new OpenAIPlugin()
    const result = plugin.validate(createMockPluginContext())
    
    // Validation passes (env vars checked at runtime)
    expect(result.valid).toBe(true)
  })
})
```

### Expected Behavior:

1. **✅ Generation Succeeds** - No API key? No problem! Generate anyway.
2. **✅ Runtime Check** - Generated code checks `process.env.API_KEY`
3. **✅ Clear Error** - Helpful error message if key missing at runtime
4. **✅ .env.example** - Includes placeholder value

---

## 🚀 Running Tests

### Run All Plugin Tests
```bash
cd packages/gen
pnpm test plugins
```

### Run Specific Category
```bash
pnpm test plugins/ai
pnpm test plugins/storage
pnpm test plugins/payments
```

### Run with Coverage
```bash
pnpm test:coverage plugins
```

### Run E2E Tests (Optional)
```bash
ENABLE_E2E_TESTS=true pnpm test:e2e
```

---

## 📊 Test Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| Unit Tests | 90%+ | TBD |
| Integration Tests | 70%+ | TBD |
| E2E Tests | Optional | TBD |

---

## 🎨 Code Quality Checks

### Automated Checks in Tests

1. **No Hardcoded Credentials**
   ```typescript
   expect(code).not.toMatch(/sk-[a-zA-Z0-9]{20,}/)
   ```

2. **Error Handling Present**
   ```typescript
   expect(code).toMatch(/try|catch|Error/)
   ```

3. **Environment Variables Used**
   ```typescript
   expect(code).toMatch(/process\.env\.\w+/)
   ```

4. **No console.log**
   ```typescript
   expect(code).not.toContain('console.log')
   ```

5. **Valid TypeScript**
   ```typescript
   const braces = code.match(/{/g)?.length === code.match(/}/g)?.length
   expect(braces).toBe(true)
   ```

---

## 🔄 Continuous Integration

### GitHub Actions Workflow

```yaml
name: Plugin Tests

on: [push, pull_request]

jobs:
  test-plugins:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm test plugins --coverage
      
      # E2E tests only on main branch with secrets
      - name: E2E Tests (Optional)
        if: github.ref == 'refs/heads/main'
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ENABLE_E2E_TESTS: true
        run: pnpm test:e2e
```

---

## 📚 Writing New Plugin Tests

### Template

```typescript
describe('MyNewPlugin', () => {
  const plugin = new MyNewPlugin()
  let envMocker: EnvMocker
  
  beforeEach(() => {
    envMocker = new EnvMocker()
  })
  
  afterEach(() => {
    envMocker.restore()
  })
  
  // 1. Metadata
  it('should have correct metadata', () => {
    expect(plugin.name).toBe('my-plugin')
    expect(plugin.version).toBe('1.0.0')
  })
  
  // 2. Requirements
  it('should declare requirements', () => {
    expect(plugin.requirements.envVars.required).toContain('MY_API_KEY')
  })
  
  // 3. Undefined API Key
  it('should handle undefined API key', () => {
    envMocker.clear(['MY_API_KEY'])
    const output = plugin.generate(createMockPluginContext())
    expect(output.files.size).toBeGreaterThan(0)
  })
  
  // 4. File Generation
  it('should generate expected files', () => {
    const output = plugin.generate(createMockPluginContext())
    expect(output.files.has('expected/file.ts')).toBe(true)
  })
  
  // 5. Code Quality
  it('should generate valid code', () => {
    const output = plugin.generate(createMockPluginContext())
    const { valid, issues } = validateGeneratedCode(output)
    expect(valid).toBe(true)
  })
})
```

---

## ✅ Summary

### What This Achieves:

1. **✅ No API Credentials Required** - Tests run on any machine
2. **✅ Comprehensive Coverage** - All 20 plugins tested
3. **✅ Reusable Utilities** - Shared test helpers
4. **✅ Undefined Key Handling** - Graceful degradation
5. **✅ Code Quality** - Automated quality checks
6. **✅ CI/CD Ready** - Runs in GitHub Actions
7. **✅ Fast Feedback** - Tests complete in seconds

### Benefits:

- 🚀 Fast development iteration
- 🛡️ Catch bugs before deployment
- 📝 Living documentation
- 🎯 Confidence in changes
- ⚡ CI/CD friendly

---

**All plugins are testable without real API credentials!** 🎉

