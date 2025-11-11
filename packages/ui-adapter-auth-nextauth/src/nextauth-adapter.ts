/**
 * NextAuthAdapter
 * 
 * Reference implementation of AuthAdapter for NextAuth.
 * 
 * ENFORCES:
 * - Deny-by-default (no user = deny)
 * - Role-based access control
 * - Permission-based access control
 */

import type { AuthAdapter, Guard, User, checkGuard } from '@ssot-ui/adapters'

// ============================================================================
// NextAuth Adapter
// ============================================================================

export class NextAuthAdapter implements AuthAdapter {
  constructor(
    private getSession: () => Promise<any>, // NextAuth getServerSession or useSession
    private signIn: (returnUrl?: string) => void
  ) {}
  
  /**
   * Check if current user satisfies guard
   * 
   * REDLINE: Deny-by-default
   */
  async can(guard: Guard): Promise<boolean> {
    const session = await this.getSession()
    
    // No session = deny
    if (!session || !session.user) {
      return false
    }
    
    const user: User = {
      id: session.user.id || session.user.email,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      roles: session.user.roles || [],
      permissions: session.user.permissions || []
    }
    
    // Import checkGuard helper
    const { checkGuard } = await import('@ssot-ui/adapters/auth')
    return checkGuard(user, guard)
  }
  
  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession()
    
    if (!session || !session.user) {
      return null
    }
    
    return {
      id: session.user.id || session.user.email,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      roles: session.user.roles || [],
      permissions: session.user.permissions || []
    }
  }
  
  /**
   * Redirect to login
   */
  redirectToLogin(returnUrl?: string): void {
    this.signIn(returnUrl)
  }
  
  /**
   * Check if user has specific role
   */
  async hasRole(role: string): Promise<boolean> {
    const user = await this.getCurrentUser()
    if (!user) return false
    
    return user.roles?.includes(role) || false
  }
  
  /**
   * Check if user has specific permission
   */
  async hasPermission(permission: string): Promise<boolean> {
    const user = await this.getCurrentUser()
    if (!user) return false
    
    return user.permissions?.includes(permission) || false
  }
}

/**
 * Create NextAuth adapter for server components
 */
export function createServerAuthAdapter(getServerSession: any, signInUrl: string = '/api/auth/signin'): NextAuthAdapter {
  return new NextAuthAdapter(
    getServerSession,
    (returnUrl) => {
      // Server-side redirect
      if (typeof window === 'undefined') {
        // Will be handled by middleware
        throw new Error('REDIRECT_TO_LOGIN')
      }
    }
  )
}

/**
 * Create NextAuth adapter for client components
 */
export function createClientAuthAdapter(useSession: () => any, signIn: (opts?: any) => void): NextAuthAdapter {
  return new NextAuthAdapter(
    async () => {
      const session = useSession()
      return session.data
    },
    (returnUrl) => {
      signIn({ callbackUrl: returnUrl || window.location.pathname })
    }
  )
}

