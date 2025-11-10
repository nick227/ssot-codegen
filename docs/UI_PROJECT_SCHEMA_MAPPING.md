# UI Project Schema Mapping System

## 🎯 The Problem

We ship **pre-built UI projects** (Blog, E-commerce, CRM, etc.) with hardcoded field references:

```tsx
// Our "Blog" UI project expects:
<h1>{user.name}</h1>
<img src={user.avatar} />
<p>{post.title}</p>
<p>{post.content}</p>
```

But the developer's **actual schema** might be different:
- Table is `users` (plural) not `user`
- Field is `email` not `name`
- Field is `profilePic` not `avatar`
- Model is `BlogPost` not `Post`
- Field is `heading` not `title`

**Solution**: A **pre-build mapping** that translates our template variables to their actual schema.

---

## 🔧 Configuration System

### In `ssot.config.ts`

```typescript
// ssot.config.ts
export default {
  // Existing config...
  framework: 'express',
  
  // NEW: UI project configuration
  uiProjects: {
    // Which pre-built UI project to use
    template: 'blog',  // or 'ecommerce', 'crm', 'dashboard', etc.
    
    // Map template variables to actual schema
    schemaMappings: {
      // Model mappings (handle plural/singular/different names)
      models: {
        'user': 'User',        // Template uses 'user', actual model is 'User'
        'post': 'BlogPost',    // Template uses 'post', actual model is 'BlogPost'
        'comment': 'Comment'   // Template uses 'comment', actual model is 'Comment'
      },
      
      // Field mappings (handle different field names)
      fields: {
        // user model fields
        'user.name': 'User.email',           // Use email as display name
        'user.avatar': 'User.profilePic',    // Different field name
        'user.bio': 'User.about',            // Different field name
        
        // post model fields
        'post.title': 'BlogPost.heading',    // Different field name
        'post.content': 'BlogPost.body',     // Different field name
        'post.excerpt': 'BlogPost.summary',  // Different field name
        'post.published': 'BlogPost.isLive', // Different field name
        'post.author': 'BlogPost.writer',    // Different relation name
        
        // comment model fields
        'comment.content': 'Comment.text',
        'comment.author': 'Comment.user'
      }
    }
  }
}
```

---

## 📝 Template Variable System

### Pre-built UI projects use template variables

```tsx
// packages/ui-templates/blog/src/screens/PostList.tsx
// This is our TEMPLATE (ships with SSOT)

import { DataTable } from '@ssot-ui/data-table'
import { use{{Model}}List } from '@/sdk'  // Template variable

export function PostListScreen() {
  const { data } = use{{Model}}List()
  
  return (
    <DataTable
      data={data}
      columns={[
        { key: '{{model.title}}', label: 'Title' },
        { key: '{{model.author.name}}', label: 'Author' },
        { key: '{{model.published}}', label: 'Status' },
        { key: '{{model.createdAt}}', label: 'Date' }
      ]}
    />
  )
}
```

### After mapping, generates actual code

```tsx
// generated/ui/screens/PostList.tsx
// This is GENERATED based on user's mappings

import { DataTable } from '@ssot-ui/data-table'
import { useBlogPostList } from '@/sdk'  // Mapped: post → BlogPost

export function PostListScreen() {
  const { data } = useBlogPostList()
  
  return (
    <DataTable
      data={data}
      columns={[
        { key: 'heading', label: 'Title' },           // Mapped: title → heading
        { key: 'writer.email', label: 'Author' },     // Mapped: author.name → writer.email
        { key: 'isLive', label: 'Status' },           // Mapped: published → isLive
        { key: 'createdAt', label: 'Date' }           // No mapping needed
      ]}
    />
  )
}
```

---

## 🎨 Example: Blog Template

### Template Structure
```
packages/ui-templates/blog/
├── template.json              (Template metadata)
├── mappings.schema.json       (Required mappings)
├── src/
│   ├── screens/
│   │   ├── PostList.tsx       (Uses {{model.*}} variables)
│   │   ├── PostDetail.tsx
│   │   └── UserProfile.tsx
│   └── components/
│       ├── PostCard.tsx
│       └── AuthorBadge.tsx
└── README.md
```

