# Website Schema Architecture for Bulk Processing

**Production-ready structure for organizing schemas, configs, and schematics**

---

## 🏗️ Recommended Directory Structure

```
websites/
├── schemas/                    # Base website type definitions
│   ├── blog/
│   │   ├── schema.prisma      # Data models
│   │   ├── ui.config.ts       # Base UI configuration
│   │   ├── theme.json         # Theme defaults (optional)
│   │   └── README.md          # Schema documentation
│   │
│   ├── ecommerce/
│   │   ├── schema.prisma
│   │   ├── ui.config.ts
│   │   └── README.md
│   │
│   └── dashboard/
│       ├── schema.prisma
│       ├── ui.config.ts
│       └── README.md
│
├── schematics/                # Reusable templates/patterns
│   ├── layouts/
│   │   ├── admin-dashboard.json
│   │   ├── marketing-site.json
│   │   ├── saas-app.json
│   │   └── README.md
│   │
│   ├── pages/
│   │   ├── blog-home.json
│   │   ├── product-catalog.json
│   │   ├── user-profile.json
│   │   └── README.md
│   │
│   ├── components/
│   │   ├── hero-sections.json
│   │   ├── pricing-tables.json
│   │   ├── feature-grids.json
│   │   └── README.md
│   │
│   ├── themes/
│   │   ├── modern-blue.json
│   │   ├── dark-minimal.json
│   │   ├── corporate.json
│   │   └── README.md
│   │
│   └── registry.json          # Schematic registry
│
├── configs/                   # Bulk generation configurations
│   ├── clients/               # Client-specific configs
│   │   ├── client-a.json
│   │   ├── client-b.json
│   │   └── README.md
│   │
│   ├── environments/          # Environment-specific configs
│   │   ├── development.json
│   │   ├── staging.json
│   │   ├── production.json
│   │   └── README.md
│   │
│   ├── templates/             # Template-based configs
│   │   ├── blog-variations.json
│   │   ├── ecommerce-variations.json
│   │   └── README.md
│   │
│   └── bulk-generate.json     # Default bulk config
│
├── projects/                  # Generated websites
│   ├── {client-id}-{type}/
│   │   ├── src/
│   │   ├── schema.prisma
│   │   └── package.json
│   │
│   └── README.md
│
├── shared/                    # Shared resources
│   ├── components/            # Shared component overrides
│   ├── themes/               # Shared theme extensions
│   └── utilities/            # Shared utilities
│
└── README.md                  # Main documentation
```

---

## 📋 Schema Structure

### Base Schema (`websites/schemas/{type}/`)

Each website type should have:

```
{type}/
├── schema.prisma              # Prisma data models
├── ui.config.ts               # Base UI configuration
├── theme.json                 # Theme defaults (optional)
├── variants/                  # Schema variants (optional)
│   ├── minimal.prisma
│   └── extended.prisma
└── README.md                  # Documentation
```

**Example: `websites/schemas/blog/schema.prisma`**
```prisma
// Blog Website Schema
// Base schema for blog websites

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  content     String   @db.Text
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
  // ... more fields
}

// ... more models
```

**Example: `websites/schemas/blog/ui.config.ts`**
```typescript
/**
 * Blog Website - Base UI Configuration
 * 
 * This is the base configuration. Use customizations in bulk config
 * to override for specific clients/projects.
 */

import type { UiConfig } from '@ssot-codegen/gen'

const blogUiConfig: UiConfig = {
  site: {
    name: 'Blog',
    title: 'My Blog',
    description: 'A blog website'
  },
  
  theme: {
    colors: {
      primary: '#2563eb',
      secondary: '#7c3aed'
    },
    darkMode: true
  },
  
  navigation: {
    header: {
      enabled: true,
      links: [
        { label: 'Home', href: '/' },
        { label: 'Posts', href: '/posts' }
      ]
    }
  },
  
  generation: {
    crudPages: {
      enabled: true,
      models: ['Post', 'Category', 'Tag']
    }
  }
}

export default blogUiConfig
```

---

## 🎨 Schematic Structure

### Layout Schematics (`websites/schematics/layouts/`)

**Purpose:** Reusable layout patterns

