# 🔍 System Checklist Page - Design Document

**Feature:** Auto-generated health check & validation dashboard

---

## 🎯 Purpose

Generate a visual **system checklist page** that validates all generated components and provides instant feedback on system health.

**Value:**
- ✅ Instant validation after generation
- ✅ Visual confirmation everything works
- ✅ Interactive testing capabilities
- ✅ Onboarding tool for new developers
- ✅ Quick troubleshooting reference

---

## 📍 Where to Add in Pipeline

### Generation Phase
```typescript
// packages/gen/src/code-generator.ts

export function generateCode(schema: ParsedSchema, config: CodeGeneratorConfig) {
  // ... existing generation ...
  
  // PHASE 5: Generate System Checklist (NEW!)
  if (config.generateChecklist !== false) {  // Default: true
    const checklistPage = generateChecklistPage(schema, files, config)
    files.checklist = checklistPage
  }
  
  return files
}
```

### File Output
```
generated/[project]/
├── src/
│   ├── registry/          # Generated code
│   ├── controllers/
│   ├── services/
│   └── checklist/         # NEW!
│       ├── checklist.html # Standalone HTML page
│       ├── checklist.ts   # API endpoints
│       └── tests.ts       # System tests
└── public/
    └── checklist.html     # Copy for easy access
```

---

## 🎨 UI Design

### Layout
```
╔════════════════════════════════════════════════════╗
║  🚀 System Checklist - [Project Name]             ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  Generated: 2025-11-06 05:10:23                   ║
║  Models: 24 | Routes: 120 | Mode: Registry        ║
║                                                    ║
╠════════════════════════════════════════════════════╣
║  System Health                                     ║
║  ✅ Database Connection      Connected (15ms)     ║
║  ✅ Redis Cache             Connected (5ms)       ║
║  ✅ Environment Variables   All present (12/12)   ║
║  ⚠️  File Permissions       Some files readonly   ║
╠════════════════════════════════════════════════════╣
║  Generated Code                                    ║
║  ✅ Registry Files          6 files, 2,323 lines  ║
║  ✅ Services                24 services generated  ║
║  ✅ Controllers             24 controllers ready   ║
║  ✅ Routes                  120 endpoints          ║
║  ✅ Validators              72 schemas             ║
╠════════════════════════════════════════════════════╣
║  API Endpoints                                     ║
║  ✅ GET  /api/users         200 OK (12ms)         ║
║  ✅ POST /api/users         201 Created (45ms)    ║
║  ✅ GET  /api/posts         200 OK (8ms)          ║
║  ✅ POST /api/posts         201 Created (32ms)    ║
║  ... (show first 10, "View All" button)           ║
╠════════════════════════════════════════════════════╣
║  Models & Relationships                            ║
║  ✅ User       (3 relations)  [Test CRUD]         ║
║  ✅ Post       (2 relations)  [Test CRUD]         ║
║  ✅ Comment    (2 relations)  [Test CRUD]         ║
║  ... (expandable list)                             ║
╠════════════════════════════════════════════════════╣
║  Advanced Features                                 ║
║  ✅ Middleware             Auth, Rate-limit ✓     ║
║  ✅ Permissions            RBAC configured         ║
║  ✅ Caching                Redis active            ║
║  ✅ Events                 3 handlers registered   ║
║  ✅ Search                 Full-text enabled       ║
╠════════════════════════════════════════════════════╣
║  [Run All Tests] [Export Report] [Documentation]  ║
╚════════════════════════════════════════════════════╝
```

---

## ✅ Checks to Include

### 1. **Environment & Infrastructure**
```typescript
const checks = {
  environment: {
    'Database Connection': async () => {
      const start = Date.now()
      await prisma.$connect()
      return { status: 'success', time: Date.now() - start }
    },
    'Redis Cache': async () => {
      if (!redis) return { status: 'skip', message: 'Not configured' }
      await redis.ping()
      return { status: 'success' }
    },
    'Environment Variables': () => {
      const required = ['DATABASE_URL', 'PORT', 'NODE_ENV']
      const missing = required.filter(v => !process.env[v])
      return {
        status: missing.length ? 'warning' : 'success',
        message: `${required.length - missing.length}/${required.length} present`,
        missing
      }
    },
    'File Permissions': async () => {
      // Check if generated files are writable
      const files = ['src/registry/models.registry.ts', 'src/app.ts']
      const results = await Promise.all(
        files.map(async f => ({
          file: f,
          writable: await checkWritable(f)
        }))
      )
      return { status: 'success', results }
    }
  }
}
```

### 2. **Generated Code Validation**
```typescript
const checks = {
  codeGeneration: {
    'Registry Files': () => {
      const files = glob('src/registry/*.ts')
      const lines = files.reduce((sum, f) => sum + countLines(f), 0)
      return {
        status: 'success',
        files: files.length,
        lines,
        message: `${files.length} files, ${lines} lines`
      }
    },
    'Services Generated': () => {
      const services = Object.keys(services)
      return {
        status: 'success',
        count: services.length,
        list: services
      }
    },
    'Routes Registered': () => {
      const routes = app._router.stack
        .filter(r => r.route)
        .map(r => ({ method: Object.keys(r.route.methods)[0], path: r.route.path }))
      return {
        status: 'success',
        count: routes.length,
        routes
      }
    },
    'TypeScript Compilation': async () => {
      try {
        await exec('tsc --noEmit')
        return { status: 'success', message: 'No type errors' }
      } catch (e) {
        return { status: 'error', message: e.message }
      }
    }
  }
}
```

