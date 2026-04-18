# Bulk Website Generation Guide

**Complete guide to generating multiple websites at scale**

---

## 🎯 Overview

Bulk website generation allows you to generate multiple websites from a single configuration file. This is ideal for:

- **Multi-client projects** - Generate customized websites for different clients
- **Template variations** - Create multiple versions of the same website type
- **A/B testing** - Generate variations for testing
- **White-label solutions** - Create branded versions from the same base

---

## 📁 Directory Structure

```
websites/
├── schemas/                    # Website type definitions
│   ├── blog/
│   │   ├── schema.prisma      # Data models
│   │   └── ui.config.ts       # UI configuration
│   ├── ecommerce/
│   │   ├── schema.prisma
│   │   └── ui.config.ts
│   └── dashboard/
│       ├── schema.prisma
│       └── ui.config.ts
│
├── schematics/                # Reusable templates (future)
│   ├── layouts/
│   ├── pages/
│   ├── components/
│   └── themes/
│
├── projects/                  # Generated websites
│   ├── client-a-blog/
│   ├── client-b-store/
│   └── client-c-dashboard/
│
└── config/
    └── bulk-generate.json     # Bulk generation configuration
```

---

## 🚀 Quick Start

### 1. Create Website Schema

Create a schema directory with Prisma schema and UI config:

```bash
mkdir -p websites/schemas/my-blog
```

**`websites/schemas/my-blog/schema.prisma`:**
```prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text
  published Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

**`websites/schemas/my-blog/ui.config.ts`:**
```typescript
import type { UiConfig } from '@ssot-codegen/gen'

export default {
  site: { name: 'My Blog' },
  theme: { colors: { primary: '#2563eb' } },
  generation: {
    crudPages: { enabled: true, models: ['Post'] }
  }
} satisfies UiConfig
```

---

### 2. Configure Bulk Generation

Edit `websites/config/bulk-generate.json`:

```json
{
  "projects": [
    {
      "id": "blog-1",
      "name": "Client A Blog",
      "schema": "websites/schemas/my-blog/schema.prisma",
      "outputDir": "websites/projects/blog-1",
      "customizations": {
        "site": {
          "name": "Client A Blog",
          "title": "Welcome to Client A"
        },
        "theme": {
          "colors": {
            "primary": "#dc2626"
          }
        }
      }
    },
    {
      "id": "blog-2",
      "name": "Client B Blog",
      "schema": "websites/schemas/my-blog/schema.prisma",
      "outputDir": "websites/projects/blog-2",
      "customizations": {
        "site": {
          "name": "Client B Blog"
        }
      }
    }
  ],
  "options": {
    "parallel": true,
    "validate": true,
    "verbose": true
  }
}
```

---

### 3. Generate Websites

```bash
# Build CLI first (if not already built)
pnpm build

# Generate all projects
pnpm ssot bulk

# Use custom config file
pnpm ssot bulk --config websites/config/my-config.json

# Preview without writing files
pnpm ssot bulk --dry-run

# Generate sequentially (not parallel)
pnpm ssot bulk --no-parallel

# Or run CLI directly
node packages/cli/dist/cli.js bulk --config websites/config/bulk-generate.json
```

**Note:** The CLI package (`@ssot-codegen/cli`) is not published to npm, so use `pnpm ssot` (workspace script) instead of `pnpm ssot`.

---

## 📋 Configuration Reference

### Bulk Generation Config (`bulk-generate.json`)

```typescript
interface BulkGenerateConfig {
  projects: ProjectConfig[]
  options?: BulkGenerateOptions
}

interface ProjectConfig {
  id: string                    // Unique project identifier
  name: string                  // Human-readable name
  schema: string                // Path to schema.prisma
  outputDir: string             // Output directory
  customizations?: {            // Override base config
    site?: Partial<SiteSettings>
    theme?: Partial<ThemeSettings>
    navigation?: Partial<NavigationSettings>
    pages?: PageConfig[]
    components?: ComponentConfig
  }
  schematics?: {                // Reusable templates (future)
    layout?: string
    pages?: string[]
    theme?: string
  }
}

