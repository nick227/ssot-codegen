/**
 * Protected Post Routes
 * 
 * Extends generated routes with authorization middleware.
 * Demonstrates the extension pattern for adding auth to generated code.
 */

import { Router } from 'express'
import { postRouter } from '@gen/routes/post'
import { postService } from '@gen/services/post'
import { authenticate, authorize } from '../auth/jwt.js'
import { requireResourceOwnership, requireRole } from '../auth/authorization.js'

/**
 * Create protected post router with authorization
 */
export const createProtectedPostRouter = (): Router => {
  const router = Router()

  // ====================================================================
  // PUBLIC ROUTES (no auth required)
  // ====================================================================

  // List published posts (public)
  router.get('/published', (req, res, next) => {
    // Import controller dynamically to avoid circular deps
    import('@gen/controllers/post').then(({ listPublishedPosts }) => {
      listPublishedPosts(req, res)
    })
  })

  // Get post by slug (public)
  router.get('/slug/:slug', (req, res) => {
    import('@gen/controllers/post').then(({ getPostBySlug }) => {
      getPostBySlug(req, res)
    })
  })

  // Increment views (public - track anonymous views)
  router.post('/:id/views', (req, res) => {
    import('@gen/controllers/post').then(({ incrementPostViews }) => {
      incrementPostViews(req, res)
    })
  })

  // Count posts (public)
  router.get('/meta/count', (req, res) => {
    import('@gen/controllers/post').then(({ countPosts }) => {
      countPosts(req, res)
    })
  })

  // ====================================================================
  // AUTHENTICATED ROUTES (require login)
  // ====================================================================

  // List all posts (authenticated - shows user's drafts + all published)
  router.get('/',
    authenticate,
    (req, res) => {
      import('@gen/controllers/post').then(({ listPosts }) => {
        listPosts(req, res)
      })
    }
  )

  // Get post by ID (authenticated - may show drafts)
  router.get('/:id',
    authenticate,
    (req, res) => {
      import('@gen/controllers/post').then(({ getPost }) => {
        getPost(req, res)
      })
    }
  )

  // ====================================================================
  // AUTHOR/EDITOR/ADMIN ROUTES (require specific roles)
  // ====================================================================

  // Create post (requires AUTHOR, EDITOR, or ADMIN role)
  router.post('/',
    authenticate,
    requireRole('AUTHOR', 'EDITOR', 'ADMIN'),
    (req, res) => {
      import('@gen/controllers/post').then(({ createPost }) => {
        createPost(req, res)
      })
    }
  )

  // ====================================================================
  // OWNER OR ADMIN ROUTES (require ownership or admin role)
  // ====================================================================

  // Update post (requires ownership or ADMIN role)
  router.put('/:id',
    authenticate,
    requireResourceOwnership({
      service: postService,
      ownerField: 'authorId',
      resourceName: 'Post',
      allowedRoles: ['ADMIN', 'EDITOR']  // Editors can edit any post
    }),
    (req, res) => {
      import('@gen/controllers/post').then(({ updatePost }) => {
        updatePost(req, res)
      })
    }
  )

  router.patch('/:id',
    authenticate,
    requireResourceOwnership({
      service: postService,
      ownerField: 'authorId',
      resourceName: 'Post',
      allowedRoles: ['ADMIN', 'EDITOR']
    }),
    (req, res) => {
      import('@gen/controllers/post').then(({ updatePost }) => {
        updatePost(req, res)
      })
    }
  )

  // Delete post (requires ownership or ADMIN role only)
  router.delete('/:id',
    authenticate,
    requireResourceOwnership({
      service: postService,
      ownerField: 'authorId',
      resourceName: 'Post',
      allowedRoles: ['ADMIN']  // Only admins can delete others' posts
    }),
    (req, res) => {
      import('@gen/controllers/post').then(({ deletePost }) => {
        deletePost(req, res)
      })
    }
  )

  // Publish post (requires ownership or EDITOR/ADMIN role)
  router.post('/:id/publish',
    authenticate,
    requireResourceOwnership({
      service: postService,
      ownerField: 'authorId',
      resourceName: 'Post',
      allowedRoles: ['ADMIN', 'EDITOR']
    }),
    (req, res) => {
      import('@gen/controllers/post').then(({ publishPost }) => {
        publishPost(req, res)
      })
    }
  )

  // Unpublish post (requires ownership or EDITOR/ADMIN role)
  router.post('/:id/unpublish',
    authenticate,
    requireResourceOwnership({
      service: postService,
      ownerField: 'authorId',
      resourceName: 'Post',
      allowedRoles: ['ADMIN', 'EDITOR']
    }),
    (req, res) => {
      import('@gen/controllers/post').then(({ unpublishPost }) => {
        unpublishPost(req, res)
      })
    }
  )

  return router
}

/**
 * Export configured router
 */
export const protectedPostRouter = createProtectedPostRouter()

