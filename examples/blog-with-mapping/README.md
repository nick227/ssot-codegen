# Blog Template Example - Schema Mapping & Customization

This example demonstrates the **blog template** with **schema mapping** and **customization**.

## 🎯 What This Example Shows

### 1. Schema Mapping

The blog template expects standard field names, but your schema uses different names. The mapping system bridges this gap:

**Template Expects:**
- Model: `user` with field `name`
- Model: `post` with fields `title`, `content`, `author`

**Your Schema Has:**
- Model: `Author` with field `fullName`
- Model: `BlogPost` with fields `heading`, `body`, `writer`

**Solution: Map in `ssot.config.ts`:**
```typescript
schemaMappings: {
  models: {
    'user': 'Author',
    'post': 'BlogPost'
  },
  fields: {
    'user.name': 'Author.fullName',
    'post.title': 'BlogPost.heading',
    'post.content': 'BlogPost.body',
    'post.author': 'BlogPost.writer'
  }
}
```

### 2. Component Overrides

Replace generated components with your own:

```typescript
customization: {
  overrides: {
    'components/PostCard': './custom/MyPostCard',
    'components/CommentSection': './custom/MyCommentSection'
  }
}
```

### 3. Custom Mappings

Create custom field transformations:

```typescript
fields: {
  // Nested field mapping
  'post.author.name': 'BlogPost.writer.fullName',
  
  // Optional field mapping
  'post.coverImage': 'BlogPost.featuredImage'
}
```

---

## 📁 Project Structure

```
blog-with-mapping/
├── prisma/
│   └── schema.prisma           # Your custom schema
├── custom/
│   ├── MyPostCard.tsx          # Override: Custom post card
│   └── MyCommentSection.tsx    # Override: Custom comments
├── app/                         # Generated Next.js app
│   ├── (blog)/
│   │   ├── layout.tsx          # Blog layout
│   │   ├── page.tsx            # Home page
│   │   ├── posts/
│   │   │   ├── page.tsx        # Post list
│   │   │   └── [slug]/
│   │   │       └── page.tsx    # Post detail
│   │   └── authors/
│   │       └── [id]/
│   │           └── page.tsx    # Author profile
│   └── admin/                   # Admin pages
│       └── posts/
│           ├── page.tsx         # Post management
│           ├── new/
│           │   └── page.tsx    # Create post
│           └── [id]/
│               └── edit/
│                   └── page.tsx # Edit post
├── generated/
│   └── sdk/                     # Auto-generated SDK
│       ├── types.ts
│       └── hooks/
│           └── react/
│               ├── use-blog-post.ts
│               └── use-author.ts
├── ssot.config.ts              # Configuration with mappings
└── README.md                    # This file
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

```bash
# Create and migrate database
npx prisma migrate dev --name init

# Seed with example data (optional)
npx prisma db seed
```

### 3. Generate Code

```bash
# Generate Prisma client + SDK + UI
npm run generate
```

This will:
- ✅ Generate Prisma client
- ✅ Generate TypeScript SDK with React hooks
- ✅ Generate blog UI with your schema mappings
- ✅ Apply your component overrides

### 4. Start Development

```bash
# Start Next.js dev server
npm run dev:ui
```

Visit:
- **Blog**: http://localhost:3001
- **Admin**: http://localhost:3001/admin

---

## 📋 Schema Mapping Examples

### Example 1: Simple Field Mapping

**Template field:** `user.name`  
**Your field:** `Author.fullName`

```typescript
fields: {
  'user.name': 'Author.fullName'
}
```

Generated code will use `author.fullName` instead of `author.name`.

### Example 2: Nested Field Mapping

**Template field:** `post.author.name`  
**Your field:** `BlogPost.writer.fullName`

```typescript
fields: {
  'post.author': 'BlogPost.writer',
  'post.author.name': 'BlogPost.writer.fullName'
}
```

Generated code will access nested fields correctly.

### Example 3: Optional Field Mapping

**Template field:** `post.coverImage` (optional)  
**Your field:** `BlogPost.featuredImage` (optional)

```typescript
fields: {
  'post.coverImage': 'BlogPost.featuredImage'
}
```

Null/undefined handling is preserved.

---

## 🎨 Customization Examples

### Override Generated Component

**Step 1:** Create your custom component
```bash
mkdir -p custom
touch custom/MyPostCard.tsx
```

**Step 2:** Implement your component
```typescript
// custom/MyPostCard.tsx
export function MyPostCard({ post }) {
  // Your custom implementation
  return <article>...</article>
}
```

**Step 3:** Configure override
```typescript
// ssot.config.ts
customization: {
  overrides: {
    'components/PostCard': './custom/MyPostCard'
  }
}
```

**Step 4:** Regenerate
```bash
npm run generate
```

All references to `PostCard` will now use `MyPostCard`.

### Extend Generated Component

Keep generated component but add custom behavior:

```typescript
// custom/EnhancedPostList.tsx
import { PostList } from '@/app/(blog)/posts/PostList'

