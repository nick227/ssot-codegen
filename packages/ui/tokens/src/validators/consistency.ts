/**
 * Validate token consistency across platforms
 */

import type { TokenSet } from '../types.js'
import { compileTailwindConfig } from '../compilers/tailwind.js'
import { compileReactNativeTokens } from '../compilers/react-native.js'

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  type: 'missing_token' | 'type_mismatch' | 'invalid_value'
  path: string
  message: string
}

export interface ValidationWarning {
  type: 'platform_difference' | 'deprecated_token'
  path: string
  message: string
}

/**
 * Validate that token names are consistent across platforms
 */
export function validateTokenConsistency(tokens: TokenSet): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  
  // Compile for both platforms
  const tailwindConfig = compileTailwindConfig(tokens)
  const rnTokens = compileReactNativeTokens(tokens)
  
  // Check spacing keys match
  const tailwindSpacingKeys = Object.keys(tailwindConfig.theme.extend.spacing)
  const rnSpacingKeys = Object.keys(rnTokens.spacing)
  
  const missingInRN = tailwindSpacingKeys.filter(k => !rnSpacingKeys.includes(k))
  const missingInTailwind = rnSpacingKeys.filter(k => !tailwindSpacingKeys.includes(k))
  
  if (missingInRN.length > 0) {
    errors.push({
      type: 'missing_token',
      path: 'spacing',
      message: `Spacing tokens missing in React Native: ${missingInRN.join(', ')}`
    })
  }
  
  if (missingInTailwind.length > 0) {
    errors.push({
      type: 'missing_token',
      path: 'spacing',
      message: `Spacing tokens missing in Tailwind: ${missingInTailwind.join(', ')}`
    })
  }
  
  // Check color keys match
  const tailwindColorKeys = Object.keys(tailwindConfig.theme.extend.colors)
  const rnColorKeys = Object.keys(rnTokens.colors)
  
  const colorMissingInRN = tailwindColorKeys.filter(k => !rnColorKeys.includes(k))
  const colorMissingInTailwind = rnColorKeys.filter(k => !tailwindColorKeys.includes(k))
  
  if (colorMissingInRN.length > 0) {
    errors.push({
      type: 'missing_token',
      path: 'colors',
      message: `Color tokens missing in React Native: ${colorMissingInRN.join(', ')}`
    })
  }
  
  if (colorMissingInTailwind.length > 0) {
    errors.push({
      type: 'missing_token',
      path: 'colors',
      message: `Color tokens missing in Tailwind: ${colorMissingInTailwind.join(', ')}`
    })
  }
  
  // Warn about shadow differences (RN shadows work differently)
  warnings.push({
    type: 'platform_difference',
    path: 'boxShadow',
    message: 'React Native shadows use elevation and shadow props (approximate conversion applied)'
  })
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Get all token names (for testing/debugging)
 */
export function getAllTokenNames(tokens: TokenSet): {
  colors: string[]
  spacing: string[]
  fontSize: string[]
  borderRadius: string[]
} {
  return {
    colors: Object.keys(tokens.colors),
    spacing: Object.keys(tokens.spacing),
    fontSize: Object.keys(tokens.typography.fontSize),
    borderRadius: Object.keys(tokens.borderRadius)
  }
}

