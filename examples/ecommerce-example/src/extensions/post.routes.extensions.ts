/**
 * Extended Post Routes
 * 
 * Combines generated routes with custom extensions
 */

import { Router } from 'express'
import * as generatedController from '@gen/controllers/post'
import * as extendedController from './post.controller.extensions.js'
import { authenticate, optionalAuthenticate } from '../auth/jwt.js'

export const postRouter = Router()

// ============================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================

/**
 * Search posts
 * GET /api/posts/search?q=typescript&category=1&limit=20
 */
postRouter.get('/search', extendedController.searchPosts)

/**
 * Get popular posts (by views)
 * GET /api/posts/popular?limit=10
 */
postRouter.get('/popular', extendedController.getPopularPosts)

/**
 * Get recent posts
 * GET /api/posts/recent?limit=10
 */
postRouter.get('/recent', extendedController.getRecentPosts)

/**
 * Get post by slug (SEO-friendly)
 * GET /api/posts/slug/getting-started-with-typescript
 */
postRouter.get('/slug/:slug', extendedController.getPostBySlug)

/**
 * List all published posts (public)
 * GET /api/posts
 */
postRouter.get('/', generatedController.listPosts)

/**
 * Get post by ID (public)
 * GET /api/posts/123
 */
postRouter.get('/:id', generatedController.getPost)

/**
 * Count posts
 * GET /api/posts/meta/count
 */
postRouter.get('/meta/count', generatedController.countPosts)

/**
 * Increment view counter
 * POST /api/posts/:id/views
 */
postRouter.post('/:id/views', extendedController.incrementPostViews)

// ============================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================

/**
 * Create post (requires authentication)
 * POST /api/posts
 */
postRouter.post('/', authenticate, generatedController.createPost)

/**
 * Update post (requires authentication + ownership)
 * PUT /api/posts/:id
 * PATCH /api/posts/:id
 * 
 * TODO: Add ownership check in controller
 */
postRouter.put('/:id', authenticate, generatedController.updatePost)
postRouter.patch('/:id', authenticate, generatedController.updatePost)

/**
 * Delete post (requires authentication + ownership)
 * DELETE /api/posts/:id
 * 
 * TODO: Add ownership check in controller
 */
postRouter.delete('/:id', authenticate, generatedController.deletePost)

