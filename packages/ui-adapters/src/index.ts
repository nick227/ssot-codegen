/**
 * @ssot-ui/adapters
 * 
 * Vendor-agnostic adapter interfaces for SSOT UI runtime.
 * 
 * Provides 5 core adapter interfaces:
 * 1. DataAdapter - Database abstraction
 * 2. UIAdapter - Component library abstraction
 * 3. AuthAdapter - Authentication/authorization abstraction
 * 4. RouterAdapter - Routing abstraction
 * 5. FormatAdapter - i18n and sanitization abstraction
 */

export * from './interfaces/data.js'
export * from './interfaces/ui.js'
export * from './interfaces/auth.js'
export * from './interfaces/router.js'
export * from './interfaces/format.js'

