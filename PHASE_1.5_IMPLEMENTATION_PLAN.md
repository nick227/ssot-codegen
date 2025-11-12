# 🔒 Phase 1.5: Security Foundation - Implementation Plan

## Overview

**Goal**: Build production-ready security layers before Phase 2 (page renderers)

**Timeline**: 2-3 weeks  
**Status**: 🚀 **STARTING NOW**

---

## Task Breakdown

### **Task 1: Policy Engine** (Week 1) 🔥 **CRITICAL**

**Package**: `@ssot-ui/policy-engine`

**Deliverables**:
1. Policy schema (Zod)
2. PolicyEngine class
3. Row-level security (RLS) enforcement
4. Field-level permissions
5. Integration with universal endpoint
6. Tests (>80% coverage)

**Files to Create**:
```
packages/policy-engine/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── policy-engine.ts
│   ├── policy-evaluator.ts
│   ├── field-filter.ts
│   ├── row-filter.ts
│   └── __tests__/
│       ├── policy-engine.test.ts
│       ├── row-filter.test.ts
│       └── field-filter.test.ts
└── examples/
    └── policies.json
```

**Success Criteria**:
- ✅ Can define policies in JSON
- ✅ Row-level filters applied automatically
- ✅ Field-level read/write enforcement
- ✅ Expression-based rules work
- ✅ All tests passing

---

### **Task 2: Expression Sandbox** (Week 1, Days 4-5) 🔥 **HIGH**

**Package**: `@ssot-ui/expressions` (update existing)

**Deliverables**:
1. SafeEvaluator class with budget enforcement
2. Operation whitelist
3. Dangerous path protection
4. Client vs server evaluation tags
5. Tests for attack scenarios

**Files to Update/Create**:
```
packages/ui-expressions/src/
├── sandbox.ts               # NEW
├── evaluator.ts            # UPDATE (use SafeEvaluator)
├── types.ts                # UPDATE (add evaluateOn field)
└── __tests__/
    ├── sandbox.test.ts      # NEW
    └── security.test.ts     # NEW
```

**Success Criteria**:
- ✅ Prototype pollution prevented
- ✅ Infinite loops caught (timeout)
- ✅ Memory exhaustion prevented (operation budget)
- ✅ Dangerous operations blocked
- ✅ All security tests passing

---

### **Task 3: Validation Layer** (Week 2, Days 1-3) 🔥 **MEDIUM-HIGH**

**Package**: `@ssot-ui/validator`

**Deliverables**:
1. Zod schema generator from data-contract.json
2. Server-side validation middleware
3. User-friendly error mapping
4. Integration with universal endpoint
5. Tests

**Files to Create**:
```
packages/validator/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── schema-generator.ts
│   ├── validator.ts
│   ├── error-mapper.ts
│   └── __tests__/
│       ├── schema-generator.test.ts
│       ├── validator.test.ts
│       └── error-mapper.test.ts
└── examples/
    └── data-contract.json
```

**Success Criteria**:
- ✅ Zod schemas generated from data-contract.json
- ✅ All requests validated server-side
- ✅ Clear, actionable error messages
- ✅ Integration with universal endpoint works
- ✅ All tests passing

---

### **Task 4: Schema Drift Protection** (Week 2, Days 4-5) 🔥 **HIGH**

**Package**: `@ssot-ui/schema-validator`

**Deliverables**:
1. Schema hash generator
2. .schema-lock.json generator
3. Template validator (checks against lock)
4. CLI command: `ssot-validate`
5. CI integration example
6. Tests

**Files to Create**:
```
packages/schema-validator/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── hash-generator.ts
│   ├── lockfile-generator.ts
│   ├── template-validator.ts
│   ├── cli.ts
│   └── __tests__/
│       ├── hash-generator.test.ts
│       ├── lockfile.test.ts
│       └── validator.test.ts
└── examples/
    └── .schema-lock.json
```

**Success Criteria**:
- ✅ Schema changes detected automatically
- ✅ Template validation catches missing fields
- ✅ CLI command works
- ✅ CI example provided
- ✅ All tests passing

---

### **Task 5: Query Budget** (Week 3, Days 1-2) 🔥 **MEDIUM**

**Package**: `@ssot-ui/adapter-prisma` (update existing)

**Deliverables**:
1. Query budget configuration
2. Pagination limits (default/max take)
3. Include depth validator
4. OrderBy whitelist
5. Tests

**Files to Update**:
```
packages/adapter-prisma/src/
├── prisma-data-adapter.ts   # UPDATE (add budget checks)
├── query-validator.ts       # NEW
├── types.ts                 # UPDATE
└── __tests__/
    └── query-budget.test.ts  # NEW
```

**Success Criteria**:
- ✅ Default pagination (take: 50)
- ✅ Max take enforced (1000)
- ✅ Include depth limited (3 levels)
- ✅ OrderBy whitelist per model
- ✅ All tests passing

---

## Integration Plan

### **Step 1: Update Universal Endpoint** (Week 3, Day 3)

**File**: `packages/create-ssot-app/src/templates/api-route.ts`