### Template Metadata
```json
// packages/ui-templates/blog/template.json
{
  "id": "blog",
  "name": "Blog Template",
  "description": "Complete blog with posts, comments, and user profiles",
  "version": "1.0.0",
  
  "requiredModels": [
    {
      "template": "user",
      "description": "User/Author model",
      "requiredFields": [
        { "template": "name", "type": "String", "description": "Display name" },
        { "template": "avatar", "type": "String?", "description": "Profile image URL" }
      ],
      "optionalFields": [
        { "template": "bio", "type": "String?", "description": "User bio" }
      ]
    },
    {
      "template": "post",
      "description": "Blog post model",
      "requiredFields": [
        { "template": "title", "type": "String", "description": "Post title" },
        { "template": "content", "type": "String", "description": "Post body" },
        { "template": "published", "type": "Boolean", "description": "Published status" },
        { "template": "author", "type": "user", "description": "Post author relation" }
      ],
      "optionalFields": [
        { "template": "excerpt", "type": "String?", "description": "Short summary" }
      ]
    },
    {
      "template": "comment",
      "description": "Comment model",
      "requiredFields": [
        { "template": "content", "type": "String" },
        { "template": "post", "type": "post", "description": "Parent post" },
        { "template": "author", "type": "user", "description": "Comment author" }
      ]
    }
  ]
}
```

---

## 🔄 Mapping Resolution Process

### Step 1: User Configures Mappings
```typescript
// ssot.config.ts
uiProjects: {
  template: 'blog',
  schemaMappings: {
    models: {
      'user': 'User',
      'post': 'BlogPost',
      'comment': 'Comment'
    },
    fields: {
      'user.name': 'User.email',
      'post.title': 'BlogPost.heading',
      'post.content': 'BlogPost.body',
      'post.author': 'BlogPost.writer'
    }
  }
}
```

### Step 2: Generator Resolves Template Variables
```typescript
// packages/gen/src/ui/template-compiler.ts

export class TemplateCompiler {
  compile(template: UITemplate, mappings: SchemaMappings): GeneratedFiles {
    const resolver = new MappingResolver(mappings)
    const files = new Map<string, string>()
    
    // Process each template file
    for (const [path, content] of template.files) {
      const resolved = this.resolveVariables(content, resolver)
      files.set(path, resolved)
    }
    
    return { files }
  }
  
  private resolveVariables(content: string, resolver: MappingResolver): string {
    // Replace {{Model}} with actual model name
    content = content.replace(/\{\{Model\}\}/g, (match) => {
      return resolver.resolveModel('post') // 'BlogPost'
    })
    
    // Replace {{model.*}} with actual field paths
    content = content.replace(/\{\{model\.(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      return resolver.resolveField('post', path)
    })
    
    // Replace {{use{{Model}}List}} with actual hook name
    content = content.replace(/use\{\{Model\}\}List/g, (match) => {
      const model = resolver.resolveModel('post') // 'BlogPost'
      return `use${model}List`
    })
    
    return content
  }
}

export class MappingResolver {
  constructor(private mappings: SchemaMappings) {}
  
  resolveModel(templateModel: string): string {
    return this.mappings.models[templateModel] || capitalize(templateModel)
  }
  
  resolveField(templateModel: string, templatePath: string): string {
    const fullPath = `${templateModel}.${templatePath}`
    
    // Check if there's an explicit mapping
    if (this.mappings.fields[fullPath]) {
      // 'post.title' → 'BlogPost.heading' → 'heading'
      const mapped = this.mappings.fields[fullPath]
      return mapped.split('.').slice(1).join('.')
    }
    
    // Handle nested paths (author.name)
    const parts = templatePath.split('.')
    if (parts.length > 1) {
      // 'post.author.name' → resolve 'post.author' then '.name'
      const relationPath = `${templateModel}.${parts[0]}`
      const relationMapping = this.mappings.fields[relationPath]
      
      if (relationMapping) {
        // 'post.author' → 'BlogPost.writer'
        const [, relationField] = relationMapping.split('.')
        const restPath = parts.slice(1).join('.')
        
        // Now resolve 'writer.name' → 'writer.email'
        const nestedPath = `${relationField}.${restPath}`
        const nestedMapping = this.mappings.fields[`user.${restPath}`]
        
        if (nestedMapping) {
          const [, nestedField] = nestedMapping.split('.')
          return `${relationField}.${nestedField}`
        }
        
        return `${relationField}.${restPath}`
      }
    }
    
    // No mapping, use as-is
    return templatePath
  }
}
```

