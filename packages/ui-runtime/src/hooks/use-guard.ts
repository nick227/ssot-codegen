/**
 * useGuard Hook
 * 
 * Checks if current user satisfies guard requirements.
 * 
 * REDLINE: Guards in JSON only, deny-by-default.
 */

import { useState, useEffect } from 'react'
import type { AuthAdapter, Guard } from '@ssot-ui/adapters'

export interface UseGuardResult {
  allowed: boolean
  checking: boolean
  user: any | null
}

/**
 * Check guard (with deny-by-default)
 */
export function useGuard(
  guard: Guard | undefined,
  authAdapter: AuthAdapter | undefined
): UseGuardResult {
  const [allowed, setAllowed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  
  useEffect(() => {
    async function checkGuard() {
      setChecking(true)
      
      // No guard = allow
      if (!guard) {
        setAllowed(true)
        setChecking(false)
        return
      }
      
      // No auth adapter = deny all guards (REDLINE)
      if (!authAdapter) {
        setAllowed(false)
        setChecking(false)
        return
      }
      
      // Get user
      const currentUser = await authAdapter.getCurrentUser()
      setUser(currentUser)
      
      // Check guard
      const canAccess = await authAdapter.can(guard)
      setAllowed(canAccess)
      setChecking(false)
    }
    
    checkGuard()
  }, [guard, authAdapter])
  
  return { allowed, checking, user }
}

