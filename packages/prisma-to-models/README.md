# @ssot-ui/prisma-to-models

**Generate models.json from Prisma schema for SSOT UI templates.**

Version: 3.0.0

---

## 📦 **Installation**

```bash
npm install -D @ssot-ui/prisma-to-models
```

---

## 🎯 **Usage**

### **Generate Once**

```bash
npx prisma-to-models generate ./prisma/schema.prisma --out ./templates/models.json
```

### **Watch Mode** (Auto-regenerate on changes)

```bash
npx prisma-to-models watch ./prisma/schema.prisma --out ./templates/models.json
```

### **In package.json**

```json
{
  "scripts": {
    "gen:models": "prisma-to-models generate ./prisma/schema.prisma --out ./templates/models.json",
    "dev:models": "prisma-to-models watch ./prisma/schema.prisma --out ./templates/models.json"
  }
}
```

---

## ⚡ **Features**

- Parses Prisma schema using @prisma/internals
- Generates models.json with all models, fields, relations, enums
- Watch mode for automatic regeneration
- TypeScript types from @ssot-ui/schemas

---

## 📋 **Output Format**

```json
{
  "version": "1.0.0",
  "generatedAt": "2025-11-11T12:00:00.000Z",
  "schemaPath": "./prisma/schema.prisma",
  "models": [
    {
      "name": "Post",
      "fields": [
        {
          "name": "id",
          "type": "String",
          "isRequired": true,
          "isList": false,
          "isId": true,
          "isRelation": false
        }
      ]
    }
  ],
  "enums": []
}
```

---

## 🔄 **Workflow**

1. Edit Prisma schema
2. Generator auto-runs (if in watch mode)
3. models.json updated
4. Runtime hot-reloads
5. UI updates instantly

**No manual model definition needed!**

---

## 📄 **License**

MIT

