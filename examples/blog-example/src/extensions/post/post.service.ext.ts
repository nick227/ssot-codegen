/**
 * Post Service Extensions
 * 
 * Extends generated post service with blog-specific functionality.
 * This demonstrates how to add features to generated code.
 */

import { postService as generatedPostService } from '@gen/services/post'
import prisma from '../../db.js'
import type { Prisma } from '@prisma/client'

export const postService = {
  // Include all generated base methods
  ...generatedPostService,
  
  /**
   * Search posts by title, content, or excerpt
   * 
   * @param query - Search query string
   * @param options - Search options (publishedOnly, limit, authorId)
   */
  async search(
    query: string, 
    options: {
      publishedOnly?: boolean
      limit?: number
      authorId?: number
      categoryId?: number
      tagId?: number
    } = {}
  ) {
    const {
      publishedOnly = true,
      limit = 20,
      authorId,
      categoryId,
      tagId
    } = options

    const where: Prisma.PostWhereInput = {
      // Search across multiple fields
      OR: [
        { title: { contains: query } },
        { content: { contains: query } },
        { excerpt: { contains: query } }
      ],
      // Apply filters
      ...(publishedOnly && { published: true }),
      ...(authorId && { authorId }),
      ...(categoryId && { 
        categories: { some: { categoryId } }
      }),
      ...(tagId && {
        tags: { some: { tagId } }
      })
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true
            }
          },
          categories: {
            include: { category: true }
          },
          tags: {
            include: { tag: true }
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy: [
          { publishedAt: 'desc' },
          { views: 'desc' }
        ],
        take: limit
      }),
      prisma.post.count({ where })
    ])

    return {
      data: posts,
      meta: {
        total,
        query,
        limit
      }
    }
  },

  /**
   * Find post by slug with full relationships
   * 
   * @param slug - URL-friendly post identifier
   */
  async findBySlug(slug: string) {
    return prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            avatarUrl: true
          }
        },
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
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        _count: {
          select: { comments: true }
        }
      }
    })
  },

  /**
   * List only published posts with relationships
   */
  async listPublished(options: {
    skip?: number
    take?: number
    authorId?: number
    categoryId?: number
    tagId?: number
  } = {}) {
    const { skip = 0, take = 20, authorId, categoryId, tagId } = options

    const where: Prisma.PostWhereInput = {
      published: true,
      publishedAt: { lte: new Date() },
      ...(authorId && { authorId }),
      ...(categoryId && {
        categories: { some: { categoryId } }
      }),
      ...(tagId && {
        tags: { some: { tagId } }
      })
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true
            }
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy: { publishedAt: 'desc' }
      }),
      prisma.post.count({ where })
    ])

    return {
      data: posts,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total
      }
    }
  },

  /**
   * Increment view counter
   */
  async incrementViews(id: number) {
    return prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
      select: { id: true, views: true }
    })
  },

  /**
   * Get popular posts (by views)
   */
  async getPopular(limit: number = 10) {
    return prisma.post.findMany({
      where: { published: true },
      include: {
        author: {
          select: { id: true, username: true, displayName: true }
        },
        _count: { select: { comments: true } }
      },
      orderBy: [
        { views: 'desc' },
        { likes: 'desc' }
      ],
      take: limit
    })
  },

  /**
   * Get recent posts
   */
  async getRecent(limit: number = 10) {
    return prisma.post.findMany({
      where: { published: true },
      include: {
        author: {
          select: { id: true, username: true, displayName: true }
        }
      },
      orderBy: { publishedAt: 'desc' },
      take: limit
    })
  }
}

