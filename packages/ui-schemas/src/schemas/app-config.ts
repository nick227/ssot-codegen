/**
 * app.json Schema
 * 
 * Consolidates all configuration into a single file.
 * Replaces: template.json, capabilities.json, mappings.json, theme.json
 */

import { z } from 'zod'

/**
 * App Metadata
 */
export const AppMetadataSchema = z.object({
  name: z.string(),
  version: z.string().default('1.0.0'),
  description: z.string().optional()
})

/**
 * Feature Flags
 */
export const FeaturesSchema = z.object({
  auth: z.boolean().default(true),
  uploads: z.boolean().default(false),
  payments: z.boolean().default(false)
})

/**
 * Auth Configuration
 */
export const AuthConfigSchema = z.object({
  providers: z.array(z.enum(['email', 'google', 'github'])).default(['email']),
  signInPath: z.string().default('/auth/signin'),
  adminEmail: z.string().email().optional()
})

/**
 * Permission Modes
 */
export const PermissionModeSchema = z.enum([
  'owner-or-admin',  // Default: owner can CRUD own data, admin can CRUD all
  'admin-only',      // Only admins can write
  'public-read'      // Anyone can read, authenticated can write own
])

/**
 * Page Configuration (per model)
 */
export const PageConfigSchema = z.object({
  list: z.boolean().or(z.object({
    enabled: z.boolean().default(true),
    columns: z.array(z.string()).optional(),  // If omitted, show all fields
    filters: z.array(z.string()).optional(),
    sort: z.string().optional()
  })).default(true),
  
  detail: z.boolean().or(z.object({
    enabled: z.boolean().default(true),
    fields: z.array(z.string()).optional(),  // If omitted, show all fields
    sections: z.array(z.object({
      title: z.string(),
      fields: z.array(z.string())
    })).optional()
  })).default(true),
  
  form: z.boolean().or(z.object({
    enabled: z.boolean().default(true),
    fields: z.array(z.string()).optional(),  // If omitted, all writable fields
    createPath: z.string().optional(),
    editPath: z.string().optional()
  })).default(true)
})

/**
 * Simple Expression (M0 - only 3 primitives)
 */
export const SimpleExpressionSchema = z.discriminatedUnion('type', [
  // Literal value
  z.object({
    type: z.literal('value'),
    value: z.any()
  }),
  
  // Field access
  z.object({
    type: z.literal('field'),
    path: z.string()
  }),
  
  // Operation
  z.object({
    type: z.literal('op'),
    name: z.enum(['add', 'subtract', 'multiply', 'divide', 'eq', 'gt', 'lt', 'and', 'or']),
    args: z.array(z.lazy(() => SimpleExpressionSchema))
  }),
  
  // Condition (when-then-else)
  z.object({
    type: z.literal('when'),
    condition: z.lazy(() => SimpleExpressionSchema),
    then: z.lazy(() => SimpleExpressionSchema),
    else: z.lazy(() => SimpleExpressionSchema)
  }),
  
  // Permission check
  z.object({
    type: z.literal('perm'),
    check: z.enum(['owner', 'admin', 'authenticated'])
  })
])

/**
 * UI Configuration
 */
export const UIConfigSchema = z.object({
  theme: z.enum(['default', 'dark', 'light']).default('default'),
  layout: z.enum(['sidebar', 'topnav']).default('sidebar')
})

/**
 * Complete app.json Schema
 */
export const AppConfigSchema = z.object({
  // Metadata
  name: z.string(),
  version: z.string().default('1.0.0'),
  description: z.string().optional(),
  
  // Features
  features: FeaturesSchema.default({}),
  
  // Auth
  auth: AuthConfigSchema.default({}),
  
  // Permissions
  permissions: PermissionModeSchema.or(
    z.record(z.string(), z.object({
      read: z.string().optional(),
      write: z.string().optional()
    }))
  ).default('owner-or-admin'),
  
  // Pages (per model)
  pages: z.record(z.string(), PageConfigSchema).default({}),
  
  // Custom expressions (optional)
  expressions: z.record(z.string(), SimpleExpressionSchema).optional(),
  
  // UI
  ui: UIConfigSchema.default({}),
  
  // Routing (optional override)
  routing: z.enum(['convention', 'custom']).default('convention')
})

export type AppConfig = z.infer<typeof AppConfigSchema>
export type SimpleExpression = z.infer<typeof SimpleExpressionSchema>
export type PageConfig = z.infer<typeof PageConfigSchema>

