# Website Schema & Schematic Structure

**Recommended structure for bulk website creation**

---

## 🏗️ Directory Structure

```
websites/
├── schemas/                    # Website schema definitions
│   ├── blog/
│   │   ├── schema.prisma      # Data models for blog
│   │   ├── ui.config.ts       # UI configuration
│   │   └── theme.json         # Theme customization
│   ├── ecommerce/
│   │   ├── schema.prisma
│   │   ├── ui.config.ts
│   │   └── theme.json
│   └── dashboard/
│       ├── schema.prisma
│       ├── ui.config.ts
│       └── theme.json
│
├── schematics/                # Reusable templates/patterns
│   ├── layouts/
│   │   ├── admin-dashboard.json
│   │   ├── marketing-site.json
│   │   └── saas-app.json
│   ├── pages/
│   │   ├── blog-home.json
│   │   ├── product-catalog.json
│   │   └── user-profile.json
│   ├── components/
│   │   ├── hero-sections.json
│   │   ├── pricing-tables.json
│   │   └── feature-grids.json
│   └── themes/
│       ├── modern-blue.json
│       ├── dark-minimal.json
│       └── corporate.json
│
├── projects/                  # Generated projects
│   ├── client-a-blog/
│   ├── client-b-store/
│   └── client-c-dashboard/
│
└── config/
    ├── bulk-generate.json     # Bulk generation config
    └── template-registry.json # Template mappings
```

---

## 📋 Schema Organization

### 1. **Website Schema** (`websites/schemas/{type}/schema.prisma`)

**Purpose:** Define data models for a website type

```prisma
// websites/schemas/blog/schema.prisma
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
  excerpt     String?
  published   Boolean  @default(false)
  publishedAt DateTime?
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  categories  Category[]
  tags        Tag[]
  comments    Comment[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([slug])
  @@index([published, publishedAt])
}

model Category {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  posts       Post[]
  createdAt   DateTime @default(now())
}

// ... more models
```

---

### 2. **UI Configuration** (`websites/schemas/{type}/ui.config.ts`)

**Purpose:** Define UI structure, pages, navigation

