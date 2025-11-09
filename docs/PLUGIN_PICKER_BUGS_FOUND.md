# Plugin Picker - Code Review Findings

## 🔴 CRITICAL ISSUES (2)

### 1. ❌ **NPM Prisma Command Broken**
**File**: `create-project.ts:102`  
**Issue**: Uses `${packageManager} prisma generate` which works for pnpm/yarn but NOT npm  
**Impact**: **NPM users cannot create projects** - generation aborts with "Failed to generate Prisma client"

```typescript
// ❌ BROKEN (line 102)
execSync(`${config.packageManager} prisma generate`, {

// ✅ FIX: Add helper function
function getPrismaCommand(packageManager: string, command: string): string {
  const cmd = packageManager === 'npm' ? 'npx' : packageManager
  return `${cmd} prisma ${command}`
}

execSync(getPrismaCommand(config.packageManager, 'generate'), {
```

**Also affects**: Line 121 (ssot-codegen generate)

---

### 2. ❌ **Wrong Setup URL for Google OAuth**
**File**: `plugin-catalog.ts:83`  
**Issue**: Google OAuth plugin points to OpenAI URL instead of Google Cloud Console

```typescript
// ❌ WRONG (line 29-43)
{
  id: 'google-auth',
  // ... NO setupInstructions field! ❌
}

// Later at line 83 (OpenAI plugin):
setupInstructions: 'Get API key from https://platform.openai.com/api-keys'

// ✅ FIX: Add correct URL to Google OAuth
{
  id: 'google-auth',
  name: 'Google OAuth',
  // ...
  setupInstructions: 'Get credentials from https://console.cloud.google.com/apis/credentials'
}
```

---

## 🟠 HIGH SEVERITY (4)

### 3. **Plugins Without Env Vars Get No Setup Instructions**
**File**: `create-project.ts:308`  
**Issue**: Filters out plugins with empty `envVarsRequired`, hiding LM Studio & Ollama instructions

```typescript
// ❌ BROKEN (line 306-308)
const pluginsWithApiKeys = pluginIds
  .map(id => getPluginById(id))
  .filter(p => p && p.envVarsRequired.length > 0)  // ❌ Excludes LM Studio, Ollama!

// ✅ FIX: Include plugins with setupInstructions
const pluginsWithSetup = pluginIds
  .map(id => getPluginById(id))
  .filter(p => p && (p.envVarsRequired.length > 0 || p.setupInstructions))
```

---

### 4. **Misleading Env Var Placeholders**
**File**: `env-file.ts:84`  
**Issue**: `AWS_ACCESS_KEY_ID` gets placeholder `your_client_id_here` (wrong credential type)

```typescript
// ❌ CONFUSING (line 84)
if (lower.includes('id')) {
  return 'your_client_id_here'  // ❌ Wrong for AWS_ACCESS_KEY_ID!
}

// ✅ FIX: More specific placeholders
function generatePlaceholder(envVar: string): string {
  const lower = envVar.toLowerCase()
  
  // More specific patterns first
  if (lower.includes('access_key_id')) return 'your_access_key_id_here'
  if (lower.includes('secret_access_key')) return 'your_secret_access_key_here'
  if (lower.includes('client_id')) return 'your_client_id_here'
  if (lower.includes('client_secret')) return 'your_client_secret_here'
  if (lower.includes('api_key')) return 'your_api_key_here'
  // ... continue with less specific patterns
}
```

---

### 5. **Missing Setup URLs for 5 Plugins**
**File**: `plugin-catalog.ts` (multiple locations)  
**Issue**: deepgram, elevenlabs, grok, s3, r2 lack `setupInstructions`

**Missing URLs**:
- deepgram → `https://console.deepgram.com/`
- elevenlabs → `https://elevenlabs.io/app/settings`
- grok → `https://console.x.ai/` (if available)
- s3 → `https://console.aws.amazon.com/s3/`
- r2 → `https://dash.cloudflare.com/`

---

### 6. **Incomplete Plugin Defaults**
**File**: `create-project.ts:256-282`  
**Issue**: Only 4/20 plugins have custom defaults, others just get `{ enabled: true }`

