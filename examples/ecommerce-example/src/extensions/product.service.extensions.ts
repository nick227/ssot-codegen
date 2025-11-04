/**
 * Product Service Extensions
 * 
 * Extends generated product service with e-commerce search functionality
 */

import { productService as generatedProductService } from '@gen/services/product'
import prisma from '../db.js'
import type { Prisma } from '@prisma/client'

export const productService = {
  // Include all generated base methods
  ...generatedProductService,
  
  /**
   * Search products by name, description, SKU
   * 
   * @param query - Search query string
   * @param options - Search and filter options
   */
  async search(
    query: string,
    options: {
      categoryId?: number
      minPrice?: number
      maxPrice?: number
      inStock?: boolean
      isFeatured?: boolean
      limit?: number
      skip?: number
    } = {}
  ) {
    const {
      categoryId,
      minPrice,
      maxPrice,
      inStock = true,
      isFeatured,
      limit = 20,
      skip = 0
    } = options

    const where: Prisma.ProductWhereInput = {
      // Search across multiple fields
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } }
      ],
      // Apply filters
      isActive: true,
      ...(inStock && { stock: { gt: 0 } }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(categoryId && {
        categories: { some: { categoryId } }
      }),
      ...(minPrice !== undefined && { 
        price: { gte: minPrice }
      }),
      ...(maxPrice !== undefined && {
        price: { lte: maxPrice }
      })
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          },
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 1  // Just main image for search results
          },
          _count: {
            select: { reviews: true }
          }
        },
        orderBy: [
          { isFeatured: 'desc' },  // Featured first
          { createdAt: 'desc' }
        ]
      }),
      prisma.product.count({ where })
    ])

    return {
      data: products,
      meta: {
        total,
        skip,
        take: limit,
        hasMore: skip + limit < total,
        query
      }
    }
  },

  /**
   * Find product by slug
   */
  async findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        categories: {
          include: { category: true }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        reviews: {
          where: { isApproved: true },
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: { reviews: true }
        }
      }
    })
  },

  /**
   * Get featured products
   */
  async getFeatured(limit: number = 10) {
    return prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        stock: { gt: 0 }
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1
        },
        _count: { select: { reviews: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  },

  /**
   * Get products by category
   */
  async getByCategory(categoryId: number, options: {
    skip?: number
    take?: number
    minPrice?: number
    maxPrice?: number
  } = {}) {
    const { skip = 0, take = 20, minPrice, maxPrice } = options

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      stock: { gt: 0 },
      categories: {
        some: { categoryId }
      },
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } })
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 1
          },
          _count: { select: { reviews: true } }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.product.count({ where })
    ])

    return {
      data: products,
      meta: { total, skip, take, hasMore: skip + take < total }
    }
  },

  /**
   * Get low stock products (for admin)
   */
  async getLowStock() {
    return prisma.product.findMany({
      where: {
        isActive: true,
        stock: {
          lte: prisma.product.fields.lowStockThreshold
        }
      },
      orderBy: { stock: 'asc' }
    })
  },

  /**
   * Search with advanced filters
   */
  async advancedSearch(filters: {
    query?: string
    categoryId?: number
    minPrice?: number
    maxPrice?: number
    minRating?: number
    inStock?: boolean
    isFeatured?: boolean
    sortBy?: 'price_asc' | 'price_desc' | 'name' | 'popular' | 'newest'
    skip?: number
    take?: number
  }) {
    const {
      query,
      categoryId,
      minPrice,
      maxPrice,
      minRating,
      inStock = true,
      isFeatured,
      sortBy = 'newest',
      skip = 0,
      take = 20
    } = filters

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(query && {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      }),
      ...(inStock && { stock: { gt: 0 } }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(categoryId && {
        categories: { some: { categoryId } }
      }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } })
    }

    // Determine sort order
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }
    if (sortBy === 'price_asc') orderBy = { price: 'asc' }
    else if (sortBy === 'price_desc') orderBy = { price: 'desc' }
    else if (sortBy === 'name') orderBy = { name: 'asc' }
    else if (sortBy === 'popular') orderBy = { views: 'desc' }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 1
          },
          categories: {
            include: { category: true }
          },
          _count: { select: { reviews: true } }
        },
        orderBy
      }),
      prisma.product.count({ where })
    ])

    return {
      data: products,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
        filters: { query, categoryId, minPrice, maxPrice, sortBy }
      }
    }
  }
}

