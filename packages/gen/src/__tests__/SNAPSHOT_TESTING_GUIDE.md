# Snapshot Testing Guide

Complete guide to snapshot testing in SSOT Codegen.

---

## Overview

**Snapshot testing** captures the output of generators and compares them to saved "snapshots" on subsequent test runs. This catches unintended template changes and regressions.

### Benefits

- ✅ **Catch regressions** - Any template change is immediately visible
- ✅ **Fast feedback** - No need to manually inspect generated code
- ✅ **Documentation** - Snapshots show expected output
- ✅ **Confidence** - Refactor safely knowing tests will catch breaks

---

## Current Coverage

### Generators with Snapshots ✅

1. **DTO Generator** - `dto-generator.comprehensive.test.ts`
   - CreateDTO, UpdateDTO, ReadDTO, QueryDTO snapshots
   - Minimal structure snapshots
   - 56 tests, comprehensive coverage

2. **Controller Generator** - `controller-generator.comprehensive.test.ts`
   - Controller class structure
   - HTTP method handlers
   - 69 tests

3. **Route Generator** - `route-generator.comprehensive.test.ts`
   - Express routes
   - Fastify routes
   - 54 tests

4. **Service Generator** - `service-generator.comprehensive.test.ts`
   - CRUD service snapshots
   - Enhanced methods
   - 74 tests

5. **Validator Generator** - `validator-generator.comprehensive.test.ts`
   - Zod schema snapshots
   - Validation logic
   - 63 tests

6. **Barrel Generator** - `barrel-generator.snapshot.test.ts` (NEW!)
   - Barrel export patterns
   - Index file generation
   - 5 tests

7. **Plugin Outputs** - `plugin-snapshots.test.ts` (NEW!)
   - OpenAI plugin
   - Google OAuth plugin  
   - Stripe, S3, SendGrid plugins
   - 27 tests

### Total Snapshot Coverage

- **Files:** 7 test suites with snapshots
- **Tests:** 348 snapshot-related tests
- **Snapshots:** 10+ snapshot files
- **Coverage:** ~60% of generators

---

## Writing Snapshot Tests

### Basic Pattern

```typescript
import { describe, it, expect } from 'vitest'
import { myGenerator } from '../my-generator.js'
import { mockModel } from './fixtures.js'

describe('My Generator Snapshots', () => {
  it('should match output snapshot', () => {
    const output = myGenerator(mockModel)
    
    expect(output).toMatchSnapshot()
  })
})
```

### First Run

```bash
cd packages/gen
pnpm test

# Creates: __snapshots__/my-test.test.ts.snap
```

### Snapshot File Format

```javascript
// Vitest Snapshot v1
exports[`My Generator > should match output 1`] = `
"// @generated
export class MyClass {
  // ... generated code
}"
`;
```

---

## Snapshot Testing Patterns

### Pattern 1: Full Content Snapshot

**When:** Output is stable and small (<500 lines)

```typescript
it('should match CreateDTO snapshot', () => {
  const dto = generator.generateCreate()
  expect(dto).toMatchSnapshot()
})
```

**Pros:** Catches every change  
**Cons:** Large diffs on intentional changes

---

### Pattern 2: Minimal/Structural Snapshot

**When:** Output is large or has dynamic parts

```typescript
it('should match minimal snapshot structure', () => {
  const output = generator.generate()
  
  const minimal = minimalSnapshot(output.files)
  expect(minimal).toMatchSnapshot()
})

// Helper
function minimalSnapshot(files: Map<string, string>) {
  return Array.from(files.entries()).map(([filename, content]) => ({
    filename,
    snapshot: {
      imports: extractImports(content),
      exports: extractExports(content),
      types: extractTypes(content),
      functions: extractFunctions(content)
    }
  }))
}
```

**Pros:** Stable, captures structure  
**Cons:** Misses some content changes

---

### Pattern 3: Section Snapshots

**When:** Testing large files like HTML dashboard

```typescript
it('should match header section snapshot', () => {
  const html = generateDashboard()
  
  const headerSection = html.substring(0, 1000)
  expect(headerSection).toMatchSnapshot('dashboard-header')
})

it('should match model card snapshot', () => {
  const html = generateDashboard()
  
  const modelSection = extractSection(html, 'model-card')
  expect(modelSection).toMatchSnapshot('model-card')
})
```

