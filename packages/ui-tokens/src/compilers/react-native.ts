/**
 * Compile tokens to React Native format
 */

import type { TokenSet, ReactNativeTokens } from '../types.js'

export function compileReactNativeTokens(tokens: TokenSet): ReactNativeTokens {
  return {
    colors: tokens.colors,
    spacing: tokens.spacing,
    typography: {
      fontSize: compileFontSize(tokens.typography.fontSize),
      fontWeight: tokens.typography.fontWeight,
      lineHeight: compileLineHeight(tokens.typography.fontSize),
      fontFamily: compileFontFamily(tokens.typography.fontFamily)
    },
    borderRadius: compileBorderRadius(tokens.borderRadius),
    zIndex: tokens.zIndex,
    opacity: tokens.opacity,
    breakpoints: tokens.breakpoints,
    shadows: compileShadows(tokens.boxShadow)
  }
}

function compileFontSize(
  fontSize: Record<string, { size: number; lineHeight: number }>
): Record<string, number> {
  const result: Record<string, number> = {}
  
  for (const [key, value] of Object.entries(fontSize)) {
    result[key] = value.size
  }
  
  return result
}

function compileLineHeight(
  fontSize: Record<string, { size: number; lineHeight: number }>
): Record<string, number> {
  const result: Record<string, number> = {}
  
  for (const [key, value] of Object.entries(fontSize)) {
    result[key] = value.lineHeight
  }
  
  return result
}

function compileFontFamily(
  fontFamily: Record<string, string[]>
): Record<string, string> {
  const result: Record<string, string> = {}
  
  for (const [key, fonts] of Object.entries(fontFamily)) {
    // React Native uses first font in the list
    result[key] = fonts[0]
  }
  
  return result
}

function compileBorderRadius(
  borderRadius: Record<string, number | string>
): Record<string, number> {
  const result: Record<string, number> = {}
  
  for (const [key, value] of Object.entries(borderRadius)) {
    if (typeof value === 'string') {
      // Handle special cases like 'full' → 9999
      result[key] = value === 'full' ? 9999 : parseInt(value) || 0
    } else {
      result[key] = value
    }
  }
  
  return result
}

function compileShadows(boxShadow: Record<string, string>): Record<string, any> {
  // React Native shadows work differently
  // Convert CSS box-shadow to RN shadow props
  const result: Record<string, any> = {}
  
  for (const [key, shadow] of Object.entries(boxShadow)) {
    if (shadow === 'none') {
      result[key] = {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0
      }
    } else {
      // Parse CSS shadow to RN properties
      // This is a simplified version
      const elevation = getShadowElevation(key)
      result[key] = {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: elevation / 2 },
        shadowOpacity: 0.1 + (elevation * 0.02),
        shadowRadius: elevation,
        elevation // Android
      }
    }
  }
  
  return result
}

function getShadowElevation(key: string): number {
  const elevations: Record<string, number> = {
    sm: 2,
    DEFAULT: 4,
    md: 6,
    lg: 10,
    xl: 15,
    '2xl': 20,
    inner: 0,
    none: 0
  }
  
  return elevations[key] || 4
}

