# Website Schema & Schematic Guide

**Complete guide for structuring websites and bulk generation**

---

## 🎯 Quick Start

### 1. Create Website Schema

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

### 2. Generate Single Website

```bash
npx ssot-gen ui \
  --schema websites/schemas/my-blog/schema.prisma \
  --config websites/schemas/my-blog/ui.config.ts \
  --output websites/projects/my-blog
```

---

### 3. Bulk Generate Multiple Websites

**`websites/config/bulk-generate.json`:**
```json
{
  "projects": [
    {
      "id": "blog-1",
      "name": "Client A Blog",
      "schema": "websites/schemas/my-blog/schema.prisma",
      "outputDir": "websites/projects/blog-1",
      "customizations": {
        "site": { "name": "Client A Blog" }
      }
    },
    {
      "id": "blog-2",
      "name": "Client B Blog",
      "schema": "websites/schemas/my-blog/schema.prisma",
      "outputDir": "websites/projects/blog-2",
      "customizations": {
        "site": { "name": "Client B Blog" },
        "theme": { "colors": { "primary": "#dc2626" } }
      }
    }
  ]
}
```

**Generate:**
```bash
npx ssot-gen bulk --config websites/config/bulk-generate.json
```

---

## 📁 Recommended Structure

```
websites/
├── schemas/              # Website type definitions
│   ├── blog/
│   │   ├── schema.prisma
│   │   └── ui.config.ts
│   ├── ecommerce/
│   │   ├── schema.prisma
│   │   └── ui.config.ts
│   └── dashboard/
│       ├── schema.prisma
│       └── ui.config.ts
│
├── schematics/           # Reusable templates
│   ├── layouts/
│   ├── pages/
│   ├── components/
│   └── themes/
│
├── projects/             # Generated websites
│   ├── client-a-blog/
│   └── client-b-store/
│
└── config/
    └── bulk-generate.json
```

---

## 🔄 Workflow

1. **Define Schema** → Create `schema.prisma` + `ui.config.ts`
2. **Test Single** → Generate one website to verify
3. **Create Bulk Config** → Define multiple projects
4. **Bulk Generate** → Generate all at once
5. **Customize** → Apply client-specific customizations

---

**See `WEBSITE_SCHEMA_STRUCTURE.md` for detailed structure documentation.**