---

## 🎯 Real Example: Blog Template

### Template File
```tsx
// packages/ui-templates/blog/src/screens/PostDetail.tsx

import { use{{Model}} } from '@/sdk'
import { useParams } from 'react-router-dom'

export function PostDetailScreen() {
  const { id } = useParams()
  const { data: post } = use{{Model}}(Number(id))
  
  if (!post) return <div>Not found</div>
  
  return (
    <article>
      <h1>{ {{model.title}} }</h1>
      
      <div className="meta">
        <span>By { {{model.author.name}} }</span>
        <time>{ {{model.createdAt}} }</time>
        <span>Status: { {{model.published}} ? 'Published' : 'Draft' }</span>
      </div>
      
      <div className="content">
        { {{model.content}} }
      </div>
      
      {/* {{model.excerpt}} is optional */}
      { {{model.excerpt}} && (
        <div className="excerpt">{ {{model.excerpt}} }</div>
      )}
    </article>
  )
}
```

### User's Mappings
```typescript
// ssot.config.ts
schemaMappings: {
  models: {
    'post': 'BlogPost'
  },
  fields: {
    'post.title': 'BlogPost.heading',
    'post.content': 'BlogPost.body',
    'post.author': 'BlogPost.writer',
    'user.name': 'User.email',
    'post.excerpt': 'BlogPost.summary'
  }
}
```

### Generated Output
```tsx
// generated/ui/screens/PostDetail.tsx

import { useBlogPost } from '@/sdk'
import { useParams } from 'react-router-dom'

export function PostDetailScreen() {
  const { id } = useParams()
  const { data: post } = useBlogPost(Number(id))
  
  if (!post) return <div>Not found</div>
  
  return (
    <article>
      <h1>{post.heading}</h1>
      
      <div className="meta">
        <span>By {post.writer.email}</span>
        <time>{post.createdAt}</time>
        <span>Status: {post.isLive ? 'Published' : 'Draft'}</span>
      </div>
      
      <div className="content">
        {post.body}
      </div>
      
      {post.summary && (
        <div className="excerpt">{post.summary}</div>
      )}
    </article>
  )
}
```

---

## 🔍 Auto-Detection with Manual Override

### Smart Defaults
```typescript
// Generator tries to auto-detect mappings first
export function autoDetectMappings(
  template: UITemplate,
  schema: ParsedSchema
): Partial<SchemaMappings> {
  const detected: Partial<SchemaMappings> = {
    models: {},
    fields: {}
  }
  
  // Try to match template models to schema models
  for (const templateModel of template.requiredModels) {
    // Try exact match (case-insensitive)
    const match = schema.models.find(m => 
      m.name.toLowerCase() === templateModel.template.toLowerCase()
    )
    
    if (match) {
      detected.models![templateModel.template] = match.name
    }
    
    // Try plural/singular variations
    // 'post' → 'Post', 'Posts', 'BlogPost'
    // ...
  }
  
  return detected
}
```

### CLI Helper
```bash
# Auto-detect mappings
pnpm ssot ui init blog

# Output:
# ✓ Detected model mappings:
#   user → User
#   post → Post
#   comment → Comment
#
# ⚠ Could not auto-detect fields:
#   user.name (User model has: id, email, username, firstName)
#     → Suggestion: Use 'email' or 'firstName'?
#
#   post.title (Post model has: id, heading, body)
#     → Suggestion: Use 'heading'?
#
# Run: pnpm ssot ui configure
```

