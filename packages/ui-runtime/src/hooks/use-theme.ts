/**
 * useTheme Hook
 * 
 * Applies theme tokens from theme.json as CSS custom properties.
 * Supports light/dark mode switching.
 */

import { useEffect, useState } from 'react'
import type { Theme } from '@ssot-ui/schemas'
import { generateCSSVars } from '@ssot-ui/schemas'

/**
 * Apply theme tokens to document
 */
export function useTheme(theme: Theme | undefined) {
  const [mode, setMode] = useState<string>('light')
  
  useEffect(() => {
    if (!theme) return
    
    // Determine initial mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialMode = theme.modes.includes('dark') && prefersDark ? 'dark' : theme.defaultMode
    setMode(initialMode)
    
    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      setMode(e.matches && theme.modes.includes('dark') ? 'dark' : 'light')
    }
    
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])
  
  useEffect(() => {
    if (!theme) return
    
    // Generate CSS vars for current mode
    const vars = generateCSSVars(theme, mode)
    
    // Apply to document root
    const root = document.documentElement
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value)
    }
    
    // Set data-theme attribute
    root.setAttribute('data-theme', mode)
  }, [theme, mode])
  
  return {
    mode,
    setMode: (newMode: string) => {
      if (theme?.modes.includes(newMode)) {
        setMode(newMode)
      }
    },
    availableModes: theme?.modes || ['light']
  }
}

