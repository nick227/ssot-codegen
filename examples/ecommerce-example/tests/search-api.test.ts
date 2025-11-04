/**
 * E-commerce Search API Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import prisma from '../src/db.js'

let app: any

beforeAll(async () => {
  app = createApp()
  
  // Ensure we have seeded data
  const productCount = await prisma.product.count()
  if (productCount === 0) {
    throw new Error('Database not seeded. Run: npm run db:seed')
  }
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('E-commerce Search API', () => {
  describe('GET /api/products/search', () => {
    it('should search products by name', async () => {
      const response = await request(app)
        .get('/api/products/search?q=laptop')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('meta')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.meta.query).toBe('laptop')
    })

    it('should return products with images', async () => {
      const response = await request(app)
        .get('/api/products/search?q=laptop')
        .expect(200)

      if (response.body.data.length > 0) {
        const product = response.body.data[0]
        expect(product).toHaveProperty('images')
        expect(Array.isArray(product.images)).toBe(true)
      }
    })

    it('should return products with categories', async () => {
      const response = await request(app)
        .get('/api/products/search?q=laptop')
        .expect(200)

      if (response.body.data.length > 0) {
        const product = response.body.data[0]
        expect(product).toHaveProperty('categories')
        expect(Array.isArray(product.categories)).toBe(true)
      }
    })

    it('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/products/search?q=laptop&minPrice=1000&maxPrice=1500')
        .expect(200)

      response.body.data.forEach((product: any) => {
        expect(product.price).toBeGreaterThanOrEqual(1000)
        expect(product.price).toBeLessThanOrEqual(1500)
      })
    })

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/products/search?q=mouse&category=1')
        .expect(200)

      expect(response.body).toHaveProperty('data')
    })

    it('should filter by stock status', async () => {
      const response = await request(app)
        .get('/api/products/search?q=product&inStock=true')
        .expect(200)

      response.body.data.forEach((product: any) => {
        expect(product.stock).toBeGreaterThan(0)
      })
    })

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/products/search?q=product&limit=2')
        .expect(200)

      expect(response.body.data.length).toBeLessThanOrEqual(2)
    })

    it('should require query parameter', async () => {
      await request(app)
        .get('/api/products/search')
        .expect(400)
    })

    it('should reject query shorter than 2 characters', async () => {
      await request(app)
        .get('/api/products/search?q=a')
        .expect(400)
    })
  })

  describe('POST /api/products/search/advanced', () => {
    it('should perform advanced search', async () => {
      const response = await request(app)
        .post('/api/products/search/advanced')
        .send({
          query: 'laptop',
          minPrice: 1000,
          maxPrice: 2000,
          sortBy: 'price_asc',
          take: 10
        })
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body.meta).toHaveProperty('filters')
      expect(response.body.meta.filters.sortBy).toBe('price_asc')
    })

    it('should sort by price ascending', async () => {
      const response = await request(app)
        .post('/api/products/search/advanced')
        .send({
          query: 'product',
          sortBy: 'price_asc',
          take: 5
        })
        .expect(200)

      const prices = response.body.data.map((p: any) => p.price)
      const sorted = [...prices].sort((a, b) => a - b)
      expect(prices).toEqual(sorted)
    })
  })

  describe('GET /api/products/slug/:slug', () => {
    it('should get product by slug', async () => {
      const response = await request(app)
        .get('/api/products/slug/professional-laptop-15')
        .expect(200)

      expect(response.body.slug).toBe('professional-laptop-15')
      expect(response.body).toHaveProperty('images')
      expect(response.body).toHaveProperty('categories')
      expect(response.body).toHaveProperty('reviews')
    })

    it('should return 404 for non-existent slug', async () => {
      await request(app)
        .get('/api/products/slug/non-existent-product')
        .expect(404)
    })

    it('should return 404 for inactive product', async () => {
      // Create inactive product
      const product = await prisma.product.create({
        data: {
          sku: 'INACTIVE-001',
          name: 'Inactive Product',
          slug: 'inactive-product',
          description: 'Test',
          price: 99.99,
          isActive: false
        }
      })

      await request(app)
        .get(`/api/products/slug/${product.slug}`)
        .expect(404)

      // Cleanup
      await prisma.product.delete({ where: { id: product.id } })
    })
  })

  describe('GET /api/products/featured', () => {
    it('should return featured products', async () => {
      const response = await request(app)
        .get('/api/products/featured?limit=5')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      response.body.data.forEach((product: any) => {
        expect(product.isFeatured).toBe(true)
        expect(product.isActive).toBe(true)
        expect(product.stock).toBeGreaterThan(0)
      })
    })
  })

  describe('GET /api/products/category/:categoryId', () => {
    it('should return products in category', async () => {
      const response = await request(app)
        .get('/api/products/category/1?take=10')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('meta')
      expect(response.body.meta).toHaveProperty('total')
    })

    it('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/products/category/1?minPrice=50&maxPrice=100')
        .expect(200)

      response.body.data.forEach((product: any) => {
        expect(product.price).toBeGreaterThanOrEqual(50)
        expect(product.price).toBeLessThanOrEqual(100)
      })
    })
  })
})