**Pros:** Focused, manageable diffs  
**Cons:** More setup code

---

## Updating Snapshots

### When a Snapshot Fails

**1. Review the diff:**
```bash
pnpm test

# Output shows:
# - Expected (snapshot)
# + Received (current output)
```

**2. Verify the change is intentional:**
- Is this a bug fix?
- Is this a new feature?
- Is this an unintended regression?

**3. Update snapshot if correct:**
```bash
pnpm test -- -u
# or
pnpm test -- --update
```

**4. Commit updated snapshot:**
```bash
git add src/generators/__tests__/__snapshots__/
git commit -m "test: update snapshots for DTO generator improvements"
```

---

## Best Practices

### DO ✅

```typescript
// ✅ Test stable, public APIs
it('should match CreateDTO snapshot', () => {
  expect(generator.generateCreate()).toMatchSnapshot()
})

// ✅ Use named snapshots for clarity
it('should match header', () => {
  expect(getHeader()).toMatchSnapshot('dashboard-header')
})

// ✅ Normalize dynamic content
it('should match normalized output', () => {
  const output = generator.generate()
  const normalized = normalizeDates(output)  // Remove timestamps
  expect(normalized).toMatchSnapshot()
})

// ✅ Test structure for large outputs
it('should match minimal structure', () => {
  const structure = extractStructure(bigOutput)
  expect(structure).toMatchSnapshot()
})
```

### DON'T ❌

```typescript
// ❌ Snapshot timestamps or random data
it('bad snapshot', () => {
  const output = generateWithTimestamp()  // Contains Date.now()
  expect(output).toMatchSnapshot()  // Will always fail!
})

// ❌ Snapshot huge files completely
it('bad snapshot', () => {
  const bigFile = generator.generate()  // 10,000 lines
  expect(bigFile).toMatchSnapshot()  // Unmanageable diffs
})

// ❌ Test private implementation details
it('bad snapshot', () => {
  const internal = (generator as any).privateMethod()
  expect(internal).toMatchSnapshot()  // Will break on refactor
})
```

---

## Snapshot Test Organization

### Directory Structure

```
packages/gen/src/
├── generators/
│   ├── __tests__/
│   │   ├── __snapshots__/        # Snapshot files
│   │   │   ├── dto-generator.comprehensive.test.ts.snap
│   │   │   ├── service-generator.comprehensive.test.ts.snap
│   │   │   ├── controller-generator.comprehensive.test.ts.snap
│   │   │   ├── route-generator.comprehensive.test.ts.snap
│   │   │   └── validator-generator.comprehensive.test.ts.snap
│   │   │
│   │   ├── dto-generator.comprehensive.test.ts
│   │   ├── service-generator.comprehensive.test.ts
│   │   └── ... other test files
│
├── plugins/
│   ├── __tests__/
│   │   ├── __snapshots__/        # Plugin snapshots
│   │   │   └── plugin-snapshots.test.ts.snap
│   │   │
│   │   ├── plugin-snapshots.test.ts
│   │   └── ... other plugin tests
```

### Naming Convention

**Test files:**
- `*.comprehensive.test.ts` - Full generator coverage with snapshots
- `*.snapshot.test.ts` - Dedicated snapshot tests
- `*.test.ts` - Unit tests (may or may not have snapshots)

**Snapshot names:**
- Use descriptive names: `'dashboard-header'`, `'create-dto'`
- Or use auto-naming: `toMatchSnapshot()` generates name from test title

---

## Running Snapshot Tests

### Run All Tests

```bash
cd packages/gen
pnpm test
```

### Run Specific Suite

```bash
pnpm test dto-generator.comprehensive
```

### Update Snapshots

```bash
# Update all snapshots
pnpm test -- -u

# Update specific suite
pnpm test dto-generator -- -u

# Interactive update
pnpm test --watch
# Press 'u' to update failing snapshots
```

### Watch Mode

```bash
pnpm test --watch

# Commands:
# - u: update snapshots
# - a: run all tests
# - f: run only failed
# - q: quit
```

---

## Coverage Gaps (TODO)

