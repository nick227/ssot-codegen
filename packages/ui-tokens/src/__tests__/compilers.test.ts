/**
 * Tests for token compilers
 */

import { describe, it, expect } from 'vitest'
import { compileTailwindConfig } from '../compilers/tailwind'
import { compileReactNativeTokens } from '../compilers/react-native'
import tokens from '../../tokens.json'

describe('Tailwind Compiler', () => {
  it('should compile tokens to valid Tailwind config', () => {
    const config = compileTailwindConfig(tokens)
    
    expect(config).toBeDefined()
    expect(config.theme).toBeDefined()
    expect(config.theme.extend).toBeDefined()
  })
  
  it('should compile colors correctly', () => {
    const config = compileTailwindConfig(tokens)
    const colors = config.theme.extend.colors
    
    expect(colors.primary).toBeDefined()
    expect(colors.primary.DEFAULT).toBe('#3B82F6')
    expect(colors.primary['500']).toBe('#3B82F6')
    expect(colors.primary.hover).toBe('#2563EB')
  })
  
  it('should convert spacing to rem', () => {
    const config = compileTailwindConfig(tokens)
    const spacing = config.theme.extend.spacing
    
    // 16px = 1rem (4 units)
    expect(spacing['4']).toBe('1rem')
    // 32px = 2rem (8 units)
    expect(spacing['8']).toBe('2rem')
    // 0 = '0'
    expect(spacing['0']).toBe('0')
  })
  
  it('should compile fontSize with lineHeight', () => {
    const config = compileTailwindConfig(tokens)
    const fontSize = config.theme.extend.fontSize
    
    expect(fontSize.base).toEqual(['16px', { lineHeight: '24px' }])
    expect(fontSize.xl).toEqual(['20px', { lineHeight: '28px' }])
  })
  
  it('should preserve boxShadow values', () => {
    const config = compileTailwindConfig(tokens)
    const shadows = config.theme.extend.boxShadow
    
    expect(shadows.md).toBeDefined()
    expect(typeof shadows.md).toBe('string')
    expect(shadows.md).toContain('rgba')
  })
  
  it('should compile breakpoints to px strings', () => {
    const config = compileTailwindConfig(tokens)
    const screens = config.theme.extend.screens
    
    expect(screens.sm).toBe('640px')
    expect(screens.md).toBe('768px')
    expect(screens.lg).toBe('1024px')
  })
})

describe('React Native Compiler', () => {
  it('should compile tokens to valid RN format', () => {
    const rnTokens = compileReactNativeTokens(tokens)
    
    expect(rnTokens).toBeDefined()
    expect(rnTokens.colors).toBeDefined()
    expect(rnTokens.spacing).toBeDefined()
    expect(rnTokens.typography).toBeDefined()
  })
  
  it('should preserve color values', () => {
    const rnTokens = compileReactNativeTokens(tokens)
    
    expect(rnTokens.colors.primary.DEFAULT).toBe('#3B82F6')
    expect(rnTokens.colors.primary.hover).toBe('#2563EB')
  })
  
  it('should keep spacing as pixel numbers', () => {
    const rnTokens = compileReactNativeTokens(tokens)
    
    expect(rnTokens.spacing['4']).toBe(16)
    expect(rnTokens.spacing['8']).toBe(32)
    expect(typeof rnTokens.spacing['4']).toBe('number')
  })
  
  it('should extract fontSize as numbers', () => {
    const rnTokens = compileReactNativeTokens(tokens)
    
    expect(rnTokens.typography.fontSize.base).toBe(16)
    expect(rnTokens.typography.fontSize.xl).toBe(20)
    expect(typeof rnTokens.typography.fontSize.base).toBe('number')
  })
  
  it('should extract lineHeight separately', () => {
    const rnTokens = compileReactNativeTokens(tokens)
    
    expect(rnTokens.typography.lineHeight.base).toBe(24)
    expect(rnTokens.typography.lineHeight.xl).toBe(28)
  })
  
  it('should convert borderRadius to numbers', () => {
    const rnTokens = compileReactNativeTokens(tokens)
    
    expect(rnTokens.borderRadius.md).toBe(8)
    expect(rnTokens.borderRadius.full).toBe(9999)
    expect(typeof rnTokens.borderRadius.md).toBe('number')
  })
  
  it('should generate RN shadow properties', () => {
    const rnTokens = compileReactNativeTokens(tokens)
    
    const shadow = rnTokens.shadows.md
    expect(shadow.shadowColor).toBeDefined()
    expect(shadow.shadowOffset).toHaveProperty('width')
    expect(shadow.shadowOffset).toHaveProperty('height')
    expect(shadow.shadowOpacity).toBeDefined()
    expect(shadow.shadowRadius).toBeDefined()
    expect(shadow.elevation).toBeDefined()
  })
  
  it('should use first font in family for RN', () => {
    const rnTokens = compileReactNativeTokens(tokens)
    
    expect(rnTokens.typography.fontFamily.sans).toBe('Inter')
    expect(rnTokens.typography.fontFamily.mono).toBe('Fira Code')
  })
})

