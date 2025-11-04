# E-commerce Search API Documentation

**Status:** ✅ Fully implemented and ready to use  
**Base URL:** `http://localhost:3002/api`

---

## 🔍 Search Endpoints

### **1. Basic Product Search**

```bash
GET /api/products/search?q=laptop
```

**Query Parameters:**
- `q` (required) - Search query (min 2 characters)
- `category` (optional) - Filter by category ID
- `minPrice` (optional) - Minimum price filter
- `maxPrice` (optional) - Maximum price filter
- `inStock` (optional) - Only in-stock products (default: true)
- `featured` (optional) - Only featured products
- `limit` (optional) - Results per page (default: 20, max: 50)
- `skip` (optional) - Pagination offset

**Example:**
```bash
curl "http://localhost:3002/api/products/search?q=laptop&minPrice=1000&maxPrice=1500"
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "sku": "LAPTOP-001",
      "name": "Professional Laptop 15\"",
      "slug": "professional-laptop-15",
      "description": "High-performance laptop...",
      "shortDescription": "Professional-grade laptop",
      "price": 1299.99,
      "compareAtPrice": 1499.99,
      "stock": 25,
      "isActive": true,
      "isFeatured": true,
      "categories": [
        {
          "category": {
            "id": 1,
            "name": "Electronics",
            "slug": "electronics"
          }
        }
      ],
      "images": [
        {
          "url": "https://example.com/laptop-1.jpg",
          "altText": "Laptop front view",
          "sortOrder": 0
        }
      ],
      "reviewCount": 5
    }
  ],
  "meta": {
    "total": 1,
    "skip": 0,
    "take": 20,
    "hasMore": false,
    "query": "laptop"
  }
}
```

---

### **2. Advanced Search**

```bash
POST /api/products/search/advanced
Content-Type: application/json

{
  "query": "laptop",
  "categoryId": 2,
  "minPrice": 500,
  "maxPrice": 2000,
  "minRating": 4,
  "inStock": true,
  "isFeatured": false,
  "sortBy": "price_asc",
  "skip": 0,
  "take": 20
}
```

**Sort Options:**
- `price_asc` - Cheapest first
- `price_desc` - Most expensive first
- `name` - Alphabetical A-Z
- `popular` - Most viewed
- `newest` - Recently added

**Example:**
```bash
curl -X POST "http://localhost:3002/api/products/search/advanced" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "laptop",
    "minPrice": 1000,
    "maxPrice": 2000,
    "sortBy": "price_asc",
    "inStock": true,
    "take": 10
  }'
```

---

### **3. Get Product by Slug** (SEO-Friendly)

```bash
GET /api/products/slug/:slug
```

**Example:**
```bash
curl "http://localhost:3002/api/products/slug/professional-laptop-15"
```

**Returns:**
- Full product details
- All product images
- Recent reviews (10 most recent)
- Review statistics
- Category information

---

### **4. Featured Products**

```bash
GET /api/products/featured?limit=10
```

**Returns:** Featured products only (in stock, active)

**Example:**
```bash
curl "http://localhost:3002/api/products/featured?limit=5"
```

---

### **5. Products by Category**

```bash
GET /api/products/category/:categoryId?minPrice=100&maxPrice=500
```

**Query Parameters:**
- `minPrice` (optional) - Minimum price
- `maxPrice` (optional) - Maximum price
- `skip` (optional) - Pagination offset
- `take` (optional) - Results per page

**Example:**
```bash
curl "http://localhost:3002/api/products/category/1?minPrice=50&maxPrice=100&take=20"
```

---

## 📋 Search Capabilities

### **What You Can Search:**
- **Product name** (case-insensitive)
- **Description** (full & short)
- **SKU** (exact & partial match)

### **What You Can Filter:**
- Category
- Price range (min/max)
- Stock status (in-stock only)
- Featured status
- Rating (minimum)

### **How You Can Sort:**
- Price (ascending/descending)
- Name (alphabetical)
- Popularity (views)
- Date (newest first)
- Relevance (default)

---

## 🎯 Use Cases

### **Use Case 1: Customer Searching**
```bash
# Customer types "laptop" in search box
GET /api/products/search?q=laptop&inStock=true

# Returns only in-stock laptops with images and reviews
```

---

### **Use Case 2: Filter by Price**
```bash
# Customer filters: $500-$1500 range
GET /api/products/search?q=laptop&minPrice=500&maxPrice=1500

# Returns laptops in price range
```

---

### **Use Case 3: Category Browse**
```bash
# Customer clicks "Electronics" category
GET /api/products/category/1?take=20

# Returns all electronics with pagination
```

---

### **Use Case 4: Featured Products Homepage**
```bash
# Homepage shows featured products
GET /api/products/featured?limit=8

# Returns 8 featured products for carousel
```

---

### **Use Case 5: Advanced Filters**
```bash
# Customer uses advanced filter UI
POST /api/products/search/advanced
{
  "categoryId": 2,
  "minPrice": 1000,
  "maxPrice": 2000,
  "minRating": 4,
  "sortBy": "price_asc"
}

# Returns filtered & sorted results
```

---

## 🔧 Technical Details

### **Search Algorithm:**
1. Case-insensitive partial matching (`contains`)
2. Searches across multiple fields (OR condition)
3. Applies filters (AND conditions)
4. Orders by relevance + sort preference
5. Returns with pagination

### **Included Relationships:**
- Product images (sorted by sortOrder)
- Categories (with full category details)
- Review count (via `_count`)
- Recent reviews (limited to 10)

### **Performance Optimizations:**
- Uses database indexes
- Parallel count queries
- Limited field selection
- Pagination support
- Image limits in search results

---

## 🎓 Extension Pattern Demonstrated

### **File Structure:**
```
src/extensions/
├── product.service.extensions.ts      # Business logic
├── product.controller.extensions.ts   # HTTP handlers
└── product.routes.extensions.ts       # Route definitions
```

### **How to Use:**
```typescript
// 1. Import extended service (not generated)
import { productService } from './extensions/product.service.extensions.js'

// 2. Use it (includes generated + custom methods)
const results = await productService.search('laptop')
```

### **Benefits:**
- ✅ Don't edit generated code
- ✅ Easy to regenerate
- ✅ Clear separation
- ✅ Version control friendly

---

## ✨ Summary

**Search Features Added:**

**Blog:**
- Full-text search (title, content, excerpt)
- Category & tag filtering
- Slug lookups
- Popular & recent posts
- Relationship loading (author, categories, tags)

**E-commerce:**
- Full-text search (name, description, SKU)
- Price range filtering
- Category filtering
- Stock status filtering
- Advanced search with sorting
- Featured products
- Slug lookups
- Relationship loading (images, categories, reviews)

**All ready to use at:**
- Blog: `http://localhost:3001/api/posts/search`
- E-commerce: `http://localhost:3002/api/products/search`

