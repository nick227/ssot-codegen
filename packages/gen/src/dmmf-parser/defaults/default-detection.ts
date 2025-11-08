/**
 * Default value detection utilities
 * 
 * Functions to determine if defaults are DB-managed or client-managed.
 */

import { DB_MANAGED_DEFAULTS, CLIENT_MANAGED_DEFAULTS } from '../constants.js'

/**
 * Check if default value is DB-managed (not client-side)
 * 
 * DB-managed defaults (autoincrement, uuid, cuid, dbgenerated):
 * - Handled entirely by the database
 * - Should NOT be included in INSERT statements
 * - Should NOT be in create DTOs
 * - Field marked as read-only if it's an ID or system timestamp
 * 
 * IMPORTANT: 'now()' is CLIENT-managed and returns false here
 * This ensures consistency with getDefaultValueString() which returns 'new Date()' for now()
 * 
 * @param defaultValue - The default value from DMMF field
 * @returns true if DB-managed, false if client-managed or not a function default
 */
export function isDbManagedDefault(defaultValue: unknown): boolean {
  if (!defaultValue || typeof defaultValue !== 'object') return false
  
  const def = defaultValue as Record<string, unknown>
  if (!('name' in def) || typeof def.name !== 'string') return false
  
  // Explicitly check it's NOT a client-managed default
  if (CLIENT_MANAGED_DEFAULTS.includes(def.name as typeof CLIENT_MANAGED_DEFAULTS[number])) {
    return false
  }
  
  // Check if it's a known DB-managed default
  // Note: dbgenerated can have args (validated via 'args' property), but we still treat it as DB-managed
  return DB_MANAGED_DEFAULTS.includes(def.name as typeof DB_MANAGED_DEFAULTS[number])
}

/**
 * Check if default value is client-managed (e.g., now())
 * 
 * Client-managed defaults:
 * - Evaluated on the client side
 * - Passed to database in INSERT statements
 * - Should be in create DTOs as optional fields
 * - getDefaultValueString() returns TypeScript code for these
 * 
 * Exported for use by generators that need to distinguish client-managed defaults
 * 
 * @param defaultValue - The default value from DMMF field
 * @returns true if client-managed, false otherwise
 */
export function isClientManagedDefault(defaultValue: unknown): boolean {
  if (!defaultValue || typeof defaultValue !== 'object') return false
  
  const def = defaultValue as Record<string, unknown>
  if (!('name' in def) || typeof def.name !== 'string') return false
  
  return CLIENT_MANAGED_DEFAULTS.includes(def.name as typeof CLIENT_MANAGED_DEFAULTS[number])
}

