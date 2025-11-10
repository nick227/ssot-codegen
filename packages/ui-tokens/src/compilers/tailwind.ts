/**
 * Compile tokens to Tailwind config
 */

import type { TokenSet, TailwindConfig } from '../types.js'

export function compileTailwindConfig(tokens: TokenSet): TailwindConfig {
  return {
    theme: {
      extend: {
        colors: compileColors(tokens.colors),
        spacing: compileSpacing(tokens.spacing),
        fontSize: compileFontSize(tokens.typography.fontSize),
        fontWeight: tokens.typography.fontWeight,
        fontFamily: tokens.typography.fontFamily,
        borderRadius: compileBorderRadius(tokens.borderRadius),
        boxShadow: tokens.boxShadow,
        zIndex: compileZIndex(tokens.zIndex),
        opacity: compileOpacity(tokens.opacity),
        screens: compileBreakpoints(tokens.breakpoints),
        transitionDuration: tokens.transitions
      }
    }
  }
}

function compileColors(colors: any): Record<string, any> {
  // Colors are already in the right format for Tailwind
  return colors
}

function compileSpacing(spacing: Record<string, number>): Record<string, string> {
  const result: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(spacing)) {
    if (value === 0) {
      result[key] = '0'
    } else if (key === 'px') {
      result[key] = '1px'
    } else {
      // Convert pixels to rem (assuming 16px = 1rem)
      result[key] = `${value / 16}rem`
    }
  }
  
  return result
}

function compileFontSize(
  fontSize: Record<string, { size: number; lineHeight: number }>
): Record<string, [string, { lineHeight: string }]> {
  const result: Record<string, [string, { lineHeight: string }]> = {}
  
  for (const [key, value] of Object.entries(fontSize)) {
    result[key] = [
      `${value.size}px`,
      { lineHeight: `${value.lineHeight}px` }
    ]
  }
  
  return result
}

function compileBorderRadius(borderRadius: Record<string, number | string>): Record<string, string> {
  const result: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(borderRadius)) {
    if (typeof value === 'string') {
      result[key] = value
    } else if (value === 0) {
      result[key] = '0'
    } else {
      result[key] = `${value}px`
    }
  }
  
  return result
}

function compileZIndex(zIndex: Record<string, number>): Record<string, string> {
  const result: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(zIndex)) {
    result[key] = String(value)
  }
  
  return result
}

function compileOpacity(opacity: Record<string, number>): Record<string, string> {
  const result: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(opacity)) {
    result[key] = String(value)
  }
  
  return result
}

function compileBreakpoints(breakpoints: Record<string, number>): Record<string, string> {
  const result: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(breakpoints)) {
    result[key] = `${value}px`
  }
  
  return result
}

