import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'
import prisma from '../../src/db.js'
import { generateTokens } from '../../src/auth/jwt.js'

let app: any
let authorToken: string
let adminToken: string
let authorId: number
let postId: number
let categoryId: number
let tagId: number

beforeAll(async () => {
  app = createApp()

  // Create test author
  const author = await prisma.author.create({
    data: {
      email: 'author@blog.com',
      username: 'testauthor',
      displayName: 'Test Author',
      role: 'AUTHOR',
    },
  })

  authorId = author.id
  const tokens = generateTokens({
    userId: author.id,
    email: author.email,
    role: 'AUTHOR',
  })
  authorToken = tokens.accessToken

  // Create test admin
  const admin = await prisma.author.create({
    data: {
      email: 'admin@blog.com',
      username: 'testadmin',
      displayName: 'Test Admin',
      role: 'ADMIN',
    },
  })

  const adminTokens = generateTokens({
    userId: admin.id,
    email: admin.email,
    role: 'ADMIN',
  })
  adminToken = adminTokens.accessToken
})

afterAll(async () => {
  // Cleanup
  await prisma.comment.deleteMany()
  await prisma.postTag.deleteMany()
  await prisma.postCategory.deleteMany()
  await prisma.post.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.category.deleteMany()
  await prisma.author.deleteMany({ where: { email: { contains: '@blog.com' } } })
  await prisma.$disconnect()
})

describe('Blog API - Posts', () => {
  it('should create a post', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        title: 'Test Post',
        slug: 'test-post',
        excerpt: 'This is a test post',
        content: 'Full content of the test post...',
        published: false,
        authorId,
      })
      .expect(201)

    expect(response.body).toHaveProperty('id')
    expect(response.body.title).toBe('Test Post')
    expect(response.body.slug).toBe('test-post')
    postId = response.body.id
  })

  it('should list posts', async () => {
    const response = await request(app)
      .get('/api/posts')
      .expect(200)

    expect(response.body).toHaveProperty('data')
    expect(response.body).toHaveProperty('meta')
    expect(Array.isArray(response.body.data)).toBe(true)
    expect(response.body.meta).toHaveProperty('total')
  })

  it('should get post by id', async () => {
    const response = await request(app)
      .get(`/api/posts/${postId}`)
      .expect(200)

    expect(response.body.id).toBe(postId)
    expect(response.body.title).toBe('Test Post')
  })

  it('should update post', async () => {
    const response = await request(app)
      .put(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        title: 'Updated Test Post',
        published: true,
      })
      .expect(200)

    expect(response.body.title).toBe('Updated Test Post')
    expect(response.body.published).toBe(true)
  })

  it('should delete post', async () => {
    await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${authorToken}`)
      .expect(204)

    // Verify deleted
    await request(app)
      .get(`/api/posts/${postId}`)
      .expect(404)
  })

  it('should handle pagination', async () => {
    // Create multiple posts
    await Promise.all([
      prisma.post.create({ data: { title: 'Post 1', slug: 'post-1', content: 'Content', authorId } }),
      prisma.post.create({ data: { title: 'Post 2', slug: 'post-2', content: 'Content', authorId } }),
      prisma.post.create({ data: { title: 'Post 3', slug: 'post-3', content: 'Content', authorId } }),
    ])

    const response = await request(app)
      .get('/api/posts?take=2&skip=0')
      .expect(200)

    expect(response.body.data).toHaveLength(2)
    expect(response.body.meta.take).toBe(2)
    expect(response.body.meta.skip).toBe(0)
  })
})

describe('Blog API - Categories', () => {
  it('should create category (admin only)', async () => {
    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category',
      })
      .expect(201)

    expect(response.body.name).toBe('Test Category')
    categoryId = response.body.id
  })

  it('should not allow non-admin to create category', async () => {
    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        name: 'Unauthorized Category',
        slug: 'unauthorized',
      })
      .expect(403) // Forbidden
  })

  it('should list categories (public)', async () => {
    const response = await request(app)
      .get('/api/categories')
      .expect(200)

    expect(response.body).toHaveProperty('data')
    expect(Array.isArray(response.body.data)).toBe(true)
  })
})

describe('Blog API - Tags', () => {
  it('should create tag (admin only)', async () => {
    const response = await request(app)
      .post('/api/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Tag',
        slug: 'test-tag',
      })
      .expect(201)

    expect(response.body.name).toBe('Test Tag')
    tagId = response.body.id
  })

  it('should list tags (public)', async () => {
    const response = await request(app)
      .get('/api/tags')
      .expect(200)

    expect(response.body).toHaveProperty('data')
    expect(Array.isArray(response.body.data)).toBe(true)
  })
})

describe('Blog API - Comments', () => {
  let commentId: number

  it('should create comment', async () => {
    // First create a post
    const post = await prisma.post.create({
      data: {
        title: 'Comment Test Post',
        slug: 'comment-test-post',
        content: 'Test content',
        authorId,
      },
    })

    const response = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        content: 'Test comment content',
        postId: post.id,
        authorId,
      })
      .expect(201)

    expect(response.body.content).toBe('Test comment content')
    commentId = response.body.id
  })

  it('should list comments for post', async () => {
    const response = await request(app)
      .get('/api/comments')
      .expect(200)

    expect(response.body).toHaveProperty('data')
    expect(Array.isArray(response.body.data)).toBe(true)
  })

  it('should approve comment (admin only)', async () => {
    const response = await request(app)
      .put(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approved: true })
      .expect(200)

    expect(response.body.approved).toBe(true)
  })
})

describe('Blog API - Health & Meta', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200)

    expect(response.body.status).toBe('ok')
    expect(response.body).toHaveProperty('timestamp')
  })

  it('should count posts', async () => {
    const response = await request(app)
      .get('/api/posts/meta/count')
      .expect(200)

    expect(response.body).toHaveProperty('total')
    expect(typeof response.body.total).toBe('number')
  })
})

