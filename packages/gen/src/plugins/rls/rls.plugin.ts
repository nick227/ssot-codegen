/**
 * RLS Plugin - Row-Level Security
 * 
 * Converts policy-engine definitions into generated middleware code.
 */

import type {
  FeaturePlugin,
  PluginContext,
  PluginOutput,
  PluginRequirements,
  ValidationResult,
  HealthCheckSection
} from '../plugin.interface.js'

export interface RlsPluginConfig {
  /** Enable owner-based security (default: true) */
  enableOwnerSecurity?: boolean
  
  /** Owner field name (default: 'uploadedBy', 'createdBy', 'userId') */
  ownerFields?: string[]
  
  /** Public filter field (default: 'isPublic') */
  publicField?: string
  
  /** Enable field-level permissions (default: true) */
  enableFieldPermissions?: boolean
  
  /** Admin role name (default: 'admin') */
  adminRole?: string
}

export class RlsPlugin implements FeaturePlugin {
  name = 'rls'
  version = '1.0.0'
  description = 'Row-level security and field-level permissions middleware'
  enabled = true
  
  private config: Required<RlsPluginConfig>
  
  constructor(config: RlsPluginConfig = {}) {
    this.config = {
      enableOwnerSecurity: true,
      ownerFields: ['uploadedBy', 'createdBy', 'userId', 'ownerId'],
      publicField: 'isPublic',
      enableFieldPermissions: true,
      adminRole: 'admin',
      ...config
    }
  }
  
  requirements: PluginRequirements = {
    models: {
      required: [],
      optional: ['User']  // Recommended for auth context
    },
    envVars: {
      required: [],
      optional: ['RLS_ADMIN_ROLE']
    },
    dependencies: {
      runtime: {
        '@ssot-ui/expressions': 'workspace:*'  // For policy expressions
      }
    }
  }
  
  validate(context: PluginContext): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    
    // Check for User model (recommended)
    const hasUserModel = context.schema.models.some(m => m.name === 'User')
    if (!hasUserModel) {
      warnings.push('No User model found - RLS will work but authentication context may be limited')
      suggestions.push('Add a User model for full authentication support')
    }
    
    // Check for owner fields in models
    const modelsWithOwnerFields = context.schema.models.filter(model => 
      model.fields.some(field => this.config.ownerFields.includes(field.name))
    )
    
    if (modelsWithOwnerFields.length === 0) {
      warnings.push(`No models have owner fields (${this.config.ownerFields.join(', ')})`)
      suggestions.push('Add uploadedBy, createdBy, or ownerId fields to enable owner-based security')
    }
    
    // Check for public field
    const modelsWithPublicField = context.schema.models.filter(model =>
      model.fields.some(field => field.name === this.config.publicField)
    )
    
    if (modelsWithPublicField.length > 0) {
      suggestions.push(`Found ${modelsWithPublicField.length} models with ${this.config.publicField} field - public filtering will be enabled`)
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }
  
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    // Extract @@policy annotations from models
    const policiesByModel = this.extractPolicyAnnotations(context.schema.models)
    
    // Generate RLS middleware (now annotation-driven)
    files.set('middleware/rls.ts', this.generateRlsMiddleware(context, policiesByModel))
    
    // Generate permission middleware
    if (this.config.enableFieldPermissions) {
      files.set('middleware/permissions.ts', this.generatePermissionsMiddleware(context, policiesByModel))
    }
    
    // Generate policies configuration
    files.set('config/policies.json', this.generatePoliciesConfig(policiesByModel))
    
    // Generate types
    files.set('types/rls.types.ts', this.generateTypes())
    
