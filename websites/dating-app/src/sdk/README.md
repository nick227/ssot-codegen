# API SDK

Type-safe TypeScript client for your API.

## ⚡ Quick Start (30 seconds)

```typescript
import { quickSDK } from './gen/sdk'

// 1. Create client
const api = quickSDK('http://localhost:3000')

// 2. Use it!
const records = await api.post.list()
console.log(records.data)
```

**That's it!** You're ready to go.

---

## 📚 Every Model Has 7 Core Methods

All models (`user`, `profile`, `photo`, `message`, `quiz`, `quizquestion`, `quizanswer`, `quizresult`, `behaviorevent`, `behavioreventarchive`, `personalitydimension`, `userdimensionscore`, `compatibilityscore`, `dimensionmappingrule`, `eventweightconfig`) provide the same interface:

| Method | Purpose | Example |
|--------|---------|---------|
| `.list(query?)` | Get multiple records | `api.post.list({ take: 20 })` |
| `.get(id)` | Get one by ID | `api.post.get(123)` |
| `.create(data)` | Create new | `api.post.create({ ... })` |
| `.update(id, data)` | Update existing | `api.post.update(123, { ... })` |
| `.delete(id)` | Remove | `api.post.delete(123)` |
| `.findOne(where)` | Find by any field | `api.post.findOne({ slug: 'hello' })` |
| `.count(query?)` | Count records | `api.post.count()` |

**Learn these 7, know the entire API!**

---

## 🎯 Available Models

- `api.user` - User operations
- `api.profile` - Profile operations
- `api.photo` - Photo operations
- `api.message` - Message operations
- `api.quiz` - Quiz operations
- `api.quizquestion` - QuizQuestion operations
- `api.quizanswer` - QuizAnswer operations
- `api.quizresult` - QuizResult operations
- `api.behaviorevent` - BehaviorEvent operations
- `api.behavioreventarchive` - BehaviorEventArchive operations
- `api.personalitydimension` - PersonalityDimension operations
- `api.userdimensionscore` - UserDimensionScore operations
- `api.compatibilityscore` - CompatibilityScore operations
- `api.dimensionmappingrule` - DimensionMappingRule operations
- `api.eventweightconfig` - EventWeightConfig operations

Each model follows the same 7-method pattern above.

---

## 🔐 With Authentication

```typescript
import { quickSDKWithAuth } from './gen/sdk'

const api = quickSDKWithAuth('http://localhost:3000', myToken)

// All calls include: Authorization: Bearer <token>
await api.post.create({ ... })
```

---

## 🎨 Domain Helpers

Some models have optional shortcuts in `.helpers`:

```typescript
// Core method (works everywhere)
const post = await api.post.findOne({ slug: 'hello' })

// Helper shortcut (optional sugar)
const post = await api.post.helpers.findBySlug('hello')
```

Type `api.post.helpers.` in your IDE to see available shortcuts.

---

## 📖 Full Documentation

- **[API Reference](./API-REFERENCE.md)** - Complete method list
- **[Architecture](./ARCHITECTURE.md)** - Design philosophy
- **[Recipes](./recipes.ts)** - Common patterns

---

## 💡 Questions?

Your IDE autocomplete has all the answers! Just type `api.` and explore.
