/**
 * GuardWrapper
 * 
 * Wraps pages with authorization checks.
 * 
 * REDLINE: Guards in JSON only, deny-by-default.
 * GUARD FIRST, FETCH SECOND.
 */

import type { ReactNode } from 'react'
import type { AuthAdapter, Guard } from '@ssot-ui/adapters'
import { useGuard } from '../hooks/use-guard.js'

export interface GuardWrapperProps {
  guard: Guard | undefined
  authAdapter: AuthAdapter | undefined
  children: ReactNode
  onUnauthorized?: () => void
}

export function GuardWrapper(props: GuardWrapperProps) {
  const { guard, authAdapter, children, onUnauthorized } = props
  const { allowed, checking } = useGuard(guard, authAdapter)
  
  // Loading guard check
  if (checking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
          <p className="text-neutral-600">Checking permissions...</p>
        </div>
      </div>
    )
  }
  
  // Unauthorized
  if (!allowed) {
    // Redirect via callback
    if (onUnauthorized) {
      onUnauthorized()
      return null
    }
    
    // Show unauthorized message
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-error-50 border border-error-200 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-error-900 mb-4">
            🔒 Unauthorized
          </h1>
          <p className="text-error-700 mb-6">
            You don't have permission to access this page.
          </p>
          {authAdapter && (
            <button
              onClick={() => authAdapter.redirectToLogin(window.location.pathname)}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    )
  }
  
  // Authorized - render children
  return <>{children}</>
}

