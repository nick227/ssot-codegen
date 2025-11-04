/**
 * Post Controller Extensions
 * 
 * Extended controllers with authorization and domain logic
 */

import type { Request, Response } from 'express'
import type { AuthRequest } from '../auth/jwt.js'
import { postService } from './post.service.extensions.js'
import { logger } from '../logger.js'

/**
 * Search posts
 * GET /api/posts/search?q=typescript&category=1&tag=2
 */
export const searchPosts = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Search query is required'
      })
    }

    if (query.length < 2) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Search query must be at least 2 characters'
      })
    }

    const result = await postService.search(query, {
      publishedOnly: true,
      limit: parseInt(req.query.limit as string) || 20,
      categoryId: req.query.category ? parseInt(req.query.category as string) : undefined,
      tagId: req.query.tag ? parseInt(req.query.tag as string) : undefined
    })

    logger.info({ query, resultsCount: result.data.length }, 'Post search executed')

    return res.json(result)
  } catch (error) {
    logger.error({ error, query: req.query }, 'Post search failed')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * Get post by slug
 * GET /api/posts/slug/:slug
 */
export const getPostBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    
    const post = await postService.findBySlug(slug)
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Only return published posts to non-authenticated users
    if (!post.published) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Increment views (async, don't wait)
    postService.incrementViews(post.id).catch(err =>
      logger.error({ err, postId: post.id }, 'Failed to increment views')
    )

    return res.json(post)
  } catch (error) {
    logger.error({ error, slug: req.params.slug }, 'Failed to get post by slug')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * Get popular posts
 * GET /api/posts/popular?limit=10
 */
export const getPopularPosts = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10
    
    if (limit > 50) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Limit cannot exceed 50'
      })
    }

    const posts = await postService.getPopular(limit)

    return res.json({
      data: posts,
      meta: { limit }
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get popular posts')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * Get recent posts
 * GET /api/posts/recent?limit=10
 */
export const getRecentPosts = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10
    
    const posts = await postService.getRecent(limit)

    return res.json({
      data: posts,
      meta: { limit }
    })
  } catch (error) {
    logger.error({ error }, 'Failed to get recent posts')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * Increment post views
 * POST /api/posts/:id/views
 */
export const incrementPostViews = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' })
    }

    const result = await postService.incrementViews(id)
    
    if (!result) {
      return res.status(404).json({ error: 'Post not found' })
    }

    return res.json(result)
  } catch (error) {
    logger.error({ error, postId: req.params.id }, 'Failed to increment views')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

