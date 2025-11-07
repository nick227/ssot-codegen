# Unified Analyzer Tests

Comprehensive test suite for the unified model analyzer covering all critical fixes and edge cases.

## Running Tests

```bash
# Run all analyzer tests
npm test unified-analyzer

# Run in watch mode
npm test unified-analyzer -- --watch

# Run with coverage
npm test unified-analyzer -- --coverage

# Run specific test suite
npm test unified-analyzer -- -t "Enum Detection"
```

## Test Coverage

### Critical Fixes (100% coverage)
- ✅ Enum field detection as filterable
- ✅ Array field detection as filterable
- ✅ Unidirectional relation classification
- ✅ Junction table detection with audit fields
- ✅ Auto-include granular control

### Core Functionality
- ✅ Basic model analysis
- ✅ Special field detection (slug, published, deletedAt, etc.)
- ✅ Capability detection (search, filters, special methods)
- ✅ Relationship classification (1:1, 1:M, M:1, M:N)
- ✅ Junction table detection (composite PK and surrogate ID patterns)

### Configuration Options
- ✅ Auto-include behavior (enabled/disabled/required-only)
- ✅ Sensitive field exclusion
- ✅ Custom parent patterns
- ✅ Error collection mode
- ✅ System field names configuration

### Edge Cases
- ✅ Composite unique indexes
- ✅ Composite foreign keys
- ✅ Self-referential relations
- ✅ Multiple relations to same model
- ✅ Normalized field names (snake_case, kebab-case, etc.)
- ✅ Decimal counters
- ✅ Missing target models

### API Tests
- ✅ `generateIncludeObject()` (new type-safe API)
- ✅ `generateSummaryInclude()` (deprecated string API)

## Test Fixtures

All test fixtures are defined in `unified-analyzer-fixtures.ts`:

### Models
- `BLOG_POST_MODEL` - Comprehensive model with all special fields
- `USER_MODEL` - Basic model with relations
- `POST_WITH_ENUMS_MODEL` - Tests enum detection
- `UNIDIRECTIONAL_MODEL` - Tests unidirectional relation classification
- `JUNCTION_WITH_AUDIT_MODEL` - Tests system field exclusion
- `SELF_REF_CATEGORY_MODEL` - Tests parent/child detection
- `COMPOSITE_UNIQUE_MODEL` - Tests composite unique index handling
- `DECIMAL_COUNTERS_MODEL` - Tests Decimal type support
- `COMPOSITE_FK_MODEL` - Tests composite foreign key handling
- `MULTIPLE_RELATIONS_MODEL` - Tests multiple relations to same target

### Helpers
- `createMockField()` - Create test field with defaults
- `createMockModel()` - Create test model with defaults
- `createMockSchema()` - Create test schema from models

## Writing New Tests

```typescript
import { analyzeModelUnified } from '../unified-analyzer.js'
import { createMockModel, createMockField, createMockSchema } from './unified-analyzer-fixtures.js'

it('should test something', () => {
  // 1. Create test model
  const model = createMockModel({
    name: 'TestModel',
    fields: [
      createMockField({ name: 'id', type: 'Int', isId: true }),
      createMockField({ name: 'name', type: 'String' })
    ]
  })
  
  // 2. Create schema
  const schema = createMockSchema([model])
  
  // 3. Analyze
  const analysis = analyzeModelUnified(model, schema)
  
  // 4. Assert
  expect(analysis.model.name).toBe('TestModel')
  expect(analysis.capabilities.searchFields).toContain('name')
})
```

## Test Organization

Tests are organized by concern:

1. **Basic Functionality** - Core analyzer behavior
2. **Critical Fixes** - Tests for each critical bug fix
3. **Relationship Classification** - 1:1, 1:M, M:1, M:N detection
4. **Junction Table Detection** - Various junction table patterns
5. **Auto-Include Behavior** - Auto-include configuration options
6. **Special Field Detection** - Slug, published, views, etc.
7. **Sensitive Field Exclusion** - Password, token, secret filtering
8. **Parent/Child Detection** - Self-referential relation detection
9. **Error Collection Mode** - Error handling configuration
10. **Foreign Key Information** - FK metadata extraction
11. **Include Generation** - Include object/string generation

## Continuous Integration

These tests run automatically on:
- Every commit (pre-commit hook)
- Pull requests
- Main branch merges

Minimum coverage requirement: **90%**

## Performance Benchmarks

The test suite includes performance benchmarks to ensure optimizations work:

```bash
# Run with benchmarks
npm test unified-analyzer -- --reporter=verbose
```

Expected performance (typical schema with 20 models, 10 fields each):
- Field analysis: <1ms per model
- Relationship analysis: <2ms per model
- Total analysis: <3ms per model

## Debugging Tests

```bash
# Run single test with full output
npm test unified-analyzer -- -t "should detect enum fields" --reporter=verbose

# Debug with Node inspector
node --inspect-brk ./node_modules/.bin/vitest unified-analyzer
```

## Related Documentation

- [CRITICAL_FIXES_ROUND_2.md](../CRITICAL_FIXES_ROUND_2.md) - Details on all fixes
- [unified-analyzer.ts](../unified-analyzer.ts) - Source code
- [../../dmmf-parser.js](../../dmmf-parser.js) - Type definitions