**Example: `websites/schematics/layouts/admin-dashboard.json`**
```json
{
  "id": "admin-dashboard",
  "name": "Admin Dashboard Layout",
  "description": "Dashboard layout with sidebar navigation",
  "type": "layout",
  "version": "1.0.0",
  "structure": {
    "header": {
      "enabled": true,
      "position": "top",
      "components": ["Logo", "UserMenu", "Notifications"]
    },
    "sidebar": {
      "enabled": true,
      "position": "left",
      "collapsible": true,
      "width": "narrow"
    },
    "footer": {
      "enabled": true,
      "position": "bottom"
    }
  },
  "variants": {
    "compact": {
      "sidebar": { "width": "narrow" }
    },
    "wide": {
      "sidebar": { "width": "wide" }
    }
  },
  "variables": {
    "logo": {
      "type": "string",
      "default": "/logo.png",
      "description": "Logo image path"
    }
  }
}
```

### Page Schematics (`websites/schematics/pages/`)

**Purpose:** Reusable page patterns

**Example: `websites/schematics/pages/blog-home.json`**
```json
{
  "id": "blog-home",
  "name": "Blog Homepage",
  "description": "Blog homepage with hero and post list",
  "type": "page",
  "version": "1.0.0",
  "layout": "landing",
  "sections": [
    {
      "type": "hero",
      "template": "hero-centered",
      "props": {
        "title": "{{site.title}}",
        "subtitle": "{{site.description}}"
      }
    },
    {
      "type": "content",
      "components": [
        {
          "type": "DataTable",
          "model": "Post",
          "props": {
            "columns": ["title", "excerpt", "author", "publishedAt"],
            "where": { "published": true },
            "orderBy": { "publishedAt": "desc" },
            "take": 10
          }
        }
      ]
    }
  ],
  "variables": {
    "postCount": {
      "type": "number",
      "default": 10,
      "description": "Number of posts to display"
    }
  }
}
```

### Component Schematics (`websites/schematics/components/`)

**Purpose:** Reusable component compositions

**Example: `websites/schematics/components/hero-sections.json`**
```json
{
  "id": "hero-centered",
  "name": "Centered Hero Section",
  "description": "Centered hero section with title and CTA",
  "type": "component",
  "version": "1.0.0",
  "template": "Hero",
  "props": {
    "variant": "centered",
    "size": "lg"
  },
  "slots": {
    "title": "{{title}}",
    "subtitle": "{{subtitle}}",
    "description": "{{description}}",
    "actions": [
      {
        "type": "Button",
        "props": {
          "variant": "primary",
          "label": "{{ctaLabel}}"
        }
      }
    ]
  },
  "variables": {
    "title": {
      "type": "string",
      "required": true
    },
    "subtitle": {
      "type": "string"
    },
    "ctaLabel": {
      "type": "string",
      "default": "Get Started"
    }
  }
}
```

### Theme Schematics (`websites/schematics/themes/`)

**Purpose:** Reusable theme configurations

**Example: `websites/schematics/themes/modern-blue.json`**
```json
{
  "id": "modern-blue",
  "name": "Modern Blue Theme",
  "description": "Modern blue color scheme",
  "type": "theme",
  "version": "1.0.0",
  "colors": {
    "primary": "#2563eb",
    "secondary": "#7c3aed",
    "success": "#059669",
    "warning": "#d97706",
    "error": "#dc2626",
    "background": "#ffffff",
    "text": "#1f2937"
  },
  "fonts": {
    "heading": "Inter",
    "body": "Inter"
  },
  "spacing": {
    "unit": 4
  },
  "breakpoints": {
    "sm": "640px",
    "md": "768px",
    "lg": "1024px",
    "xl": "1280px"
  }
}
```

### Schematic Registry (`websites/schematics/registry.json`)

**Purpose:** Central registry of all schematics

```json
{
  "version": "1.0.0",
  "schematics": {
    "layouts": {
      "admin-dashboard": "./layouts/admin-dashboard.json",
      "marketing-site": "./layouts/marketing-site.json",
      "saas-app": "./layouts/saas-app.json"
    },
    "pages": {
      "blog-home": "./pages/blog-home.json",
      "product-catalog": "./pages/product-catalog.json",
      "user-profile": "./pages/user-profile.json"
    },
    "components": {
      "hero-centered": "./components/hero-sections.json",
      "pricing-table": "./components/pricing-tables.json"
    },
    "themes": {
      "modern-blue": "./themes/modern-blue.json",
      "dark-minimal": "./themes/dark-minimal.json",
      "corporate": "./themes/corporate.json"
    }
  },
  "categories": {
    "blog": {
      "layouts": ["admin-dashboard"],
      "pages": ["blog-home"],
      "themes": ["modern-blue"]
    },
    "ecommerce": {
      "layouts": ["marketing-site"],
      "pages": ["product-catalog"],
      "themes": ["corporate"]
    }
  }
}
```

