# @ssot-ui/data-table - Prop API Specification v1.0.0

## 🎯 Production-Safe, Minimal API

Built for immediate implementation. Every prop is essential.

---

## 📝 Component Signature

```typescript
<DataTable<T>
  // Data source (REQUIRED)
  hook={usePostList}
  hookParams?: ListParams
  
  // OR explicit data (for custom fetching)
  data?: T[]
  total?: number
  isLoading?: boolean
  error?: ErrorShape
  
  // Columns (REQUIRED)
  columns={ColumnDef<T>[]}
  
  // Search
  searchable?: boolean | string[]
  searchPlaceholder?: string
  
  // Filters
  filterable?: FilterDef<T>[]
  
  // Sorting
  defaultSort?: Array<{ field: string; dir: 'asc' | 'desc' }>
  
  // Pagination
  pagination?: 'pages' | 'infinite' | false
  defaultPageSize?: number
  pageSizeOptions?: number[]
  
  // Row actions
  rowActions?: (row: T) => ReactNode
  onRowClick?: (row: T) => void
  
  // Export
  exportable?: boolean | 'client' | 'server'
  exportFilename?: string
  onExportServer?: (params: ListParams) => Promise<Blob>
  
  // Customization
  emptyState?: ReactNode
  loadingState?: ReactNode
  errorState?: (error: ErrorShape) => ReactNode
  
  // Virtualization
  virtualize?: boolean | { threshold: number }
  rowHeight?: number
  
  // Messages (i18n)
  messages?: Messages
  
  // Styling
  className?: string
  tableClassName?: string
  compact?: boolean
/>
```

---

## 📋 Type Definitions

### ColumnDef

```typescript
interface ColumnDef<T> {
  // Required
  key: string                          // Field path: 'title' or 'author.name'
  header: string                       // Display label
  
  // Optional
  sortable?: boolean                   // Enable sorting (default: false)
  filterType?: FilterType              // Enable filtering
  width?: number | string              // Column width
  align?: 'left' | 'center' | 'right'  // Text alignment
  
  // Custom rendering
  cellRender?: (value: any, row: T, index: number) => ReactNode
  headerRender?: (column: ColumnDef<T>) => ReactNode
  
  // Visibility
  visible?: boolean | ((row: T) => boolean)
  
  // Export
  exportable?: boolean                 // Include in CSV export
  exportFormat?: (value: any) => string
}

type FilterType = 
  | 'text'         // Text input with operators (contains, equals, etc.)
  | 'enum'         // Multi-select dropdown
  | 'boolean'      // True/false/all toggle
  | 'date-range'   // From/to date pickers
  | 'number-range' // Min/max inputs
```

---

### FilterDef

```typescript
interface FilterDef<T> {
  field: string                        // Field to filter
  type: FilterType                     // Filter UI type
  label?: string                       // Display label
  
  // For enum filters
  options?: Array<{
    label: string
    value: any
  }>
  
  // For number/date ranges
  min?: number | Date
  max?: number | Date
  
  // Custom filter function (client-side only)
  filterFn?: (row: T, value: any) => boolean
}
```

---

### Messages (i18n)

```typescript
interface Messages {
  search?: string                      // Default: 'Search...'
  noResults?: string                   // Default: 'No results found'
  loading?: string                     // Default: 'Loading...'
  error?: string                       // Default: 'Error loading data'
  
  // Pagination
  showing?: string                     // Default: 'Showing {start}-{end} of {total}'
  rowsPerPage?: string                 // Default: 'Rows per page'
  
  // Export
  export?: string                      // Default: 'Export'
  exportSuccess?: string               // Default: 'Export started'
  
  // Filters
  filters?: string                     // Default: 'Filters'
  clearFilters?: string                // Default: 'Clear all'
  applyFilters?: string                // Default: 'Apply'
}
```

---

## 🎯 Usage Examples

### Example 1: Minimal (Just Data)

```typescript
import { DataTable } from '@ssot-ui/data-table'
import { usePostList } from '@/sdk/hooks'

export default function PostsPage() {
  return (
    <DataTable
      hook={usePostList}
      columns={[
        { key: 'title', header: 'Title' },
        { key: 'author.name', header: 'Author' },
        { key: 'createdAt', header: 'Created' }
      ]}
    />
  )
}
```

