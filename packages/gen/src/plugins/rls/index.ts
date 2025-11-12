/**
 * RLS (Row-Level Security) Plugin
 * 
 * Generates row-level security middleware from policy definitions.
 * Based on @ssot-ui/policy-engine but generates code instead of runtime enforcement.
 * 
 * Features:
 * - Row-level security (RLS) filters
 * - Field-level permissions
 * - Expression-based policies
 * - Fail-closed security model
 * 
 * Generated Output:
 * - src/middleware/rls.ts - Apply RLS filters to queries
 * - src/middleware/permissions.ts - Field-level permission checks
 * - src/config/policies.json - Policy configuration
 */

export { RlsPlugin } from './rls.plugin.js'
export type { RlsPluginConfig } from './rls.plugin.js'

