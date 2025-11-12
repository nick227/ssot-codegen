# UI Configuration Guide

Complete guide for defining UI pages, layouts, and functionality in SSOT.

## 📋 Overview

Developers define UI through **three approaches**:

1. **Auto-generation** - Generate CRUD pages directly from Prisma schema (zero config)
2. **Template-based** - Start with pre-built templates (blog, dashboard, e-commerce)
3. **Declarative config** - Full control via `ssot.ui.config.ts` (recommended)

## 🚀 Quick Start

### Option 1: Auto-Generation (Zero Config)

```bash
# Generate CRUD pages for all models
npx ssot-gen ui

# This reads your schema.prisma and generates:
# - List pages for each model
# - Detail pages with edit/delete
# - Create/edit forms
# - Navigation structure
```

### Option 2: Use a Template

```bash
# Start with a pre-built template
npx ssot-gen ui --template blog

# Available templates:
# - blog      (Blog with posts, categories, comments)
# - dashboard (Admin dashboard with sidebar)
# - ecommerce (Product catalog, cart, checkout)
# - landing   (Marketing landing page)
```

### Option 3: Declarative Configuration

```bash
# Create configuration file
cp node_modules/@ssot/gen/ssot.ui.config.example.ts ssot.ui.config.ts

# Edit ssot.ui.config.ts to define your UI

# Generate
npx ssot-gen ui --config ssot.ui.config.ts
```

## 📝 Configuration File Structure

```typescript
// ssot.ui.config.ts
import type { UiConfig } from '@ssot/gen'

const config: UiConfig = {
  site: { ... },        // Site-wide settings
  theme: { ... },       // Colors, fonts, dark mode
  navigation: { ... },  // Header, sidebar, footer
  pages: [ ... ],       // Page definitions
  generation: { ... },  // Auto-generation settings
  components: { ... }   // Component customization
}

export default config
```

## 🎨 Defining Pages

### Approach 1: Auto-Generate from Schema

```typescript
generation: {
  crudPages: {
    enabled: true,
    models: 'all', // or ['Post', 'User']
    exclude: ['Session', 'VerificationToken'],
    
    list: {
      features: ['search', 'filter', 'sort', 'pagination'],
      columns: {
        Post: ['title', 'author', 'status', 'createdAt']
      }
    },
    
    detail: {
      features: ['edit', 'delete', 'share']
    },
    
    form: {
      features: ['validation', 'autosave']
    }
  }
}
```

This generates:
- `/posts` → List page
- `/posts/[id]` → Detail page
- `/posts/new` → Create page
- `/posts/[id]/edit` → Edit page

### Approach 2: Define Custom Pages

```typescript
pages: [
  {
    path: 'dashboard',
    type: 'dashboard',
    layout: 'dashboard',
    title: 'Dashboard',
    requiresAuth: true,
    sections: [
      {
        type: 'content',
        components: [
          {
            type: 'Grid',
            props: { cols: 4, gap: 6 },
            children: [
              { type: 'Card', children: 'Total Users' },
              { type: 'Card', children: 'Total Posts' },
              { type: 'Card', children: 'Comments' },
              { type: 'Card', children: 'Revenue' }
            ]
          }
        ]
      }
    ]
  }
]
```

### Approach 3: Hybrid (Auto + Custom)

```typescript
{
  generation: {
    crudPages: {
      enabled: true,
      models: ['Post', 'User', 'Comment']
    }
  },
  
  pages: [
    // Custom dashboard
    { path: 'dashboard', type: 'dashboard', ... },
    
    // Custom landing page
    { path: 'home', type: 'landing', ... },
    
    // Override auto-generated post list
    {
      path: 'posts',
      model: 'Post',
      type: 'list',
      overrides: {
        disableAutoGeneration: true
      },
      sections: [
        // Your custom implementation
      ]
    }
  ]
}
```

## 🏗️ Page Types

### 1. List Page (Auto-Generated)

```typescript
{
  path: 'posts',
  model: 'Post',
  type: 'list',
  layout: 'dashboard'
}
```

Generates:
- Data table with model fields
- Search, filter, sort
- Create button
- Row actions (view, edit, delete)

### 2. Detail Page (Auto-Generated)

```typescript
{
  path: 'posts/[id]',
  model: 'Post',
  type: 'detail',
  layout: 'dashboard'
}
```

Generates:
- Field display
- Edit/delete buttons
- Related records

### 3. Form Page (Auto-Generated)

```typescript
{
  path: 'posts/new',
  model: 'Post',
  type: 'form',
  layout: 'dashboard'
}
```

Generates:
- Form inputs for all fields
- Validation
- Submit/cancel buttons

### 4. Dashboard Page (Custom)

```typescript
{
  path: 'dashboard',
  type: 'dashboard',
  layout: 'dashboard',
  sections: [
    {
      type: 'content',
      components: [
        { type: 'Grid', ... },
        { type: 'DataTable', ... },
        { type: 'Chart', ... }
      ]
    }
  ]
}
```

### 5. Landing Page (Custom)

```typescript
{
  path: 'home',
  type: 'landing',
  layout: 'landing',
  sections: [
    {
      type: 'hero',
      config: {
        title: 'Welcome',
        description: 'Build amazing things'
      }
    },
    {
      type: 'content',
      components: [ ... ]
    }
  ]
}
```

## 🧩 Available Components

### Layout Components

```typescript
{ type: 'Container', props: { size: 'lg' } }
{ type: 'Grid', props: { cols: 3, gap: 6 } }
{ type: 'Stack', props: { direction: 'vertical', spacing: 4 } }
{ type: 'Header', props: { title: 'My App', links: [...] } }
{ type: 'Footer', props: { sections: [...] } }
{ type: 'Sidebar', props: { sections: [...] } }
```

