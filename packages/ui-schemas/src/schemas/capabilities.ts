/**
 * Capabilities Schema
 * 
 * Declares available UI primitives, features, security policies,
 * and sanitization rules.
 */

import { z } from 'zod'

// ============================================================================
// Sanitization Policies
// ============================================================================

export const SanitizePolicySchema = z.object({
  allowedTags: z.array(z.string()),
  allowedAttrs: z.record(z.array(z.string()))
})

export const SanitizeConfigSchema = z.object({
  policy: z.enum(['basic', 'strict', 'rich', 'custom']),
  custom: SanitizePolicySchema.optional() // Required if policy is 'custom'
})

export type SanitizeConfig = z.infer<typeof SanitizeConfigSchema>

// ============================================================================
// Security
// ============================================================================

export const SecurityConfigSchema = z.object({
  enforceGuards: z.boolean().default(true),
  denyByDefault: z.boolean().default(true),
  csrfProtection: z.boolean().default(true)
})

export type SecurityConfig = z.infer<typeof SecurityConfigSchema>

// ============================================================================
// Telemetry
// ============================================================================

export const TelemetryConfigSchema = z.object({
  enabled: z.boolean().default(false),
  events: z.array(z.string()).optional(), // Whitelist of event names
  scrub: z.array(z.string()).optional()   // PII fields to redact
})

export type TelemetryConfig = z.infer<typeof TelemetryConfigSchema>

// ============================================================================
// PII Redaction
// ============================================================================

export const RedactionConfigSchema = z.object({
  fields: z.array(z.string()), // e.g., ["email", "phone", "ssn"]
  strategy: z.enum(['mask', 'hash', 'remove']).default('mask')
})

export type RedactionConfig = z.infer<typeof RedactionConfigSchema>

// ============================================================================
// File Upload
// ============================================================================

export const FileUploadConfigSchema = z.object({
  maxSize: z.number().int().positive(), // Bytes
  allowedTypes: z.array(z.string()),    // MIME types
  storage: z.enum(['s3', 'cloudinary', 'local', 'custom'])
})

export type FileUploadConfig = z.infer<typeof FileUploadConfigSchema>

// ============================================================================
// Capabilities (Root)
// ============================================================================

export const CapabilitiesSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  
  // Available UI components
  ui: z.array(z.string()), // e.g., ["Avatar", "Badge", "DataTable", "Form"]
  
  // Security & sanitization
  sanitize: SanitizeConfigSchema,
  security: SecurityConfigSchema,
  
  // Optional features
  telemetry: TelemetryConfigSchema.optional(),
  redaction: RedactionConfigSchema.optional(),
  fileUpload: FileUploadConfigSchema.optional()
})

export type Capabilities = z.infer<typeof CapabilitiesSchema>

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateCapabilities(data: unknown) {
  const result = CapabilitiesSchema.safeParse(data)
  
  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code
    }))
    
    return {
      valid: false as const,
      errors
    }
  }
  
  return {
    valid: true as const,
    data: result.data
  }
}

/**
 * Check if sanitization policy is custom and has definition
 */
export function validateCapabilitiesRules(capabilities: Capabilities): string[] {
  const warnings: string[] = []
  
  if (capabilities.sanitize.policy === 'custom' && !capabilities.sanitize.custom) {
    warnings.push(
      'Sanitize policy is "custom" but no custom policy definition provided. ' +
      'Add sanitize.custom with allowedTags and allowedAttrs.'
    )
  }
  
  if (capabilities.telemetry?.enabled && !capabilities.telemetry.events) {
    warnings.push(
      'Telemetry is enabled but no events whitelist provided. ' +
      'Add telemetry.events array to specify which events to track.'
    )
  }
  
  return warnings
}

/**
 * Get sanitization policy
 */
export function getSanitizePolicy(capabilities: Capabilities): z.infer<typeof SanitizePolicySchema> | null {
  if (capabilities.sanitize.policy === 'custom') {
    return capabilities.sanitize.custom || null
  }
  
  // Built-in policies
  const policies: Record<string, z.infer<typeof SanitizePolicySchema>> = {
    strict: {
      allowedTags: [],
      allowedAttrs: {}
    },
    basic: {
      allowedTags: ['b', 'i', 'em', 'strong', 'p', 'a', 'ul', 'ol', 'li'],
      allowedAttrs: {
        a: ['href', 'title']
      }
    },
    rich: {
      allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 'img', 'table', 'tr', 'td', 'th', 'code', 'pre', 'blockquote'],
      allowedAttrs: {
        a: ['href', 'title', 'target'],
        img: ['src', 'alt', 'width', 'height'],
        td: ['colspan', 'rowspan'],
        th: ['colspan', 'rowspan']
      }
    }
  }
  
  return policies[capabilities.sanitize.policy] || null
}

