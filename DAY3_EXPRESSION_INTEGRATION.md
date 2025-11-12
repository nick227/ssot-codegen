# 🚀 Day 3: Expression Integration with Smart Components

**Goal**: Wire @ssot-ui/expressions into generated smart components  
**Status**: Starting  
**Timeline**: 1 day

---

## 🎯 What We're Building

**Expression-Enabled Components**:
1. **DataTable** - visibleWhen for columns, conditional row rendering
2. **Button** - enabledWhen for permissions, RLS-aware
3. **Form** - field-level visibility and permissions

**Integration Points**:
- Component library uses @ssot-ui/expressions
- Generated pages pass expression configs
- RLS policies use expressions for authorization

---

## 📋 Tasks

**Morning** (3-4 hours):
1. Update DataTable to support visibleWhen on columns
2. Update Button to support enabledWhen
3. Update Form to support field visibility/permissions

**Afternoon** (2-3 hours):
4. Update page generators to emit expression configs
5. Wire RLS plugin to use expressions
6. Test with Track model

**Evening** (1-2 hours):
7. Test with all 3 presets
8. Fix any integration issues
9. Document expression usage

---

## 🔧 Technical Approach

**Add Expression Context**:
```tsx
// Generated app/layout.tsx
import { ExpressionContextProvider } from '@ssot-ui/expressions'

export default function RootLayout({ children }) {
  return (
    <ExpressionContextProvider 
      data={{}} 
      user={user}
      globals={{}}
    >
      {children}
    </ExpressionContextProvider>
  )
}
```

**Expression-Enabled DataTable**:
```tsx
<DataTable
  model="track"
  columns={[
    { 
      key: 'title', 
      label: 'Title',
      visibleWhen: { op: 'isAuthenticated' }
    },
    { 
      key: 'plays',
      label: 'Plays',
      visibleWhen: { op: 'hasRole', role: 'admin' }
    }
  ]}
/>
```

**Expression-Enabled Button**:
```tsx
<Button
  action="delete"
  model="track"
  id={track.id}
  enabledWhen={{
    op: 'or',
    args: [
      { op: 'isOwner', field: 'uploadedBy' },
      { op: 'hasRole', role: 'admin' }
    ]
  }}
>
  Delete
</Button>
```

---

**Starting implementation now...**

