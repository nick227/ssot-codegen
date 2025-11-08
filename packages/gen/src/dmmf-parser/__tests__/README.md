# DMMF Parser Test Suite

Comprehensive test coverage for the modularized DMMF parser.

## Test Statistics

- **Total Tests**: 78 ✅
- **Test Files**: 5
- **Pass Rate**: 100%
- **Coverage**: Core parsing, validation, field helpers, defaults, integration scenarios

## Test Files

### 1. `parsing-core.test.ts` (27 tests)
Tests the main `parseDMMF` orchestrator and core parsing logic.

**Coverage:**
- ✅ Basic DMMF parsing (simple models, enums)
- ✅ Model name extraction and normalization
- ✅ ID field detection
- ✅ Field categorization (scalar, relation, enum)
- ✅ Field properties (optional, required, nullable)
- ✅ Default value detection (DB-managed vs client-managed)
- ✅ DTO field categorization (createFields, updateFields, readFields)
- ✅ Enum parsing and detection
- ✅ Relationship parsing (one-to-many, many-to-one)
- ✅ Reverse relation map building
- ✅ Self-referencing relations
- ✅ Composite primary keys
- ✅ Immutability (freeze option)
- ✅ Custom logger support
- ✅ Error handling (malformed DMMF, validation)

**Key Scenarios:**
```typescript
// Simple model parsing
const schema = parseDMMF(simpleUserDMMF)
expect(schema.models).toHaveLength(1)

// Relationship detection
const post = schema.models.find(m => m.name === 'Post')
expect(post.relationFields.length).toBeGreaterThan(0)

// Self-referencing
const category = schema.models[0]
expect(category.hasSelfRelation).toBe(true)
```

### 2. `validation.test.ts` (11 tests)
Tests schema validation and circular dependency detection.

**Coverage:**
- ✅ Valid schema acceptance
- ✅ Missing ID field detection
- ✅ Unknown enum reference detection
- ✅ Self-referencing relation info
- ✅ Relation field validation (relationFromFields/ToFields)
- ✅ Mismatched field count detection
- ✅ Circular required relation detection
- ✅ Valid circular optional relation acceptance
- ✅ Structured validation results

**Key Scenarios:**
```typescript
// Detect missing ID
const errors = validateSchema(schemaWithoutId)
expect(errors.some(e => e.includes('no @id field'))).toBe(true)

// Detect circular dependencies
const errors = validateSchema(circularRequiredSchema)
expect(errors.some(e => e.includes('Circular relationship'))).toBe(true)
```

### 3. `field-helpers.test.ts` (11 tests)
Tests field utility functions.

**Coverage:**
- ✅ Field lookup by name
- ✅ Non-existent field handling
- ✅ Relation target resolution
- ✅ Optional field detection
- ✅ Nullable field detection
- ✅ Required field detection

**Key Scenarios:**
```typescript
// Find field
const emailField = getField(user, 'email')
expect(emailField?.name).toBe('email')

// Get relation target
const target = getRelationTarget(authorField, modelMap)
expect(target?.name).toBe('User')

// Check optionality
expect(isOptionalForCreate(nameField)).toBe(true)
expect(isNullable(emailField)).toBe(false)
```

### 4. `defaults.test.ts` (19 tests)
Tests default value detection and stringification.

**Coverage:**
- ✅ String literal generation
- ✅ Number literal generation (including 0)
- ✅ Boolean literal generation
- ✅ Null default handling
- ✅ now() → `new Date()` conversion
- ✅ autoincrement() → undefined (DB-managed)
- ✅ uuid() → undefined (DB-managed)
- ✅ Enum reference generation (`EnumName.VALUE`)
- ✅ Special character escaping
- ✅ BigInt field handling
- ✅ Decimal field handling
- ✅ Client-managed default detection
- ✅ Integration with parseDMMF

**Key Scenarios:**
```typescript
// Client-managed default
expect(getDefaultValueString(createdAtField)).toBe('new Date()')
expect(isClientManagedDefault({ name: 'now' })).toBe(true)

// DB-managed default
expect(getDefaultValueString(idField)).toBeUndefined()
expect(isClientManagedDefault({ name: 'uuid' })).toBe(false)

// Enum default
expect(getDefaultValueString(roleField)).toBe('Role.USER')

// Falsy values (0, null)
expect(getDefaultValueString(countField)).toBe('0')
expect(getDefaultValueString(nullField)).toBe('null')
```

### 5. `integration.test.ts` (10 tests)
Tests real-world schema patterns and workflows.

**Coverage:**
- ✅ E-commerce schema (Customer, Order, OrderStatus enum)
- ✅ Blog platform schema (User, Post, Comment with multiple relations)
- ✅ Complex relationship navigation
- ✅ Multi-model reverse relations
- ✅ DTO field identification in realistic scenarios
- ✅ Default value generation for business logic
- ✅ Performance with many models (50 models < 100ms)
- ✅ Immutability enforcement

