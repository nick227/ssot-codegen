/**
 * Expression Provider Generator
 * 
 * Generates ExpressionContextProvider wrapper for app layout
 */

export function generateExpressionProvider(): string {
  return `/**
 * Expression Provider
 * 
 * Wraps app with expression context for dynamic logic
 */

'use client'

import { ExpressionContextProvider } from '@ssot-ui/expressions'
import { useState, useEffect } from 'react'

export interface ExpressionProviderProps {
  children: React.ReactNode
}

export function ExpressionProvider({ children }: ExpressionProviderProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Fetch user session
  useEffect(() => {
    // TODO: Replace with actual auth
    // Example with NextAuth:
    // import { useSession } from 'next-auth/react'
    // const { data: session } = useSession()
    // setUser(session?.user)
    
    // Mock user for development
    if (process.env.NODE_ENV === 'development') {
      setUser({
        id: 'dev-user',
        email: 'dev@example.com',
        role: 'user'
      })
    }
    
    setLoading(false)
  }, [])
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  return (
    <ExpressionContextProvider
      data={{}}
      user={user}
      globals={{}}
    >
      {children}
    </ExpressionContextProvider>
  )
}
`
}