interface BulkGenerateOptions {
  parallel?: boolean           // Generate in parallel (default: true)
  skipExisting?: boolean       // Skip existing projects (default: false)
  validate?: boolean           // Validate before generation (default: true)
  continueOnError?: boolean    // Continue on errors (default: false)
  verbose?: boolean            // Verbose output (default: false)
}
```

---

## 🎨 Customization Examples

### Example 1: Theme Customization

```json
{
  "id": "client-red",
  "name": "Client Red",
  "schema": "websites/schemas/blog/schema.prisma",
  "outputDir": "websites/projects/client-red",
  "customizations": {
    "theme": {
      "colors": {
        "primary": "#dc2626",
        "secondary": "#991b1b"
      },
      "darkMode": false
    }
  }
}
```

### Example 2: Site Settings

```json
{
  "id": "client-branded",
  "name": "Client Branded",
  "schema": "websites/schemas/blog/schema.prisma",
  "outputDir": "websites/projects/client-branded",
  "customizations": {
    "site": {
      "name": "Client Branded Blog",
      "title": "Welcome to Client Branded",
      "description": "Custom description",
      "logo": "/logo.png"
    }
  }
}
```

### Example 3: Navigation Customization

```json
{
  "id": "client-nav",
  "name": "Client Navigation",
  "schema": "websites/schemas/blog/schema.prisma",
  "outputDir": "websites/projects/client-nav",
  "customizations": {
    "navigation": {
      "header": {
        "links": [
          { "label": "Home", "href": "/" },
          { "label": "Blog", "href": "/blog" },
          { "label": "About", "href": "/about" }
        ]
      }
    }
  }
}
```

### Example 4: Page Customization

```json
{
  "id": "client-pages",
  "name": "Client Pages",
  "schema": "websites/schemas/blog/schema.prisma",
  "outputDir": "websites/projects/client-pages",
  "customizations": {
    "pages": [
      {
        "path": "home",
        "type": "landing",
        "layout": "landing",
        "title": "Custom Home",
        "sections": [
          {
            "type": "hero",
            "config": {
              "title": "Welcome to Client",
              "subtitle": "Custom subtitle"
            }
          }
        ]
      }
    ]
  }
}
```

---

## 🔄 Workflow

### Standard Workflow

1. **Define Base Schema**
   ```bash
   # Create schema directory
   mkdir -p websites/schemas/my-type
   
   # Add schema.prisma
   # Add ui.config.ts
   ```

2. **Test Single Generation**
   ```bash
   pnpm ssot ui \
     --schema websites/schemas/my-type/schema.prisma \
     --config websites/schemas/my-type/ui.config.ts \
     --output websites/projects/test
   ```

3. **Add to Bulk Config**
   ```json
   {
     "projects": [
       {
         "id": "my-project",
         "name": "My Project",
         "schema": "websites/schemas/my-type/schema.prisma",
         "outputDir": "websites/projects/my-project"
       }
     ]
   }
   ```

4. **Generate Bulk**
   ```bash
   pnpm ssot bulk
   ```

---

### Advanced Workflow: Multi-Client

1. **Create Base Schema**
   - Define common data models
   - Set default UI configuration

2. **Create Client Configs**
   ```json
   {
     "projects": [
       {
         "id": "client-a",
         "name": "Client A",
         "schema": "websites/schemas/blog/schema.prisma",
         "outputDir": "websites/projects/client-a",
         "customizations": {
           "site": { "name": "Client A Blog" },
           "theme": { "colors": { "primary": "#client-a-color" } }
         }
       },
       {
         "id": "client-b",
         "name": "Client B",
         "schema": "websites/schemas/blog/schema.prisma",
         "outputDir": "websites/projects/client-b",
         "customizations": {
           "site": { "name": "Client B Blog" },
           "theme": { "colors": { "primary": "#client-b-color" } }
         }
       }
     ]
   }
   ```

3. **Generate All Clients**
   ```bash
   pnpm ssot bulk --config websites/config/clients.json
   ```

---

## 🛠️ CLI Commands

### `pnpm ssot bulk`

Generate multiple websites from bulk configuration.

**Options:**
- `-c, --config <path>` - Path to bulk config (default: `websites/config/bulk-generate.json`)
- `--dry-run` - Preview without writing files
- `--parallel` - Generate in parallel (default: true)
- `--no-parallel` - Generate sequentially

**Examples:**
```bash
# Basic usage
pnpm ssot bulk