**Changes**:
```typescript
// app/api/data/route.ts (generated template)

import { PolicyEngine } from '@ssot-ui/policy-engine'
import { SafeEvaluator } from '@ssot-ui/expressions'
import { validateRequest } from '@ssot-ui/validator'
import { validateQuery } from '@ssot-ui/adapter-prisma'

// Policy engine (loaded from templates/policies.json)
const policyEngine = new PolicyEngine(policies)

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  const body = await request.json()
  
  // 1. Validate request schema
  const validation = validateRequest(body, schemas)
  if (!validation.success) {
    return NextResponse.json({ error: validation.errors }, { status: 400 })
  }
  
  // 2. Check authorization
  const isAllowed = await policyEngine.checkAccess({
    user: session.user,
    model: body.model,
    action: body.action,
    where: body.where,
    data: body.data
  })
  if (!isAllowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // 3. Apply row-level filters
  const whereWithPolicy = policyEngine.applyRowFilters({
    model: body.model,
    action: body.action,
    where: body.where,
    user: session.user
  })
  
  // 4. Validate query budget
  validateQuery(body.model, body.action, {
    pagination: body.pagination,
    include: body.include,
    orderBy: body.orderBy
  })
  
  // 5. Get allowed fields
  const allowedFields = policyEngine.getAllowedFields({
    model: body.model,
    action: body.action,
    user: session.user
  })
  
  // 6. Execute with all constraints
  const result = await adapters.data[body.action](body.model, {
    where: whereWithPolicy,
    data: filterFields(body.data, allowedFields.write),
    include: body.include,
    orderBy: body.orderBy,
    pagination: body.pagination,
    select: allowedFields.read
  })
  
  return NextResponse.json(result)
}
```

---

### **Step 2: Update create-ssot-app** (Week 3, Day 4)

**Files to Update**:
- `packages/create-ssot-app/src/v3-ui-generator.ts`
- Add policies.json template generation
- Add .schema-lock.json generation
- Update package.json scripts

---

### **Step 3: Documentation** (Week 3, Day 5)

**Docs to Create**:
1. Policy Engine Guide
2. Expression Security Best Practices
3. Validation Guide
4. Schema Drift Prevention Guide
5. Migration Guide (V3 without security → V3 with security)

---

## Testing Strategy

### **Unit Tests** (per package)
- ✅ Each package has >80% coverage
- ✅ All public APIs tested
- ✅ Edge cases covered

### **Integration Tests**
- ✅ Policy engine + universal endpoint
- ✅ Validation layer + universal endpoint
- ✅ All components working together

### **Security Tests**
- ✅ Attack scenarios (privilege escalation)
- ✅ Expression exploits (prototype pollution)
- ✅ Query attacks (DOS via includes)

### **E2E Tests**
- ✅ Real project with all security layers
- ✅ Create, read, update, delete with policies
- ✅ Unauthorized access blocked

---

## Dependencies

### **New Package Dependencies**:

```json
{
  "zod": "^3.22.0",                    // Validation
  "crypto": "built-in",                 // Hashing for lockfile
  "commander": "^11.0.0"               // CLI tool
}
```

### **Internal Dependencies**:

```
@ssot-ui/policy-engine
  └─ @ssot-ui/expressions (evaluate policy rules)

@ssot-ui/validator
  └─ zod (schema validation)

@ssot-ui/schema-validator
  └─ @ssot-ui/schemas (template schemas)

@ssot-ui/adapter-prisma (updated)
  └─ (no new deps)
```

---

## Success Metrics

### **Security Metrics**:
- ✅ 0 critical vulnerabilities (npm audit)
- ✅ All OWASP Top 10 addressed
- ✅ Security test suite passing (100%)

### **Performance Metrics**:
- ✅ Policy check <5ms overhead per request
- ✅ Validation <3ms overhead per request
- ✅ Expression evaluation <10ms

### **Developer Experience**:
- ✅ Clear error messages (actionable)
- ✅ Good documentation (guides + examples)
- ✅ Easy to configure policies

---

## Risk Mitigation

### **Risk 1: Performance Overhead**

**Mitigation**:
- Cache policy evaluations
- Optimize expression evaluator
- Profile and benchmark

### **Risk 2: Complexity**

**Mitigation**:
- Clear examples for common patterns
- Good defaults (secure by default)
- Progressive disclosure (start simple)

### **Risk 3: Breaking Changes**

**Mitigation**:
- Version policies carefully
- Provide migration guide
- Support both old/new for transition period

---

## Timeline (Detailed)

### **Week 1**:
- Mon-Wed: Policy Engine (core)
- Thu-Fri: Expression Sandbox

### **Week 2**:
- Mon-Wed: Validation Layer
- Thu-Fri: Schema Drift Protection

### **Week 3**:
- Mon-Tue: Query Budget
- Wed: Integration (universal endpoint)
- Thu: Update create-ssot-app
- Fri: Documentation

**Total**: 3 weeks (15 working days)

---

## Next Steps (Immediate)

1. ✅ Create `packages/policy-engine/` package structure
2. ✅ Implement PolicyEngine class
3. ✅ Write policy schema (Zod)
4. ✅ Write tests
5. ✅ Integrate with universal endpoint (example)

**Let's start with Task 1: Policy Engine** 🚀

---

*Status: Planning Complete - Implementation Starting*  
*Date: November 12, 2025*  
*Phase: 1.5 (Security Foundation)*