### Not Yet Snapshot-Tested

1. **Checklist Generator** (partially)
   - Dashboard HTML (very large)
   - API endpoints
   - Test suite

2. **SDK Generators**
   - Model clients
   - Service clients
   - React hooks

3. **OpenAPI Generator**
   - OpenAPI spec generation

4. **Registry Generator**
   - Registry system files

5. **Hook Generators**
   - React Query hooks
   - Framework adapters

### Recommended Next Additions

```typescript
// packages/gen/src/generators/__tests__/openapi.snapshot.test.ts
describe('OpenAPI Generator Snapshots', () => {
  it('should match OpenAPI spec snapshot', () => {
    const spec = generateOpenAPISpec(schema)
    expect(spec).toMatchSnapshot()
  })
})

// packages/gen/src/generators/__tests__/hooks.snapshot.test.ts
describe('React Hook Generator Snapshots', () => {
  it('should match useModel hook snapshot', () => {
    const hook = generateReactHook(model)
    expect(hook).toMatchSnapshot()
  })
})
```

---

## Debugging Snapshot Failures

### 1. View the Diff

```bash
pnpm test

# Output shows:
- Expected (old snapshot)
+ Received (new output)
```

### 2. Check Git Diff

```bash
git diff src/generators/__tests__/__snapshots__/
```

### 3. Identify the Cause

**Common causes:**
- Template changes (intentional)
- Generator logic changes
- Dependency updates
- Model fixture changes

### 4. Decide Action

**If change is correct:**
```bash
pnpm test -- -u                # Update snapshot
git add __snapshots__/         # Commit new snapshot
```

**If change is incorrect:**
```bash
# Fix the generator code
vim src/generators/my-generator.ts

# Re-test
pnpm test
```

---

## Snapshot Testing Best Practices

### 1. Keep Snapshots Small

```typescript
// ✅ Good - Test sections
expect(getImportSection(output)).toMatchSnapshot('imports')
expect(getExportSection(output)).toMatchSnapshot('exports')

// ❌ Bad - Entire 5000-line file
expect(hugeOutput).toMatchSnapshot()
```

### 2. Normalize Dynamic Content

```typescript
function normalizeGenerated(code: string): string {
  return code
    .replace(/Generated at: .+/g, 'Generated at: [timestamp]')
    .replace(/v\d+\.\d+\.\d+/g, 'v[version]')
    .trim()
}

expect(normalizeGenerated(output)).toMatchSnapshot()
```

### 3. Use Inline Snapshots for Small Output

```typescript
it('should generate export statement', () => {
  expect(generateExport('User')).toMatchInlineSnapshot(
    `"export { User } from './user.js'"`
  )
})
```

### 4. Group Related Snapshots

```typescript
describe('User DTO Snapshots', () => {
  const model = models.user()
  
  it('create', () => expect(gen.create(model)).toMatchSnapshot())
  it('update', () => expect(gen.update(model)).toMatchSnapshot())
  it('read', () => expect(gen.read(model)).toMatchSnapshot())
  it('query', () => expect(gen.query(model)).toMatchSnapshot())
})
```

---

## CI Integration

Snapshots are automatically checked in CI:

```yaml
- name: Run generator tests
  run: pnpm test:generator
  
# If snapshots don't match, CI fails
# Developers must update snapshots and commit them
```

**Workflow:**
1. Developer changes template
2. Local tests fail (snapshot mismatch)
3. Developer reviews diff
4. If correct: `pnpm test -- -u`
5. Commit updated snapshot
6. CI passes with new snapshot

---

## Snapshot Files in Git

### Commit Snapshots ✅

```bash
git add src/generators/__tests__/__snapshots__/
git commit -m "test: update DTO generator snapshots"
```

**Snapshots are source code** - they must be versioned!

### Snapshot Diff Reviews

When reviewing PRs, check:
- Are snapshot changes intentional?
- Do they match the PR description?
- Are they improvements or regressions?

---

## Maintenance

### Regular Reviews

**Monthly:**
- Review all snapshots for staleness
- Verify coverage is adequate
- Check for huge snapshot files

**After Major Changes:**
- Update affected snapshots
- Verify all tests pass
- Document breaking changes