# Custom config
pnpm ssot bulk --config my-config.json

# Preview
pnpm ssot bulk --dry-run

# Sequential generation
pnpm ssot bulk --no-parallel
```

---

### `pnpm ssot bulk init`

Initialize bulk generation structure (future).

```bash
pnpm ssot bulk init
```

Creates:
- `websites/schemas/`
- `websites/schematics/`
- `websites/projects/`
- `websites/config/bulk-generate.json`

---

## 📊 Output Structure

Each generated project follows this structure:

```
websites/projects/{project-id}/
├── src/
│   ├── app/                  # Generated pages
│   │   ├── home/
│   │   ├── dashboard/
│   │   └── admin/
│   ├── components/           # Generated components
│   │   ├── ssot/
│   │   └── layouts/
│   ├── hooks/                # Hook adapters
│   │   ├── {model}-adapter.ts
│   │   ├── index.ts
│   │   └── registry.ts
│   └── config/               # Configuration
│       └── theme.ts
├── schema.prisma             # Copied schema
└── package.json              # Generated package.json
```

---

## 🔍 How It Works

### Generation Process

1. **Load Configuration**
   - Read `bulk-generate.json`
   - Validate structure
   - Load project configs

2. **For Each Project:**
   - Parse Prisma schema
   - Load UI configuration
   - Apply customizations
   - Generate UI components
   - Generate pages
   - Generate hook adapters
   - Write files to output directory

3. **Parallel vs Sequential**
   - **Parallel**: All projects generate simultaneously (faster)
   - **Sequential**: One project at a time (safer, better error handling)

### Customization Merging

Customizations are merged with base config:

```typescript
// Base config
{
  site: { name: 'Blog' },
  theme: { colors: { primary: '#2563eb' } }
}

// Customization
{
  site: { name: 'Client Blog' },
  theme: { colors: { primary: '#dc2626' } }
}