### 3. **API Endpoint Testing**
```typescript
const checks = {
  apiEndpoints: {
    'Test CRUD Operations': async () => {
      const results = []
      
      for (const model of models) {
        const modelLower = model.name.toLowerCase()
        
        // Test GET (list)
        const list = await fetch(`http://localhost:${PORT}/api/${modelLower}`)
        results.push({
          endpoint: `GET /api/${modelLower}`,
          status: list.status,
          time: list.headers.get('x-response-time')
        })
        
        // Test POST (create) - if not junction table
        if (!isJunctionTable(model)) {
          const create = await fetch(`http://localhost:${PORT}/api/${modelLower}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(generateTestData(model))
          })
          results.push({
            endpoint: `POST /api/${modelLower}`,
            status: create.status,
            time: create.headers.get('x-response-time')
          })
        }
      }
      
      return { status: 'success', results }
    }
  }
}
```

### 4. **Model & Relationship Validation**
```typescript
const checks = {
  models: {
    'Validate Relationships': async () => {
      const results = []
      
      for (const model of models) {
        const relations = model.relationFields
        const checks = []
        
        for (const rel of relations) {
          // Try to fetch with include
          const result = await prisma[model.name.toLowerCase()].findFirst({
            include: { [rel.name]: true }
          })
          checks.push({
            relation: rel.name,
            type: rel.relationType,
            working: !!result
          })
        }
        
        results.push({
          model: model.name,
          relations: relations.length,
          checks
        })
      }
      
      return { status: 'success', results }
    }
  }
}
```

### 5. **Advanced Features Testing**
```typescript
const checks = {
  advancedFeatures: {
    'Middleware Active': () => {
      const middlewareCount = {
        auth: countMiddleware('auth'),
        rateLimit: countMiddleware('rateLimit'),
        logging: countMiddleware('logging')
      }
      return { status: 'success', middleware: middlewareCount }
    },
    'Permissions Configured': () => {
      const models = Object.keys(modelsRegistry)
      const withPermissions = models.filter(m => 
        modelsRegistry[m].permissions
      )
      return {
        status: 'success',
        count: withPermissions.length,
        models: withPermissions
      }
    },
    'Caching Enabled': async () => {
      if (!cache) return { status: 'skip' }
      
      // Test cache
      await cache.set('test', 'value')
      const value = await cache.get('test')
      
      return {
        status: value === 'value' ? 'success' : 'error',
        message: 'Cache operational'
      }
    },
    'Event Handlers': () => {
      const handlers = eventBus.getHandlers()
      return {
        status: 'success',
        count: handlers.length,
        events: handlers.map(h => h.event)
      }
    },
    'Search Configured': () => {
      const models = Object.keys(modelsRegistry)
      const withSearch = models.filter(m => 
        modelsRegistry[m].search?.fullTextFields?.length
      )
      return {
        status: 'success',
        count: withSearch.length,
        models: withSearch
      }
    }
  }
}
```

### 6. **Performance Metrics**
```typescript
const checks = {
  performance: {
    'Query Performance': async () => {
      const tests = []
      
      for (const model of models.slice(0, 5)) {  // Test first 5
        const start = Date.now()
        await prisma[model.name.toLowerCase()].findMany({ take: 10 })
        const time = Date.now() - start
        
        tests.push({
          model: model.name,
          operation: 'findMany',
          time,
          status: time < 100 ? 'good' : time < 500 ? 'ok' : 'slow'
        })
      }
      
      return { status: 'success', tests }
    },
    'Memory Usage': () => {
      const usage = process.memoryUsage()
      return {
        status: 'success',
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(usage.rss / 1024 / 1024)}MB`
      }
    }
  }
}
```

---

## 🎨 Interactive Features

### 1. **Test Individual Models**
```html
<button onclick="testModel('user')">Test User CRUD</button>

<!-- Shows modal with results -->
<div id="test-results">
  ✅ CREATE: Created user #123 (45ms)
  ✅ READ: Fetched user #123 (12ms)
  ✅ UPDATE: Updated user #123 (38ms)
  ✅ DELETE: Deleted user #123 (21ms)
</div>
```

### 2. **Live API Testing**
```html
<div class="api-tester">
  <select id="endpoint">
    <option value="GET /api/users">GET /api/users</option>
    <option value="POST /api/users">POST /api/users</option>
  </select>
  
  <textarea id="request-body">{}</textarea>
  
  <button onclick="testEndpoint()">Send Request</button>
  
  <pre id="response"></pre>
