# Template Factory Refactoring Plan

**Goal**: Transform from imperative template generators (1200+ lines each) to declarative template definitions (100-200 lines each)

---

## 📊 **CURRENT STATE ANALYSIS**

### **Duplication Found**:

| Pattern | Blog | Chatbot | Can Be |
|---------|------|---------|--------|
| Field mapping logic | 50 lines | 30 lines | FieldResolver class |
| Model resolution | 44 lines | 25 lines | ModelResolver class |
| File write operations | 10 calls | 5 calls | FileManager class |
| Header comments | 10 identical | 5 identical | CodeBuilder.header() |
| SDK imports | 12 patterns | 5 patterns | CodeBuilder.hookImport() |
| Page structures | 7 pages | 2 pages | PageBuilder patterns |

### **Code Metrics**:
- **Blog**: 1,192 lines → 90% duplication/boilerplate
- **Chatbot**: 484 lines → 85% duplication/boilerplate
- **Total**: 1,676 lines of mostly duplicated logic

---

## ✅ **PROPOSED FACTORY SYSTEM**

### **1. FieldResolver** (Shared Logic)
```typescript
class FieldResolver {
  getField(templateField, defaultField)
  resolveFields(templateModel, fieldNames)
}
```
**Eliminates**: 80 lines of duplicated mapping logic

###  **2. ModelResolver** (Shared Logic)
```typescript
class ModelResolver {
  findModel(templateName)
  requireModel(templateName)
  resolveModels(templateNames)
}
```
**Eliminates**: 70 lines of duplicated resolution logic

### **3. FileManager** (Safe I/O)
```typescript
class FileManager {
  ensureDir(path)
  writeFile(path, content)
  writeFiles(files)
  safeWrite(path, content, backup = true)
}
```
**Eliminates**: 50+ manual fs.writeFileSync calls

### **4. CodeBuilder** (Code Generation)
```typescript
class CodeBuilder {
  static header(template, description)
  static hookImport(model, hooks)
  static typeImport(models)
  static sharedImport(components)
  static imports({ hooks, types, shared, custom })
}
```
**Eliminates**: 200+ lines of repeated template strings

### **5. PageBuilder** (Page Patterns)
```typescript
class PageBuilder {
  buildListPage(options)
  buildDetailPage(options)
  buildFormPage(options)
}
```
**Eliminates**: 600+ lines of page generation logic

### **6. ComponentBuilder** (Component Patterns)
```typescript
class ComponentBuilder {
  buildItemCard(options)
  buildListItem(options)
  buildForm(options)
}
```
**Eliminates**: 400+ lines of component generation

### **7. TemplateFactory** (Orchestrator)
```typescript
class TemplateFactory {
  generate(definition: TemplateDefinition)
}
```
**Enables**: Declarative template definitions!

---

## 🎯 **DECLARATIVE TEMPLATE DEFINITIONS**

### **Blog Template (BEFORE - 1192 lines)**
```typescript
// blog-generator.ts - 1192 lines of imperative code
export function generateBlogTemplate(projectPath, config, models, mappings) {
  // 50 lines: field mapping
  const fields = {
    user: { id: getField(...), name: getField(...), ... },
    post: { id: getField(...), title: getField(...), ... }
  }
  
  // 10 x fs.writeFileSync calls
  fs.writeFileSync(path.join(blogDir, 'layout.tsx'), generateBlogLayout(...))
  fs.writeFileSync(path.join(blogDir, 'page.tsx'), generateHomePage(...))
  // ... 8 more writes
  
  // 10 x generate functions (100-200 lines each)
  function generateBlogLayout() { return `/** ... */ 60 lines of template` }
  function generateHomePage() { return `/** ... */ 75 lines of template` }
  // ... 8 more functions
}
```

### **Blog Template (AFTER - ~150 lines)**
```typescript
// blog-template.ts - 150 lines of declarative config
import { TemplateFactory } from '../factories/template-builder.js'

export async function generateBlogTemplate(projectPath, config, models, mappings) {
  const factory = new TemplateFactory(projectPath, 'Blog', models, mappings)
  
  factory.generate({
    name: 'blog',
    directories: ['app/(blog)', 'app/admin/posts', 'components'],
    
    pages: [
      {
        type: 'list',
        path: 'app/(blog)/posts/page.tsx',
        model: 'post',
        title: 'All Posts',
        cardComponent: 'PostCard',
        sortBy: 'createdAt',
        includeRelations: ['author']
      },
      {
        type: 'detail',
        path: 'app/(blog)/posts/[slug]/page.tsx',
        model: 'post',
        title: 'Post',
        displayFields: [
          { field: 'title', label: 'Title', format: 'text' },
          { field: 'content', label: 'Content', format: 'html' },
          { field: 'author.name', label: 'Author', format: 'text' }
        ],
        backLink: '/posts'
      },
      {
        type: 'form',
        path: 'app/admin/posts/new/page.tsx',
        model: 'post',
        title: 'New Post',
        mode: 'create',
        formFields: [
          { name: 'title', label: 'Title', type: 'text' },
          { name: 'content', label: 'Content', type: 'textarea' },
          { name: 'published', label: 'Published', type: 'checkbox' }
        ]
      }
    ],
    
    components: [
      {
        type: 'item-card',
        path: 'components/PostCard.tsx',
        model: 'post',
        displayFields: [
          { field: 'title', type: 'title' },
          { field: 'excerpt', type: 'text' },
          { field: 'author', type: 'author', useShared: 'Avatar' },
          { field: 'createdAt', type: 'date', useShared: 'TimeAgo' }
        ],
        linkTo: '/posts'
      }
    ]
  })
}
```