**Missing Defaults For**:
- gemini: `defaultModel: 'gemini-pro'`
- deepgram: `defaultModel: 'nova-2'`
- elevenlabs: `defaultVoice: 'EXAVITQu4vr4xnSDxMaL'`
- lmstudio: `endpoint: 'http://localhost:1234'`
- ollama: `endpoint: 'http://localhost:11434', models: ['llama2']`
- s3: `region: 'us-east-1'`

---

## 🟡 MEDIUM SEVERITY (4)

### 7. **Unused Import**
**File**: `prompts.ts:16`  
**Issue**: Imports `CLIPluginInfo` but never uses it

```typescript
// ❌ UNUSED
import {
  // ...
  type CLIPluginInfo  // ❌ Remove this
} from './plugin-catalog.js'
```

---

### 8. **Type Safety Compromised**
**File**: `readme.ts:109`  
**Issue**: Uses `as any` to bypass type checking

```typescript
// ❌ UNSAFE (line 105-109)
const plugins = config.selectedPlugins
  .map(id => getPluginById(id))
  .filter(Boolean)

const grouped = groupPluginsByCategory(plugins as any)  // ❌

// ✅ FIX: Proper type guard
const plugins = config.selectedPlugins
  .map(id => getPluginById(id))
  .filter((p): p is CLIPluginInfo => p !== undefined)

const grouped = groupPluginsByCategory(plugins)  // ✅ Type-safe
```

---

### 9. **Unused Variable**
**File**: `prisma-schema.ts:9`  
**Issue**: `dbUrl` computed but never used

```typescript
// ❌ DEAD CODE (line 9)
const dbUrl = getDatabaseUrl(config.database)  // ❌ Never referenced

// ✅ FIX: Remove it
// const dbUrl = getDatabaseUrl(config.database)  ← Delete this line
```

---

### 10. **Unused Constant**
**File**: `create-project.ts:19`  
**Issue**: `__dirname` calculated but never used

```typescript
// ❌ UNUSED (line 19)
const __dirname = path.dirname(fileURLToPath(import.meta.url))  // ❌

// ✅ FIX: Remove if truly unused
```

---

## 🟢 LOW SEVERITY (3)

### 11. **Regex No-Op**
**File**: `env-file.ts:76`  
**Issue**: `.replace(/_/g, '_')` replaces underscore with underscore (does nothing)

```typescript
// ❌ NO-OP (line 76)
return 'your_' + envVar.toLowerCase().replace(/_/g, '_') + '_here'
                                      // ↑ Does nothing!

// ✅ FIX: Just remove the replace
return `your_${envVar.toLowerCase()}_here`
```

---

### 12. **Too Many Pre-Selected Plugins**
**File**: `plugin-catalog.ts` (popular flags)  
**Issue**: 7 plugins marked as popular (35%) might overwhelm users

**Currently Popular** (7):
- google-auth ✓ (good default)
- jwt-service ✓ (essential)
- openai ✓ (common use case)
- claude ✓ (maybe too specific?)
- cloudinary ✓ (good default)
- stripe ✓ (not all apps need payments)
- sendgrid ✓ (not all apps need email)
- usage-tracker ✓ (good default)

**Recommendation**: Reduce to 3-4 essentials:
- Keep: jwt-service, usage-tracker, cloudinary
- Optional: openai (if targeting AI apps)
- Remove: claude, stripe, sendgrid, google-auth from defaults

---

### 13. **Inconsistent Indentation**
**File**: `create-project.ts:291`  
**Issue**: Uses 4-space indent, project standard is 2-space

```typescript
// ❌ INCONSISTENT (line 291)
features: ${JSON.stringify(features, null, 4)}  // 4 spaces

// ✅ FIX: Match project style
features: ${JSON.stringify(features, null, 2)}  // 2 spaces
```

---

## ⚡ TOP 3 PRIORITIES

1. **🔴 Fix NPM Prisma Command** (Critical, blocks npm users)
2. **🔴 Fix Google OAuth URL** (Critical, wrong documentation)
3. **🟠 Fix Setup Instructions Filter** (High, hides important info for local AI users)

---

## Summary Statistics

- **Total Issues**: 13
- **Critical**: 2 (15%)
- **High**: 4 (31%)
- **Medium**: 4 (31%)
- **Low**: 3 (23%)

**Overall Assessment**: Code is functional but has **2 critical bugs** that will break user experience. High-priority fixes needed before release.

**Recommendation**: Fix critical and high severity issues, then release. Medium/low can be addressed in follow-up.

