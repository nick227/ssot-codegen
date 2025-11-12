# UI Developer Workflow

**How developers define UI pages, layout, and functionality in SSOT**

## 📋 Developer Input Files

Developers provide three configuration files:

```
my-project/
├── schema.prisma           ✅ Already provided
├── ssot.config.ts          ✅ Already provided (plugins, API settings)
└── ssot.ui.config.ts       🆕 New file for UI definition
```

## 🎯 Three Approaches

### 1️⃣ Zero Config (Auto-Generation)

**Input:** Just your Prisma schema

**Command:**
```bash
npx ssot-gen ui
```

**Output:**
- CRUD pages for all models
- List, detail, create, edit pages
- Navigation structure
- Working forms and tables

**When to use:** Quick prototypes, admin dashboards, internal tools

---

### 2️⃣ Template-Based

**Input:** Choose a template

**Command:**
```bash
npx ssot-gen ui --template blog
```

**Available templates:**
- `blog` - Blog with posts, categories, comments
- `dashboard` - Admin dashboard with sidebar
- `ecommerce` - Product catalog, cart, checkout  
- `landing` - Marketing landing page

**Output:** Complete website structure based on template

**When to use:** Starting a new project with common patterns

---

### 3️⃣ Declarative Configuration (Recommended)

**Input:** Create `ssot.ui.config.ts`

**Command:**
```bash
npx ssot-gen ui --config ssot.ui.config.ts
```

**Output:** Fully customized website

**When to use:** Production apps, custom requirements

## 📝 Configuration File Format

```typescript
// ssot.ui.config.ts
import type { UiConfig } from '@ssot/gen'

const config: UiConfig = {
  // 1. SITE INFO
  site: {
    name: 'My App',
    title: 'Welcome to My App',
    description: 'Built with SSOT'
  },

  // 2. THEME
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6'
    },
    darkMode: true
  },

  // 3. NAVIGATION (Header, Sidebar, Footer)
  navigation: {
    header: {
      title: 'My App',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Posts', href: '/posts' }
      ]
    },
    sidebar: {
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

  // 4. AUTO-GENERATION SETTINGS
  generation: {
    crudPages: {
      enabled: true,
      models: 'all',              // or ['Post', 'User']
      exclude: ['Session'],
      
      list: {
        features: ['search', 'filter', 'sort', 'pagination'],
        columns: {
          Post: ['title', 'author', 'status', 'createdAt']
        }
      }
    },
    
    dashboard: {
      enabled: true,
      widgets: [
        { type: 'stat', title: 'Total Posts', model: 'Post' },
        { type: 'stat', title: 'Total Users', model: 'User' }
      ]
    }
  },

  // 5. CUSTOM PAGES
  pages: [
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
          components: [
            {
              type: 'Grid',
              props: { cols: 3 },
              children: [
                { type: 'Card', children: 'Feature 1' },
                { type: 'Card', children: 'Feature 2' },
                { type: 'Card', children: 'Feature 3' }
              ]
            }
          ]
        }
      ]
    }
  ]
}

export default config
```

## 🔄 Complete Workflow

### Step 1: Define Your Schema

```prisma
// schema.prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  status    String   @default("draft")
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
}

model User {
  id    String @id @default(cuid())
  name  String
  email String @unique
  posts Post[]
}
```

### Step 2: Choose Your Approach

#### Option A: Zero Config
```bash
npx ssot-gen ui
```
✅ Gets working CRUD pages immediately

#### Option B: Start with Template
```bash
npx ssot-gen ui --template blog
```
✅ Gets professional blog structure

#### Option C: Full Control
```bash
cp node_modules/@ssot/gen/ssot.ui.config.example.ts ssot.ui.config.ts
# Edit ssot.ui.config.ts
npx ssot-gen ui --config ssot.ui.config.ts
```
✅ Gets exactly what you specify

### Step 3: Customize (Optional)

