# Tools Comparison Summary

## Quick Overview

| Tool | Purpose | Findings | Severity | Action Needed |
|------|---------|----------|----------|---------------|
| **Knip** | Dead code detection | 29 unused files (11 real, 17 false positives) | 🟡 Medium | Clean up 11 files |
| **Madge** | Circular dependencies | 1 cycle (type-only) | 🟢 Low | Optional fix |
| **ESLint** | Code quality | 9 warnings, 0 errors | 🟢 Low | Replace `:any` types |

---

## Tool-by-Tool Breakdown

### 1. Knip (Dead Code Detection)

**What it found:**
- 29 "unused" files
- 41 unused exports
- 2 unused dependencies

**Reality check:**
- ✅ 11 files truly unused (legacy code)
- 🔴 17 files false positives (sdk-runtime used by generated code)
- 🟠 1 file config file (review needed)

**Best for:**
- Finding dead code
- Identifying unused exports
- Cleaning up imports

**Limitations:**
- Can't see usage in generated code
- Can't see usage in template strings
- Requires configuration to reduce false positives

**Trust level:** 🟡 75% (needs verification script)

---

### 2. Madge (Circular Dependencies)

**What it found:**
- 1 circular dependency between 2 files
- code-generator.ts ↔ checklist-generator.ts

**Analysis:**
- Type-only circular import (safe)
- No runtime circular dependency
- TypeScript handles this correctly

**Best for:**
- Detecting circular imports
- Visualizing dependency graphs
- Finding architectural issues

**Limitations:**
- Can't distinguish type-only vs runtime cycles
- Needs Graphviz for visual output
- May flag safe patterns

**Trust level:** 🟢 95% (but needs human analysis)

---

### 3. ESLint (Code Quality)

**What it found:**
- 9 warnings (all `:any` usage)
- 0 errors

**Distribution:**
- core: 1 warning
- sdk-runtime: 8 warnings

**Best for:**
- Code style consistency
- Type safety enforcement
- Best practices
- Catching common bugs

**Limitations:**
- Config-dependent (only checks what's configured)
- May be too strict for generic code
- Doesn't understand generation patterns

**Trust level:** 🟢 99% (highly accurate)

---

## Which Tool for What?

### Finding Unused Code
1. **Knip** (primary) - Finds unused files and exports
2. **Verification script** - Confirms knip findings
3. **grep** - Manual verification

### Finding Bad Patterns
1. **ESLint** (primary) - Code quality and standards
2. **TypeScript compiler** - Type safety
3. **Madge** - Architectural issues

### Understanding Dependencies
1. **Madge** (primary) - Dependency visualization
2. **Knip** - Import analysis
3. **grep** - Manual tracing

---

## Recommended Workflow

### Daily Development
```powershell
# Quick check before commit
npx eslint .
```

### Weekly Cleanup
```powershell
# Full health check
npx knip --reporter compact
npx eslint .
```

### Before Release
```powershell
# Comprehensive analysis
npx knip
npx madge --circular packages/gen/src
npx eslint .
node scripts/verify-knip-findings.cjs
```

### After Refactoring
```powershell
# Check for broken dependencies
npx madge --circular packages/gen/src
pnpm tsc --noEmit
pnpm test
```

---

## Tool Configuration

### Knip (knip.json)
```json
{
  "entry": ["packages/gen/src/index-new.ts"],
  "ignore": ["generated/**", "examples/**"],
  "ignoreDependencies": ["@ssot-codegen/sdk-runtime"]
}
```

**Why:** Exclude generated code and false positives

### ESLint (eslint.config.js)
```javascript
{
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'error'
  }
}
```

**Why:** Balance between strictness and practicality

### Madge (command line)
```powershell
madge --circular --extensions ts packages/gen/src
```

**Why:** Focus on source code, ignore builds

---

## False Positives by Tool

### Knip False Positives
- ❌ sdk-runtime files (used by generated code)
- ❌ Template type files (used in generated templates)
- ❌ Plugin interface files (may be in templates)

**Solution:** Use verification script + manual review

### Madge False Positives
- ⚠️ Type-only cycles (safe in TypeScript)
- ⚠️ Interface-only cycles (safe)

**Solution:** Manual review of each cycle

### ESLint False Positives
- Rare (highly accurate)
- May flag intentional `any` in generic code
- May flag acceptable patterns

**Solution:** Use eslint-disable comments sparingly

---

## Combining Tools for Maximum Effectiveness

### Step 1: Run All Three
```powershell
npx knip > knip-report.txt
npx madge --circular packages/gen/src > madge-report.txt
npx eslint . > eslint-report.txt
```

### Step 2: Prioritize
1. **ESLint errors** - Fix immediately (breaking issues)
2. **Madge runtime cycles** - Fix soon (architectural issues)
3. **ESLint warnings** - Fix regularly (code quality)
4. **Knip findings** - Clean up periodically (maintenance)
5. **Madge type cycles** - Fix optionally (cosmetic)

### Step 3: Verify
```powershell
node scripts/verify-knip-findings.cjs
pnpm test
pnpm gen examples/blog-example/schema.prisma
```

### Step 4: Document
- Update CHANGELOG
- Document breaking changes
- Note any new patterns

---

## Tool Comparison Matrix

| Feature | Knip | Madge | ESLint |
|---------|------|-------|--------|
| **Speed** | Fast | Fast | Medium |
| **Accuracy** | 75% | 95% | 99% |
| **False Positives** | Common | Rare | Very Rare |
| **Setup Difficulty** | Medium | Easy | Medium |
| **Maintenance** | High | Low | Medium |
| **Value for Code Generators** | High* | Medium | High |

*\*With proper configuration and verification*

---

## Recommendations

### For This Project

1. **Run ESLint on every commit** (CI/CD)
   - Zero tolerance for errors
   - Fix warnings regularly

2. **Run Knip weekly** (manual)
   - Use verification script
   - Clean up quarterly

3. **Run Madge before major refactors** (manual)
   - Check for new cycles
   - Document architectural decisions

### General Best Practices

- ✅ Use all three tools together
- ✅ Automate what you can (ESLint in CI)
- ✅ Manual review for knip findings
- ✅ Understand tool limitations
- ✅ Create verification scripts
- ⚠️ Don't blindly trust any single tool
- ⚠️ Always test after automated cleanup

---

## Current Project Status

### What's Good ✅
- Zero ESLint errors
- Only type-only circular dependency
- Clear false positives documented
- Verification script available

### What Needs Work ⚠️
- 9 `:any` type usages
- 11 unused files
- ~40 unused exports

### What's Safe to Ignore 🟢
- 17 sdk-runtime "unused" files
- Type-only circular dependency
- Plugin template type files

---

## Next Steps

1. **Today:** Fix 9 `:any` warnings (30 min)
2. **This Week:** Delete 11 unused files (30 min)
3. **This Month:** Clean up 40 unused exports (2 hours)
4. **Optional:** Fix type-only circular dependency

**Total Effort:** 3-4 hours for complete cleanup
**Risk Level:** 🟢 LOW
**Impact:** High (cleaner, more maintainable code)


