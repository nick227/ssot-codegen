/**
 * AuthAdapter Interface
 * 
 * REDLINE: Guards declared in JSON only, deny-by-default.
 * 
 * CONTRACT:
 * - can(guard) is synchronous or async boolean check
 * - Renderer short-circuits unauthorized views
 * - No AuthAdapter = deny all guarded routes
 */

// ============================================================================
// User Model
// ============================================================================

export interface User {
  id: string
  name?: string
  email?: string
  image?: string
  roles?: string[]
  permissions?: string[]
}

// ============================================================================
// Guard Definition
// ============================================================================

export interface Guard {
  roles?: string[]
  permissions?: string[]
}

// ============================================================================
// AuthAdapter Interface
// ============================================================================

export interface AuthAdapter {
  /**
   * Check if current user satisfies guard requirements
   * 
   * DENY-BY-DEFAULT: Returns false if no user or requirements not met
   */
  can(guard: Guard): boolean | Promise<boolean>
  
  /**
   * Get current user (null if not authenticated)
   */
  getCurrentUser(): Promise<User | null>
  
  /**
   * Redirect to login page
   */
  redirectToLogin(returnUrl?: string): void
  
  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean | Promise<boolean>
  
  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean | Promise<boolean>
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if user satisfies guard (synchronous)
 */
export function checkGuard(user: User | null, guard: Guard): boolean {
  // No user = deny
  if (!user) return false
  
  // Check roles
  if (guard.roles && guard.roles.length > 0) {
    if (!user.roles) return false
    const hasRole = guard.roles.some(role => user.roles?.includes(role))
    if (!hasRole) return false
  }
  
  // Check permissions
  if (guard.permissions && guard.permissions.length > 0) {
    if (!user.permissions) return false
    const hasPermission = guard.permissions.some(perm => user.permissions?.includes(perm))
    if (!hasPermission) return false
  }
  
  return true
}

/**
 * Extract roles from user
 */
export function getUserRoles(user: User | null): string[] {
  return user?.roles || []
}

/**
 * Extract permissions from user
 */
export function getUserPermissions(user: User | null): string[] {
  return user?.permissions || []
}

