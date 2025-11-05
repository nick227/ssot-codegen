/**
 * Test Data Factory
 * Builders for creating consistent test data
 */

import { PrismaClient } from '@prisma/client'

/**
 * Author factory
 */
export async function createAuthor(
  prisma: PrismaClient,
  overrides: {
    email?: string
    username?: string
    displayName?: string
    role?: 'ADMIN' | 'AUTHOR' | 'SUBSCRIBER'
  } = {}
) {
  const timestamp = Date.now()
  return await prisma.author.create({
    data: {
      email: overrides.email || `author-${timestamp}@test.com`,
      username: overrides.username || `author${timestamp}`,
      displayName: overrides.displayName || `Test Author ${timestamp}`,
      role: overrides.role || 'AUTHOR'
    }
  })
}

/**
 * Category factory
 */
export async function createCategory(
  prisma: PrismaClient,
  overrides: {
    name?: string
    slug?: string
    description?: string
  } = {}
) {
  const timestamp = Date.now()
  return await prisma.category.create({
    data: {
      name: overrides.name || `Category ${timestamp}`,
      slug: overrides.slug || `category-${timestamp}`,
      description: overrides.description
    }
  })
}

/**
 * Tag factory
 */
export async function createTag(
  prisma: PrismaClient,
  overrides: {
    name?: string
    slug?: string
  } = {}
) {
  const timestamp = Date.now()
  return await prisma.tag.create({
    data: {
      name: overrides.name || `Tag ${timestamp}`,
      slug: overrides.slug || `tag-${timestamp}`
    }
  })
}

/**
 * Post factory
 */
export async function createPost(
  prisma: PrismaClient,
  authorId: number,
  overrides: {
    title?: string
    slug?: string
    content?: string
    excerpt?: string
    published?: boolean
  } = {}
) {
  const timestamp = Date.now()
  return await prisma.post.create({
    data: {
      title: overrides.title || `Post ${timestamp}`,
      slug: overrides.slug || `post-${timestamp}`,
      content: overrides.content || `Content for post ${timestamp}`,
      excerpt: overrides.excerpt,
      published: overrides.published ?? true,
      authorId
    }
  })
}

/**
 * Comment factory
 */
export async function createComment(
  prisma: PrismaClient,
  postId: number,
  authorId: number,
  overrides: {
    content?: string
    approved?: boolean
  } = {}
) {
  return await prisma.comment.create({
    data: {
      content: overrides.content || 'Test comment content',
      postId,
      authorId,
      approved: overrides.approved ?? false
    }
  })
}

/**
 * Create full post with relationships
 */
export async function createFullPost(
  prisma: PrismaClient,
  options: {
    authorRole?: 'ADMIN' | 'AUTHOR'
    categoryCount?: number
    tagCount?: number
    commentCount?: number
    published?: boolean
  } = {}
) {
  const author = await createAuthor(prisma, { role: options.authorRole })
  
  const categories = await Promise.all(
    Array.from({ length: options.categoryCount || 1 }, () => createCategory(prisma))
  )
  
  const tags = await Promise.all(
    Array.from({ length: options.tagCount || 1 }, () => createTag(prisma))
  )
  
  const post = await createPost(prisma, author.id, { published: options.published })
  
  // Link categories
  await Promise.all(
    categories.map(cat =>
      prisma.postCategory.create({
        data: { postId: post.id, categoryId: cat.id }
      })
    )
  )
  
  // Link tags
  await Promise.all(
    tags.map(tag =>
      prisma.postTag.create({
        data: { postId: post.id, tagId: tag.id }
      })
    )
  )
  
  // Create comments
  const comments = await Promise.all(
    Array.from({ length: options.commentCount || 0 }, () =>
      createComment(prisma, post.id, author.id)
    )
  )
  
  return { author, post, categories, tags, comments }
}

