/**
 * @ssot-ui/policy-engine
 * 
 * Policy engine for row-level security (RLS) and field-level permissions.
 * 
 * Usage:
 * ```typescript
 * import { PolicyEngine } from '@ssot-ui/policy-engine'
 * 
 * const engine = new PolicyEngine(policies)
 * 
 * // Check access
 * const allowed = await engine.checkAccess({
 *   user: session.user,
 *   model: 'Track',
 *   action: 'read'
 * })
 * 
 * // Apply row filters
 * const where = engine.applyRowFilters({
 *   model: 'Track',
 *   action: 'read',
 *   where: { isPublic: true },
 *   user: session.user
 * })
 * 
 * // Get allowed fields
 * const fields = engine.getAllowedFields({
 *   model: 'Track',
 *   action: 'update',
 *   user: session.user
 * })
 * ```
 */

export { PolicyEngine } from './policy-engine.js'
export { applyRowFilters } from './row-filter.js'
export { filterFields, filterDataFields } from './field-filter.js'

export type {
  PolicyRule,
  PolicyContext,
  PolicyResult,
  AllowedFields,
  Policies
} from './types.js'

export { PolicyRuleSchema, PoliciesSchema } from './types.js'

