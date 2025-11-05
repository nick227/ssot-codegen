/**
 * Extended Product Routes
 * 
 * Combines generated routes with e-commerce search extensions
 */

import { Router } from 'express'
import * as generatedController from '@gen/controllers/product'
import * as extendedController from './product.controller.extensions.js'
import { authenticate, authorize } from '../auth/jwt.js'

export const productRouter = Router()

// ============================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================

/**
 * Search products
 * GET /api/products/search?q=laptop&category=1&minPrice=100&maxPrice=2000&inStock=true
 * 
 * Query Parameters:
 * - q: Search query (required, min 2 chars)
 * - category: Filter by category ID
 * - minPrice: Minimum price filter
 * - maxPrice: Maximum price filter
 * - inStock: Only show in-stock products (default: true)
 * - featured: Only show featured products
 * - limit: Results per page (default: 20, max: 50)
 * - skip: Pagination offset
 */
productRouter.get('/search', extendedController.searchProducts)

/**
 * Advanced search with complex filters
 * POST /api/products/search/advanced
 * 
 * Body: {
 *   query?: string
 *   categoryId?: number
 *   minPrice?: number
 *   maxPrice?: number
 *   minRating?: number
 *   inStock?: boolean
 *   isFeatured?: boolean
 *   sortBy?: 'price_asc' | 'price_desc' | 'name' | 'popular' | 'newest'
 *   skip?: number
 *   take?: number
 * }
 */
productRouter.post('/search/advanced', extendedController.advancedSearchProducts)

/**
 * Get featured products
 * GET /api/products/featured?limit=10
 */
productRouter.get('/featured', extendedController.getFeaturedProducts)

/**
 * Get product by slug (SEO-friendly)
 * GET /api/products/slug/professional-laptop-15
 */
productRouter.get('/slug/:slug', extendedController.getProductBySlug)

/**
 * Get products by category
 * GET /api/products/category/:categoryId?minPrice=100&maxPrice=500
 */
productRouter.get('/category/:categoryId', extendedController.getProductsByCategory)

/**
 * List all active products
 * GET /api/products?skip=0&take=20
 */
productRouter.get('/', generatedController.listProducts)

/**
 * Get product by ID
 * GET /api/products/123
 */
productRouter.get('/:id', generatedController.getProduct)

/**
 * Count products
 * GET /api/products/meta/count
 */
productRouter.get('/meta/count', generatedController.countProducts)

// ============================================================
// PROTECTED ROUTES (Authentication required - Admin/Staff only)
// ============================================================

/**
 * Create product (admin only)
 * POST /api/products
 */
productRouter.post('/', 
  authenticate, 
  authorize('ADMIN'), 
  generatedController.createProduct
)

/**
 * Update product (admin only)
 * PUT /api/products/:id
 * PATCH /api/products/:id
 */
productRouter.put('/:id', 
  authenticate, 
  authorize('ADMIN'), 
  generatedController.updateProduct
)

productRouter.patch('/:id', 
  authenticate, 
  authorize('ADMIN'), 
  generatedController.updateProduct
)

/**
 * Delete product (admin only)
 * DELETE /api/products/:id
 */
productRouter.delete('/:id', 
  authenticate, 
  authorize('ADMIN'), 
  generatedController.deleteProduct
)