</div>
```

### 3. **Export Report**
```typescript
function exportReport() {
  const report = {
    timestamp: new Date().toISOString(),
    project: config.projectName,
    checks: allCheckResults,
    summary: {
      total: checks.length,
      passed: checks.filter(c => c.status === 'success').length,
      failed: checks.filter(c => c.status === 'error').length,
      warnings: checks.filter(c => c.status === 'warning').length
    }
  }
  
  // Download as JSON or PDF
  downloadReport(report, 'json')  // or 'pdf', 'html'
}
```

---

## 📊 Status Icons & Colors

```css
.status-success { color: #22c55e; }  /* Green checkmark */
.status-warning { color: #f59e0b; }  /* Yellow warning */
.status-error   { color: #ef4444; }  /* Red X */
.status-skip    { color: #94a3b8; }  /* Gray dash */
.status-loading { color: #3b82f6; }  /* Blue spinner */
```

**Icons:**
- ✅ Success
- ⚠️ Warning
- ❌ Error
- ⏭️ Skipped
- 🔄 Running
- ⏱️ Slow

---

## 🔧 Configuration

### Enable/Disable
```typescript
// code-generator.config.ts
export default {
  generateChecklist: true,  // Generate checklist page
  checklistConfig: {
    // What to include
    includeEnvironmentChecks: true,
    includeCodeValidation: true,
    includeAPITesting: true,
    includePerformanceMetrics: true,
    
    // Auto-run on generation
    autoRunOnGenerate: false,
    
    // Where to mount
    route: '/checklist',
    
    // Security
    requireAuth: false,  // Set true for production
    allowedIPs: [],      // Restrict access
    
    // Output
    generateHTML: true,
    generateAPI: true,
    includeInteractiveTests: true
  }
}
```

---

## 📁 Generated Files

### 1. `src/checklist/checklist.html`
Standalone HTML page (no dependencies) with:
- All checks embedded
- Inline CSS/JS
- Works without server
- Can open directly in browser

### 2. `src/checklist/checklist.ts`
API endpoints for checks:
```typescript
// GET /api/checklist
export const getChecklist = async (req, res) => {
  const results = await runAllChecks()
  res.json(results)
}

// GET /api/checklist/:checkName
export const runCheck = async (req, res) => {
  const result = await runSingleCheck(req.params.checkName)
  res.json(result)
}

// POST /api/checklist/test/:model
export const testModel = async (req, res) => {
  const result = await testModelCRUD(req.params.model)
  res.json(result)
}
```

### 3. `src/checklist/tests.ts`
System test suite:
```typescript
export const systemTests = {
  environment: [
    // Environment tests
  ],
  generation: [
    // Code generation tests
  ],
  api: [
    // API endpoint tests
  ],
  performance: [
    // Performance tests
  ]
}
```

---

## 🎯 Usage Flow

### After Generation
```bash
# 1. Generate project
pnpm gen --schema schema.prisma

# 2. Start server
npm run dev

# 3. Open checklist
open http://localhost:3000/checklist
# or
open generated/project/public/checklist.html

# 4. See instant feedback
✅ 45/48 checks passed
⚠️ 3 warnings
❌ 0 errors

# 5. Click "Run All Tests" for deep validation
```

### In CI/CD
```yaml
# .github/workflows/test.yml
- name: Generate code
  run: pnpm gen

- name: Run checklist tests
  run: npm run checklist:test

- name: Export report
  run: npm run checklist:export report.json
```

---

## 💡 Value Propositions

### For Developers
1. **Instant Validation** - Know immediately if generation worked
2. **Visual Feedback** - See what was generated
3. **Quick Testing** - Test endpoints without Postman
4. **Troubleshooting** - Identify issues fast
5. **Onboarding** - New devs understand system quickly

### For Teams
1. **Quality Assurance** - Automated validation
2. **Documentation** - Self-documenting system
3. **CI/CD Integration** - Automated checks
4. **Confidence** - Deploy with confidence

### For Learning
1. **Educational** - See what was generated
2. **Interactive** - Test features live
3. **Comprehensive** - Understand full system

---

## 🚀 Implementation Priority

### Phase 1 (MVP)
- [x] Basic HTML page structure
- [ ] Environment checks
- [ ] Code validation
- [ ] Simple API endpoint listing
- [ ] Export HTML report

### Phase 2 (Enhanced)
- [ ] Interactive API testing
- [ ] Model CRUD testing
- [ ] Performance metrics
- [ ] Live status updates

### Phase 3 (Advanced)
- [ ] CI/CD integration
- [ ] Historical reports
- [ ] Comparison with previous runs
- [ ] Advanced analytics

---

## 📋 Next Steps

1. **Create generator** - `packages/gen/src/generators/checklist-generator.ts`
2. **Add to pipeline** - Integrate in `code-generator.ts`
3. **Build UI template** - Create HTML template
4. **Add tests** - Implement check functions
5. **Document** - Add to user docs

---

**Questions to Discuss:**
1. Should checklist be generated by default or opt-in?
2. Should it work offline (static HTML) or require server?
3. What security considerations for production?
4. Which checks are most valuable?
5. Should it include model data seeding?

---

**This feature would make SSOT the most developer-friendly code generator! 🎯**