**Code Reduction**: 1192 lines → 150 lines = **87% less code!**

---

## 📋 **REFACTORING ROADMAP**

### **Phase 1: Build Core Factories** (Day 1-2)
- [x] ✅ Create `FieldResolver` class
- [x] ✅ Create `ModelResolver` class
- [x] ✅ Create `FileManager` class
- [x] ✅ Create `CodeBuilder` class
- [x] ✅ Create `PageBuilder` class
- [x] ✅ Create `ComponentBuilder` class
- [x] ✅ Create `TemplateFactory` orchestrator
- [ ] Add unit tests for each factory

### **Phase 2: Migrate Blog Template** (Day 3-4)
- [ ] Convert blog-generator.ts to use TemplateFactory
- [ ] Create blog-template-definition.ts (declarative config)
- [ ] Test blog generation with new system
- [ ] Compare output with old generator (should be identical)
- [ ] Add snapshot tests

### **Phase 3: Migrate Chatbot Template** (Day 5)
- [ ] Convert chatbot-generator.ts to use TemplateFactory
- [ ] Create chatbot-template-definition.ts
- [ ] Test chatbot generation
- [ ] Verify OpenAI integration still works
- [ ] Add snapshot tests

### **Phase 4: Delete Old Code** (Day 6)
- [ ] Remove old blog-generator.ts (1192 lines deleted!)
- [ ] Remove old chatbot-generator.ts (484 lines deleted!)
- [ ] Remove duplicate helper functions
- [ ] Update all tests
- [ ] Verify all E2E tests still pass

### **Phase 5: Add Safety Features** (Day 7)
- [ ] Implement `safeWriteFile` with backups
- [ ] Add `--dry-run` CLI flag
- [ ] Add `--backup` option
- [ ] Implement change detection (don't write if unchanged)
- [ ] Add user confirmation for overwrites

---

## 🚀 **BENEFITS**

### **Code Reduction**:
- Blog: 1192 → 150 lines = **87% reduction**
- Chatbot: 484 → 100 lines = **79% reduction**
- **Total**: 1676 → 250 lines = **85% reduction**

### **Adding New Templates**:
**BEFORE**: Write 700-1000 lines of generator code  
**AFTER**: Write 100-150 lines of declarative config

### **Maintenance**:
**BEFORE**: Fix bug in 3 places (blog, chatbot, future templates)  
**AFTER**: Fix once in factory, all templates benefit

### **Testing**:
**BEFORE**: Test each template generator separately  
**AFTER**: Test factories once, templates are just data

### **Safety**:
**BEFORE**: No backup, no dry-run, silent overwrites  
**AFTER**: Backups, dry-run mode, change detection, confirmations

---

## 📈 **SCALABILITY**

### **Current Approach** (Imperative):
```
Template 1:  700 lines
Template 2:  500 lines  
Template 3:  800 lines
...
Template 20: 600 lines
─────────────────────
Total: ~12,000+ lines of mostly duplicated code
```

### **Factory Approach** (Declarative):
```
Factories:    600 lines (once)
Template 1:   150 lines (config)
Template 2:   100 lines (config)
Template 3:   120 lines (config)
...
Template 20:  110 lines (config)
─────────────────────
Total: ~2,700 lines (77% reduction!)
```

---

## 🎯 **NEXT STEPS**

### **Immediate** (Ready to implement):
1. ✅ **template-builder.ts created** (600 lines - all factories)
2. Test the factories with blog template
3. Convert blog to declarative definition
4. Verify output matches old generator
5. Migrate chatbot
6. Delete old code

### **Future** (After migration):
- Add 10-20 more templates easily
- E-commerce definition (~120 lines)
- Dashboard definition (~100 lines)
- CRM definition (~150 lines)
- Portfolio definition (~80 lines)
- Documentation definition (~90 lines)

**Total effort per template**: ~2-3 hours vs. ~2-3 days

---

## ✅ **READY TO IMPLEMENT**

The factory system is **designed and ready**. Next steps:
1. Test the factories
2. Migrate one template (blog) as POC
3. Verify E2E tests pass
4. Migrate remaining templates
5. Delete old code

**Expected outcome**: **85% code reduction + infinite scalability**

🚀 **Ready to proceed with implementation?**