**Renders**: Basic table with 3 columns, default pagination (20 items/page)

---

### Example 2: Full Featured

```typescript
<DataTable
  hook={usePostList}
  hookParams={{ include: { author: true } }}
  
  columns={[
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      filterType: 'text',
      cellRender: (value, post) => (
        <Link href={`/posts/${post.id}`} className="font-medium hover:underline">
          {value}
        </Link>
      )
    },
    {
      key: 'author.email',
      header: 'Author',
      sortable: true,
      filterType: 'enum',
      cellRender: (email, post) => (
        <div className="flex items-center gap-2">
          <Avatar src={post.author.avatar} />
          <span>{email}</span>
        </div>
      )
    },
    {
      key: 'published',
      header: 'Status',
      filterType: 'boolean',
      cellRender: (value) => (
        <Badge variant={value ? 'success' : 'secondary'}>
          {value ? 'Published' : 'Draft'}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      filterType: 'date-range',
      cellRender: (date) => new Date(date).toLocaleDateString()
    }
  ]}
  
  searchable={['title', 'content']}
  searchPlaceholder="Search posts..."
  
  filterable={[
    {
      field: 'published',
      type: 'boolean',
      label: 'Status'
    },
    {
      field: 'author.email',
      type: 'enum',
      label: 'Author',
      options: authors.map(a => ({ label: a.email, value: a.email }))
    }
  ]}
  
  defaultSort={[
    { field: 'createdAt', dir: 'desc' }
  ]}
  
  pagination="pages"
  defaultPageSize={20}
  pageSizeOptions={[10, 20, 50, 100]}
  
  rowActions={(post) => (
    <>
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/posts/${post.id}/edit`}>Edit</Link>
      </Button>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => deletePost.mutate(post.id)}
      >
        Delete
      </Button>
    </>
  )}
  
  exportable="server"
  exportFilename="posts-export.csv"
  onExportServer={async (params) => {
    const blob = await api.posts.export(params)
    return blob
  }}
  
  virtualize={{ threshold: 1000 }}
  
  emptyState={
    <div className="text-center py-12">
      <p className="text-muted-foreground mb-4">No posts yet</p>
      <Button asChild>
        <Link href="/posts/new">Create your first post</Link>
      </Button>
    </div>
  }
/>
```

---

## 🔧 Internal Behavior Specification

### Multi-Column Sort

**Visual indicators**:
- First sort: ↑ or ↓ (large arrow)
- Second sort: ¹ (small superscript 1)
- Third sort: ² (small superscript 2)

**Stable sort order list**:
```
Current sort:
  1. createdAt ↓ (desc)
  2. title ↑ (asc)
  
[Clear all sorts]
```

**Click behavior**:
- No sort → Asc (↑)
- Asc → Desc (↓)
- Desc → Remove from sort

---

### Filter UI

**One control per filterable column**:
```
┌────────────────────────────────────┐
│ Filters                      Clear │
├────────────────────────────────────┤
│ Status:   [Published ▼]           │
│ Author:   [Select... ▼]           │
│ Created:  [From] [To]              │
└────────────────────────────────────┘

Active filters:
  [Status: Published ×] [Author: john@... ×]
