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
# Generate all projects
npx ssot-gen bulk

# Use custom config file
npx ssot-gen bulk --config websites/config/my-config.json

# Preview without writing files
npx ssot-gen bulk --dry-run

# Generate sequentially (not parallel)
npx ssot-gen bulk --no-parallel
```

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
   npx ssot-gen ui \
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
   npx ssot-gen bulk
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
   npx ssot-gen bulk --config websites/config/clients.json
   ```

---

## 🛠️ CLI Commands

### `npx ssot-gen bulk`

Generate multiple websites from bulk configuration.

**Options:**
- `-c, --config <path>` - Path to bulk config (default: `websites/config/bulk-generate.json`)
- `--dry-run` - Preview without writing files
- `--parallel` - Generate in parallel (default: true)
- `--no-parallel` - Generate sequentially

**Examples:**
```bash
# Basic usage
npx ssot-gen bulk

# Custom config
npx ssot-gen bulk --config my-config.json

# Preview
npx ssot-gen bulk --dry-run

# Sequential generation
npx ssot-gen bulk --no-parallel
```

---

### `npx ssot-gen bulk init`

Initialize bulk generation structure (future).

```bash
npx ssot-gen bulk init
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
   - Run `npx ssot-gen bulk`
   - Review generated output
   - Customize as needed

4. **Iterate**
   - Refine schemas
   - Add more projects
   - Optimize customizations

---

**Ready to generate websites at scale! 🎉**

