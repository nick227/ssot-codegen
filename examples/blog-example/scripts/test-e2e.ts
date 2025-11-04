#!/usr/bin/env tsx
/**
 * End-to-End Test Script for Blog Example
 * Tests the complete blog API workflow
 */

import { config } from 'dotenv'
config()

const API_URL = process.env.API_URL || 'http://localhost:3001'
const API_PREFIX = process.env.API_PREFIX || '/api'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration: number
}

const results: TestResult[] = []

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now()
  try {
    await fn()
    const duration = Date.now() - start
    results.push({ name, passed: true, duration })
    console.log(`✅ ${name} (${duration}ms)`)
  } catch (error) {
    const duration = Date.now() - start
    const errorMessage = error instanceof Error ? error.message : String(error)
    results.push({ name, passed: false, error: errorMessage, duration })
    console.log(`❌ ${name} (${duration}ms)`)
    console.log(`   Error: ${errorMessage}`)
  }
}

async function request(method: string, path: string, options: any = {}) {
  const url = `${API_URL}${path}`
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok && options.expectStatus && response.status !== options.expectStatus) {
    throw new Error(`Expected ${options.expectStatus}, got ${response.status}: ${JSON.stringify(data)}`)
  }

  return { status: response.status, data }
}

async function runE2ETests() {
  console.log('🧪 Running Blog Example E2E Tests\n')
  console.log(`API URL: ${API_URL}`)
  console.log(`API Prefix: ${API_PREFIX}\n`)

  let accessToken: string
  let authorId: number
  let postId: number

  // Health Check
  await test('Health check returns OK', async () => {
    const { status, data } = await request('GET', '/health')
    if (status !== 200 || data.status !== 'ok') {
      throw new Error('Health check failed')
    }
  })

  // Authentication Tests
  await test('Register new author', async () => {
    const { status, data } = await request('POST', `${API_PREFIX}/auth/register`, {
      body: {
        email: `e2e-${Date.now()}@blog.com`,
        password: 'E2ETest123!@#',
        name: 'E2E Test Author',
      },
    })

    if (status !== 201 || !data.accessToken) {
      throw new Error('Registration failed')
    }

    accessToken = data.accessToken
    authorId = data.user.id
  })

  await test('Login with credentials', async () => {
    const { status, data } = await request('POST', `${API_PREFIX}/auth/login`, {
      body: {
        email: `admin@blog.com`,
        password: 'Admin123!@#',
      },
    })

    if (status !== 200 || !data.accessToken) {
      throw new Error('Login failed')
    }
  })

  await test('Get current user profile', async () => {
    const { status, data } = await request('GET', `${API_PREFIX}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (status !== 200 || !data.user) {
      throw new Error('Get profile failed')
    }
  })

  // Post Tests
  await test('Create blog post', async () => {
    const { status, data } = await request('POST', `${API_PREFIX}/posts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      body: {
        title: 'E2E Test Post',
        slug: `e2e-test-post-${Date.now()}`,
        excerpt: 'Testing post creation',
        content: 'Full content of E2E test post',
        published: false,
        authorId,
      },
    })

    if (status !== 201 || !data.id) {
      throw new Error('Post creation failed')
    }

    postId = data.id
  })

  await test('List all posts', async () => {
    const { status, data } = await request('GET', `${API_PREFIX}/posts`)

    if (status !== 200 || !Array.isArray(data.data)) {
      throw new Error('List posts failed')
    }

    if (data.data.length === 0) {
      throw new Error('No posts returned')
    }
  })

  await test('Get post by ID', async () => {
    const { status, data } = await request('GET', `${API_PREFIX}/posts/${postId}`)

    if (status !== 200 || data.id !== postId) {
      throw new Error('Get post failed')
    }
  })

  await test('Update post', async () => {
    const { status, data } = await request('PUT', `${API_PREFIX}/posts/${postId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      body: {
        title: 'Updated E2E Test Post',
        published: true,
      },
    })

    if (status !== 200 || data.title !== 'Updated E2E Test Post') {
      throw new Error('Update post failed')
    }
  })

  await test('Pagination works', async () => {
    const { status, data } = await request('GET', `${API_PREFIX}/posts?take=2&skip=0`)

    if (status !== 200 || !data.meta) {
      throw new Error('Pagination failed')
    }

    if (data.data.length > 2) {
      throw new Error('Pagination limit not working')
    }
  })

  // Comment Tests
  await test('Create comment on post', async () => {
    const { status, data } = await request('POST', `${API_PREFIX}/comments`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      body: {
        content: 'E2E test comment',
        postId,
        authorId,
      },
    })

    if (status !== 201 || !data.id) {
      throw new Error('Comment creation failed')
    }
  })

  // Category Tests
  await test('Create category (admin)', async () => {
    const { status, data } = await request('POST', `${API_PREFIX}/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'E2E Category',
        slug: `e2e-category-${Date.now()}`,
        description: 'Test category',
      },
    })

    if (status !== 201 || !data.id) {
      throw new Error('Category creation failed')
    }

    categoryId = data.id
  })

  await test('List categories (public)', async () => {
    const { status, data } = await request('GET', `${API_PREFIX}/categories`)

    if (status !== 200 || !Array.isArray(data.data)) {
      throw new Error('List categories failed')
    }
  })

  // Tag Tests
  await test('Create tag (admin)', async () => {
    const { status, data } = await request('POST', `${API_PREFIX}/tags`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'E2E Tag',
        slug: `e2e-tag-${Date.now()}`,
      },
    })

    if (status !== 201 || !data.id) {
      throw new Error('Tag creation failed')
    }

    tagId = data.id
  })

  // Cleanup
  await test('Delete test post', async () => {
    const { status } = await request('DELETE', `${API_PREFIX}/posts/${postId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (status !== 204) {
      throw new Error('Delete post failed')
    }
  })

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 E2E Test Summary')
  console.log('='.repeat(60))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => r.failed).length
  const total = results.length

  console.log(`\nTotal Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}`)
      console.log(`     ${r.error}`)
    })
  }

  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
  console.log(`\n⏱️  Total Duration: ${totalDuration}ms`)

  if (failed > 0) {
    process.exit(1)
  }

  console.log('\n✅ All E2E tests passed!\n')
}

runE2ETests().catch((error) => {
  console.error('\n❌ E2E tests failed:', error)
  process.exit(1)
})

