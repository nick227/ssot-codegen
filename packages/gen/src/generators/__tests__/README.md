# Generator Validation Tests

This directory contains tests that validate code generators produce correct, working code.

## Purpose

These tests catch common issues **before** they reach generated projects:

1. **Controller Method Binding** - Ensures methods are properly bound to preserve `this` context
2. **Template Patterns** - Validates templates follow correct patterns
3. **Code Structure** - Checks for similar binding issues elsewhere

## Running Tests

```bash
# Run validation tests only
pnpm test:validate

# Run all tests
pnpm test

# Run during build
pnpm build:test
```

## What Gets Tested

### Controller Binding Validation

Validates that `BaseCRUDController` methods are exported with `.bind()`:

```typescript
// ✅ CORRECT
export const listUsers = userCRUD.list.bind(userCRUD)

// ❌ WRONG (causes runtime errors)
export const listUsers = userCRUD.list
```

**Why this matters:**
- Without `.bind()`, methods lose their `this` context
- Results in: `Cannot read properties of undefined (reading 'modelName')`
- This test catches the issue at build time, not runtime

### Generated Code Patterns

Checks for:
- Proper error handling patterns
- Safe property access
- Correct method exports

## Adding New Tests

When fixing generator bugs, add a test to prevent regression:

1. Create test in `__tests__/` directory
2. Test should fail if the bug exists
3. Test should pass after fix
4. Add to `test:validate` script

## Example: Fixing Controller Binding

**Before (broken):**
```typescript
export const listUsers = userCRUD.list  // ❌ Loses 'this' context
```

**After (fixed):**
```typescript
export const listUsers = userCRUD.list.bind(userCRUD)  // ✅ Preserves 'this'
```

**Test added:**
- `generated-code-validation.test.ts` checks for `.bind()` pattern
- Fails build if pattern is missing
- Prevents regression

