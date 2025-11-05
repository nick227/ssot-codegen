# Blog Example Extensions

This folder contains example code showing how to extend the generated API with custom business logic.

## What Are Extensions?

Extensions allow you to:
- **Add custom methods** to generated services
- **Override generated behavior** while keeping the base functionality
- **Implement domain-specific logic** not inferrable from the schema

## Pattern

```typescript
// Import the generated service
import { postService as generatedPostService } from '@gen/services/post'

// Extend it with custom methods
export const postService = {
  ...generatedPostService,  // Keep all generated CRUD
  
  // Add your custom methods
  async search(query: string) {
    // Your custom logic
  }
}
```

## Examples in This Folder

### `post.service.extension.ts`

Shows how to add blog-specific functionality:
- `search()` - Full-text search across title, content, excerpt
- `findBySlug()` - Find post by URL slug with relationships
- `incrementViews()` - Track post views
- `getPopular()` - Get most viewed posts

## Using Extensions in Generated Projects

After generating with `pnpm ssot generate blog-example`:

1. **Copy extension files to your gen-N project:**
   ```bash
   cp examples/blog-example/extensions/* gen-1/src/extensions/
   ```

2. **Import in your app:**
   ```typescript
   // Instead of:
   import { postService } from '@gen/services/post'
   
   // Use:
   import { postService } from './extensions/post.service.extension.js'
   ```

3. **Use both generated and custom methods:**
   ```typescript
   // Generated CRUD
   await postService.create({ title: 'New Post', ... })
   
   // Custom method
   const results = await postService.search('typescript')
   ```

## Benefits

- ✅ **DRY** - Don't rewrite CRUD, extend it
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Maintainable** - Regenerate base code anytime
- ✅ **Flexible** - Add domain logic without touching generated code

