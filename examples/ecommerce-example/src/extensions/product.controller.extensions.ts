/**
 * Product Controller Extensions
 * 
 * Extended product controllers with search functionality
 */

import type { Request, Response } from 'express'
import { productService } from './product.service.extensions.js'
import { logger } from '../logger.js'

/**
 * Search products
 * GET /api/products/search?q=laptop&category=1&minPrice=100&maxPrice=2000&inStock=true
 */
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Search query is required'
      })
    }

    if (query.length < 2) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Search query must be at least 2 characters'
      })
    }

    const result = await productService.search(query, {
      categoryId: req.query.category ? parseInt(req.query.category as string) : undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      inStock: req.query.inStock !== 'false',
      isFeatured: req.query.featured === 'true' ? true : undefined,
      limit: parseInt(req.query.limit as string) || 20,
      skip: parseInt(req.query.skip as string) || 0
    })

    logger.info({ 
      query, 
      resultsCount: result.data.length,
      filters: req.query
    }, 'Product search executed')

    return res.json(result)
  } catch (error) {
    logger.error({ error, query: req.query }, 'Product search failed')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * Advanced product search with filters
 * POST /api/products/search/advanced
 * 
 * Accepts complex filter criteria in request body
 */
export const advancedSearchProducts = async (req: Request, res: Response) => {
  try {
    const result = await productService.advancedSearch(req.body)

    logger.info({ 
      resultsCount: result.data.length,
      filters: req.body
    }, 'Advanced product search executed')

    return res.json(result)
  } catch (error) {
    logger.error({ error, filters: req.body }, 'Advanced search failed')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * Get product by slug
 * GET /api/products/slug/professional-laptop-15
 */
export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    
    const product = await productService.findBySlug(slug)
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    if (!product.isActive) {
      return res.status(404).json({ error: 'Product not available' })
    }

    return res.json(product)
  } catch (error) {
    logger.error({ error, slug: req.params.slug }, 'Failed to get product by slug')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * Get featured products
 * GET /api/products/featured?limit=10
 */
export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10
    
    if (limit > 50) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Limit cannot exceed 50'
      })
    }

    const products = await productService.getFeatured(limit)

    return res.json({
      data: products,
      meta: { limit }
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get featured products')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * Get products by category
 * GET /api/products/category/:categoryId?minPrice=100&maxPrice=500
 */
export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.categoryId, 10)
    
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID' })
    }

    const result = await productService.getByCategory(categoryId, {
      skip: parseInt(req.query.skip as string) || 0,
      take: parseInt(req.query.take as string) || 20,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined
    })

    return res.json(result)
  } catch (error) {
    logger.error({ error, categoryId: req.params.categoryId }, 'Failed to get products by category')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