// Result
{
  site: { name: 'Client Blog' },
  theme: { colors: { primary: '#dc2626' } }
}
```

---

## ✅ Best Practices

### 1. Schema Organization

- ✅ One schema per website type
- ✅ Keep schemas generic and reusable
- ✅ Use customizations for client-specific changes
- ✅ Document schema purpose in comments

### 2. Configuration Management

- ✅ Use TypeScript for type safety (`ui.config.ts`)
- ✅ Keep base configs minimal
- ✅ Use customizations for variations
- ✅ Version control all configs

### 3. Output Management

- ✅ Use descriptive project IDs
- ✅ Organize output by client/project
- ✅ Keep generated code separate from source
- ✅ Use `.gitignore` for generated projects

### 4. Testing

- ✅ Test single generation first
- ✅ Use `--dry-run` to preview
- ✅ Validate configs before bulk generation
- ✅ Test customizations incrementally

---

## 🐛 Troubleshooting

### Common Issues

**1. Schema Not Found**
```
Error: Could not read schema file
```
**Solution:** Check schema path is relative to project root or absolute.

**2. UI Config Not Found**
```
Warning: UI config not found, using defaults
```
**Solution:** Create `ui.config.ts` in schema directory or check path.

**3. Customization Not Applied**
```
Customization not working
```
**Solution:** Verify customization structure matches `UiConfig` type.

**4. Parallel Generation Errors**
```
Error during parallel generation
```
**Solution:** Use `--no-parallel` for sequential generation and better error messages.

---

## 📚 Related Documentation

- **Schema Structure:** `docs/WEBSITE_SCHEMA_STRUCTURE.md`
- **Quick Guide:** `docs/WEBSITE_SCHEMA_GUIDE.md`
- **UI Configuration:** `docs/UI_CONFIGURATION_GUIDE.md`
- **Hook Adapters:** `docs/HOOK_ADAPTER_STRATEGY.md`

---

## 🎯 Use Cases

### Use Case 1: Multi-Client Blog Platform

Generate customized blogs for multiple clients:

```json
{
  "projects": [
    {
      "id": "client-a-blog",
      "schema": "websites/schemas/blog/schema.prisma",
      "customizations": {
        "site": { "name": "Client A Blog" },
        "theme": { "colors": { "primary": "#client-a-brand" } }
      }
    },
    {
      "id": "client-b-blog",
      "schema": "websites/schemas/blog/schema.prisma",
      "customizations": {
        "site": { "name": "Client B Blog" },
        "theme": { "colors": { "primary": "#client-b-brand" } }
      }
    }
  ]
}
```

### Use Case 2: Template Variations

Create multiple variations of the same template:

```json
{
  "projects": [
    {
      "id": "blog-light",
      "schema": "websites/schemas/blog/schema.prisma",
      "customizations": {
        "theme": { "darkMode": false }
      }
    },
    {
      "id": "blog-dark",
      "schema": "websites/schemas/blog/schema.prisma",
      "customizations": {
        "theme": { "darkMode": true }
      }
    }
  ]
}
```

### Use Case 3: Environment-Specific Generation

Generate different versions for dev/staging/prod:

```json
{
  "projects": [
    {
      "id": "blog-dev",
      "schema": "websites/schemas/blog/schema.prisma",
      "outputDir": "websites/projects/blog-dev",
      "customizations": {
        "site": { "name": "Blog (Dev)" }
      }
    },
    {
      "id": "blog-prod",
      "schema": "websites/schemas/blog/schema.prisma",
      "outputDir": "websites/projects/blog-prod",
      "customizations": {
        "site": { "name": "Blog (Production)" }
      }
    }
  ]
}
```

---

## 🚀 Next Steps

1. **Create Your First Schema**
   - Start with `websites/schemas/blog/`
   - Customize `ui.config.ts`
   - Test single generation

2. **Set Up Bulk Config**
   - Create `websites/config/bulk-generate.json`
   - Add your projects
   - Test with `--dry-run`

3. **Generate Websites**
   - Run `pnpm ssot bulk`
   - Review generated output
   - Customize as needed

4. **Iterate**
   - Refine schemas
   - Add more projects
   - Optimize customizations

---

## ⚙️ Implementation Notes & Improvements

**Current implementation status and planned enhancements**

---

### 1. Config Handling

**Current:** Basic JSON config loading

**Improvements:**
- ✅ Validate schema and output paths before launching any parallel jobs
- ✅ Support both `.json` and `.ts` configs to allow typed imports for complex logic
- ✅ Add a checksum or manifest (`.ssot/bulk-manifest.json`) for repeatable builds and detecting drift

**Example:**
```typescript
// websites/configs/clients/client-a.ts
import type { BulkGenerateConfig } from '@ssot-codegen/gen'

