# Testing Strategy

## Overview

The SSOT Codegen project uses a comprehensive **two-tier testing strategy** to ensure both the code generators and the generated code are high quality.

## Tier 1: Generator Tests (Unit Tests)

**Location:** `packages/gen/src/generators/__tests__/`  
**Command:** `pnpm test:generator`  
**Coverage:** 414 tests across 8 test suites

### What's Tested:
- **DTO Generator** (76 tests): Validates DTO structure, type mappings, and relationships
- **Validator Generator** (63 tests): Ensures Zod schemas are correctly generated
- **Service Generator** (74 tests): Tests CRUD methods, Prisma queries, and error handling
- **Controller Generator** (69 tests): Validates Express/Fastify controllers
- **Route Generator** (54 tests): Tests route definitions and middleware
- **SDK Generator** (40 tests): Validates TypeScript SDK with helpers namespace
- **SDK Service Generator** (38 tests): Tests SDK service integration

### Key Validations:
✅ Import paths use `@/` convention consistently  
✅ TypeScript types are accurate  
✅ Generated code structure matches expectations  
✅ Snapshots match for consistent output  
✅ Domain methods (findBySlug, publish, etc.) generate correctly  
✅ Relationship handling works properly  

## Tier 2: Generated Code Validation

**Location:** `scripts/test-generated.js`  
**Command:** `pnpm test:generated`  
**Coverage:** 16 validation tests

### What's Tested:
1. **Generation Process** (1 test)
   - Verifies code generation completes successfully

2. **File Structure** (6 tests)
   - Validates all expected directories exist
   - Checks for contracts, services, controllers, routes, validators, SDK

3. **Import Paths** (4 tests)
   - Services use `@/` imports
   - Controllers use relative imports for local files
   - Routes use `@/` imports for controllers
   - SDK uses `@/` imports for contracts

4. **Code Quality** (4 tests)
   - Services have all CRUD methods
   - Controllers export handler functions
   - SDK inherits from BaseModelClient
   - SDK has helpers namespace for domain methods

5. **Cleanup** (1 test)
   - Removes test output after validation

### Process:
1. Generate a minimal test project
2. Validate file structure
3. Check import path consistency
4. Verify code quality and patterns
5. Clean up test artifacts

## Full Test Suite

**Command:** `pnpm run full-test`

Runs the complete testing pipeline:
```bash
pnpm run build          # Build all packages
pnpm test:generator     # Run 414 generator unit tests
pnpm test:generated     # Run 16 generated code validation tests
```

### Total Coverage:
- **430 tests total** (414 + 16)
- **100% pass rate** required for CI/CD
- **~2-3 seconds** total execution time

## Test Output Example

```
╭─────────────────────────────────────────────╮
│  🧪 Generated Code Validation Test      │
╰─────────────────────────────────────────────╯

📦 Step 1: Generate Test Project
✅ Generate minimal test project

📋 Step 2: Validate File Structure
✅ Generated src directory exists
✅ Generated contracts exist
✅ Generated services exist
✅ Generated controllers exist
✅ Generated routes exist
✅ Generated validators exist

🔍 Step 3: Validate Import Paths
✅ Services use @/ imports
✅ Controllers use relative imports for local files
✅ Routes use @/ imports for controllers
✅ SDK uses @/ imports for contracts

✨ Step 4: Validate Generated Code Quality
✅ Services have CRUD methods
✅ Controllers export handler functions
✅ SDK has BaseModelClient inheritance
✅ SDK has helpers namespace for domain methods

🧹 Cleanup
✅ Remove test output

╭─────────────────────────────────────────────╮
│  📊 Test Summary                         │
╰─────────────────────────────────────────────╯

✅ Passed: 16
❌ Failed: 0
📈 Total:  16

✅ Generated code validation PASSED
```

## CI/CD Integration

### Pre-commit Checks:
```bash
pnpm run typecheck  # TypeScript compilation
pnpm run lint       # ESLint checks
pnpm test:generator # Generator unit tests
```

### Pre-push Checks:
```bash
pnpm run full-test  # Complete test suite
```

### Build Pipeline:
```bash
pnpm run build          # Build packages
pnpm test:generator     # Generator tests
pnpm test:generated     # Validation tests
```

## Why Two Tiers?

### Tier 1 (Generator Tests):
- **Fast feedback** - Runs in ~1 second
- **Granular testing** - Pinpoints exact issues
- **Snapshot testing** - Catches unintended changes
- **High coverage** - Tests all generator logic

### Tier 2 (Validation Tests):
- **End-to-end verification** - Tests actual generation output
- **Import path validation** - Ensures consistency
- **Structure verification** - Validates file organization  
- **Quality assurance** - Checks code patterns

## Adding New Tests

### Generator Tests:
Add to `packages/gen/src/generators/__tests__/[generator]-generator.comprehensive.test.ts`:

```typescript
it('should generate new feature', () => {
  const model = models.todo()
  const generator = new ServiceGenerator({ model })
  const output = generator.generate()
  const content = output.files.get('todo.service.ts')!
  
  expect(content).toContain('expected code')
})
```

### Validation Tests:
Add to `scripts/test-generated.js`:

```javascript
test('New validation check', () => {
  const content = readFileSync(join(TEST_OUTPUT, 'path/to/file.ts'), 'utf8')
  if (!content.includes('expected pattern')) {
    throw new Error('Validation failed')
  }
})
```

## Benefits

✅ **Confidence** - Know generators produce working code  
✅ **Regression Prevention** - Catch breaking changes early  
✅ **Documentation** - Tests serve as examples  
✅ **Fast Iteration** - Quick feedback loop  
✅ **Quality Assurance** - Automated validation  
✅ **Maintainability** - Easy to update as features evolve  

## Running Tests

### Development:
```bash
# Watch mode for generator tests
cd packages/gen
pnpm test:watch

# Single test file
pnpm test -- sdk-generator.comprehensive.test.ts

# With coverage
pnpm test:coverage
```

### CI/CD:
```bash
# Complete validation
pnpm run full-test

# Quick check
pnpm run check:all  # typecheck + lint + knip + madge
```

## Test Philosophy

1. **Test behaviors, not implementation** - Focus on what code does, not how
2. **Keep tests fast** - Sub-second feedback for unit tests
3. **Make failures obvious** - Clear error messages
4. **Validate real usage** - Generated code must actually work
5. **Automate everything** - No manual verification needed

## Success Metrics

- ✅ **100% test pass rate** on main branch
- ✅ **<3 seconds** total test execution time
- ✅ **Zero false positives** - Tests fail only for real issues
- ✅ **Full coverage** of critical paths
- ✅ **Automated validation** in CI/CD pipeline