export function EnhancedPostList(props) {
  // Add featured section
  const featuredPosts = props.posts.filter(p => p.featured)
  
  return (
    <>
      <FeaturedSection posts={featuredPosts} />
      <PostList {...props} />
    </>
  )
}
```

---

## 🔧 Advanced Mapping

### Type Transformations

If field types don't match, provide a transform function:

```typescript
fields: {
  // Template expects DateTime, you have string
  'post.createdAt': {
    source: 'BlogPost.publishedDate',
    transform: (value: string) => new Date(value)
  }
}
```

### Computed Fields

Create virtual fields from multiple sources:

```typescript
fields: {
  // Template expects 'post.author.name'
  // Compute from firstName + lastName
  'post.author.name': {
    compute: (post) => `${post.writer.firstName} ${post.writer.lastName}`
  }
}
```

### Conditional Mapping

Map fields based on conditions:

```typescript
fields: {
  'post.status': {
    source: 'BlogPost.published',
    transform: (published: boolean) => published ? 'live' : 'draft'
  }
}
```

---

## 📖 Generated Code Examples

### With Mapping

**Generated PostCard.tsx** (using your schema):
```typescript
import { useBlogPost } from '@/generated/sdk/hooks/react/use-blog-post'

export function PostCard({ postId }: { postId: number }) {
  const { data: post } = useBlogPost(postId, {
    include: { writer: true }
  })
  
  return (
    <article>
      <h2>{post.heading}</h2>  {/* Uses 'heading', not 'title' */}
      <p>{post.summary}</p>     {/* Uses 'summary', not 'excerpt' */}
      <span>By {post.writer.fullName}</span>  {/* Uses 'writer.fullName' */}
    </article>
  )
}
```

### Without Mapping (Error)

If you don't provide mappings, generation fails with helpful error:

```
❌ Schema Mapping Error

Template field 'post.title' not found in your schema.

Your BlogPost model has:
  - id
  - heading     ← Did you mean this?
  - body
  - summary

💡 Add mapping in ssot.config.ts:
  fields: {
    'post.title': 'BlogPost.heading'
  }

📖 Docs: https://ssot-codegen.dev/ui/blog-template#schema-mapping
```

---

## ✅ Validation

The generator validates your mappings:

### Type Compatibility
```typescript
// ✅ OK: Both are String
'user.name': 'Author.fullName'

// ❌ Error: Type mismatch
'user.id': 'Author.email'  // Int → String
```

### Required Fields
```typescript
// ✅ OK: Both required
'post.title': 'BlogPost.heading'

// ❌ Warning: Template required, yours optional
'post.title': 'BlogPost.optionalHeading'
```

### Relations
```typescript
// ✅ OK: Both are User relations
'post.author': 'BlogPost.writer'

// ❌ Error: Type mismatch
'post.author': 'BlogPost.categoryId'  // User → Int
```

---

## 🎯 Benefits

### 1. Use Existing Schema
Don't change your database to fit the template. Map your schema as-is.

### 2. Type Safety
Full TypeScript support with your actual types, not template types.

### 3. Flexibility
Override any component while keeping the rest of the generated code.

### 4. Maintainability
Regenerate safely. Your custom code is preserved.

### 5. Documentation
Generated code is readable and uses your field names.

---

## 📚 Learn More

- **Schema Mapping Guide**: docs/ui/schema-mapping.md
- **Blog Template Docs**: docs/ui/templates/blog.md
- **Customization Guide**: docs/ui/customization.md
- **Example Projects**: examples/

---

## 🆘 Troubleshooting

### Mapping Not Applied

**Issue**: Generated code still uses template field names.

**Solution**: 
1. Check `ssot.config.ts` syntax
2. Run `npm run generate` again
3. Clear `.next` cache: `rm -rf .next`

### Type Errors

**Issue**: TypeScript errors in generated code.

**Solution**: 
1. Verify field types match
2. Check relations are correctly mapped
3. Ensure include statements match your schema

### Override Not Working

**Issue**: Custom component not being used.

**Solution**: 
1. Check file path in `overrides` is correct
2. Ensure custom component exports match expected interface
3. Regenerate: `npm run generate`

---

**Generated by**: SSOT CodeGen v1.0.0  
**Template**: Blog v1.0.0  
**Schema**: Custom (with mappings)

