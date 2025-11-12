# @ssot-ui/data-table

> Production-ready data table component with sorting, filtering, search, and pagination

[![Version](https://img.shields.io/npm/v/@ssot-ui/data-table.svg)](https://www.npmjs.com/package/@ssot-ui/data-table)
[![License](https://img.shields.io/npm/l/@ssot-ui/data-table.svg)](https://github.com/yourusername/ssot-codegen/blob/main/LICENSE)

## ✨ Features

- ✅ **Sorting**: Multi-column with visual indicators
- ✅ **Filtering**: Text, enum, boolean, date-range, number-range
- ✅ **Search**: Debounced across specified fields
- ✅ **Pagination**: Page numbers or infinite scroll
- ✅ **Export**: CSV with current filters
- ✅ **Virtualization**: Auto-enable for large datasets (>1000 rows)
- ✅ **Accessible**: WCAG 2.1 AA compliant
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Customizable**: Override any behavior

---

## 📦 Installation

```bash
npm install @ssot-ui/data-table @ssot-ui/tokens
```

Also install peer dependencies:
```bash
npm install react react-dom
```

---

## 🚀 Quick Start

```tsx
import { DataTable } from '@ssot-ui/data-table'
import '@ssot-ui/data-table/styles.css'
import { usePostList } from '@/sdk/hooks'

export default function PostsPage() {
  return (
    <DataTable
      hook={usePostList}
      columns={[
        { key: 'title', header: 'Title', sortable: true },
        { key: 'author.name', header: 'Author' },
        { key: 'createdAt', header: 'Created', sortable: true }
      ]}
    />
  )
}
```

---

## 📖 API Reference

### Props

#### Data Source

**Option 1: Use SDK hook** (recommended)
```tsx
<DataTable
  hook={usePostList}
  hookParams={{ include: { author: true } }}
/>
```

**Option 2: Explicit data**
```tsx
<DataTable
  data={posts}
  total={totalCount}
  isLoading={loading}
  error={error}
  onParamsChange={(params) => fetchData(params)}
/>
```

#### Columns (Required)

```tsx
<DataTable
  columns={[
    {
      key: 'title',              // Field name (supports nested: 'author.name')
      header: 'Post Title',      // Display label
      sortable: true,            // Enable sorting
      filterType: 'text',        // Enable filtering
      cellRender: (value, row, index) => (
        <Link href={`/posts/${row.id}`}>{value}</Link>
      )
    }
  ]}
/>
```

#### Search

```tsx
<DataTable
  searchable={['title', 'content']}  // Search these fields
  searchPlaceholder="Search posts..."
/>
```

#### Filters

```tsx
<DataTable
  filterable={[
    {
      field: 'published',
      type: 'boolean',
      label: 'Status'
    },
    {
      field: 'category',
      type: 'enum',
      label: 'Category',
      options: [
        { label: 'Tech', value: 'tech' },
        { label: 'News', value: 'news' }
      ]
    }
  ]}
/>
```

---

## 🎨 Examples

See Storybook for interactive examples:
```bash
cd packages/ui-data-table
pnpm storybook
```

---

## ♿ Accessibility

- ✅ Keyboard navigation (arrow keys, tab, enter)
- ✅ ARIA roles and labels
- ✅ Screen reader support
- ✅ Focus indicators (2px ring)
- ✅ WCAG 2.1 AA compliant

---

## 📜 License

MIT © SSOT CodeGen

