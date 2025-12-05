import React, { createContext, useContext, useState, useEffect } from 'react'

interface AuthContextValue {
  userId: string | null
  isLoading: boolean
  setUserId: (userId: string | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TODO: Implement actual auth check (localStorage, token validation, etc.)
    // For now, use placeholder
    const storedUserId = localStorage.getItem('userId') || 'current-user-id'
    setUserId(storedUserId)
    setIsLoading(false)
  }, [])

  return (
    <AuthContext.Provider value={{ userId, isLoading, setUserId }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function useCurrentUserId(): string {
  const { userId } = useAuth()
  if (!userId) {
    throw new Error('User not authenticated')
  }
  return userId
}

