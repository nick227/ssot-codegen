/**
 * Permission Operations
 * 
 * SRP: Only permission checks
 * DRY: Used by all components that need permission checks
 */

import type { OperationRegistry, ExpressionContext } from '../types.js'

export const permissionOperations: OperationRegistry = {
  /**
   * Check if user has role
   * @example hasRole('admin', context) → true
   */
  hasRole: (role: string, context: ExpressionContext): boolean => {
    if (!context.user) return false
    return context.user.roles.includes(role)
  },

  /**
   * Check if user has any of the roles
   * @example hasAnyRole(['admin', 'editor'], context) → true
   */
  hasAnyRole: (roles: string[], context: ExpressionContext): boolean => {
    if (!context.user) return false
    if (!Array.isArray(roles)) return false
    return roles.some(role => context.user.roles.includes(role))
  },

  /**
   * Check if user has all roles
   * @example hasAllRoles(['admin', 'editor'], context) → false
   */
  hasAllRoles: (roles: string[], context: ExpressionContext): boolean => {
    if (!context.user) return false
    if (!Array.isArray(roles)) return false
    return roles.every(role => context.user.roles.includes(role))
  },

  /**
   * Check if user has permission
   * @example hasPermission('posts.edit', context) → true
   */
  hasPermission: (permission: string, context: ExpressionContext): boolean => {
    if (!context.user) return false
    if (!context.user.permissions) return false
    return context.user.permissions.includes(permission)
  },

  /**
   * Check if user is owner (field matches user ID)
   * @example isOwner('userId', context) → true if data.userId === context.user.id
   */
  isOwner: (ownerField: string = 'userId', context: ExpressionContext): boolean => {
    if (!context.user) return false
    if (!context.data) return false
    
    // Handle nested fields
    const parts = ownerField.split('.')
    let value = context.data
    for (const part of parts) {
      if (value == null) return false
      value = value[part]
    }
    
    return value === context.user.id
  },

  /**
   * Check if user is authenticated
   * @example isAuthenticated(context) → true
   */
  isAuthenticated: (context: ExpressionContext): boolean => {
    return context.user != null && context.user.id != null
  },

  /**
   * Check if user is anonymous
   * @example isAnonymous(context) → false
   */
  isAnonymous: (context: ExpressionContext): boolean => {
    return context.user == null || context.user.id == null
  }
}