### Snapshot Hygiene

```bash
# Remove unused snapshots
pnpm test -- --removeUnusedSnapshots

# Update all snapshots
pnpm test -- -u

# Check snapshot coverage
pnpm test --coverage
```

---

## Advanced Techniques

### Custom Snapshot Matchers

```typescript
expect.extend({
  toMatchTypeScriptSnapshot(received: string, snapshot: string) {
    // Custom comparison logic
    const normalizedReceived = normalizeTypeScript(received)
    const normalizedSnapshot = normalizeTypeScript(snapshot)
    
    return {
      pass: normalizedReceived === normalizedSnapshot,
      message: () => `TypeScript snapshots don't match`
    }
  }
})

// Usage
expect(tsCode).toMatchTypeScriptSnapshot()
```

### Property Matchers

```typescript
expect(output).toMatchSnapshot({
  timestamp: expect.any(Number),
  id: expect.any(String)
})
```

### Snapshot Serializers

```typescript
// vitest.config.ts
export default {
  test: {
    snapshotSerializers: [
      './test/serializers/typescript-serializer.ts'
    ]
  }
}

// Automatically formats TypeScript in snapshots
```

---

## Examples from Codebase

### DTO Generator (Excellent Example)

```typescript
// src/generators/__tests__/dto-generator.comprehensive.test.ts

it('should match CreateDTO snapshot', () => {
  const model = models.todo()
  const generator = new DTOGenerator({ model })
  const createDTO = generator.generateCreate()
  
  expect(createDTO).toMatchSnapshot()
})

it('should match minimal snapshot structure', () => {
  const model = models.post()
  const generator = new DTOGenerator({ model })
  const output = generator.generate()
  
  const minimal = minimalSnapshot(output.files)
  expect(minimal).toMatchSnapshot()
})
```

### Plugin Snapshots (New Example)

```typescript
// src/plugins/__tests__/plugin-snapshots.test.ts

it('should match Google OAuth strategy snapshot', () => {
  const plugin = new GoogleAuthPlugin({
    clientId: 'test-client-id',
    clientSecret: 'test-secret',
    strategy: 'jwt'
  })
  const output = plugin.generate(mockContext)
  
  const strategyFile = output.files.get('auth/strategies/google.strategy.ts')
  expect(strategyFile).toMatchSnapshot()
})
```

---

## Troubleshooting

### "Snapshot obsolete"

**Cause:** Test or fixture renamed

**Fix:**
```bash
pnpm test -- --removeUnusedSnapshots
```

### "Cannot find snapshot"

**Cause:** New test without snapshot

**Fix:** Just run tests - snapshot will be created automatically

### "Snapshot too large"

**Cause:** Snapshotting entire huge file

**Fix:** Use minimal/structural snapshots instead:
```typescript
// Instead of:
expect(hugeFile).toMatchSnapshot()

// Do:
expect(extractStructure(hugeFile)).toMatchSnapshot()
```

---

## Snapshot Coverage Goals

### Current: ~60%

Generators with snapshots:
- DTO ✅
- Validator ✅
- Service ✅
- Controller ✅
- Route ✅
- Barrel ✅
- Plugins (partial) ✅

### Target: ~85%

Need to add:
- SDK client generator
- React hooks generator
- OpenAPI generator
- Checklist generator (sections)
- Registry generator

### Not Worth Snapshotting

- Config files (too environment-specific)
- Test fixtures
- Utility functions (covered by unit tests)

---

## Summary

**Snapshot testing is:**
- ✅ Implemented (60% coverage)
- ✅ Working (512 tests, 5 suites with snapshots)
- ✅ Integrated into CI
- ✅ Documented

**To add more:**
1. Create `*snapshot.test.ts` file
2. Import generator
3. Call `expect(output).toMatchSnapshot()`
4. Run tests to generate snapshot
5. Commit snapshot file

**That's it!** Snapshot testing is simple and powerful. 🎉

---

## See Also

- [Vitest Snapshot Docs](https://vitest.dev/guide/snapshot.html)
- [Testing Strategy](../plugins/__tests__/TESTING_STRATEGY.md)
- [CONTRIBUTING.md](../../../CONTRIBUTING.md)

