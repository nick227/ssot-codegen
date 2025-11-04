import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'
import prisma from '../../src/db.js'

let app: any

beforeAll(async () => {
  app = createApp()
  // Clear test data
  await prisma.comment.deleteMany()
  await prisma.postTag.deleteMany()
  await prisma.postCategory.deleteMany()
  await prisma.post.deleteMany()
  await prisma.author.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Blog API - Authentication', () => {
  let accessToken: string
  let userId: number

  it('should register a new author', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@blog.com',
        password: 'Test123!@#',
        name: 'Test Author',
      })
      .expect(201)

    expect(response.body).toHaveProperty('user')
    expect(response.body).toHaveProperty('accessToken')
    expect(response.body).toHaveProperty('refreshToken')
    expect(response.body.user.email).toBe('test@blog.com')

    accessToken = response.body.accessToken
    userId = response.body.user.id
  })

  it('should not register duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@blog.com',
        password: 'Test123!@#',
      })
      .expect(409) // Conflict
  })

  it('should reject weak passwords', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'weak@blog.com',
        password: 'weak',
      })
      .expect(400)

    expect(response.body.error).toBe('Weak Password')
    expect(response.body.details).toBeInstanceOf(Array)
  })

  it('should login with correct credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@blog.com',
        password: 'Test123!@#',
      })
      .expect(200)

    expect(response.body).toHaveProperty('accessToken')
    expect(response.body).toHaveProperty('user')
    expect(response.body.user).not.toHaveProperty('passwordHash')
  })

  it('should reject invalid credentials', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@blog.com',
        password: 'WrongPassword',
      })
      .expect(401)
  })

  it('should get current user with valid token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(response.body.user.email).toBe('test@blog.com')
    expect(response.body.user.id).toBe(userId)
  })

  it('should reject request without token', async () => {
    await request(app)
      .get('/api/auth/me')
      .expect(401)
  })

  it('should reject request with invalid token', async () => {
    await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401)
  })

  it('should refresh access token', async () => {
    // First login to get refresh token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@blog.com',
        password: 'Test123!@#',
      })
      .expect(200)

    const { refreshToken } = loginResponse.body

    // Refresh
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200)

    expect(response.body).toHaveProperty('accessToken')
    expect(response.body).toHaveProperty('refreshToken')
  })

  it('should change password', async () => {
    const response = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'Test123!@#',
        newPassword: 'NewPass123!@#',
      })
      .expect(200)

    expect(response.body.message).toContain('successfully')

    // Try login with new password
    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@blog.com',
        password: 'NewPass123!@#',
      })
      .expect(200)
  })
})