export default {
  projects: [
    {
      id: 'client-a-blog',
      name: 'Client A Blog',
      schema: '../../schemas/blog/schema.prisma',
      outputDir: '../../projects/client-a-blog',
      customizations: {
        site: { name: 'Client A Blog' }
      }
    }
  ]
} satisfies BulkGenerateConfig
```

---

### 2. Parallel Generation

**Current:** Full parallel execution with `Promise.allSettled`

**Improvements:**
- ✅ Limit concurrency (use `p-limit` or a pool) instead of full parallel spawn for memory safety
- ✅ Stream logs tagged by project ID for readable console output
- ✅ Add progress indicators for long-running generations

**Example:**
```bash
[client-a-blog] 📦 Generating project: Client A Blog
[client-b-store] 📦 Generating project: Client B Store
[client-a-blog] ✅ Generated 45 files
[client-b-store] ✅ Generated 52 files
```

---

### 3. Schema / UI Sync

**Current:** Basic schema and UI config loading

**Improvements:**
- ✅ Ensure UI config path auto-detection: if no explicit `ui.config.ts` next to schema, default to base template
- ✅ Validate that models referenced in `crudPages.models` exist in schema
- ✅ Warn on missing models or invalid references
- ✅ Auto-generate minimal UI config if missing

**Example:**
```typescript
// Auto-detection logic
const uiConfigPath = config.uiConfigPath || 
  resolve(dirname(schemaPath), 'ui.config.ts')

if (!existsSync(uiConfigPath)) {
  console.warn(`⚠️  UI config not found, using defaults`)
  uiConfig = createDefaultUiConfig(schema)
}
```

---

### 4. Customization Merge Logic

**Current:** Shallow merge of customizations

**Improvements:**
- ✅ Implement a deep merge that preserves arrays (override, not concatenate, for predictable behavior)
- ✅ Resolve theme tokens (like color aliases) before write
- ✅ Validate customization structure against `UiConfig` type
- ✅ Support nested overrides (e.g., `theme.colors.primary`)

**Example:**
```typescript
// Deep merge with array override
function deepMerge(base: any, override: any): any {
  if (Array.isArray(override)) return override // Override arrays
  if (typeof override !== 'object' || override === null) return override
  if (typeof base !== 'object' || base === null) return override
  
  const result = { ...base }
  for (const key in override) {
    result[key] = deepMerge(base[key], override[key])
  }
  return result
}
```

---

### 5. Error Recovery

**Current:** Basic error handling with `continueOnError` option

**Improvements:**
- ✅ If one project fails in parallel mode:
  - Log clean summary per project
  - Optionally re-run only failed ones (`--retry-failed` future flag)
- ✅ Collect all errors and report at end
- ✅ Generate error report file (`bulk-errors.json`)

**Example:**
```bash
# After failed generation
pnpm ssot bulk --retry-failed

# Retries only projects that failed:
# - client-a-blog (schema parse error)
# - client-c-dashboard (UI config error)
```

---

### 6. Output Management

**Current:** Basic file writing

**Improvements:**
- ✅ Always include `.ssot.json` manifest inside each generated site:
  ```json
  {
    "projectId": "client-a-blog",
    "schema": "../../schemas/blog/schema.prisma",
    "generatedAt": "2024-01-15T10:30:00Z",
    "checksum": "abc123...",
    "version": "1.0.0"
  }
  ```
- ✅ Optionally emit `bulk-report.txt` summarizing all generated sites
- ✅ Track generation metadata (files count, size, duration)

**Example:**
```
Bulk Generation Report
=====================
Generated: 2024-01-15 10:30:00
Projects: 3
Total Files: 142
Total Size: 2.3 MB

Projects:
  ✅ client-a-blog (45 files, 0.8 MB)
  ✅ client-b-store (52 files, 1.1 MB)
  ✅ client-c-dashboard (45 files, 0.4 MB)
```

---

### 7. CLI Enhancements

**Current:** Basic `bulk` command

**Planned Subcommands:**

#### `bulk diff`
Compare current vs regenerated output (detect drift)

```bash
pnpm ssot bulk diff --config websites/config/bulk-generate.json
```

**Output:**
```
Comparing generated projects...
  client-a-blog: No changes
  client-b-store: 3 files changed
    - src/app/home/page.tsx (modified)
    - src/components/Header.tsx (modified)
    - src/config/theme.ts (modified)
