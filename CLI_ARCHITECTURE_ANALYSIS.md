# 🔍 CLI Architecture Analysis

**Question**: Is packages/create-ssot-app still in use?  
**Answer**: YES - But there's confusion about the two CLIs!

---

## 📦 We Have TWO Separate CLIs

### **CLI 1: `ssot generate`** (packages/cli/)

**Purpose**: Generate API from existing Prisma schema  
**Usage**: `ssot generate schema.prisma`  
**Uses**: @ssot-codegen/gen (V2 generator)  
**Generates**: API routes, controllers, DTOs, SDK, OpenAPI

**Typical workflow**:
```bash
# Developer has existing project with Prisma schema
cd my-existing-project
ssot generate prisma/schema.prisma
# → Generates API code in src/
```

---

### **CLI 2: `create-ssot-app`** (packages/create-ssot-app/)

**Purpose**: Scaffold complete new project from scratch  
**Usage**: `npx create-ssot-app my-app`  
**Creates**: 
- Project structure
- Prisma schema (from preset or custom)
- package.json
- Config files
- UI files (if selected)
- README, .gitignore, etc.

**Typical workflow**:
```bash
# Developer starting from scratch
npx create-ssot-app my-soundcloud
? Select preset: media
? Generate UI: yes
# → Creates complete project folder
cd my-soundcloud
npm install
npm run dev
```

---

## 🤔 The Confusion

**Currently**:
- `create-ssot-app` creates project structure
- But it doesn't call `ssot generate` (V2 generator)!
- It has its own UI generation logic (ui-generator.ts)

**Problem**:
- create-ssot-app and gen/ are doing similar things
- Not using the same generators
- Potential for drift

---

## 🎯 What create-ssot-app Should Do

### **Current Approach** (Redundant):
```
create-ssot-app
  ├── Creates project structure ✅
  ├── Generates Prisma schema ✅
  ├── Has its own UI generator ❌ (redundant with gen/)
  └── Doesn't use V2 generator ❌
```

### **Ideal Approach** (Unified):
```
create-ssot-app
  ├── Creates project structure ✅
  ├── Generates Prisma schema (from preset) ✅
  ├── Calls ssot generate (uses V2 gen/) ✅
  └── Adds UI components (from gen/ui-generator) ✅
```

---

## 🔄 What Should Happen

**create-ssot-app should**:
1. Create project folder
2. Generate Prisma schema (from preset)
3. Call `@ssot-codegen/gen` to generate API + UI
4. Write config files
5. Install dependencies

**It should NOT**:
- Have its own code generation logic
- Duplicate what gen/ already does

---

## ✅ Consolidation Strategy

### **Keep**:
- ✅ packages/create-ssot-app/ (project scaffolding)
- ✅ packages/cli/ (API generation)
- ✅ packages/gen/ (core generator)

### **Consolidate**:
- ❌ create-ssot-app/src/ui-generator.ts (use gen/ui-generator instead)
- ❌ create-ssot-app/src/factories/ (use gen/generators instead)
- ❌ create-ssot-app/src/templates/ (use gen/templates instead)

### **Result**:
```
create-ssot-app/
├── src/
│   ├── create-project.ts    ✅ Main orchestration
│   ├── prompts.ts           ✅ User interaction
│   ├── presets/             ✅ Preset schemas
│   └── index.ts             ✅ Entry point
└── examples/                ✅ Reference schemas

# Everything else delegates to gen/
```

---

## 🎯 Recommended Actions

**1. Simplify create-ssot-app** (3-4 hours):
- Remove ui-generator.ts (use gen/)
- Remove factories/ (use gen/)
- Keep only: create-project.ts, prompts.ts, presets/
- Call gen.generateUI() instead of own logic

**2. Make gen/ the source of truth**:
- All generation logic in gen/
- create-ssot-app just orchestrates
- No duplication

**3. Clear separation**:
- create-ssot-app = project scaffolding
- gen/ = code generation
- cli/ = CLI wrapper

---

## 📊 Impact

**Before**:
- 2 code generators (gen/ and create-ssot-app/)
- Duplication risk
- Maintenance burden

**After**:
- 1 code generator (gen/)
- create-ssot-app orchestrates
- No duplication
- Easier maintenance

---

**Should we consolidate create-ssot-app to use gen/ directly?**

This would:
- ✅ Eliminate duplication
- ✅ Single source of truth
- ✅ Easier maintenance
- ✅ Guaranteed consistency

**Proceed?**

