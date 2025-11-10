/**
 * Template Schema - Core UI template definition
 * 
 * Defines pages, components, routes, SEO, and guards.
 * This is the primary configuration consumed by the runtime renderer.
 */

import { z } from 'zod'

// ============================================================================
// Common Types
// ============================================================================

export const RuntimeModeSchema = z.enum(['server', 'client', 'edge'])
export type RuntimeMode = z.infer<typeof RuntimeModeSchema>

export const SEOSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  canonical: z.string().optional(),
  'og:image': z.string().optional(),
  'og:type': z.string().optional(),
  noindex: z.boolean().optional()
})
export type SEO = z.infer<typeof SEOSchema>

export const LayoutSchema = z.object({
  type: z.enum(['standard', 'split', 'tabs', 'wizard']),
  slots: z.array(z.string()).optional()
})
export type Layout = z.infer<typeof LayoutSchema>

// Predicates for conditional UI
export const PredicateSchema = z.object({
  field: z.string(),
  op: z.enum(['eq', 'ne', 'in', 'exists', 'roleAny']),
  value: z.unknown().optional()
})
export type Predicate = z.infer<typeof PredicateSchema>

// ============================================================================
// List Page
// ============================================================================

export const FilterDefSchema = z.object({
  field: z.string(),
  label: z.string(),
  type: z.enum(['text', 'enum', 'boolean', 'date-range', 'number-range'])
})

export const SortDefSchema = z.object({
  field: z.string(),
  dir: z.enum(['asc', 'desc']).default('asc')
})

export const PaginationDefSchema = z.object({
  type: z.enum(['pages', 'cursor', 'infinite']),
  defaultSize: z.number().default(20)
})

export const ListPageSchema = z.object({
  type: z.literal('list'),
  route: z.string(),
  runtime: RuntimeModeSchema,
  model: z.string(),
  title: z.string().optional(),
  
  // Data
  relations: z.array(z.string()).optional(),
  filters: z.array(FilterDefSchema).optional(),
  sort: z.array(SortDefSchema).optional(),
  pagination: PaginationDefSchema.optional(),
  
  // UI
  cardComponent: z.string().optional(),
  layout: LayoutSchema.optional(),
  seo: SEOSchema.optional(),
  visibleWhen: PredicateSchema.optional(),
  
  // Features
  search: z.boolean().optional(),
  export: z.boolean().optional(),
  virtualize: z.boolean().optional(),
  estimatedRowHeight: z.number().optional()
})

export type ListPage = z.infer<typeof ListPageSchema>

// ============================================================================
// Detail Page
// ============================================================================

export const FieldDefSchema = z.object({
  field: z.string(),
  label: z.string(),
  format: z.enum(['text', 'date', 'html', 'markdown', 'json', 'richtext']).optional(),
  sanitizePolicy: z.string().optional() // Required if format is 'html'
})

export const RelatedSectionSchema = z.object({
  relation: z.string(),
  title: z.string(),
  component: z.string()
})

export const DetailPageSchema = z.object({
  type: z.literal('detail'),
  route: z.string(),
  runtime: RuntimeModeSchema,
  model: z.string(),
  title: z.string().optional(),
  
  // Data
  idParam: z.string().optional().default('id'),
  relations: z.array(z.string()).optional(),
  fields: z.array(FieldDefSchema),
  
  // UI
  layout: LayoutSchema.optional(),
  seo: SEOSchema.optional(),
  visibleWhen: PredicateSchema.optional(),
  
  // Features
  breadcrumbs: z.boolean().optional(),
  prevNext: z.boolean().optional(),
  relatedSections: z.array(RelatedSectionSchema).optional()
})

export type DetailPage = z.infer<typeof DetailPageSchema>

// ============================================================================
// Form Page
// ============================================================================

export const FormFieldDefSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(['text', 'textarea', 'number', 'checkbox', 'select', 'multiselect', 'date', 'richtext', 'file', 'tags']),
  required: z.boolean().default(false),
  validation: z.string().optional(), // Additional Zod validation string
  widget: z.string().optional(),     // Custom widget component
  helpText: z.string().optional(),
  placeholder: z.string().optional()
})

