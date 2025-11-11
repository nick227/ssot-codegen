# test-v3-blog - V3 JSON Runtime

**UI Mode**: JSON Runtime (V3)  
**Code Generated**: ZERO!  
**Template**: blog

---

## 📁 **Structure**

```
templates/          ← All UI configuration (JSON only!)
├── template.json          # Pages, components, routes
├── data-contract.json     # Whitelists for filters/sorts
├── capabilities.json      # Security policies
├── mappings.json          # Field aliases
├── models.json            # Auto-generated from Prisma
├── theme.json             # Design tokens
└── i18n.json              # Translations

app/[[...slug]]/    ← Single mount point
└── page.tsx               # 40 lines - renders everything

lib/adapters/       ← Adapter configuration
└── index.ts               # 20 lines - connects to Prisma, UI, etc.
```

**Total project code**: ~60 lines  
**Everything else**: JSON configuration

---

## 🔄 **Workflow**

### **Edit UI**
Just edit JSON files in `templates/`!

```bash
# Edit template
code templates/template.json

# Changes apply instantly (hot reload)
npm run dev
```

### **Generate models.json**
Auto-updates when Prisma schema changes:

```bash
npm run gen:models:watch
```

### **Validate**
```bash
npm run validate:templates
```

---

## 🎨 **Hot Reload**

Edit any JSON file → See changes **instantly** (no rebuild!)

---

## 📚 **Learn More**

- Architecture: docs/TEMPLATE_FACTORY_GUIDE.md
- Adapters: Check each @ssot-ui/adapter-* package
- Examples: examples/json-templates/
