# Next Work Priorities

**Date**: November 12, 2025  
**Last Completed**: WebSocket + System Improvements Phase 2  
**Status**: Ready for Next Phase  

---

## ✅ Just Completed

1. ✅ WebSocket integration (transport layer + generator)
2. ✅ Schema annotation system (5 annotations)
3. ✅ RLS + WebSocket unified security
4. ✅ System guide + comprehensive docs (15 guides)

---

## 🎯 Immediate Next (Priority 1)

### **A. Wire Annotation Parser into DMMF Parser** ⭐ CRITICAL
**Why**: Annotations exist but aren't actually being parsed yet  
**Impact**: Everything depends on this  
**Effort**: 2-3 hours  

**Tasks**:
1. Update `packages/gen/src/dmmf-parser/parsing/model-parser.ts`
2. Call `parseAnnotations()` when parsing models
3. Add annotations to `ParsedModel` type
4. Update schema validator to validate annotations
5. Test with real schema

**Files**:
- `dmmf-parser/parsing/model-parser.ts` (add annotation parsing)
- `dmmf-parser/types.ts` (add annotations field to ParsedModel)
- `dmmf-parser/validation/schema-validator.ts` (validate annotations)

---

### **B. WebSocket Generator: Use Parsed Annotations** ⭐ CRITICAL
**Why**: Currently reads raw documentation, should use parsed annotations  
**Impact**: Makes @@realtime actually work  
**Effort**: 1 hour  

**Tasks**:
1. Update `websocket-generator.ts` to use `model.annotations`
2. Remove manual parsing (already done in DMMF parser)
3. Test with @@realtime annotation

**Files**:
- `generators/websocket/websocket-generator.ts`

---

### **C. RLS Plugin: Read @@policy Annotations** ⭐ CRITICAL
**Why**: Policies defined in schema need to generate middleware  
**Impact**: Security layer works  
**Effort**: 2-3 hours  

**Tasks**:
1. Update `plugins/rls/rls.plugin.ts`
2. Read @@policy annotations from models
3. Generate middleware code based on policies
4. Generate expression evaluation code

**Files**:
- `plugins/rls/rls.plugin.ts`
- `plugins/rls/policy-generator.ts` (new)

---

## 🎯 High Priority (Priority 2)

### **D. Test WebSocket Integration End-to-End**
**Why**: Verify everything works together  
**Impact**: Confidence in shipping  
**Effort**: 4 hours  

**Tasks**:
1. Create test schema with @@realtime
2. Run generation
3. Verify files generated correctly
4. Start servers (HTTP + WebSocket)
5. Test connection, subscription, broadcast
6. Document any issues

---

### **E. Example Project: Real-Time Chat**
**Why**: Showcase WebSocket capabilities  
**Impact**: User confidence, testing  
**Effort**: 3 hours  

**Tasks**:
1. Create `examples/realtime-chat/`
2. Schema with Message model + @@realtime
3. Generate code
4. Add simple UI (chat interface)
5. Test real-time messaging
6. Document setup

---

### **F. UI Form Generation**
**Why**: Current UI only has list/detail, needs create/edit  
**Impact**: Complete CRUD UI  
**Effort**: 4 hours  

**Tasks**:
1. Create `generators/ui/form-generator.ts`
2. Generate create/edit pages
3. Wire up Zod validation
4. Handle file uploads
5. Add form components

**Files**:
- `generators/ui/form-generator.ts` (new)
- Update `ui-generator.ts` to call form generator

---

## 🎯 Medium Priority (Priority 3)

### **G. Expression Engine Integration**
**Why**: Enable dynamic fields in UI  
**Impact**: Advanced features  
**Effort**: 3 hours  

**Tasks**:
1. Wire `@ssot-ui/expressions` into generated UI
2. Generate computed field components
3. Add expression context provider
4. Test with example expressions

---

### **H. CI/CD Workflow Generation**
**Why**: Phase exists but generates nothing  
**Impact**: Professional projects  
**Effort**: 2 hours  

