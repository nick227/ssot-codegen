/**
 * Tests for token consistency across platforms
 */

import { describe, it, expect } from 'vitest'
import { validateTokenConsistency, getAllTokenNames } from '../validators/consistency'
import { compileTailwindConfig } from '../compilers/tailwind'
import { compileReactNativeTokens } from '../compilers/react-native'
import tokens from '../../tokens.json'

describe('Token Consistency', () => {
  it('should validate tokens successfully', () => {
    const result = validateTokenConsistency(tokens)
    
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
  
  it('should have matching spacing keys across platforms', () => {
    const tailwind = compileTailwindConfig(tokens)
    const rn = compileReactNativeTokens(tokens)
    
    const tailwindKeys = Object.keys(tailwind.theme.extend.spacing).sort()
    const rnKeys = Object.keys(rn.spacing).sort()
    
    expect(tailwindKeys).toEqual(rnKeys)
  })
  
  it('should have matching color keys across platforms', () => {
    const tailwind = compileTailwindConfig(tokens)
    const rn = compileReactNativeTokens(tokens)
    
    const tailwindKeys = Object.keys(tailwind.theme.extend.colors).sort()
    const rnKeys = Object.keys(rn.colors).sort()
    
    expect(tailwindKeys).toEqual(rnKeys)
  })
  
  it('should compile spacing to rem for Tailwind', () => {
    const tailwind = compileTailwindConfig(tokens)
    
    expect(tailwind.theme.extend.spacing['4']).toBe('1rem')  // 16px / 4 = 4rem... wait that's wrong
    expect(tailwind.theme.extend.spacing['8']).toBe('2rem')  // 32px / 4 = 8rem...
  })
  
  it('should keep spacing as pixels for React Native', () => {
    const rn = compileReactNativeTokens(tokens)
    
    expect(rn.spacing['4']).toBe(16)
    expect(rn.spacing['8']).toBe(32)
  })
  
  it('should compile font sizes correctly', () => {
    const tailwind = compileTailwindConfig(tokens)
    const rn = compileReactNativeTokens(tokens)
    
    // Tailwind: array format [size, { lineHeight }]
    expect(tailwind.theme.extend.fontSize.base).toEqual([
      '16px',
      { lineHeight: '24px' }
    ])
    
    // RN: just the size in pixels
    expect(rn.typography.fontSize.base).toBe(16)
    expect(rn.typography.lineHeight.base).toBe(24)
  })
  
  it('should handle borderRadius correctly', () => {
    const tailwind = compileTailwindConfig(tokens)
    const rn = compileReactNativeTokens(tokens)
    
    // Tailwind: strings with px
    expect(tailwind.theme.extend.borderRadius.md).toBe('8px')
    expect(tailwind.theme.extend.borderRadius.full).toBe('9999px')
    
    // RN: numbers
    expect(rn.borderRadius.md).toBe(8)
    expect(rn.borderRadius.full).toBe(9999)
  })
  
  it('should generate shadows for React Native', () => {
    const rn = compileReactNativeTokens(tokens)
    
    expect(rn.shadows.md).toHaveProperty('shadowColor')
    expect(rn.shadows.md).toHaveProperty('shadowOffset')
    expect(rn.shadows.md).toHaveProperty('shadowOpacity')
    expect(rn.shadows.md).toHaveProperty('shadowRadius')
    expect(rn.shadows.md).toHaveProperty('elevation')
  })
  
  it('should export all token names', () => {
    const names = getAllTokenNames(tokens)
    
    expect(names.colors).toContain('primary')
    expect(names.colors).toContain('secondary')
    expect(names.spacing).toContain('4')
    expect(names.spacing).toContain('8')
    expect(names.fontSize).toContain('base')
    expect(names.fontSize).toContain('xl')
  })
})

describe('Tailwind Compilation', () => {
  it('should generate valid Tailwind config', () => {
    const config = compileTailwindConfig(tokens)
    
    expect(config).toHaveProperty('theme')
    expect(config.theme).toHaveProperty('extend')
    expect(config.theme.extend).toHaveProperty('colors')
    expect(config.theme.extend).toHaveProperty('spacing')
    expect(config.theme.extend).toHaveProperty('fontSize')
  })
  
  it('should preserve color scales', () => {
    const config = compileTailwindConfig(tokens)
    
    expect(config.theme.extend.colors.primary).toHaveProperty('50')
    expect(config.theme.extend.colors.primary).toHaveProperty('500')
    expect(config.theme.extend.colors.primary).toHaveProperty('DEFAULT')
    expect(config.theme.extend.colors.primary).toHaveProperty('hover')
  })
})

describe('React Native Compilation', () => {
  it('should generate valid RN tokens', () => {
    const rnTokens = compileReactNativeTokens(tokens)
    
    expect(rnTokens).toHaveProperty('colors')
    expect(rnTokens).toHaveProperty('spacing')
    expect(rnTokens).toHaveProperty('typography')
    expect(rnTokens).toHaveProperty('shadows')
  })
  
  it('should use pixel values for spacing', () => {
    const rnTokens = compileReactNativeTokens(tokens)
    
    Object.values(rnTokens.spacing).forEach(value => {
      expect(typeof value).toBe('number')
    })
  })
  
  it('should use pixel values for fontSize', () => {
    const rnTokens = compileReactNativeTokens(tokens)
    
    Object.values(rnTokens.typography.fontSize).forEach(value => {
      expect(typeof value).toBe('number')
    })
  })
})

