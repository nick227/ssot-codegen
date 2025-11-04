/**
 * Protected Comment Routes (Extension)
 * 
 * Extends generated comment routes with authorization and moderation workflow.
 * Uses convention-based route builder for clean, readable configuration.
 */

import type { Router as RouterType } from 'express'
import { buildProtectedRouter } from '../../utils/route-builder.js'
import { commentService } from '@gen/services/comment'

/**
 * Comment Router with Full Authorization and Moderation
 * 
 * - Public: list approved comments
 * - Authenticated: create comments
 * - Owner/EDITOR/ADMIN: update, delete
 * - EDITOR/ADMIN: approve, list pending
 */
export const protectedCommentRouter: RouterType = buildProtectedRouter({
  model: 'comment',
  service: commentService,
  ownerField: 'authorId',
  
  // Standard CRUD permissions
  list: 'public',                                    // Public can list (approved only should be handled in controller)
  get: 'public',                                     // Public can get (if approved)
  create: 'auth',                                    // Any authenticated user can comment
  update: { ownerOrRoles: ['ADMIN', 'EDITOR'] },     // Owner or moderators can update
  delete: { ownerOrRoles: ['ADMIN', 'EDITOR'] },     // Owner or moderators can delete
  count: 'public',                                   // Public can count
  
  // Moderation workflow routes (auto-generated methods from Phase 1)
  custom: [
    { 
      method: 'get', 
      path: '/pending', 
      controller: 'listPendingComments', 
      protection: { roles: ['EDITOR', 'ADMIN'] } 
    },
    { 
      method: 'post', 
      path: '/:id/approve', 
      controller: 'approveComment', 
      protection: { roles: ['EDITOR', 'ADMIN'] } 
    },
  ]
})

/**
 * Metadata for auto-registration
 */
;(protectedCommentRouter as any).__meta = {
  basePath: '/comments',
  priority: 10,
  description: 'Protected comment routes with moderation workflow'
}

