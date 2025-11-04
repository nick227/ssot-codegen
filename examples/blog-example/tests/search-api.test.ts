/**
 * Search API Integration Tests
 * Tests all search endpoints for blog-example
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import prisma from '../src/db.js'

let app: any

beforeAll(async () => {
  app = createApp()
  
  // Ensure we have seeded data
  const postCount = await prisma.post.count()
  if (postCount === 0) {
    throw new Error('Database not seeded. Run: npm run db:seed')
  }
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Blog Search API', () => {
  describe('POST /api/posts/search', () => {
    it('should search posts by title', async () => {
      const response = await request(app)
        .get('/api/posts/search?q=typescript')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('meta')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.meta.query).toBe('typescript')
    })

    it('should return posts with author information', async () => {
      const response = await request(app)
        .get('/api/posts/search?q=typescript')
        .expect(200)

      if (response.body.data.length > 0) {
        const post = response.body.data[0]
        expect(post).toHaveProperty('author')
        expect(post.author).toHaveProperty('username')
        expect(post.author).toHaveProperty('displayName')
      }
    })

    it('should return posts with categories and tags', async () => {
      const response = await request(app)
        .get('/api/posts/search?q=typescript')
        .expect(200)

      if (response.body.data.length > 0) {
        const post = response.body.data[0]
        expect(post).toHaveProperty('categories')
        expect(post).toHaveProperty('tags')
        expect(Array.isArray(post.categories)).toBe(true)
        expect(Array.isArray(post.tags)).toBe(true)
      }
    })

    it('should include comment count', async () => {
      const response = await request(app)
        .get('/api/posts/search?q=typescript')
        .expect(200)

      if (response.body.data.length > 0) {
        const post = response.body.data[0]
        expect(post).toHaveProperty('_count')
        expect(post._count).toHaveProperty('comments')
      }
    })

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/posts/search?q=api&category=1')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body.meta.query).toBe('api')
    })

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/posts/search?q=post&limit=2')
        .expect(200)

      expect(response.body.data.length).toBeLessThanOrEqual(2)
    })

    it('should require query parameter', async () => {
      await request(app)
        .get('/api/posts/search')
        .expect(400)
    })

    it('should reject query shorter than 2 characters', async () => {
      await request(app)
        .get('/api/posts/search?q=a')
        .expect(400)
    })

    it('should only return published posts', async () => {
      const response = await request(app)
        .get('/api/posts/search?q=post')
        .expect(200)

      response.body.data.forEach((post: any) => {
        expect(post.published).toBe(true)
      })
    })
  })

  describe('GET /api/posts/slug/:slug', () => {
    it('should get post by slug', async () => {
      const response = await request(app)
        .get('/api/posts/slug/getting-started-with-typescript')
        .expect(200)

      expect(response.body.slug).toBe('getting-started-with-typescript')
      expect(response.body).toHaveProperty('author')
      expect(response.body).toHaveProperty('categories')
      expect(response.body).toHaveProperty('tags')
    })

    it('should return 404 for non-existent slug', async () => {
      await request(app)
        .get('/api/posts/slug/non-existent-post')
        .expect(404)
    })

    it('should return 404 for unpublished post', async () => {
      // Draft posts should not be accessible via slug
      await request(app)
        .get('/api/posts/slug/modern-ui-design-principles')
        .expect(404)
    })
  })

  describe('GET /api/posts/popular', () => {
    it('should return popular posts sorted by views', async () => {
      const response = await request(app)
        .get('/api/posts/popular?limit=3')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeLessThanOrEqual(3)

      // Check sorting (views descending)
      if (response.body.data.length > 1) {
        expect(response.body.data[0].views).toBeGreaterThanOrEqual(
          response.body.data[1].views
        )
      }
    })

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/posts/popular?limit=2')
        .expect(200)

      expect(response.body.data.length).toBeLessThanOrEqual(2)
    })

    it('should reject limit > 50', async () => {
      await request(app)
        .get('/api/posts/popular?limit=100')
        .expect(400)
    })
  })

  describe('GET /api/posts/recent', () => {
    it('should return recent posts', async () => {
      const response = await request(app)
        .get('/api/posts/recent?limit=5')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)

      // Check sorting (newest first)
      if (response.body.data.length > 1) {
        const date1 = new Date(response.body.data[0].publishedAt)
        const date2 = new Date(response.body.data[1].publishedAt)
        expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime())
      }
    })
  })

  describe('POST /api/posts/:id/views', () => {
    it('should increment view counter', async () => {
      // Get a post ID
      const posts = await prisma.post.findFirst({ where: { published: true } })
      if (!posts) throw new Error('No posts found')

      const initialViews = posts.views

      const response = await request(app)
        .post(`/api/posts/${posts.id}/views`)
        .expect(200)

      expect(response.body.views).toBe(initialViews + 1)
    })

    it('should return 404 for non-existent post', async () => {
      await request(app)
        .post('/api/posts/99999/views')
        .expect(404)
    })
  })
})