```

#### `bulk clean`
Remove all generated projects safely

```bash
pnpm ssot bulk clean --config websites/config/bulk-generate.json
# Prompts for confirmation
# Removes only projects listed in config
```

#### `bulk validate`
Schema + config dry validation only

```bash
pnpm ssot bulk validate --config websites/config/bulk-generate.json
```

**Output:**
```
Validating bulk configuration...
  ✅ Schema paths valid
  ✅ UI configs found
  ✅ Output directories writable
  ✅ Models referenced exist in schemas
  ✅ Customizations valid
```

---

### 8. Future Hooks

**Planned:** Post-generation hooks for programmatic post-processing

**Example:**
```json
{
  "projects": [
    {
      "id": "client-a-blog",
      "schema": "...",
      "outputDir": "...",
      "hooks": {
        "postGenerate": [
          "git add .",
          "git commit -m 'Generated client-a-blog'",
          "npm run deploy"
        ]
      }
    }
  ]
}
```

**Or programmatic:**
```typescript
// websites/configs/hooks.ts
export async function postGenerate(projectId: string, outputDir: string) {
  // Custom logic
  await gitCommit(outputDir)
  await deploy(outputDir)
}
```

---

### 9. Testing

**Current:** Manual testing

**Planned:**
- ✅ Unit-test merging and file write paths with temporary directories
- ✅ Validate schema parsing + UI generation for at least one sample per schema type
- ✅ Integration tests for bulk generation pipeline
- ✅ Snapshot testing for generated output

**Example:**
```typescript
describe('Bulk Generation', () => {
  it('should merge customizations correctly', () => {
    const base = { theme: { colors: { primary: '#000' } } }
    const custom = { theme: { colors: { primary: '#fff' } } }
    expect(deepMerge(base, custom)).toEqual({
      theme: { colors: { primary: '#fff' } }
    })
  })
  
  it('should generate all projects', async () => {
    const config = loadBulkConfig('test-config.json')
    const results = await generateBulkWebsites(config)
    expect(results.size).toBe(config.projects.length)
  })
})
```

---

## 🧩 Next Logical Extensions

**Future enhancements and architectural improvements**

---

### 1. Schematics System

**JSON/YAML-driven component templates** for partial overrides

**Purpose:** Reusable templates for layouts, themes, components

**Structure:**
```
websites/schematics/
├── layouts/
│   ├── admin-dashboard.json
│   └── marketing-site.json
├── pages/
│   ├── blog-home.json
│   └── product-catalog.json
├── components/
│   ├── hero-sections.json
│   └── pricing-tables.json
└── themes/
    ├── modern-blue.json
    └── dark-minimal.json
