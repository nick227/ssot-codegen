/**
 * Post Service Extensions
 * 
 * This example shows how to extend generated services with custom business logic.
 * Import the generated service and add your own methods.
 */

import { postService as generatedPostService } from '@gen/services/post'
import prisma from '../src/db.js'
import type { Prisma } from '@prisma/client'

export const postService = {
  // Include all generated CRUD methods
  ...generatedPostService,
  
  /**
   * Search posts by title, content, or excerpt
   * Custom method not in generated code
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
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } }
      ],
      ...(publishedOnly && { published: true }),
      ...(authorId && { authorId }),
      ...(categoryId && { categories: { some: { categoryId } } }),
      ...(tagId && { tags: { some: { tagId } } })
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
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
          _count: { select: { comments: true } }
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
      meta: { total, query, limit }
    }
  },

  /**
   * Find post by slug with full relationships
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
              select: { id: true, name: true, slug: true }
            }
          }
        },
        tags: {
          include: {
            tag: {
              select: { id: true, name: true, slug: true }
            }
          }
        },
        _count: { select: { comments: true } }
      }
    })
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
  }
}