---

## ⚙️ Configuration Structure

### Client Configs (`websites/configs/clients/`)

**Purpose:** Client-specific bulk generation configs

**Example: `websites/configs/clients/client-a.json`**
```json
{
  "name": "Client A Projects",
  "description": "All projects for Client A",
  "projects": [
    {
      "id": "client-a-blog",
      "name": "Client A Blog",
      "schema": "../../schemas/blog/schema.prisma",
      "outputDir": "../../projects/client-a-blog",
      "customizations": {
        "site": {
          "name": "Client A Blog",
          "title": "Welcome to Client A",
          "logo": "/client-a-logo.png"
        },
        "theme": {
          "colors": {
            "primary": "#client-a-brand-color"
          }
        }
      },
      "schematics": {
        "layout": "admin-dashboard",
        "pages": ["blog-home"],
        "theme": "modern-blue"
      }
    },
    {
      "id": "client-a-store",
      "name": "Client A Store",
      "schema": "../../schemas/ecommerce/schema.prisma",
      "outputDir": "../../projects/client-a-store",
      "customizations": {
        "site": {
          "name": "Client A Store"
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

### Environment Configs (`websites/configs/environments/`)

**Purpose:** Environment-specific configurations

**Example: `websites/configs/environments/development.json`**
```json
{
  "name": "Development Environment",
  "description": "Development website generation",
  "projects": [
    {
      "id": "blog-dev",
      "name": "Blog (Development)",
      "schema": "../../schemas/blog/schema.prisma",
      "outputDir": "../../projects/blog-dev",
      "customizations": {
        "site": {
          "name": "Blog (Dev)",
          "title": "Development Blog"
        },
        "theme": {
          "colors": {
            "primary": "#3b82f6"
          }
        }
      }
    }
  ],
  "options": {
    "parallel": false,
    "validate": true,
    "verbose": true
  }
}
```

### Template Configs (`websites/configs/templates/`)

**Purpose:** Template-based variations

**Example: `websites/configs/templates/blog-variations.json`**
```json
{
  "name": "Blog Template Variations",
  "description": "Different variations of blog template",
  "projects": [
    {
      "id": "blog-light",
      "name": "Blog (Light Theme)",
      "schema": "../../schemas/blog/schema.prisma",
      "outputDir": "../../projects/blog-light",
      "customizations": {
        "theme": {
          "darkMode": false,
          "colors": {
            "primary": "#2563eb",
            "background": "#ffffff",
            "text": "#1f2937"
          }
        }
      }
    },
    {
      "id": "blog-dark",
      "name": "Blog (Dark Theme)",
      "schema": "../../schemas/blog/schema.prisma",
      "outputDir": "../../projects/blog-dark",
      "customizations": {
        "theme": {
          "darkMode": true,
          "colors": {
            "primary": "#60a5fa",
            "background": "#111827",
            "text": "#f9fafb"
          }
        }
      }
    }
  ]
}
```

### Default Bulk Config (`websites/configs/bulk-generate.json`)

**Purpose:** Default configuration for quick generation

```json
{
  "name": "Default Bulk Generation",
  "description": "Default bulk generation configuration",
  "projects": [
    {
      "id": "blog-example",
      "name": "Blog Example",
      "schema": "../schemas/blog/schema.prisma",
      "outputDir": "../projects/blog-example"
    }
  ],
  "options": {
    "parallel": true,
    "skipExisting": false,
    "validate": true,
    "continueOnError": false,
    "verbose": false
  }
}
```

---

## 🔄 Processing Flow

### 1. Schema Resolution

```
Project Config
  ↓
Schema Path (relative/absolute)
  ↓
Load schema.prisma
  ↓
Parse DMMF
  ↓
ParsedSchema
```

### 2. Config Resolution

```
Project Config
  ↓
UI Config Path (derived from schema path)
  ↓
Load ui.config.ts
  ↓
Apply Customizations
  ↓
