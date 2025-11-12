/**
 * PolicyEngine
 * 
 * Core policy engine for authorization, row-level security (RLS), and field-level permissions.
 * 
 * DRY: Single engine for all authorization checks
 * SRP: Only handles policy evaluation and enforcement
 */

import { evaluate, type Expression, type ExpressionContext } from '@ssot-ui/expressions'
import type { PolicyRule, PolicyContext, PolicyResult, AllowedFields, Policies } from './types.js'
import { PoliciesSchema } from './types.js'
import { applyRowFilters } from './row-filter.js'
import { filterFields } from './field-filter.js'

export class PolicyEngine {
  private policies: PolicyRule[]
  
  constructor(policiesConfig: Policies) {
    // Validate policies structure
    const validation = PoliciesSchema.safeParse(policiesConfig)
    if (!validation.success) {
      throw new Error(`Invalid policies configuration: ${validation.error.message}`)
    }
    
    this.policies = policiesConfig.policies
  }
  
  /**
   * Check if an action is allowed
   * 
   * Evaluates the "allow" expression for matching policies.
   * 
   * @param context - Policy context (user, model, action, etc.)
   * @returns true if allowed, false otherwise
   */
  async checkAccess(context: PolicyContext): Promise<boolean> {
    const result = await this.evaluate(context)
    return result.allowed
  }
  
  /**
   * Evaluate policies and return detailed result
   * 
   * @param context - Policy context
   * @returns PolicyResult with allowed status, filters, and field permissions
   */
  async evaluate(context: PolicyContext): Promise<PolicyResult> {
    // Find matching policies (model + action)
    const matchingPolicies = this.policies.filter(
      p => p.model === context.model && p.action === context.action
    )
    
    if (matchingPolicies.length === 0) {
      // No policy defined = deny by default (fail-closed)
      return {
        allowed: false,
        reason: `No policy defined for ${context.model}.${context.action}`
      }
    }
    
    // Evaluate each matching policy
    // If ANY policy allows, the action is permitted
    for (const policy of matchingPolicies) {
      const isAllowed = await this.evaluatePolicy(policy, context)
      
      if (isAllowed) {
        // Policy allows - compute row filters and field permissions
        const rowFilters = this.computeRowFilters(policy, context)
        const allowedFields = this.computeAllowedFields(policy, context)
        
        return {
          allowed: true,
          rowFilters,
          readFields: allowedFields.read,
          writeFields: allowedFields.write
        }
      }
    }
    
    // No policy allowed the action
    return {
      allowed: false,
      reason: `Access denied by policy for ${context.model}.${context.action}`
    }
  }
  
  /**
   * Evaluate a single policy's "allow" expression
   * 
   * @param policy - Policy rule to evaluate
   * @param context - Policy context
   * @returns true if policy allows, false otherwise
   */
  private async evaluatePolicy(policy: PolicyRule, context: PolicyContext): Promise<boolean> {
    try {
      // Build expression context
      const expressionContext: ExpressionContext = {
        data: context.data || {},
        user: context.user,
        params: {},
        globals: {
          model: context.model,
          action: context.action,
          where: context.where
        }
      }
      
      // Evaluate "allow" expression
      const result = evaluate(policy.allow, expressionContext)
      
      // Cast to boolean
      return Boolean(result)
    } catch (error) {
      console.error(`[PolicyEngine] Error evaluating policy for ${policy.model}.${policy.action}:`, error)
      // On error, deny access (fail-closed)
      return false
    }
  }
  
  /**
   * Compute row-level filters from policy
   * 
   * Some policies may need to add WHERE conditions to queries.
   * For example: "read your own tracks" → WHERE uploadedBy = user.id
   * 
   * @param policy - Policy rule
   * @param context - Policy context
   * @returns Row filters to apply
   */
  private computeRowFilters(policy: PolicyRule, context: PolicyContext): any {
    // Extract row filters from the "allow" expression
    // For simple cases, we can infer filters from the expression
    // For complex cases, policies should specify filters explicitly
    
    // This is a simplified implementation
    // Real implementation would analyze the expression AST
    return applyRowFilters(policy.allow, context)
  }
  
  /**
   * Compute allowed fields from policy
   * 
   * @param policy - Policy rule
   * @param context - Policy context
   * @returns Allowed read/write fields
   */
  private computeAllowedFields(policy: PolicyRule, context: PolicyContext): AllowedFields {
    if (!policy.fields) {
      // No field restrictions = all fields allowed
      return {
        read: ['*'],
        write: ['*']
      }
    }
    
    // Apply field filters
    return filterFields(policy.fields, context)
  }
  
  /**
   * Apply row-level filters to a query
   * 
   * Modifies the WHERE clause to enforce row-level security.
   * 
   * @param options - Options for applying filters
   * @returns Modified WHERE clause
   */
  applyRowFilters(options: {
    model: string
    action: 'create' | 'read' | 'update' | 'delete'
    where?: any
    user: { id: string; roles: string[]; permissions?: string[] }
  }): any {
    const context: PolicyContext = {
      user: options.user,
      model: options.model,
      action: options.action,
      where: options.where
    }
    
    // Find matching policies
    const matchingPolicies = this.policies.filter(
      p => p.model === options.model && p.action === options.action
    )
    
    if (matchingPolicies.length === 0) {
      // No policy = deny all (return impossible filter)
      return { id: '__never__' }
    }
    
    // Apply row filters from first matching policy
    // In a real implementation, we'd combine filters from all policies
    const policy = matchingPolicies[0]
    const rowFilters = applyRowFilters(policy.allow, context)
    
    // Merge with existing WHERE clause
    if (options.where && Object.keys(options.where).length > 0) {
      return {
        AND: [options.where, rowFilters]
      }
    }
    
    return rowFilters
  }
  
  /**
   * Get allowed fields for a model/action
   * 
   * @param options - Options for field filtering
   * @returns Allowed read/write fields
   */
  getAllowedFields(options: {
    model: string
    action: 'create' | 'read' | 'update' | 'delete'
    user: { id: string; roles: string[]; permissions?: string[] }
  }): AllowedFields {
    const context: PolicyContext = {
      user: options.user,
      model: options.model,
      action: options.action
    }
    
    // Find matching policies
    const matchingPolicies = this.policies.filter(
      p => p.model === options.model && p.action === options.action
    )
    
    if (matchingPolicies.length === 0) {
      // No policy = deny all fields
      return { read: [], write: [] }
    }
    
    // Get allowed fields from first matching policy
    const policy = matchingPolicies[0]
    return this.computeAllowedFields(policy, context)
  }
}

