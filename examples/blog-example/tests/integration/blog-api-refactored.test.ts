/**
 * Blog API Integration Tests - REFACTORED VERSION
 * Demonstrates using new test utilities
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createApp } from '../../src/app.js'
import { generateTokens } from '../../src/auth/jwt.js'
import {
  getTestPrisma,
  cleanDatabase,
  disconnectDatabase,
  createAuthor,
  createCategory,
  createTag,
  createPost,
  createAuthRequest,
  assertions
} from '../helpers/index.js'

let app: any
let authorToken: string
let adminToken: string
let authorId: number

beforeAll(async () => {
  app = createApp()
})

beforeEach(async () => {
  const prisma = getTestPrisma()
  await cleanDatabase(prisma)
  
  // Create test author using factory
  const author = await createAuthor(prisma, {
    email: 'author@blog.com',
    username: 'testauthor',
    role: 'AUTHOR'
  })
  
  authorId = author.id
  const tokens = generateTokens({
    userId: author.id,
    email: author.email,
    role: 'AUTHOR'
  })
  authorToken = tokens.accessToken
  
  // Create test admin using factory
  const admin = await createAuthor(prisma, {
    email: 'admin@blog.com',
    username: 'testadmin',
    role: 'ADMIN'
  })
  
  const adminTokens = generateTokens({
    userId: admin.id,
    email: admin.email,
    role: 'ADMIN'
  })
  adminToken = adminTokens.accessToken
})

afterAll(async () => {
  const prisma = getTestPrisma()
  await disconnectDatabase(prisma)
})

describe('Blog API - Posts', () => {
  it('should create a post', async () => {
    const authRequest = createAuthRequest(app, authorToken)
    
    const response = await authRequest
      .post('/api/posts')
      .send({
        title: 'Test Post',
        slug: 'test-post',
        excerpt: 'This is a test post',
        content: 'Full content of the test post...',
        published: false,
        authorId
      })
      .expect(201)

    expect(response.body).toHaveProperty('id')
    expect(response.body.title).toBe('Test Post')
    expect(response.body.slug).toBe('test-post')
  })

  it('should list posts with pagination', async () => {
    // Create test posts using factory
    const prisma = getTestPrisma()
    await Promise.all([
      createPost(prisma, authorId, { title: 'Post 1', published: true }),
      createPost(prisma, authorId, { title: 'Post 2', published: true }),
      createPost(prisma, authorId, { title: 'Post 3', published: true })
    ])

    const response = await app
      .get('/api/posts?take=2&skip=0')
      .expect(200)

    // Use helper assertions
    assertions.hasPagedResponse(response.body)
    assertions.hasPagination(response.body.meta)
    
    expect(response.body.data).toHaveLength(2)
    expect(response.body.meta.take).toBe(2)
  })

  it('should get post by id', async () => {
    const prisma = getTestPrisma()
    const post = await createPost(prisma, authorId, {
      title: 'Test Post',
      published: true
    })

    const response = await app.get(`/api/posts/${post.id}`).expect(200)

    expect(response.body.id).toBe(post.id)
    expect(response.body.title).toBe('Test Post')
    assertions.isValidTimestamp(response.body.createdAt)
  })

  it('should update post', async () => {
    const prisma = getTestPrisma()
    const post = await createPost(prisma, authorId)
    
    const authRequest = createAuthRequest(app, authorToken)
    const response = await authRequest
      .put(`/api/posts/${post.id}`)
      .send({
        title: 'Updated Test Post',
        published: true
      })
      .expect(200)

    expect(response.body.title).toBe('Updated Test Post')
    expect(response.body.published).toBe(true)
  })

  it('should delete post', async () => {
    const prisma = getTestPrisma()
    const post = await createPost(prisma, authorId)
    
    const authRequest = createAuthRequest(app, authorToken)
    
    await authRequest.delete(`/api/posts/${post.id}`).expect(204)

    // Verify deleted
    await app.get(`/api/posts/${post.id}`).expect(404)
  })
})

describe('Blog API - Categories', () => {
  it('should create category (admin only)', async () => {
    const authRequest = createAuthRequest(app, adminToken)
    
    const response = await authRequest
      .post('/api/categories')
      .send({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .expect(201)

    expect(response.body.name).toBe('Test Category')
  })

  it('should not allow non-admin to create category', async () => {
    const authRequest = createAuthRequest(app, authorToken)
    
    await authRequest
      .post('/api/categories')
      .send({
        name: 'Unauthorized Category',
        slug: 'unauthorized'
      })
      .expect(403)
  })

  it('should list categories (public)', async () => {
    const prisma = getTestPrisma()
    await Promise.all([
      createCategory(prisma, { name: 'Category 1' }),
      createCategory(prisma, { name: 'Category 2' })
    ])

    const response = await app.get('/api/categories').expect(200)

    assertions.hasPagedResponse(response.body)
    expect(response.body.data.length).toBeGreaterThanOrEqual(2)
  })
})

describe('Blog API - Tags', () => {
  it('should create tag (admin only)', async () => {
    const authRequest = createAuthRequest(app, adminToken)
    
    const response = await authRequest
      .post('/api/tags')
      .send({
        name: 'Test Tag',
        slug: 'test-tag'
      })
      .expect(201)

    expect(response.body.name).toBe('Test Tag')
  })

  it('should list tags (public)', async () => {
    const prisma = getTestPrisma()
    await Promise.all([
      createTag(prisma, { name: 'Tag 1' }),
      createTag(prisma, { name: 'Tag 2' }),
      createTag(prisma, { name: 'Tag 3' })
    ])

    const response = await app.get('/api/tags').expect(200)

    assertions.hasPagedResponse(response.body)
    expect(response.body.data.length).toBeGreaterThanOrEqual(3)
  })
})

describe('Blog API - Health & Meta', () => {
  it('should return health status', async () => {
    const response = await app.get('/health').expect(200)

    expect(response.body.status).toBe('ok')
    expect(response.body).toHaveProperty('timestamp')
  })

  it('should count posts', async () => {
    const prisma = getTestPrisma()
    await Promise.all([
      createPost(prisma, authorId),
      createPost(prisma, authorId),
      createPost(prisma, authorId)
    ])

    const response = await app.get('/api/posts/meta/count').expect(200)

    expect(response.body).toHaveProperty('total')
    expect(response.body.total).toBeGreaterThanOrEqual(3)
  })
})

