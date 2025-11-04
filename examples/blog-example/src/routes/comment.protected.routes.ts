/**
 * Protected Comment Routes
 * 
 * Extends generated routes with authorization middleware for comments.
 * Implements moderation workflow with approval system.
 */

import { Router } from 'express'
import { commentService } from '@gen/services/comment'
import { authenticate } from '../auth/jwt.js'
import { requireResourceOwnership, requireRole } from '../auth/authorization.js'

/**
 * Create protected comment router with authorization
 */
export const createProtectedCommentRouter = (): Router => {
  const router = Router()

  // ====================================================================
  // PUBLIC ROUTES (no auth required)
  // ====================================================================

  // List approved comments (public)
  router.get('/', (req, res) => {
    import('@gen/controllers/comment').then(({ listComments }) => {
      // TODO: Filter to only approved comments in controller or add query param
      listComments(req, res)
    })
  })

  // Get comment by ID (public - only if approved)
  router.get('/:id',
    // TODO: Add middleware to verify comment is approved before showing
    (req, res) => {
      import('@gen/controllers/comment').then(({ getComment }) => {
        getComment(req, res)
      })
    }
  )

  // Count comments (public)
  router.get('/meta/count', (req, res) => {
    import('@gen/controllers/comment').then(({ countComments }) => {
      countComments(req, res)
    })
  })

  // ====================================================================
  // AUTHENTICATED ROUTES (require login)
  // ====================================================================

  // Create comment (authenticated users can comment)
  router.post('/',
    authenticate,
    (req, res) => {
      import('@gen/controllers/comment').then(({ createComment }) => {
        createComment(req, res)
      })
    }
  )

  // ====================================================================
  // OWNER OR MODERATOR ROUTES
  // ====================================================================

  // Update comment (requires ownership or MODERATOR/ADMIN role)
  router.put('/:id',
    authenticate,
    requireResourceOwnership({
      service: commentService,
      ownerField: 'authorId',
      resourceName: 'Comment',
      allowedRoles: ['ADMIN', 'EDITOR']  // Editors can moderate
    }),
    (req, res) => {
      import('@gen/controllers/comment').then(({ updateComment }) => {
        updateComment(req, res)
      })
    }
  )

  router.patch('/:id',
    authenticate,
    requireResourceOwnership({
      service: commentService,
      ownerField: 'authorId',
      resourceName: 'Comment',
      allowedRoles: ['ADMIN', 'EDITOR']
    }),
    (req, res) => {
      import('@gen/controllers/comment').then(({ updateComment }) => {
        updateComment(req, res)
      })
    }
  )

  // Delete comment (requires ownership or ADMIN role)
  router.delete('/:id',
    authenticate,
    requireResourceOwnership({
      service: commentService,
      ownerField: 'authorId',
      resourceName: 'Comment',
      allowedRoles: ['ADMIN', 'EDITOR']  // Editors can delete spam
    }),
    (req, res) => {
      import('@gen/controllers/comment').then(({ deleteComment }) => {
        deleteComment(req, res)
      })
    }
  )

  // ====================================================================
  // MODERATOR/ADMIN ROUTES (moderation workflow)
  // ====================================================================

  // List pending comments (requires EDITOR or ADMIN role)
  router.get('/pending',
    authenticate,
    requireRole('EDITOR', 'ADMIN'),
    (req, res) => {
      import('@gen/controllers/comment').then(({ listPendingComments }) => {
        listPendingComments(req, res)
      })
    }
  )

  // Approve comment (requires EDITOR or ADMIN role)
  router.post('/:id/approve',
    authenticate,
    requireRole('EDITOR', 'ADMIN'),
    (req, res) => {
      import('@gen/controllers/comment').then(({ approveComment }) => {
        approveComment(req, res)
      })
    }
  )

  return router
}

/**
 * Export configured router
 */
export const protectedCommentRouter = createProtectedCommentRouter()