### UI Components

```typescript
{ type: 'Button', props: { variant: 'primary' } }
{ type: 'Card', props: { padding: 'lg', hover: true } }
{ type: 'Badge', props: { variant: 'success' } }
{ type: 'Modal', props: { title: 'Confirm' } }
{ type: 'Dropdown', props: { options: [...] } }
{ type: 'Tabs', props: { tabs: [...] } }
{ type: 'Accordion', props: { items: [...] } }
{ type: 'Alert', props: { variant: 'info' } }
```

### Data Components (Smart)

```typescript
// Auto-fetching table
{
  type: 'DataTable',
  props: {
    model: 'post',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'author', label: 'Author' }
    ],
    where: { status: 'published' },
    orderBy: { createdAt: 'desc' }
  }
}

// Auto-fetching form
{
  type: 'Form',
  props: {
    model: 'post',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'content', label: 'Content', type: 'textarea' }
    ]
  }
}
```

### Page Templates

```typescript
{ type: 'Hero', props: { title: '...', description: '...' } }
{ type: 'Section', props: { title: '...', centered: true } }
{ type: 'DashboardLayout', props: { header: ..., sidebar: ... } }
{ type: 'LandingLayout', props: { header: ..., footer: ... } }
{ type: 'AuthLayout', props: { title: '...', logo: ... } }
```

## 🎨 Theme Configuration

```typescript
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
    body: 'Inter',
    mono: 'JetBrains Mono'
  },
  darkMode: true
}
```

## 🧭 Navigation Configuration

```typescript
navigation: {
  header: {
    enabled: true,
    title: 'My App',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Posts', href: '/posts' },
      { label: 'About', href: '/about' }
    ]
  },
  
  sidebar: {
    enabled: true,
    collapsible: true,
    sections: [
      {
        title: 'Main',
        links: [
          { label: 'Dashboard', href: '/dashboard', icon: '📊' },
          { label: 'Analytics', href: '/analytics', icon: '📈' }
        ]
      }
    ]
  },
  
  footer: {
    enabled: true,
    sections: [ ... ],
    copyright: '© 2024 My App'
  }
}
```

## 🔐 Authentication & Authorization

```typescript
pages: [
  {
    path: 'admin',
    requiresAuth: true,
    roles: ['admin', 'moderator'],
    ...
  }
]
```

```typescript
navigation: {
  header: {
    links: [
      { 
        label: 'Admin', 
        href: '/admin',
        requiresAuth: true,
        roles: ['admin']
      }
    ]
  }
}
```

## 📊 Example Configurations

### Blog Site

```typescript
{
  generation: {
    crudPages: {
      enabled: true,
      models: ['Post', 'Category', 'Comment'],
      list: {
        columns: {
          Post: ['title', 'excerpt', 'author', 'category', 'createdAt']
        }
      }
    }
  },
  
  pages: [
    {
      path: 'home',
      type: 'landing',
      sections: [
        { type: 'hero', ... },
        {
          type: 'content',
          components: [
            { type: 'DataTable', props: { model: 'post' } }
          ]
        }
      ]
    }
  ]
}
```

### Admin Dashboard

```typescript
{
  navigation: {
    sidebar: {
      enabled: true,
      sections: [
        {
          title: 'Content',
          links: [
            { label: 'Posts', href: '/posts', icon: '📝' },
            { label: 'Users', href: '/users', icon: '👥' }
          ]
        }
      ]
    }
  },
  
  generation: {
    crudPages: { enabled: true, models: 'all' },
    dashboard: {
      enabled: true,
      widgets: [
        { type: 'stat', title: 'Total Posts', model: 'Post' },
        { type: 'table', title: 'Recent Activity', model: 'AuditLog' }
      ]
    }
  }
}
```

## 🔧 Component Customization

### Override Default Components

```typescript
components: {
  overrides: {
    'DataTable': './components/custom/MyDataTable',
    'Form': './components/custom/MyForm'
  },
  
  defaults: {
    Button: { variant: 'primary', size: 'md' },
    Card: { padding: 'md', hover: true }
  }
}
```

## 🚀 Generation Commands

```bash
# Auto-generate from schema only
npx ssot-gen ui

# Use template
npx ssot-gen ui --template blog

# Use config file
npx ssot-gen ui --config ssot.ui.config.ts

# Specific models only
npx ssot-gen ui --models Post,User,Comment

# Dry run (preview without writing)
npx ssot-gen ui --dry-run

# Output to custom directory
npx ssot-gen ui --output ./custom-output
```

## 📚 Integration with Existing Config

Merge with `ssot.config.ts`:

```typescript
// ssot.config.ts
import type { SsotConfig } from '@ssot/gen'
import uiConfig from './ssot.ui.config'

const config: SsotConfig = {
  prisma: { ... },
  plugins: [ ... ],
  api: { ... },
  
  // Add UI configuration
  ui: uiConfig
}

export default config
```

Or keep separate:

```bash
npx ssot-gen api    # Generate API from ssot.config.ts
npx ssot-gen ui     # Generate UI from ssot.ui.config.ts
```

## ✅ Best Practices

1. **Start with auto-generation** for CRUD pages
2. **Use templates** for common patterns
3. **Customize gradually** as needs arise
4. **Keep configs DRY** - use generation settings
5. **Override selectively** - only customize what's needed
6. **Version control** your config files
7. **Document custom components** in your project

## 🎯 Next Steps

1. Copy `ssot.ui.config.example.ts` to your project
2. Customize for your schema
3. Run `npx ssot-gen ui`
4. Iterate and refine

Happy building! 🚀