export const FormPageSchema = z.object({
  type: z.literal('form'),
  route: z.string(),
  runtime: z.literal('client'), // Forms must be client
  model: z.string(),
  title: z.string().optional(),
  mode: z.enum(['create', 'edit', 'inline']),
  
  // Form config
  fields: z.array(FormFieldDefSchema),
  validation: z.enum(['zod', 'yup', 'custom']).default('zod'),
  
  // UI
  layout: LayoutSchema.optional(),
  visibleWhen: PredicateSchema.optional(),
  
  // Features
  success: z.object({
    redirect: z.string().optional(),
    message: z.string().optional()
  }).optional(),
  autosave: z.boolean().optional(),
  confirmBeforeLeave: z.boolean().default(true)
})

export type FormPage = z.infer<typeof FormPageSchema>

// ============================================================================
// Custom Page
// ============================================================================

export const CustomPageSchema = z.object({
  type: z.literal('custom'),
  route: z.string(),
  runtime: RuntimeModeSchema,
  componentPath: z.string(), // Path to custom component file
  props: z.record(z.unknown()).optional()
})

export type CustomPage = z.infer<typeof CustomPageSchema>

// ============================================================================
// Page Union (Discriminated)
// ============================================================================

export const PageSchema = z.discriminatedUnion('type', [
  ListPageSchema,
  DetailPageSchema,
  FormPageSchema,
  CustomPageSchema
])

export type Page = z.infer<typeof PageSchema>

// ============================================================================
// Component Definitions
// ============================================================================

export const ComponentFieldSchema = z.object({
  field: z.string(),
  type: z.enum(['title', 'text', 'image', 'date', 'tags', 'author']),
  useShared: z.string().optional() // e.g., 'Avatar', 'Badge', 'TimeAgo'
})

export const ComponentDefSchema = z.object({
  type: z.enum(['item-card', 'custom']),
  path: z.string(),
  model: z.string().optional(),
  displayFields: z.array(ComponentFieldSchema).optional(),
  content: z.string().optional() // For custom components
})

export type ComponentDef = z.infer<typeof ComponentDefSchema>

// ============================================================================
// Guard Definitions
// ============================================================================

export const GuardSchema = z.object({
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional()
})

export type Guard = z.infer<typeof GuardSchema>

// ============================================================================
// Template Definition (Root)
// ============================================================================

export const TemplateSchema = z.object({
  // Version control
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be valid semver (e.g., "1.0.0")'),
  runtimeVersion: z.string(), // Semver range (e.g., "^3.0.0")
  
  // Template metadata
  name: z.string(),
  description: z.string().optional(),
  
  // Core definitions
  pages: z.array(PageSchema).min(1, 'At least one page required'),
  components: z.array(ComponentDefSchema).optional(),
  
  // Guards (route-level access control)
  guards: z.record(GuardSchema).optional(), // { "/admin/*": { roles: ["admin"] } }
  
  // Features
  features: z.object({
    forms: z.boolean().optional(),
    fileUpload: z.boolean().optional(),
    richText: z.boolean().optional(),
    i18n: z.boolean().optional()
  }).optional()
})

export type Template = z.infer<typeof TemplateSchema>

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate template with enhanced error messages
 */
export function validateTemplate(data: unknown) {
  const result = TemplateSchema.safeParse(data)
  
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
 * Additional validation rules beyond Zod schema
 */
export function validateTemplateRules(template: Template): string[] {
  const warnings: string[] = []
  
  // Check HTML fields have sanitize policy
  for (const page of template.pages) {
    if (page.type === 'detail') {
      for (const field of page.fields) {
        if (field.format === 'html' && !field.sanitizePolicy) {
          warnings.push(
            `Page "${page.route}": Field "${field.field}" uses format "html" but has no sanitizePolicy. ` +
            `Add sanitizePolicy: "basic" | "strict" | "rich" in capabilities.json`
          )
        }
      }
    }
  }
  
  // Note: FormPageSchema already enforces runtime: "client" at Zod level
  // No additional validation needed here
  
  return warnings
}

