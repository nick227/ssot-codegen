# SDK API Reference

Quick reference for all available SDK methods.

## 🎯 The 7 Core Methods (Every Model)

Every model client provides these **exact same methods**:

| Method | Purpose | Returns |
|--------|---------|---------|
| `.list(query?)` | Get multiple records | `{ data: T[], meta: {...} }` |
| `.get(id)` | Get one by ID | `T \| null` |
| `.create(data)` | Create new | `T` |
| `.update(id, data)` | Update existing | `T \| null` |
| `.delete(id)` | Remove | `boolean` |
| `.findOne(where)` | Find by any field | `T \| null` |
| `.count(query?)` | Count records | `number` |

**Learn these 7, know the entire API!**

---

## User Client (`api.user`)

### Core Methods (Inherited)
```typescript
api.user.list({ take: 20, orderBy: { id: 'desc' } })
api.user.get('abc123')
api.user.create({ /* ... */ })
api.user.update('abc123', { /* ... */ })
api.user.delete('abc123')
api.user.findOne({ /* any field */ })
api.user.count({ where: { /* filter */ } })
```

---

## Profile Client (`api.profile`)

### Core Methods (Inherited)
```typescript
api.profile.list({ take: 20, orderBy: { id: 'desc' } })
api.profile.get('abc123')
api.profile.create({ /* ... */ })
api.profile.update('abc123', { /* ... */ })
api.profile.delete('abc123')
api.profile.findOne({ /* any field */ })
api.profile.count({ where: { /* filter */ } })
```

---

## Photo Client (`api.photo`)

### Core Methods (Inherited)
```typescript
api.photo.list({ take: 20, orderBy: { id: 'desc' } })
api.photo.get('abc123')
api.photo.create({ /* ... */ })
api.photo.update('abc123', { /* ... */ })
api.photo.delete('abc123')
api.photo.findOne({ /* any field */ })
api.photo.count({ where: { /* filter */ } })
```

---

## Message Client (`api.message`)

### Core Methods (Inherited)
```typescript
api.message.list({ take: 20, orderBy: { id: 'desc' } })
api.message.get('abc123')
api.message.create({ /* ... */ })
api.message.update('abc123', { /* ... */ })
api.message.delete('abc123')
api.message.findOne({ /* any field */ })
api.message.count({ where: { /* filter */ } })
```

---

## Quiz Client (`api.quiz`)

### Core Methods (Inherited)
```typescript
api.quiz.list({ take: 20, orderBy: { id: 'desc' } })
api.quiz.get('abc123')
api.quiz.create({ /* ... */ })
api.quiz.update('abc123', { /* ... */ })
api.quiz.delete('abc123')
api.quiz.findOne({ /* any field */ })
api.quiz.count({ where: { /* filter */ } })
```

---

## QuizQuestion Client (`api.quizquestion`)

### Core Methods (Inherited)
```typescript
api.quizquestion.list({ take: 20, orderBy: { id: 'desc' } })
api.quizquestion.get('abc123')
api.quizquestion.create({ /* ... */ })
api.quizquestion.update('abc123', { /* ... */ })
api.quizquestion.delete('abc123')
api.quizquestion.findOne({ /* any field */ })
api.quizquestion.count({ where: { /* filter */ } })
```

---

## QuizAnswer Client (`api.quizanswer`)

### Core Methods (Inherited)
```typescript
api.quizanswer.list({ take: 20, orderBy: { id: 'desc' } })
api.quizanswer.get('abc123')
api.quizanswer.create({ /* ... */ })
api.quizanswer.update('abc123', { /* ... */ })
api.quizanswer.delete('abc123')
api.quizanswer.findOne({ /* any field */ })
api.quizanswer.count({ where: { /* filter */ } })
```

---

## QuizResult Client (`api.quizresult`)

### Core Methods (Inherited)
```typescript
api.quizresult.list({ take: 20, orderBy: { id: 'desc' } })
api.quizresult.get('abc123')
api.quizresult.create({ /* ... */ })
api.quizresult.update('abc123', { /* ... */ })
api.quizresult.delete('abc123')
api.quizresult.findOne({ /* any field */ })
api.quizresult.count({ where: { /* filter */ } })
```

---

## BehaviorEvent Client (`api.behaviorevent`)

### Core Methods (Inherited)
```typescript
api.behaviorevent.list({ take: 20, orderBy: { id: 'desc' } })
api.behaviorevent.get('abc123')
api.behaviorevent.create({ /* ... */ })
api.behaviorevent.update('abc123', { /* ... */ })
api.behaviorevent.delete('abc123')
api.behaviorevent.findOne({ /* any field */ })
api.behaviorevent.count({ where: { /* filter */ } })
```