Final UiConfig
```

### 3. Schematic Resolution (Future)

```
Project Config
  ↓
Schematic References
  ↓
Load from registry.json
  ↓
Apply Variables
  ↓
Merged Config
```

### 4. Generation

```
ParsedSchema + Final UiConfig
  ↓
Generate UI Components
  ↓
Generate Pages
  ↓
Generate Hook Adapters
  ↓
Write Files
```

---

## 📝 Naming Conventions

### Schema Directories
- Use lowercase, kebab-case: `blog`, `ecommerce`, `admin-dashboard`
- Descriptive and specific: `blog` not `site`, `ecommerce` not `shop`

### Project IDs
- Format: `{client-id}-{type}` or `{type}-{variant}`
- Examples: `client-a-blog`, `blog-light`, `store-prod`

### Schematic IDs
- Format: `{category}-{name}`
- Examples: `layout-admin-dashboard`, `page-blog-home`, `theme-modern-blue`

### Config Files
- Use descriptive names: `client-a.json`, `development.json`
- Group by purpose: `clients/`, `environments/`, `templates/`

---

## ✅ Best Practices

### 1. Schema Organization

**DO:**
- ✅ Keep schemas generic and reusable
- ✅ Document schema purpose in README
- ✅ Use variants for schema variations
- ✅ Keep UI configs minimal (use customizations)

**DON'T:**
- ❌ Include client-specific models in base schema
- ❌ Hard-code values in base configs
- ❌ Mix concerns (data vs UI)

### 2. Configuration Management

**DO:**
- ✅ Use TypeScript for type safety (`ui.config.ts`)
- ✅ Keep base configs minimal
- ✅ Use customizations for variations
- ✅ Version control all configs
- ✅ Document customizations

**DON'T:**
- ❌ Duplicate configs
- ❌ Hard-code paths (use relative paths)
- ❌ Mix environments in same config

### 3. Schematic Design

**DO:**
- ✅ Keep schematics generic
- ✅ Use variables for customization
- ✅ Document variables
- ✅ Version schematics
- ✅ Create variants for common variations

**DON'T:**
- ❌ Hard-code values
- ❌ Create overly specific schematics
- ❌ Mix concerns (layout vs page vs component)

### 4. Project Organization

**DO:**
- ✅ Use descriptive project IDs
- ✅ Organize by client/type
- ✅ Keep generated code separate
- ✅ Use `.gitignore` appropriately

**DON'T:**
- ❌ Use generic names (`project1`, `test`)
- ❌ Mix source and generated code
- ❌ Commit generated projects

---

## 🔍 Example: Complete Workflow

### Step 1: Create Base Schema

```bash
mkdir -p websites/schemas/blog
```

Create `schema.prisma` and `ui.config.ts` (see examples above)

### Step 2: Create Client Config

```bash
mkdir -p websites/configs/clients
```

Create `websites/configs/clients/client-a.json`:

```json
{
  "projects": [
    {
      "id": "client-a-blog",
      "name": "Client A Blog",
      "schema": "../../schemas/blog/schema.prisma",
      "outputDir": "../../projects/client-a-blog",
      "customizations": {
        "site": { "name": "Client A Blog" },
        "theme": { "colors": { "primary": "#dc2626" } }
      }
    }
  ]
}
```

### Step 3: Generate

```bash
pnpm ssot bulk --config websites/configs/clients/client-a.json
```

### Step 4: Review Output

```
websites/projects/client-a-blog/
├── src/
│   ├── app/
│   ├── components/
│   └── hooks/
├── schema.prisma
└── package.json
```

---

## 🎯 Scalability Considerations

### For Small Scale (< 10 projects)
- Single `bulk-generate.json`
- Simple structure
- Manual customization

### For Medium Scale (10-50 projects)
- Organize by client (`configs/clients/`)
- Use schematics for common patterns
- Automated customization

### For Large Scale (50+ projects)
- Full schematic system
- Template-based generation
- Automated testing
- CI/CD integration

---

## 📚 Related Documentation

- **Bulk Generation Guide:** `docs/BULK_WEBSITE_GENERATION.md`
- **Schema Structure:** `docs/WEBSITE_SCHEMA_STRUCTURE.md`
- **Quick Guide:** `docs/WEBSITE_SCHEMA_GUIDE.md`

---

**This architecture provides a scalable, maintainable structure for bulk website generation! 🚀**

