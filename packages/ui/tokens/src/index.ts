/**
 * @ssot-ui/tokens v1.0.0
 * 
 * Design token system for SSOT UI
 * Single source of truth compiled to Tailwind (web) and React Native (mobile)
 */

import tokens from '../tokens.json' with { type: 'json' }

export { tokens }
export * from './types.js'
export { compileTailwindConfig } from './compilers/tailwind.js'
export { compileReactNativeTokens } from './compilers/react-native.js'
export { validateTokenConsistency } from './validators/consistency.js'