**Key Scenarios:**
```typescript
// E-commerce: Customer -> Order
const order = schema.modelMap.get('Order')
expect(order.createFields).toContain('customerId')
expect(order.createFields).not.toContain('id') // Autoincrement

// Blog: Multi-model relationships
const comment = schema.modelMap.get('Comment')
expect(comment.relationFields).toHaveLength(2) // Post + Author

// Performance
const startTime = Date.now()
parseDMMF(dmmfWith50Models)
expect(Date.now() - startTime).toBeLessThan(100)
```

## Test Fixtures (`fixtures.ts`)

Provides realistic DMMF structures for testing:

- **`simpleUserDMMF`**: Basic User model with enum, timestamps
- **`relatedModelsDMMF`**: User <-> Post one-to-many relationship
- **`selfReferencingDMMF`**: Category with parent/children
- **`compositePkDMMF`**: UserRole with composite primary key
- **`emptyDMMF`**: Valid but empty schema
- **`malformedDMMF`**: Invalid structure for error testing

## Running Tests

```bash
# Run all dmmf-parser tests
pnpm test dmmf-parser

# Run specific test file
pnpm test parsing-core

# Run with coverage
pnpm test dmmf-parser --coverage

# Watch mode for development
pnpm test dmmf-parser --watch
```

## Test Organization

```
dmmf-parser/__tests__/
├── fixtures.ts                # Test data
├── parsing-core.test.ts       # Core orchestrator
├── validation.test.ts         # Schema validation
├── field-helpers.test.ts      # Utility functions
├── defaults.test.ts           # Default value handling
├── integration.test.ts        # Real-world scenarios
└── README.md                  # This file
```

## Coverage Goals

Current coverage targets:
- ✅ **Core parsing**: 100% (all paths tested)
- ✅ **Validation**: 100% (all error conditions)
- ✅ **Field helpers**: 100% (all utilities)
- ✅ **Defaults**: 100% (all default types)
- ✅ **Integration**: Key workflows covered

## Key Test Patterns

### 1. Positive Tests
Verify correct behavior with valid inputs:
```typescript
const schema = parseDMMF(validDMMF)
expect(schema.models).toBeDefined()
expect(schema.isValid).toBe(true)
```

### 2. Negative Tests
Verify error handling with invalid inputs:
```typescript
expect(() => parseDMMF(malformedDMMF)).toThrow('Invalid DMMF')
expect(errors.some(e => e.includes('missing ID'))).toBe(true)
```

### 3. Edge Cases
Test boundary conditions and special scenarios:
```typescript
// Falsy defaults
expect(getDefaultValueString({ default: 0 })).toBe('0')
expect(getDefaultValueString({ default: null })).toBe('null')

// Empty but valid
const schema = parseDMMF(emptyDMMF)
expect(schema.models).toHaveLength(0)
```

### 4. Integration Tests
Test complete workflows and realistic schemas:
```typescript
// Parse complex schema
const schema = parseDMMF(ecommerceDMMF)

// Navigate relationships
const target = getRelationTarget(field, schema.modelMap)

// Validate end-to-end
const result = validateSchemaDetailed(schema)
expect(result.isValid).toBe(true)
```

## Regression Prevention

These tests protect against:
- ✅ Breaking changes to public API
- ✅ Field categorization logic errors
- ✅ Default value handling bugs (falsy values)
- ✅ Relationship parsing issues
- ✅ Validation false positives/negatives
- ✅ Performance regressions
- ✅ Immutability violations

## Continuous Integration

Tests run automatically on:
- Every commit (pre-commit hook)
- Pull requests
- Main branch merges
- Release builds

## Contributing Tests

When adding new features or fixing bugs:

1. **Add test first** (TDD approach)
2. **Cover happy path** (normal usage)
3. **Cover error cases** (invalid inputs)
4. **Cover edge cases** (boundary conditions)
5. **Update this README** if adding new test file

Example:
```typescript
describe('New Feature', () => {
  it('should handle normal case', () => {
    // Arrange
    const input = createValidInput()
    
    // Act
    const result = newFeature(input)
    
    // Assert
    expect(result).toBeDefined()
  })

  it('should throw on invalid input', () => {
    expect(() => newFeature(invalidInput)).toThrow()
  })
})
```

## Test Maintenance

- ✅ Tests are self-contained (no external dependencies)
- ✅ Fixtures are realistic (based on actual Prisma schemas)
- ✅ Tests run fast (< 1 second for full suite)
- ✅ Clear test names describe what is tested
- ✅ Each test verifies one thing
- ✅ Tests are independent (can run in any order)

## Debugging Failed Tests

```bash
# Run single test file
pnpm test parsing-core.test.ts

# Run single test case
pnpm test -t "should parse simple user model"

# Run with debugging
pnpm test --inspect-brk dmmf-parser

# Show console output
pnpm test --reporter=verbose dmmf-parser
```

## Related Documentation

- [DMMF Parser Architecture](../README.md)
- [Modularization Summary](../../../../docs/DMMF_PARSER_MODULARIZATION_COMPLETE.md)
- [Modularization Proposal](../../../../docs/DMMF_PARSER_MODULARIZATION_PROPOSAL.md)