### Interactive Configuration
```bash
pnpm ssot ui configure

# Prompts:
# Template 'user.name' should map to which field?
#   User model fields: email, username, firstName, lastName
# > email
#
# Template 'post.title' should map to which field?
#   Post model fields: heading, body, slug
# > heading
#
# ✓ Generated ssot.config.ts with mappings
```

---

## 📦 Available UI Templates

### 1. Blog Template
```typescript
{
  id: 'blog',
  models: ['user', 'post', 'comment'],
  screens: [
    'PostList',
    'PostDetail', 
    'PostCreate',
    'UserProfile',
    'CommentSection'
  ]
}
```

### 2. E-commerce Template
```typescript
{
  id: 'ecommerce',
  models: ['product', 'category', 'order', 'user'],
  screens: [
    'ProductList',
    'ProductDetail',
    'Cart',
    'Checkout',
    'OrderHistory'
  ]
}
```

### 3. CRM Template
```typescript
{
  id: 'crm',
  models: ['contact', 'company', 'deal', 'task'],
  screens: [
    'ContactList',
    'ContactDetail',
    'KanbanBoard',
    'ActivityFeed'
  ]
}
```

### 4. Dashboard Template
```typescript
{
  id: 'dashboard',
  models: ['user', 'metric', 'report'],
  screens: [
    'Overview',
    'Analytics',
    'Reports',
    'Settings'
  ]
}
```

---

## 🎯 Benefits

### 1. **Flexibility**
- Use pre-built UI without changing schema
- Map any field to any template variable
- Handle plural/singular differences
- Handle different naming conventions

### 2. **Time Savings**
- Pre-built screens ready to use
- Just configure mappings
- No manual UI coding

### 3. **Best Practices**
- Templates follow UI best practices
- Production-ready code
- Accessible, responsive

### 4. **Maintainability**
- Clear mapping configuration
- Easy to update
- Documented in config

---

## 🚀 Usage Flow

```bash
# 1. Choose template
pnpm ssot ui init blog

# 2. Auto-detect mappings (interactive)
pnpm ssot ui configure
# Prompts for unmapped fields

# 3. Generate UI
pnpm ssot generate --ui

# 4. Customize as needed
# Edit generated files in generated/ui/
```

---

## 📝 Full Config Example

```typescript
// ssot.config.ts
export default {
  framework: 'express',
  
  uiProjects: {
    template: 'blog',
    
    schemaMappings: {
      // Model mappings
      models: {
        'user': 'Author',
        'post': 'Article',
        'comment': 'Reply'
      },
      
      // Field mappings
      fields: {
        // User/Author
        'user.name': 'Author.fullName',
        'user.avatar': 'Author.photoUrl',
        'user.bio': 'Author.description',
        
        // Post/Article
        'post.title': 'Article.headline',
        'post.content': 'Article.bodyText',
        'post.excerpt': 'Article.summary',
        'post.published': 'Article.isPublished',
        'post.author': 'Article.writer',
        'post.category': 'Article.section',
        
        // Comment/Reply
        'comment.content': 'Reply.message',
        'comment.author': 'Reply.user',
        'comment.post': 'Reply.article'
      }
    },
    
    // Optional: Customize template
    overrides: {
      // Hide certain screens
      excludeScreens: ['PostCreate'],
      
      // Add custom screens
      customScreens: ['Newsletter', 'Search']
    }
  }
}
```

---

## 🎯 This Is The Real System

**Pre-built UI templates** with **flexible schema mapping**, not auto-detection!

Users can:
1. ✅ Choose a template (blog, e-commerce, CRM)
2. ✅ Map their schema to template variables
3. ✅ Generate production-ready UI
4. ✅ Keep their existing schema structure

**Is this the system you had in mind?** 🎯