```

**Usage:**
```json
{
  "id": "client-a-blog",
  "schema": "...",
  "schematics": {
    "layout": "admin-dashboard",
    "pages": ["blog-home"],
    "theme": "modern-blue"
  }
}
```

---

### 2. Manifest Linking

**Store references** between generated projects and their base schemas for update propagation

**Purpose:** Track dependencies and enable incremental updates

**Example:**
```json
// .ssot/manifest.json in generated project
{
  "projectId": "client-a-blog",
  "baseSchema": "../../schemas/blog/schema.prisma",
  "baseConfig": "../../schemas/blog/ui.config.ts",
  "customizations": { ... },
  "generatedAt": "2024-01-15T10:30:00Z",
  "schemaHash": "abc123...",
  "configHash": "def456..."
}
```

**Benefits:**
- Detect when base schema changes
- Regenerate only affected projects
- Track customization history

---

### 3. Diff-Based Regeneration

**Regenerate only changed files** per schema/config hash

**Purpose:** Faster regeneration by skipping unchanged files

**Process:**
1. Calculate hash of schema + config + customizations
2. Compare with previous hash (from manifest)
3. Regenerate only if hash changed
4. Use file-level diffing for partial regeneration

**Example:**
```bash
pnpm ssot bulk --incremental
# Only regenerates projects with changed schemas/configs
```

---

### 4. Remote Mode

**Accept remote schemas/configs** via URL or Git repo

**Purpose:** Share schemas across teams or organizations

**Example:**
```json
{
  "projects": [
    {
      "id": "remote-blog",
      "schema": "https://example.com/schemas/blog.prisma",
      "uiConfig": "git+https://github.com/org/schemas#blog/ui.config.ts"
    }
  ]
}
```

**Features:**
- Support HTTP/HTTPS URLs
- Support Git repositories (with branch/tag)
- Cache remote resources locally
- Validate remote resources before use

---

### 5. Template Registry

**Central registry** of available templates and schemas

**Purpose:** Discover and share templates

**Example:**
```json
// websites/schematics/registry.json
{
  "templates": {
    "blog": {
      "schema": "../schemas/blog/schema.prisma",
      "description": "Blog website template",
      "tags": ["blog", "content", "cms"],
      "preview": "https://example.com/previews/blog.png"
    }
  }
}
```

**CLI:**
```bash
pnpm ssot bulk templates list
pnpm ssot bulk templates use blog --output my-blog
```

---

### 6. Multi-Schema Projects

**Support projects** that combine multiple schemas

**Purpose:** Generate websites from multiple schema sources

**Example:**
```json
{
  "id": "multi-schema-project",
  "schemas": [
    "schemas/blog/schema.prisma",
    "schemas/ecommerce/schema.prisma"
  ],
  "uiConfig": "configs/multi-schema.config.ts"
}
```

---

### 7. Environment Variables

**Support environment variables** in configs for dynamic values

**Purpose:** Different values per environment without config duplication

**Example:**
```json
{
  "id": "env-aware-project",
  "schema": "...",
  "customizations": {
    "site": {
      "name": "${SITE_NAME}",
      "url": "${SITE_URL}"
    }
  }
}
```

---

### 8. Validation Rules

**Custom validation rules** for schemas and configs

**Purpose:** Enforce project-specific constraints

**Example:**
```json
{
  "projects": [
    {
      "id": "validated-project",
      "schema": "...",
      "validation": {
        "requiredModels": ["Post", "User"],
        "maxModels": 10,
        "requiredThemes": ["primary", "secondary"]
      }
    }
  ]
}
```

---

### 9. Batch Operations

**Batch operations** across multiple projects

**Purpose:** Apply operations to multiple projects at once

**Examples:**
```bash
# Regenerate all projects
pnpm ssot bulk regenerate --all

# Update dependencies in all projects
pnpm ssot bulk update-deps --all

# Build all projects
pnpm ssot bulk build --all
```

---

### 10. CI/CD Integration

**CI/CD friendly** output and reporting

**Purpose:** Integrate with CI/CD pipelines

**Features:**
- JSON output for programmatic parsing
- Exit codes for success/failure
- Artifact generation
- Test result reporting

**Example:**
```bash
pnpm ssot bulk --json-output report.json
# Exit code 0 = success, 1 = failure
# report.json contains detailed results
```

---

## 📊 Implementation Priority

**Suggested order of implementation:**

1. **Phase 1: Core Improvements** (High Priority)
   - Config validation and path checking
   - Deep merge for customizations
   - Error recovery and reporting
   - Manifest generation

2. **Phase 2: CLI Enhancements** (Medium Priority)
   - `bulk validate` command
   - `bulk diff` command
   - `bulk clean` command
   - Improved logging

3. **Phase 3: Advanced Features** (Lower Priority)
   - Schematics system
   - Diff-based regeneration
   - Remote mode
   - Template registry

4. **Phase 4: Enterprise Features** (Future)
   - Multi-schema projects
   - Batch operations
   - CI/CD integration
   - Advanced validation

---

**Ready to generate websites at scale! 🎉**