---

## BehaviorEventArchive Client (`api.behavioreventarchive`)

### Core Methods (Inherited)
```typescript
api.behavioreventarchive.list({ take: 20, orderBy: { id: 'desc' } })
api.behavioreventarchive.get('abc123')
api.behavioreventarchive.create({ /* ... */ })
api.behavioreventarchive.update('abc123', { /* ... */ })
api.behavioreventarchive.delete('abc123')
api.behavioreventarchive.findOne({ /* any field */ })
api.behavioreventarchive.count({ where: { /* filter */ } })
```

---

## PersonalityDimension Client (`api.personalitydimension`)

### Core Methods (Inherited)
```typescript
api.personalitydimension.list({ take: 20, orderBy: { id: 'desc' } })
api.personalitydimension.get('abc123')
api.personalitydimension.create({ /* ... */ })
api.personalitydimension.update('abc123', { /* ... */ })
api.personalitydimension.delete('abc123')
api.personalitydimension.findOne({ /* any field */ })
api.personalitydimension.count({ where: { /* filter */ } })
```

---

## UserDimensionScore Client (`api.userdimensionscore`)

### Core Methods (Inherited)
```typescript
api.userdimensionscore.list({ take: 20, orderBy: { id: 'desc' } })
api.userdimensionscore.get('abc123')
api.userdimensionscore.create({ /* ... */ })
api.userdimensionscore.update('abc123', { /* ... */ })
api.userdimensionscore.delete('abc123')
api.userdimensionscore.findOne({ /* any field */ })
api.userdimensionscore.count({ where: { /* filter */ } })
```

---

## CompatibilityScore Client (`api.compatibilityscore`)

### Core Methods (Inherited)
```typescript
api.compatibilityscore.list({ take: 20, orderBy: { id: 'desc' } })
api.compatibilityscore.get('abc123')
api.compatibilityscore.create({ /* ... */ })
api.compatibilityscore.update('abc123', { /* ... */ })
api.compatibilityscore.delete('abc123')
api.compatibilityscore.findOne({ /* any field */ })
api.compatibilityscore.count({ where: { /* filter */ } })
```

---

## DimensionMappingRule Client (`api.dimensionmappingrule`)

### Core Methods (Inherited)
```typescript
api.dimensionmappingrule.list({ take: 20, orderBy: { id: 'desc' } })
api.dimensionmappingrule.get('abc123')
api.dimensionmappingrule.create({ /* ... */ })
api.dimensionmappingrule.update('abc123', { /* ... */ })
api.dimensionmappingrule.delete('abc123')
api.dimensionmappingrule.findOne({ /* any field */ })
api.dimensionmappingrule.count({ where: { /* filter */ } })
```

---

## EventWeightConfig Client (`api.eventweightconfig`)

### Core Methods (Inherited)
```typescript
api.eventweightconfig.list({ take: 20, orderBy: { id: 'desc' } })
api.eventweightconfig.get('abc123')
api.eventweightconfig.create({ /* ... */ })
api.eventweightconfig.update('abc123', { /* ... */ })
api.eventweightconfig.delete('abc123')
api.eventweightconfig.findOne({ /* any field */ })
api.eventweightconfig.count({ where: { /* filter */ } })
```

---

## 🎨 Common Patterns

### Pagination
```typescript
// Same pattern for ALL models
const page1 = await api.post.list({ skip: 0, take: 20 })
const page2 = await api.post.list({ skip: 20, take: 20 })
```

### Filtering
```typescript
// Generic where clause (works everywhere)
await api.post.list({ where: { published: true } })
```

### Find by Field
```typescript
// Works with ANY unique field
await api.post.findOne({ slug: 'hello' })
await api.author.findOne({ email: 'john@example.com' })
```

### State Changes
```typescript
// All state changes via update (consistent!)
await api.post.update(123, { published: true })
await api.comment.update(456, { approved: true })
```

---

## 🔐 Authentication

All methods automatically include auth headers if configured:

```typescript
import { quickSDKWithAuth } from './gen/sdk'

const api = quickSDKWithAuth('http://localhost:3000', myToken)

// All calls include: Authorization: Bearer <token>
await api.post.create({ ... })
```

---

## 💡 Remember

1. **7 core methods work on EVERY model** - Learn once, use everywhere
2. **Helpers are optional sugar** - Use when convenient
3. **Consistent patterns** - If it works on one model, it works on all
4. **Type-safe** - TypeScript guides you with autocomplete

**You now know the entire API!** 🎉
