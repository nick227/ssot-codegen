/**
 * Protected Post Routes (Extension)
 * 
 * Extends generated post routes with authorization using the simplified
 * convention-based route builder. Clean, intuitive, and maintainable!
 */

import type { Router as RouterType } from 'express'
import { buildProtectedRouter } from '../../utils/route-builder.js'
import { postService } from '@gen/services/post'

/**
 * Post Router with Full Authorization
 * 
 * - Public: published posts, slug lookup, view counter
 * - Authenticated: list all (with drafts)
 * - AUTHOR+: create posts
 * - Owner/EDITOR/ADMIN: update, publish/unpublish
 * - Owner/ADMIN: delete
 */
export const protectedPostRouter: RouterType = buildProtectedRouter({
  model: 'post',
  service: postService,
  ownerField: 'authorId',
  
  // Standard CRUD permissions
  list: 'auth',                                      // Authenticated users can see all (including own drafts)
  get: 'auth',                                       // Authenticated users can get by ID
  create: { roles: ['AUTHOR', 'EDITOR', 'ADMIN'] },  // Authors and above can create
  update: { ownerOrRoles: ['ADMIN', 'EDITOR'] },     // Owner or editors can update
  delete: { ownerOrRoles: ['ADMIN'] },               // Owner or admins can delete
  count: 'public',                                   // Public can count
  
  // Domain-specific routes (auto-generated methods from Phase 1)
  custom: [
    // Public routes
    { 
      method: 'get', 
      path: '/published', 
      controller: 'listPublishedPosts', 
      protection: 'public' 
    },
    { 
      method: 'get', 
      path: '/slug/:slug', 
      controller: 'getPostBySlug', 
      protection: 'public' 
    },
    { 
      method: 'post', 
      path: '/:id/views', 
      controller: 'incrementPostViews', 
      protection: 'public' 
    },
    
    // Protected workflow routes
    { 
      method: 'post', 
      path: '/:id/publish', 
      controller: 'publishPost', 
      protection: { ownerOrRoles: ['ADMIN', 'EDITOR'] } 
    },
    { 
      method: 'post', 
      path: '/:id/unpublish', 
      controller: 'unpublishPost', 
      protection: { ownerOrRoles: ['ADMIN', 'EDITOR'] } 
    },
  ]
})

/**
 * Metadata for auto-registration
 */
;(protectedPostRouter as any).__meta = {
  basePath: '/posts',
  priority: 10,
  description: 'Protected post routes with ownership and role-based authorization'
}