```

**Filter operators by type**:
- Text: contains, equals, starts with, ends with
- Enum: in (multi-select)
- Boolean: true, false, all
- Date range: between (from/to)
- Number range: between, lt, lte, gt, gte

---

### Virtualization

**Auto-enable when**:
- `rowCount > 1000` (default threshold)
- Or explicit: `virtualize={{ threshold: 500 }}`

**Implementation**:
- Use `@tanstack/react-virtual` or similar
- SSR-safe: Fallback to regular rendering on server
- Maintain scroll position on refetch
- Smooth scrolling with overscan

---

### Export CSV

**Client mode** (total ≤ 10k rows):
- Export current page data
- Or fetch all pages and export
- Generate CSV in browser
- Trigger download

**Server mode** (total > 10k rows):
- Send request to server with current filters
- Server generates CSV
- Server returns Blob
- Trigger download

**CSV format**:
```csv
Title,Author,Created,Status
"Hello World","john@example.com","2025-01-15","Published"
"Getting Started","jane@example.com","2025-01-14","Draft"
```

**Respects**:
- Column visibility
- Current filters
- Current sort order

---

## ♿ Accessibility Requirements

### Keyboard Navigation

**Table**:
- Tab: Move between interactive elements
- Arrow keys: Navigate cells (when focused)
- Enter/Space: Activate buttons/links
- Escape: Close dropdowns/modals

**Sort**:
- Click header or press Enter when focused
- Screen reader announces: "Sorted by Title ascending"

**Filter**:
- Tab through filter controls
- Enter to apply
- Escape to cancel

### ARIA

```html
<table role="grid" aria-label="Posts table">
  <thead>
    <tr>
      <th 
        id="col-title"
        role="columnheader"
        aria-sort="ascending"
        tabindex="0"
      >
        Title <span aria-hidden="true">↑</span>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr role="row">
      <td role="gridcell" headers="col-title">
        Hello World
      </td>
    </tr>
  </tbody>
</table>

<div role="status" aria-live="polite" aria-atomic="true">
  Showing 1-20 of 1234 results
</div>
```

### Focus Management

- Clear focus indicators (2px outline)
- Roving tabindex in table body
- Focus trap in filter dropdown
- Return focus after modal close

---

## 🎯 Error Handling

### Missing Relation Data

**Error**:
```typescript
if (column.key.includes('.') && value === undefined) {
  console.warn(
    `⚠️ @ssot-ui/data-table: Field '${column.key}' returned undefined\n\n` +
    `Problem:\n` +
    `  The field '${column.key}' is not present in the data\n\n` +
    `Why:\n` +
    `  The relation '${relation}' was not included in the query\n\n` +
    `How to fix:\n` +
    `  Add the relation to your query hook:\n\n` +
    `  ${hookName}({ include: { ${relation}: true } })\n\n` +
    `Current data structure:\n` +
    `  ${JSON.stringify(Object.keys(row), null, 2)}\n\n` +
    `📖 Docs: https://ssot-codegen.dev/ui/data-table#relations`
  )
}
```

---

## 📦 Dependencies

**Required**:
- React 18+
- TypeScript 5+
- @ssot-ui/tokens

**Peer dependencies**:
- @tanstack/react-query (if using hook mode)
- @tanstack/react-virtual (for virtualization)

**Optional**:
- react-day-picker (for date filters)
- papaparse (for CSV export)

---

## 🎯 Implementation Checklist

### Week 1: Core Table
- [ ] Basic table rendering with columns
- [ ] Hook integration with SDK contract
- [ ] Loading/error/empty states
- [ ] Column width handling
- [ ] Responsive design (stack on mobile)

### Week 2: Sorting & Filtering
- [ ] Multi-column sort with visual indicators
- [ ] Sort state management
- [ ] Filter UI per type (text, enum, boolean, date, number)
- [ ] Active filter chips
- [ ] Filter application to query

### Week 3: Search & Pagination
- [ ] Search input with debounce
- [ ] Search highlighting (optional)
- [ ] Page number pagination
- [ ] Infinite scroll mode
- [ ] Page size selector

### Week 4: Export & Polish
- [ ] CSV export (client mode)
- [ ] CSV export (server mode)
- [ ] Virtualization with threshold
- [ ] Accessibility audit (keyboard, ARIA, focus)
- [ ] Error messages with solutions

### Week 5: Testing & Docs
- [ ] 20+ unit tests
- [ ] 5 Storybook stories
- [ ] README with examples
- [ ] API documentation
- [ ] Bundle size check (<60kb)

---

## 🎯 MVP Scope (Ship First)

**MUST HAVE**:
- ✅ Column rendering
- ✅ Hook integration
- ✅ Sorting (single + multi)
- ✅ Pagination (pages)
- ✅ Loading/error/empty states
- ✅ Basic accessibility

**NICE TO HAVE** (v1.1+):
- ⏳ Advanced filters
- ⏳ Search highlighting
- ⏳ Virtualization
- ⏳ CSV export
- ⏳ Infinite scroll

---

This is the complete, production-safe API for immediate implementation.

