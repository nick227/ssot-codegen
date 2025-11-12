# Website Schemas & Bulk Generation

**Structure for organizing and bulk-generating websites**

---

## 📁 Directory Structure

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
├── schematics/           # Reusable templates (future)
│   ├── layouts/
│   ├── pages/
│   ├── components/
│   └── themes/
│
├── projects/             # Generated websites
│   ├── blog-example/
│   └── ecommerce-example/
│
└── config/
    └── bulk-generate.json
```

---

## 🚀 Quick Start

### Generate Single Website

```bash
npx ssot-gen ui \
  --schema websites/schemas/blog/schema.prisma \
  --config websites/schemas/blog/ui.config.ts \
  --output websites/projects/my-blog
```

### Generate Multiple Websites (Bulk)

```bash
npx ssot-gen bulk --config websites/config/bulk-generate.json
```

### Dry Run (Preview)

```bash
npx ssot-gen bulk --config websites/config/bulk-generate.json --dry-run
```

---

## 📋 Available Schemas

### Blog (`websites/schemas/blog/`)
- **Models:** Post, Category, Tag, Comment, User
- **Features:** Blog posts, categories, tags, comments, user roles
- **Use Case:** Content websites, blogs, news sites

### E-commerce (`websites/schemas/ecommerce/`)
- **Models:** Product, Category, Order, OrderItem, Review
- **Features:** Products, categories, orders, reviews
- **Use Case:** Online stores, marketplaces

### Dashboard (`websites/schemas/dashboard/`)
- **Models:** (Coming soon)
- **Features:** Admin dashboards, analytics
- **Use Case:** Admin panels, analytics dashboards

---

## ⚙️ Configuration

### Bulk Generation Config

Edit `websites/config/bulk-generate.json`:

```json
{
  "projects": [
    {
      "id": "my-blog",
      "name": "My Blog",
      "schema": "websites/schemas/blog/schema.prisma",
      "outputDir": "websites/projects/my-blog",
      "customizations": {
        "site": {
          "name": "My Blog",
          "title": "Welcome"
        },
        "theme": {
          "colors": {
            "primary": "#custom-color"
          }
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

## 📚 Documentation

- **Structure Guide:** `docs/WEBSITE_SCHEMA_STRUCTURE.md`
- **Quick Guide:** `docs/WEBSITE_SCHEMA_GUIDE.md`
- **API Reference:** See `packages/gen/src/generators/ui/website-schema-types.ts`

---

## 🔄 Workflow

1. **Define Schema** → Create `schema.prisma` + `ui.config.ts` in `schemas/{type}/`
2. **Test Single** → Generate one website to verify
3. **Add to Bulk Config** → Add project to `config/bulk-generate.json`
4. **Bulk Generate** → Run `npx ssot-gen bulk`
5. **Customize** → Apply client-specific customizations

---

**Ready to generate websites at scale! 🚀**

