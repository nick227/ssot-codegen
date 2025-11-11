/**
 * NextRouterAdapter
 * 
 * Reference implementation of RouterAdapter for Next.js App Router.
 * 
 * ENFORCES:
 * - Declarative links
 * - navigate() returns Result<void>
 */

'use client'

import Link from 'next/link'
import { useParams, useSearchParams, usePathname, useRouter } from 'next/navigation'
import type { RouterAdapter, Result } from '@ssot-ui/adapters'

// ============================================================================
// Next Router Adapter
// ============================================================================

export const NextRouterAdapter: RouterAdapter = {
  /**
   * Link component (wraps Next.js Link)
   */
  Link: ({ href, prefetch, children, className }) => (
    <Link
      href={href}
      prefetch={prefetch}
      className={className}
    >
      {children}
    </Link>
  ),
  
  /**
   * Get route parameters
   */
  useParams: () => {
    const params = useParams()
    return params as Record<string, string | string[]>
  },
  
  /**
   * Get search parameters
   */
  useSearchParams: () => {
    const searchParams = useSearchParams()
    const params: Record<string, string | string[]> = {}
    
    searchParams.forEach((value, key) => {
      if (params[key]) {
        // Multiple values for same key
        if (Array.isArray(params[key])) {
          (params[key] as string[]).push(value)
        } else {
          params[key] = [params[key] as string, value]
        }
      } else {
        params[key] = value
      }
    })
    
    return params
  },
  
  /**
   * Programmatic navigation
   * 
   * Returns Result<void> to handle failures
   */
  useNavigate: () => {
    const router = useRouter()
    
    return async (path, options) => {
      try {
        if (options?.replace) {
          router.replace(path, { scroll: options?.scroll })
        } else {
          router.push(path, { scroll: options?.scroll })
        }
        
        return { ok: true, data: undefined }
      } catch (error) {
        return {
          ok: false,
          error: {
            code: 'NAVIGATION_ERROR',
            message: (error as Error).message
          }
        }
      }
    }
  },
  
  /**
   * Server-side redirect (Next.js specific)
   */
  redirect: (path, statusCode = 307) => {
    if (typeof window === 'undefined') {
      // Server-side - use Next.js redirect
      const { redirect } = require('next/navigation')
      redirect(path, statusCode)
    } else {
      // Client-side - use window.location
      window.location.href = path
    }
  },
  
  /**
   * Get current pathname
   */
  usePathname: () => {
    return usePathname()
  },
  
  /**
   * Check if route is active
   */
  isActive: (path) => {
    const pathname = usePathname()
    return pathname === path || pathname.startsWith(path + '/')
  }
}

