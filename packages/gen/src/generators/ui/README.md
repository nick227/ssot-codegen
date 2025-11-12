# UI Generation System

Complete system for generating modern, composable websites from Prisma schemas and JSON specifications.

## 🎯 Features

### 1. **Component Library** (`@ssot-ui/shared`)
Pre-built, production-ready React components:

**Layout Components:**
- `Container` - Responsive container with max-width
- `Grid` - Responsive grid layout
- `Stack` - Vertical/horizontal stacking
- `Header` - Application header with navigation
- `Footer` - Application footer
- `Sidebar` - Collapsible sidebar navigation

**UI Components:**
- `Button` - Action buttons with variants
- `Card` - Content containers
- `Badge` - Status indicators
- `Avatar` - User avatars
- `TimeAgo` - Relative time display
- `Modal` - Dialog modals
- `Dropdown` - Dropdown menus
- `Tabs` - Tabbed interfaces
- `Accordion` - Collapsible content
- `Alert` - Alert messages

**Page Templates:**
- `DashboardLayout` - Admin dashboard layout
- `LandingLayout` - Marketing page layout
- `AuthLayout` - Authentication page layout
- `Hero` - Hero section
- `Section` - Content sections

### 2. **Smart Components**
Self-contained components that fetch data and handle actions:

- `DataTable` - Auto-fetching table with sorting, filtering
- `Form` - Auto-fetching form with validation
- `Button` - Action buttons with built-in handlers (delete, save)

### 3. **Page Generation**
Generate complete CRUD pages from Prisma schema:

```typescript
generateUI(schema, {
  outputDir: './src',
  generateComponents: true,
  generatePages: true,
  models: ['Post', 'User']
})
```

### 4. **Website Composition**
Build complete websites from JSON specifications:

```typescript
const site = generateSite(siteConfig, schema, './src')
```

### 5. **Pre-built Templates**
Start with ready-made templates:

- **Blog** - Blog with posts and categories
- **Dashboard** - Admin dashboard
- **E-commerce** - Product catalog and cart
- **Landing** - Marketing landing page

## 📖 Usage

### Quick Start

```bash
# Generate CRUD pages from schema
npx ssot-gen ui --schema schema.prisma --output ./src

# Generate from template
npx ssot-gen ui --template blog --output ./src

# Generate from site config
npx ssot-gen ui --config site.json --schema schema.prisma --output ./src
```

### Programmatic Usage

```typescript
import { generateSite, createBlogTemplate } from '@ssot/gen'
import { parsePrismaSchema } from '@ssot/gen'

// Load schema
const schema = parsePrismaSchema('./schema.prisma')

// Option 1: Use a template
const template = createBlogTemplate()
const files = generateSite(template, schema, './src')

// Option 2: Custom configuration
const customSite = {
  name: 'My App',
  version: '1.0.0',
  pages: [
    {
      path: 'home',
      spec: {
        layout: 'landing',
        sections: [
          {
            type: 'hero',
            props: {
              title: 'Welcome',
              description: 'Build amazing things'
            }
          }
        ]
      }
    }
  ]
}

const files = generateSite(customSite, schema, './src')
```

### Site Configuration Format

```json
{
  "name": "My App",
  "version": "1.0.0",
  "theme": {
    "colors": {
      "primary": "#3b82f6",
      "secondary": "#8b5cf6"
    }
  },
  "navigation": {
    "header": {
      "title": "My App",
      "links": [
        { "label": "Home", "href": "/" },
        { "label": "About", "href": "/about" }
      ]
    }
  },
  "pages": [
    {
      "path": "home",
      "spec": {
        "layout": "landing",
        "sections": [
          {
            "type": "hero",
            "props": {
              "title": "Welcome to My App",
              "description": "Build amazing things"
            }
          },
          {
            "type": "content",
            "children": [
              {
                "type": "Grid",
                "props": { "cols": 3 },
                "children": [
                  { "type": "Card", "children": "Feature 1" },
                  { "type": "Card", "children": "Feature 2" },
                  { "type": "Card", "children": "Feature 3" }
                ]
              }
            ]
          }
        ]
      }
    }
  ]
}
```

## 🏗️ Architecture

### Component Hierarchy

```
Site Builder (JSON → Files)
├── Page Composer (Pages → Components)
│   ├── Layout Components (Structure)
│   ├── UI Components (Display)
│   └── Smart Components (Data + Actions)
├── Component Library (Reusable Components)
└── Handlers (Data, Form, Action, Navigation)
```

### Generated Structure

```
src/
├── app/
│   ├── page.tsx                    # Home page
│   ├── posts/
│   │   ├── page.tsx               # Posts list
│   │   ├── [id]/page.tsx          # Post detail
│   │   ├── new/page.tsx           # Create post
│   │   └── [id]/edit/page.tsx     # Edit post
│   └── ...
├── components/
│   ├── ssot/                       # Smart components
│   │   ├── Button.tsx
│   │   ├── DataTable.tsx
│   │   ├── Form.tsx
│   │   └── index.ts
│   ├── AppHeader.tsx               # Site header
│   ├── AppSidebar.tsx              # Site sidebar
│   └── AppFooter.tsx               # Site footer
└── config/
    └── theme.ts                    # Theme config
```

## 🎨 Styling

All components use Tailwind CSS for styling. Theme tokens can be customized:

```typescript
{
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    }
  }
}
```

## 🔌 Integration

### With Prisma Schema

The generator reads your Prisma schema to automatically create:

- CRUD pages for each model
- DataTables with proper columns
- Forms with correct field types
- Type-safe SDK calls

### With SSOT SDK

Smart components integrate directly with the generated SDK:

```tsx
<DataTable
  model="post"
  columns={[
    { key: 'title', label: 'Title' },
    { key: 'author', label: 'Author' }
  ]}
  actions={[
    { label: 'Delete', action: 'delete', variant: 'danger' }
  ]}
/>
```

## 📚 Examples

See the [examples](../../../examples/) directory for complete working examples:

- `blog-example` - Full-featured blog
- `ecommerce-example` - E-commerce site
- `search-example` - Search functionality

## 🚀 Next Steps

1. **Customize templates** - Modify pre-built templates
2. **Create components** - Add your own components
3. **Extend layouts** - Create custom layouts
4. **Add features** - Integrate auth, search, etc.

## 📝 Notes

- All components are TypeScript
- Uses Next.js App Router conventions
- Fully tree-shakeable
- Production-ready
- Accessible (WCAG 2.1 AA)