**Tasks**:
1. Update `pipeline/phases/10-generate-ci-cd.phase.ts`
2. Generate `.github/workflows/ci.yml`
3. Generate `.github/workflows/deploy.yml`
4. Add Node version matrix, caching, build/test

**Template**:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build
```

---

### **I. Environment Template Generation**
**Why**: Users need .env guidance  
**Impact**: Better onboarding  
**Effort**: 1 hour  

**Tasks**:
1. Generate `.env.template` in output
2. Include required vars based on config
3. Add plugin-specific vars (if enabled)
4. Document each variable

**Example**:
```bash
# Database
DATABASE_URL="postgresql://..."

# Auth (required for JWT strategy)
JWT_SECRET="generate-with-openssl-rand"

# WebSocket (if @@realtime used)
WEBSOCKET_URL="ws://localhost:3001/ws"

# Cloudinary (if @@service("Cloudinary"))
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
```

---

### **J. Plugin System Documentation**
**Why**: 24 plugins but unclear how to use  
**Impact**: Users can leverage plugins  
**Effort**: 2 hours  

**Tasks**:
1. Create `docs/PLUGIN_SYSTEM_GUIDE.md`
2. Document each plugin category
3. Show activation examples
4. Explain ordering and conflicts

---

## 🎯 Lower Priority (Priority 4+)

### Later
- Next.js RSC support (SSR data fetching)
- WebSocket horizontal scaling (Redis adapter)
- Rate limiting plugin
- Bundle size optimization
- GDPR compliance hooks
- Payment webhook generation
- Advanced search (Elasticsearch, Typesense)

---

## 📋 Recommended Order

### **Today (4-6 hours)**
1. **A. Wire annotations into DMMF parser** (2-3h) ⭐
2. **B. Update WebSocket generator** (1h) ⭐
3. **C. Update RLS plugin** (2-3h) ⭐

**Result**: Annotations actually work end-to-end

---

### **Tomorrow (6-8 hours)**
4. **D. E2E test** (4h)
5. **E. Example chat project** (3h)
6. **I. Environment template** (1h)

**Result**: Proven working system with example

---

### **This Week**
7. **F. UI form generation** (4h)
8. **G. Expression integration** (3h)
9. **H. CI/CD workflows** (2h)
10. **J. Plugin documentation** (2h)

**Result**: Complete feature set with docs

---

## 🎪 The Critical Path

```
Annotations in DMMF Parser (A)
    ↓
WebSocket reads annotations (B)
    ↓
RLS reads annotations (C)
    ↓
End-to-end test (D)
    ↓
Example project (E)
    ↓
Ship! 🚀
```

**Blockers**: None (A → B → C is sequential)

---

## 💡 Recommendation

**Start with A (Wire annotations into DMMF parser)**

This unblocks everything else. Currently, annotations are:
- ✅ Defined (types.ts)
- ✅ Parseable (parser.ts)
- ✅ Validatable (validator.ts)
- ❌ Not actually being called!

**Impact**: Once A is done, B and C are trivial (just use `model.annotations` instead of manual parsing).

---

## 🎯 Success Criteria

After completing A → B → C → D:

```bash
# 1. Create schema with annotations
cat > schema.prisma << 'EOF'
model Message {
  id String @id
  text String
  /// @@realtime(subscribe: ["list"], broadcast: ["created"])
  /// @@policy("read", rule: "authenticated")
}
EOF

# 2. Generate
pnpm ssot generate

# 3. Start servers
pnpm dev

# 4. Test
# ✅ WebSocket gateway running
# ✅ Annotations parsed
# ✅ RLS middleware generated
# ✅ Real-time updates work
# ✅ Security enforced
```

---

## 🚀 Ready to Proceed

**Next Task**: **A. Wire annotations into DMMF parser**  
**Effort**: 2-3 hours  
**Impact**: Unblocks B and C  
**Status**: Ready to start  

**Say the word and I'll begin!** 🎯

