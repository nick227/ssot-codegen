# Blog Example with UI

Complete blog website generated from Prisma schema + UI configuration.

## 🎯 What This Example Shows

- **Auto-generated CRUD pages** for Posts, Users, Categories, Tags, Comments
- **Custom pages** (Home, Dashboard, About)
- **Professional navigation** (Header, Sidebar, Footer)
- **Dashboard with stats** and recent activity
- **Public blog pages** with published posts
- **Admin panel** for content management

## 📁 Files

```
blog-with-ui/
├── schema.prisma           # Database schema
├── ssot.ui.config.ts       # UI configuration
└── README.md
```

## 🚀 Generate

### Option 1: Quick Start (Auto-generate)

```bash
# Generate from schema only (zero config)
pnpm ssot ui --schema schema.prisma --output ./generated
```

Gets you working CRUD pages immediately!

### Option 2: With Configuration (Recommended)

```bash
# Generate with full configuration
pnpm ssot ui --schema schema.prisma --config ssot.ui.config.ts --output ./generated
```

Gets you:
- Custom home page with hero section
- Dashboard with stats
- Admin panel with sidebar
- Professional header/footer
- CRUD pages for all models

### Option 3: Dry Run (Preview)

```bash
# See what files would be generated
pnpm ssot ui --schema schema.prisma --config ssot.ui.config.ts --dry-run
```

## 📦 What Gets Generated

```
generated/
├── app/
│   ├── page.tsx                      # Custom home page
│   ├── dashboard/page.tsx            # Custom dashboard
│   ├── about/page.tsx                # About page
│   │
│   ├── admin/                        # Admin routes
│   │   ├── posts/
│   │   │   ├── page.tsx             # Posts list
│   │   │   ├── [id]/page.tsx        # Post detail
│   │   │   ├── new/page.tsx         # Create post
│   │   │   └── [id]/edit/page.tsx   # Edit post
│   │   ├── users/...
│   │   ├── categories/...
│   │   ├── tags/...
│   │   └── comments/...
│   │
│   └── posts/                        # Public blog routes
│       ├── page.tsx                  # Published posts
│       └── [slug]/page.tsx           # Post view
│
├── components/
│   ├── ssot/                         # Smart components
│   │   ├── Button.tsx
│   │   ├── DataTable.tsx
│   │   ├── Form.tsx
│   │   └── index.ts
│   ├── AppHeader.tsx                 # Site header
│   ├── AppSidebar.tsx                # Admin sidebar
│   └── AppFooter.tsx                 # Site footer
│
└── config/
    └── theme.ts                      # Theme configuration
```

## 🎨 Customization

### Change Colors

Edit `ssot.ui.config.ts`:

```typescript
theme: {
  colors: {
    primary: '#your-color',
    secondary: '#your-color'
  }
}
```

### Add Pages

```typescript
pages: [
  {
    path: 'my-page',
    type: 'landing',
    sections: [...]
  }
]
```

### Modify Navigation

```typescript
navigation: {
  header: {
    links: [
      { label: 'My Link', href: '/my-link' }
    ]
  }
}
```

### Customize CRUD Pages

```typescript
generation: {
  crudPages: {
    list: {
      columns: {
        Post: ['title', 'author', 'status']  // Show these columns
      }
    }
  }
}
```

## 🔐 Authentication

Pages can require authentication:

```typescript
{
  path: 'admin',
  requiresAuth: true,
  roles: ['ADMIN', 'AUTHOR']
}
```

## 📚 Learn More

- [UI Configuration Guide](../../docs/UI_CONFIGURATION_GUIDE.md)
- [Developer Workflow](../../docs/UI_DEVELOPER_WORKFLOW.md)
- [Component Library](../../packages/ui/shared/README.md)

## 🚀 Next Steps

1. Generate the UI
2. Review generated files
3. Customize as needed
4. Add your business logic
5. Deploy!

