/**
 * Policy Engine Types
 * 
 * Defines the structure for authorization policies with expression-based rules.
 */

import { z } from 'zod'
import type { Expression } from '@ssot-ui/expressions'

/**
 * Policy Rule
 * 
 * Defines access control for a specific model and action.
 */
export interface PolicyRule {
  /** Model name (e.g., "Track", "User") */
  model: string
  
  /** Action (CRUD operation) */
  action: 'create' | 'read' | 'update' | 'delete'
  
  /** Expression that evaluates to boolean (allow/deny) - optional for default policies */
  allow?: Expression
  
  /** Field-level permissions (optional) */
  fields?: {
    /** Fields allowed for reading */
    read?: string[]
    
    /** Fields allowed for writing */
    write?: string[]
    
    /** Fields explicitly denied (takes precedence) */
    deny?: string[]
  }
}

/**
 * Policy Context
 * 
 * Context provided when evaluating policies.
 */
export interface PolicyContext {
  /** Current user */
  user: {
    id: string
    roles: string[]
    permissions?: string[]
  }
  
  /** Model being accessed */
  model: string
  
  /** Action being performed */
  action: 'create' | 'read' | 'update' | 'delete'
  
  /** Where clause (for read/update/delete) */
  where?: any
  
  /** Data being created/updated */
  data?: any
}

/**
 * Policy Evaluation Result
 */
export interface PolicyResult {
  /** Whether the action is allowed */
  allowed: boolean
  
  /** Reason for denial (if denied) */
  reason?: string
  
  /** Row-level filters to apply */
  rowFilters?: any
  
  /** Fields allowed for reading */
  readFields?: string[]
  
  /** Fields allowed for writing */
  writeFields?: string[]
}

/**
 * Allowed Fields
 */
export interface AllowedFields {
  read: string[]
  write: string[]
}

//
// Zod Schemas for Validation
//

/**
 * Policy Rule Schema (for validating policies.json)
 */
export const PolicyRuleSchema = z.object({
  model: z.string(),
  action: z.enum(['create', 'read', 'update', 'delete']),
  allow: z.any().optional(), // Expression (validated separately), optional for default policies
  fields: z.object({
    read: z.array(z.string()).optional(),
    write: z.array(z.string()).optional(),
    deny: z.array(z.string()).optional()
  }).optional()
})

/**
 * Policies Schema
 */
export const PoliciesSchema = z.object({
  policies: z.array(PolicyRuleSchema)
})

export type Policies = z.infer<typeof PoliciesSchema>

