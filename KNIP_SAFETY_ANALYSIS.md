# Knip Safety Analysis for ssot-codegen

## Executive Summary

✅ **SAFE TO USE** - Knip can be used safely on this project with minimal risk of code loss.

The codebase does NOT use problematic dynamic imports that knip would miss. All plugin loading is explicit and statically analyzable. The few dynamic imports found are in **generated test templates**, not in the code generator itself.

---

## Analysis Overview

### What We Checked
1. ✅ Dynamic imports with template literals (`import(${variable})`)
2. ✅ Runtime module loading patterns (`require()` with variables)
3. ✅ Plugin/provider auto-discovery from filesystem
4. ✅ Convention-based imports
5. ✅ Meta-programming patterns

---

## Findings

### 1. Dynamic Imports Found (3 instances)

**Location:** `packages/gen/src/generators/hooks/test-generator.ts` (lines 300, 320, 341)

```typescript
const { use${modelName}BySlug } = await import('../use-${model.name.toLowerCase()}')
const { usePublish${modelName} } = await import('../use-${model.name.toLowerCase()}')
const { useApprove${modelName} } = await import('../use-${model.name.toLowerCase()}')
```

**Risk Level:** ⚠️ **NONE** - These are in **GENERATED TEST CODE TEMPLATES**

**Explanation:**
- This is code that **generates** test files for the output
- The template strings are used to create dynamic imports in the generated tests
- These are not imports that the code generator itself uses
- Knip analyzes the generator code, not the generated output

---

### 2. Import.meta.glob Usage (1 instance)

**Location:** `packages/gen/src/generators/hooks/test-generator.ts` (line 431)

```typescript
const testFiles = import.meta.glob('./**/*.test.ts')
```

**Risk Level:** ⚠️ **NONE** - Also in generated test template code

**Explanation:**
- Again, this is in a generated test file template
- Not executed by the generator itself
- Generated tests are in `generated/` folder which is ignored by knip

---

### 3. Plugin System Architecture

**Location:** `packages/gen/src/plugins/plugin-manager.ts`

**Pattern:** ✅ **EXPLICIT STATIC IMPORTS**

All plugins are imported explicitly at the top of the file:

```typescript
// Auth plugins
import { GoogleAuthPlugin } from './auth/google-auth.plugin.js'
import { JWTServicePlugin } from './auth/jwt-service.plugin.js'
import { APIKeyManagerPlugin } from './auth/api-key-manager.plugin.js'

// AI providers
import { OpenAIPlugin } from './ai/openai.plugin.js'
import { ClaudePlugin } from './ai/claude.plugin.js'
import { GeminiPlugin } from './ai/gemini.plugin.js'
// ... etc
```

**Risk Level:** ✅ **SAFE** - Knip can trace all these imports

The plugin manager conditionally instantiates plugins based on config, but all imports are static and visible to knip.

---

### 4. Filesystem Operations

**Location:** `packages/gen/src/utils/gen-folder.ts`

**Pattern:** `fs.readdirSync()` usage

**Purpose:** Managing output directories (e.g., `generated/blog-example-1`, `generated/blog-example-2`)

**Risk Level:** ✅ **SAFE** - Only used for file management, not code loading

---

### 5. Generated Code Imports

**Pattern:** The generator creates code that imports from `@ssot-codegen/sdk-runtime`

**Knip Reports These as Unused:** ⚠️ False Positive

```
Unused files (17)
packages/sdk-runtime/src/**/*
```

**Why Knip Flags This:**
- The sdk-runtime is used by **generated code** (in `generated/` folder)
- The `generated/` folder is ignored by knip (per knip.json)
- Knip only analyzes `packages/` and can't see the usage in ignored folders

**Resolution:**
- **Option 1:** Add exceptions for sdk-runtime files
- **Option 2:** Accept the false positive (recommended)
- **DO NOT DELETE** these files - they are needed by generated projects

---

## Actual Knip Findings (Safe to Address)

### Unused Dependencies

```
@ssot-codegen/core  packages/templates-default/package.json
@ssot-codegen/core  packages/schema-lint/package.json
prisma              package.json
```

**Action:** ✅ Safe to review and potentially remove if truly unused

### Configuration Issues

```
Configuration hints (5)
- Unused entry patterns
- Unused project patterns
- @types/* in ignoreDependencies
```

**Action:** ✅ Safe to fix knip.json configuration

---

## Patterns That Would Be Problematic (NOT FOUND)

The following patterns would cause issues with knip, but **none were found**:

### ❌ NOT FOUND: Dynamic Plugin Loading
```typescript
// DANGEROUS - NOT IN YOUR CODE
const pluginName = config.provider
const plugin = await import(`./plugins/${pluginName}.js`)
```

### ❌ NOT FOUND: Convention-Based Loading
```typescript
// DANGEROUS - NOT IN YOUR CODE
const files = fs.readdirSync('./plugins')
for (const file of files) {
  await import(`./plugins/${file}`)
}
```

### ❌ NOT FOUND: Registry Pattern
```typescript
// DANGEROUS - NOT IN YOUR CODE
const providers = {
  'stripe': () => import('./stripe'),
  'paypal': () => import('./paypal')
}
await providers[config.payment]()
```

---

## Recommendations

### 1. Safe to Run Knip ✅

You can safely use knip to identify unused code. The reported issues are either:
- False positives (sdk-runtime used by generated code)
- Legitimate unused code safe to remove
- Configuration issues

### 2. Protected Against False Positives

Your `knip.json` already excludes:
```json
{
  "ignore": [
    "examples/**",     // Generated code examples
    "scripts/**",      // Build scripts
    "**/gen/**",       // Generated output
    "**/__tests__/**", // Test files
    "**/dist/**"       // Build artifacts
  ]
}
```

### 3. Fix Configuration

Update `knip.json` to fix configuration warnings:

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": [
    "packages/gen/src/index-new.ts",
    "packages/cli/src/index.ts"
  ],
  "project": ["packages/*/src/**/*.ts"],
  "ignore": [
    "**/__tests__/**",
    "**/*.test.ts",
    "**/dist/**",
    "generated/**",
    "examples/**",
    "scripts/**"
  ],
  "ignoreDependencies": [
    "@ssot-codegen/sdk-runtime",  // Used by generated code
    "@ssot-codegen/templates-default"  // Used by generated code
  ]
}
```

### 4. Review Before Deleting

Before removing any file knip identifies:
1. ✅ Check if it's used in templates (search for filename in `*.template.ts`)
2. ✅ Check if it's referenced in generated code
3. ✅ Check if it's imported by generated projects

---

## Testing Strategy

To verify knip works correctly:

1. **Run Knip in Dry-Run Mode**
   ```powershell
   npx knip --no-exit-code
   ```

2. **Review Each Finding**
   - Unused files: Check if used in templates
   - Unused dependencies: Verify not used in generation
   - Unused exports: Safe to remove

3. **Test Generation After Cleanup**
   ```powershell
   pnpm gen examples/blog-example/schema.prisma
   cd generated/blog-example-1
   pnpm install
   pnpm test
   ```

---

## Conclusion

### ✅ KNIP IS SAFE TO USE

**Why:**
1. No dynamic imports in generator code
2. All plugin loading is explicit and static
3. Generated code is properly excluded
4. Filesystem operations only manage output directories

**False Positives to Ignore:**
- `packages/sdk-runtime/**` - Used by generated code
- Template dependencies - Used during generation

**Safe to Remove:**
- Truly unused dependencies flagged by knip
- Files with no imports anywhere in packages/

**Risk Level:** 🟢 **LOW** - Standard precautions apply (review before delete)

