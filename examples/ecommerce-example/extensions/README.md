# E-Commerce Example Extensions

This folder contains example code showing how to extend the generated API with e-commerce specific functionality.

## What's Included

### `product.service.extensions.ts`

Advanced product search and filtering:
- `search()` - Multi-field search (name, description, SKU)
- `findBySlug()` - Get product by URL slug with reviews
- `getFeatured()` - Get featured products
- `getByCategory()` - Filter by category with pagination
- `getLowStock()` - Find products needing restock (admin)
- `advancedSearch()` - Complex filtering with sorting

### `product.controller.extensions.ts`

HTTP handlers for custom product endpoints:
- `GET /products/search` - Search endpoint
- `GET /products/featured` - Featured products
- `GET /products/:slug` - Find by slug

### `product.routes.extensions.ts`

Express routes for custom endpoints

## E-Commerce Patterns Demonstrated

1. **Multi-field Search**
   ```typescript
   OR: [
     { name: { contains: query } },
     { description: { contains: query } },
     { sku: { contains: query } }
   ]
   ```

2. **Complex Filtering**
   - Price ranges
   - Stock availability
   - Category filtering
   - Rating thresholds

3. **Pagination & Performance**
   ```typescript
   const [data, total] = await Promise.all([
     prisma.product.findMany(...),
     prisma.product.count(...)
   ])
   ```

4. **SEO-Friendly URLs**
   - Find by slug instead of ID
   - Include full product details

## Using in Generated Projects

```bash
pnpm ssot generate ecommerce-example
cd gen-1
cp ../examples/ecommerce-example/extensions/* src/extensions/
pnpm install
pnpm dev
```

Then use your extended services:
```typescript
import { productService } from './extensions/product.service.extensions.js'

// Search products
const results = await productService.search('laptop', {
  categoryId: 5,
  minPrice: 500,
  maxPrice: 2000,
  inStock: true
})
```