    return {
      files,
      routes: [],
      middleware: [
        {
          name: 'rlsFilter',
          importPath: '@/middleware/rls',
          global: false  // Applied per-route in controllers
        }
      ],
      envVars: {
        RLS_ADMIN_ROLE: this.config.adminRole
      },
      packageJson: {
        dependencies: {
          '@ssot-ui/expressions': 'workspace:*'
        }
      }
    }
  }
  
  /**
   * Extract @@policy annotations from models
   */
  private extractPolicyAnnotations(models: readonly any[]): Map<string, any[]> {
    const policiesByModel = new Map<string, any[]>()
    
    for (const model of models) {
      if (!model.annotations) continue
      
      const policies = model.annotations.filter((a: any) => a.type === 'policy')
      if (policies.length > 0) {
        policiesByModel.set(model.name, policies)
      }
    }
    
    return policiesByModel
  }
  
  /**
   * Generate switch case for model's policies
   */
  private generateModelPolicyCase(modelName: string, policies: any[]): string {
    const readPolicy = policies.find(p => p.operation === 'read' || p.operation === '*')
    const writePolicy = policies.find(p => p.operation === 'write' || p.operation === '*')
    const deletePolicy = policies.find(p => p.operation === 'delete' || p.operation === '*')
    
    const conditions: string[] = []
    
    if (readPolicy) {
      conditions.push(`      if (action === 'read') {
        // Policy: ${readPolicy.rule}
        return evaluatePolicy(user, where, '${readPolicy.rule}')
      }`)
    }
    
    if (writePolicy) {
      conditions.push(`      if (action === 'create' || action === 'update') {
        // Policy: ${writePolicy.rule}
        return evaluatePolicy(user, where, '${writePolicy.rule}')
      }`)
    }
    
    if (deletePolicy) {
      conditions.push(`      if (action === 'delete') {
        // Policy: ${deletePolicy.rule}
        return evaluatePolicy(user, where, '${deletePolicy.rule}')
      }`)
    }
    
    return `    case '${modelName}':
${conditions.join('\n')}
      break`
  }
  
  /**
   * Generate policies configuration JSON
   */
  private generatePoliciesConfig(policiesByModel: Map<string, any[]>): string {
    const config: Record<string, any> = {}
    
    for (const [modelName, policies] of policiesByModel) {
      config[modelName] = policies.map(p => ({
        operation: p.operation,
        rule: p.rule,
        fields: p.fields
      }))
    }
    
    return JSON.stringify(config, null, 2)
  }
  
  private generateRlsMiddleware(context: PluginContext, policiesByModel: Map<string, any[]>): string {
    // Generate policy-specific middleware for each model
    const modelCases = Array.from(policiesByModel.entries())
      .map(([modelName, policies]) => this.generateModelPolicyCase(modelName, policies))
      .join('\n\n')
    
    return `// @generated by RLS Plugin
// Row-Level Security Middleware
// 
// Generated from @@policy annotations in schema

import type { User } from '@/types/auth'

export interface RlsContext {
  user?: User
  model: string
  action: 'read' | 'create' | 'update' | 'delete'
  where?: Record<string, any>
}

export interface RlsResult {
  allowed: boolean
  where: Record<string, any>
  reason?: string
}

/**
 * Apply RLS filters to a query
 * Based on @@policy annotations in schema
 */
export function applyRLS(context: RlsContext): RlsResult {
  const { user, model, action, where = {} } = context
  
  // Admin bypass (always)
  if (user?.role === '${this.config.adminRole}') {
    return { allowed: true, where }
  }
  
  // Apply model-specific policies
  switch (model) {
${modelCases}
    
    default:
      // No policy defined - fall back to convention-based security
      return applyConventionBasedRLS(context)
  }
}

/**
 * Convention-based RLS (fallback if no @@policy)
 */
function applyConventionBasedRLS(context: RlsContext): RlsResult {
  const { user, where = {} } = context
  
  if (!user?.id) {
    return {
      allowed: false,
      where,
      reason: 'Authentication required'
    }
  }
  
  // Allow authenticated users (conventions)
  const ownerField = findOwnerField(context.model)
  if (ownerField) {
    return {
      allowed: true,
      where: { ...where, [ownerField]: user.id }
    }
  }
  
  return { allowed: true, where }
}

/**
 * Find owner field in model
 */
function findOwnerField(model: string): string | null {
  const ownerFields = ${JSON.stringify(this.config.ownerFields)}
  const modelFields = getModelFields(model)
  
  for (const field of ownerFields) {
    if (modelFields.includes(field)) {
      return field
    }
  }
  
  return null
}

/**
 * Check if model has public field
 */
function modelHasPublicField(model: string): boolean {
  const modelFields = getModelFields(model)
  return modelFields.includes('${this.config.publicField}')
}

/**
 * Get model fields (generated based on schema)
 */
function getModelFields(model: string): string[] {
  const modelFieldMap: Record<string, string[]> = ${JSON.stringify(
    Object.fromEntries(
      context.schema.models.map(m => [
        m.name,
        m.fields.map(f => f.name)
      ])
    ),
    null,
    2
  )}
  
  return modelFieldMap[model] || []
}

// Helper functions for RLS evaluation
function evaluatePolicy(user: any, where: any, rule: string): RlsResult {
  // TODO: Use expression engine to evaluate rule
  // For now, simple rules
  if (rule === 'authenticated') {
    return user ? { allowed: true, where } : { allowed: false, where, reason: 'Not authenticated' }
  }
  if (rule === 'isOwner') {
    // Find owner field
    const ownerField = findOwnerField('') // TODO: pass model
    return ownerField 
      ? { allowed: true, where: { ...where, [ownerField]: user?.id } }
      : { allowed: true, where }
  }
  // Default: fail-closed
  return { allowed: false, where, reason: \`Unknown rule: \${rule}\` }
}

function findOwnerField(model: string): string | null {
  // TODO: Detect owner field
  return null
}
`
  }
  
  private generatePermissionsMiddleware(context: PluginContext, policiesByModel: Map<string, any[]>): string {
    // Extract field-level policies
    const fieldPolicies = this.extractFieldPolicies(policiesByModel)
    
    return `// @generated by RLS Plugin
// Field-Level Permissions Middleware

export function checkFieldPermission(
  model: string,
  field: string,
  user: any,
  operation: 'read' | 'write'
): boolean {
  // Admin bypass
  if (user?.role === 'admin') return true
  
  // Field-level policies
  const policies = FIELD_POLICIES[model]
  if (!policies) return true  // No restrictions
  
  const fieldPolicy = policies[field]
  if (!fieldPolicy) return true  // No restrictions on this field
  
  return evaluateFieldPolicy(fieldPolicy, user, operation)
}

const FIELD_POLICIES: Record<string, Record<string, any>> = ${JSON.stringify(fieldPolicies, null, 2)}

function evaluateFieldPolicy(policy: any, user: any, operation: string): boolean {
  // TODO: Evaluate expression
  return false  // Fail-closed
}
`
  }
  
  private extractFieldPolicies(policiesByModel: Map<string, any[]>): Record<string, any> {
    const fieldPolicies: Record<string, any> = {}
    
    for (const [modelName, policies] of policiesByModel) {
      const fieldsWithPolicies: Record<string, any> = {}
      
      for (const policy of policies) {
        if (policy.fields && policy.fields.length > 0) {
          for (const field of policy.fields) {
            if (!fieldsWithPolicies[field]) {
              fieldsWithPolicies[field] = []
            }
            fieldsWithPolicies[field].push({
              operation: policy.operation,
              rule: policy.rule
            })
          }
        }
      }
      
      if (Object.keys(fieldsWithPolicies).length > 0) {
        fieldPolicies[modelName] = fieldsWithPolicies
      }
    }
    
    return fieldPolicies
  }
  
  private generateDefaultPolicies(context: PluginContext): string {
    const policies = {
      version: '1.0',
      description: 'Default RLS policies',
      policies: context.schema.models.map(model => {
        const ownerField = model.fields.find(f => 
          this.config.ownerFields.includes(f.name)
        )
        const hasPublicField = model.fields.some(f => 
          f.name === this.config.publicField
        )
        
        return {
          model: model.name,
          description: `Security policy for ${model.name}`,
          rules: [
            {
              action: 'read',
              allow: hasPublicField 
                ? { op: 'or', args: [
                    { op: 'isOwner', field: ownerField?.name },
                    { op: 'eq', args: [{ op: 'field', field: this.config.publicField }, true] }
                  ]}
                : ownerField
                  ? { op: 'isOwner', field: ownerField.name }
                  : { op: 'isAuthenticated' }
            },
            {
              action: 'create',
              allow: { op: 'isAuthenticated' }
            },
            {
              action: 'update',
              allow: ownerField 
                ? { op: 'or', args: [
                    { op: 'isOwner', field: ownerField.name },
                    { op: 'hasRole', role: this.config.adminRole }
                  ]}
                : { op: 'isAuthenticated' }
            },
            {
              action: 'delete',
              allow: ownerField
                ? { op: 'or', args: [
                    { op: 'isOwner', field: ownerField.name },
                    { op: 'hasRole', role: this.config.adminRole }
                  ]}
                : { op: 'hasRole', role: this.config.adminRole }
            }
          ]
        }
      })
    }
    
    return JSON.stringify(policies, null, 2)
  }
  
  private generateTypes(): string {
    return `// @generated by RLS Plugin
// RLS Types

export interface User {
  id: string
  role?: string
  email?: string
}

export type RlsAction = 'read' | 'create' | 'update' | 'delete'

export interface RlsFilter {
  model: string
  action: RlsAction
  where?: Record<string, any>
}
`
  }
  
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'rls',
      title: 'Row-Level Security',
      icon: '🔒',
      checks: [
        {
          id: 'rls-middleware',
          name: 'RLS Middleware Generated',
          description: 'Row-level security middleware is in place'
        },
        {
          id: 'permission-checks',
          name: 'Permission Checks',
          description: 'Field-level permission checks are configured'
        },
        {
          id: 'owner-security',
          name: 'Owner-Based Security',
          description: 'Models with owner fields are protected'
        }
      ]
    }
  }
}

