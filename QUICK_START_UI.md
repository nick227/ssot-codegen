# 🚀 Quick Start: UI Generation

Generate complete websites from your Prisma schema in 3 easy steps.

## Step 1: Choose Your Approach

### Option A: Zero Config (30 seconds) ⚡
```bash
npx ssot-gen ui
```

**Gets you:**
- CRUD pages for all models
- Working forms and tables
- Basic navigation
- Professional UI

**Best for:** Quick prototypes, admin panels, internal tools

---

### Option B: Template (5 minutes) 🎨
```bash
npx ssot-gen ui --template blog
```

**Available templates:**
- `blog` - Blog with posts, categories, comments
- `dashboard` - Admin dashboard with sidebar
- `ecommerce` - Product catalog with cart
- `landing` - Marketing landing page

**Best for:** Starting a new project

---

### Option C: Full Control (30-60 minutes) 🎯
```bash
# 1. Create config file
cp node_modules/@ssot/gen/ssot.ui.config.example.ts ssot.ui.config.ts

# 2. Edit ssot.ui.config.ts for your needs

# 3. Generate
npx ssot-gen ui --config ssot.ui.config.ts
```

**Best for:** Production apps, custom requirements

## Step 2: Customize (Optional)

### Quick Customization

Edit `ssot.ui.config.ts`:

```typescript
export default {
  // Change colors
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6'
    }
  },
  
  // Add navigation
  navigation: {
    header: {
      title: 'My App',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Posts', href: '/posts' }
      ]
    }
  },
  
  // Auto-generate CRUD pages
  generation: {
    crudPages: {
      enabled: true,
      models: 'all'  // or ['Post', 'User']
    }
  }
}
```

### Add Custom Pages

```typescript
pages: [
  {
    path: 'dashboard',
    type: 'dashboard',
    sections: [{
      type: 'content',
      components: [
        // Use Grid for layout
        {
          type: 'Grid',
          props: { cols: 3 },
          children: [
            { type: 'Card', children: 'Total Users: 1,234' },
            { type: 'Card', children: 'Total Posts: 5,678' },
            { type: 'Card', children: 'Revenue: $12,345' }
          ]
        },
        // Use DataTable for data
        {
          type: 'DataTable',
          props: {
            model: 'post',
            columns: [
              { key: 'title', label: 'Title' },
              { key: 'author', label: 'Author' }
            ]
          }
        }
      ]
    }]
  }
]
```

## Step 3: Run & Test

```bash
# Generate UI
npx ssot-gen ui --config ssot.ui.config.ts --output ./src

# Your generated files:
# src/
# ├── app/
# │   ├── page.tsx              (Home page)
# │   ├── dashboard/page.tsx    (Custom dashboard)
# │   └── posts/                (Auto-generated CRUD)
# ├── components/
# │   └── ssot/                 (Smart components)
# └── config/
#     └── theme.ts              (Theme config)
```

## 🎯 Common Scenarios

### Blog Website
```bash
npx ssot-gen ui --template blog
```

### Admin Dashboard
```bash
npx ssot-gen ui --template dashboard
```

### E-commerce Site
```bash
npx ssot-gen ui --template ecommerce
```

### Landing Page
```bash
npx ssot-gen ui --template landing
```

### Custom App
```bash
# Generate CRUD for specific models
npx ssot-gen ui --models Post,User,Comment

# Generate with custom config
npx ssot-gen ui --config ssot.ui.config.ts
```

## 📚 Available Components

Use these in your pages:

**Layout:**
`Container`, `Grid`, `Stack`, `Header`, `Footer`, `Sidebar`

**UI:**
`Button`, `Card`, `Badge`, `Modal`, `Dropdown`, `Tabs`, `Accordion`, `Alert`

**Data (Smart):**
`DataTable`, `Form`, `Button` (with actions)

**Templates:**
`DashboardLayout`, `LandingLayout`, `AuthLayout`, `Hero`, `Section`

## 🔧 CLI Commands

```bash
# List available templates
npx ssot-gen ui --list-templates

# Generate from schema
npx ssot-gen ui --schema ./schema.prisma

# Generate with config
npx ssot-gen ui --config ssot.ui.config.ts

# Specific models only
npx ssot-gen ui --models Post,User

# Preview without writing
npx ssot-gen ui --dry-run

# Components only
npx ssot-gen ui --components-only

# Pages only
npx ssot-gen ui --pages-only
```

## 📖 Learn More

- [UI Configuration Guide](docs/UI_CONFIGURATION_GUIDE.md) - Complete config reference
- [Developer Workflow](docs/UI_DEVELOPER_WORKFLOW.md) - Detailed workflow
- [Component Library](packages/ui/shared/README.md) - Component docs
- [Examples](examples/blog-with-ui/) - Working examples

## 💡 Tips

1. **Start simple** - Use zero config first
2. **Use templates** - Don't start from scratch
3. **Customize gradually** - Add features as needed
4. **Override selectively** - Only customize what you need
5. **Reuse components** - Build with existing components

## ❓ Troubleshooting

**Q: No pages generated?**  
A: Check your schema has models (excluding Session, Account, etc.)

**Q: Components not found?**  
A: Make sure you ran generation with `--components` or full generation

**Q: Styles not working?**  
A: Ensure Tailwind CSS is configured in your project

**Q: SDK errors?**  
A: Run `npx ssot-gen` first to generate the SDK

## 🎉 You're Ready!

```bash
# One command to get started:
npx ssot-gen ui --template blog

# Then customize and deploy! 🚀
```

---

**Need help?** See the [full documentation](docs/UI_CONFIGURATION_GUIDE.md)