```typescript
// ssot.ui.config.ts

// Override auto-generated post list page
pages: [
  {
    path: 'posts',
    model: 'Post',
    type: 'list',
    overrides: {
      disableAutoGeneration: true  // Turn off auto-gen for this page
    },
    sections: [
      {
        type: 'content',
        components: [
          // Your custom layout
          {
            type: 'Tabs',
            props: {
              tabs: [
                { label: 'Published', value: 'published' },
                { label: 'Drafts', value: 'draft' }
              ]
            },
            children: [
              {
                type: 'DataTable',
                props: {
                  model: 'post',
                  where: { status: 'published' },
                  columns: [...]
                }
              }
            ]
          }
        ]
      }
    ]
  }
]
```

## 🎨 What Gets Generated

### From Schema Only
```
src/
├── app/
│   ├── posts/
│   │   ├── page.tsx              (List page)
│   │   ├── [id]/page.tsx         (Detail page)
│   │   ├── new/page.tsx          (Create page)
│   │   └── [id]/edit/page.tsx    (Edit page)
│   └── users/
│       └── ... (same structure)
```

### With Configuration
```
src/
├── app/
│   ├── page.tsx                   (Custom home page)
│   ├── dashboard/page.tsx         (Custom dashboard)
│   ├── posts/...                  (Auto-generated CRUD)
│   └── users/...                  (Auto-generated CRUD)
├── components/
│   ├── ssot/                      (Smart components)
│   ├── AppHeader.tsx              (From config)
│   ├── AppSidebar.tsx             (From config)
│   └── AppFooter.tsx              (From config)
└── config/
    └── theme.ts                   (From config)
```

## 🧩 Available Components

Developers can compose pages using these components:

### Layout
- `Container`, `Grid`, `Stack`
- `Header`, `Footer`, `Sidebar`
- `DashboardLayout`, `LandingLayout`, `AuthLayout`

### UI
- `Button`, `Card`, `Badge`, `Avatar`
- `Modal`, `Dropdown`, `Tabs`, `Accordion`, `Alert`
- `Hero`, `Section`

### Data (Smart Components)
- `DataTable` - Auto-fetches from SDK
- `Form` - Auto-fetches and submits
- `Button` - Built-in delete/save handlers

## 📊 Real-World Examples

### Example 1: Blog with Custom Home Page

```typescript
{
  // Auto-generate admin pages
  generation: {
    crudPages: {
      enabled: true,
      models: ['Post', 'Category', 'Comment']
    }
  },
  
  // Custom home page
  pages: [
    {
      path: 'home',
      type: 'landing',
      sections: [
        { type: 'hero', config: { title: 'My Blog' } },
        {
          type: 'content',
          components: [
            {
              type: 'DataTable',
              props: {
                model: 'post',
                where: { status: 'published' },
                orderBy: { createdAt: 'desc' }
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### Example 2: Dashboard with Stats

```typescript
{
  pages: [
    {
      path: 'dashboard',
      type: 'dashboard',
      sections: [
        {
          type: 'content',
          components: [
            {
              type: 'Grid',
              props: { cols: 4 },
              children: [
                { type: 'Card', children: 'Users: 1,234' },
                { type: 'Card', children: 'Posts: 5,678' },
                { type: 'Card', children: 'Comments: 9,012' },
                { type: 'Card', children: 'Revenue: $12,345' }
              ]
            },
            {
              type: 'DataTable',
              props: { model: 'post' }
            }
          ]
        }
      ]
    }
  ]
}
```

## 🔐 Authentication & Roles

```typescript
pages: [
  {
    path: 'admin',
    requiresAuth: true,
    roles: ['admin'],
    ...
  }
]

navigation: {
  header: {
    links: [
      {
        label: 'Admin Panel',
        href: '/admin',
        requiresAuth: true,
        roles: ['admin']
      }
    ]
  }
}
```

## ✅ Summary

**What developers provide:**
1. ✅ `schema.prisma` (already have)
2. ✅ `ssot.config.ts` (already have)
3. 🆕 `ssot.ui.config.ts` (NEW - optional but recommended)

**What they get:**
- Complete, working website
- CRUD pages for all models
- Custom pages they define
- Professional UI components
- Type-safe SDK integration
- Authentication/authorization
- Responsive layouts
- Dark mode support

**Developer effort:**
- Zero config: 0 minutes (just run command)
- Template: 5 minutes (choose template, customize)
- Full control: 30-60 minutes (define full config)

The system is **progressive** - start simple, add complexity as needed! 🚀