```typescript
// websites/schemas/blog/ui.config.ts
import type { UiConfig } from '@ssot-codegen/gen'

export const blogUiConfig: UiConfig = {
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
        { label: 'Posts', href: '/posts' },
        { label: 'About', href: '/about' }
      ]
    }
  },
  
  pages: [
    {
      path: 'home',
      type: 'landing',
      layout: 'landing',
      sections: [
        {
          type: 'hero',
          config: {
            title: 'Welcome to My Blog',
            subtitle: 'Thoughts & Stories'
          }
        }
      ]
    }
  ],
  
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

### 3. **Theme Configuration** (`websites/schemas/{type}/theme.json`)

**Purpose:** Visual customization (optional, can be in ui.config.ts)

```json
{
  "colors": {
    "primary": "#2563eb",
    "secondary": "#7c3aed",
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

---

## 🎨 Schematic System

### 1. **Layout Schematics** (`websites/schematics/layouts/`)

**Purpose:** Reusable layout patterns

```json
// websites/schematics/layouts/admin-dashboard.json
{
  "name": "admin-dashboard",
  "description": "Admin dashboard layout with sidebar",
  "type": "layout",
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
      "sections": [
        {
          "title": "Navigation",
          "links": ["{{models}}"]
        }
      ]
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
  }
}
```

---

### 2. **Page Schematics** (`websites/schematics/pages/`)

**Purpose:** Reusable page patterns

```json
// websites/schematics/pages/blog-home.json
{
  "name": "blog-home",
  "description": "Blog homepage with hero and post list",
  "type": "page",
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
  "variants": {
    "grid": {
      "sections": [
        {
          "type": "content",
          "components": [
            {
              "type": "Grid",
              "props": { "cols": 3 },
              "children": ["{{PostCard}}"]
            }
          ]
        }
      ]
    }
  }
}
```

---

### 3. **Component Schematics** (`websites/schematics/components/`)

**Purpose:** Reusable component compositions

```json
// websites/schematics/components/hero-sections.json
{
  "name": "hero-centered",
  "description": "Centered hero section",
  "type": "component",
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
        "props": { "variant": "primary", "label": "Get Started" }
      }
    ]
  }
}
```

---

### 4. **Theme Schematics** (`websites/schematics/themes/`)

**Purpose:** Reusable theme configurations

```json
// websites/schematics/themes/modern-blue.json
{
  "name": "modern-blue",
  "description": "Modern blue theme",
  "colors": {
    "primary": "#2563eb",
    "secondary": "#7c3aed",
    "success": "#059669",
    "warning": "#d97706",
    "error": "#dc2626"
  },
  "fonts": {
    "heading": "Inter",
    "body": "Inter"
  },
  "darkMode": true
}
```

---

## 🔄 Bulk Generation Configuration

### Bulk Generate Config (`websites/config/bulk-generate.json`)

```json
{
  "projects": [
    {
      "id": "client-a-blog",
      "name": "Client A Blog",
      "schema": "websites/schemas/blog/schema.prisma",
      "uiConfig": "websites/schemas/blog/ui.config.ts",
      "outputDir": "websites/projects/client-a-blog",
      "customizations": {
        "theme": {
          "primary": "#custom-color"
        },
        "site": {
          "name": "Client A Blog",
          "title": "Welcome to Client A"
        }
      },
      "schematics": {
        "layout": "admin-dashboard",
        "pages": ["blog-home"],
        "theme": "modern-blue"
      }
    },
    {
      "id": "client-b-store",
      "name": "Client B Store",
      "schema": "websites/schemas/ecommerce/schema.prisma",
      "uiConfig": "websites/schemas/ecommerce/ui.config.ts",
      "outputDir": "websites/projects/client-b-store",
      "schematics": {
        "layout": "marketing-site",
        "pages": ["product-catalog"],
        "theme": "corporate"
      }
    }
  ],
  "options": {
    "parallel": true,
    "skipExisting": false,
    "validate": true
  }
}
```

---

## 🚀 Usage Patterns

### Pattern 1: Schema-Based (Recommended)

**Structure:**
```
websites/schemas/{type}/
├── schema.prisma      # Data models
├── ui.config.ts       # UI configuration
└── theme.json         # Theme (optional)
```

**Usage:**
```bash
# Generate single website
pnpm ssot ui --schema websites/schemas/blog/schema.prisma --config websites/schemas/blog/ui.config.ts

# Generate multiple websites
pnpm ssot bulk --config websites/config/bulk-generate.json
```

---

### Pattern 2: Schematic-Based

**Structure:**
```
websites/schematics/
├── layouts/
├── pages/
├── components/
└── themes/
```

**Usage:**
```typescript
import { loadSchematic, applySchematic } from '@ssot-codegen/gen/schematics'

const layout = loadSchematic('layouts/admin-dashboard')
const page = loadSchematic('pages/blog-home')
const theme = loadSchematic('themes/modern-blue')

const siteConfig = applySchematic({
  layout,
  pages: [page],
  theme,
  schema: parsedSchema
})
```

---

### Pattern 3: Template Registry

**Structure:**
```
websites/config/template-registry.json
```

**Usage:**
```json
{
  "templates": {
    "blog": {
      "schema": "websites/schemas/blog/schema.prisma",
      "uiConfig": "websites/schemas/blog/ui.config.ts",
      "schematics": {
        "layout": "admin-dashboard",
        "pages": ["blog-home"],
        "theme": "modern-blue"
      }
    },
    "ecommerce": {
      "schema": "websites/schemas/ecommerce/schema.prisma",
      "uiConfig": "websites/schemas/ecommerce/ui.config.ts",
      "schematics": {
        "layout": "marketing-site",
        "pages": ["product-catalog"],
        "theme": "corporate"
      }
    }
  }
}
```

---

## 📝 Best Practices

### 1. **Schema Organization**
- ✅ One schema per website type
- ✅ Shared models in `common/` directory
- ✅ Use schema composition for variations

### 2. **Schematic Reusability**
- ✅ Keep schematics generic (use variables)
- ✅ Create variants for common variations
- ✅ Document schematic parameters

### 3. **Configuration Management**
- ✅ Use TypeScript for type safety (`ui.config.ts`)
- ✅ Use JSON for simple data (`theme.json`)
- ✅ Keep customizations separate from base configs

### 4. **Bulk Generation**
- ✅ Use bulk config for multiple projects
- ✅ Support parallel generation
- ✅ Validate before generation

---

## 🔧 Implementation Plan

### Phase 1: Schema Structure
1. Create `websites/schemas/` directory structure
2. Migrate existing schemas
3. Create base UI configs

### Phase 2: Schematic System
1. Create schematic loader
2. Implement schematic application
3. Build template registry

### Phase 3: Bulk Generation
1. Create bulk generation CLI command
2. Implement parallel generation
3. Add validation and error handling

---

## 📚 Example: Complete Blog Website

```
websites/
├── schemas/
│   └── blog/
│       ├── schema.prisma
│       ├── ui.config.ts
│       └── theme.json
│
└── projects/
    └── my-blog/
        ├── src/
        │   ├── app/
        │   ├── components/
        │   └── config/
        ├── schema.prisma
        └── package.json
```

**Generate:**
```bash
pnpm ssot ui \
  --schema websites/schemas/blog/schema.prisma \
  --config websites/schemas/blog/ui.config.ts \
  --output websites/projects/my-blog
```

---

**This structure provides:**
- ✅ Clear organization
- ✅ Reusability (schematics)
- ✅ Scalability (bulk generation)
- ✅ Maintainability (separation of concerns)

