/**
 * Theme Schema
 * 
 * Design tokens defining the visual system.
 * Supports light/dark modes with token deltas.
 */

import { z } from 'zod'

// ============================================================================
// Token Value (with modes)
// ============================================================================

export const TokenValueSchema = z.union([
  z.string(),
  z.number(),
  z.record(z.union([z.string(), z.number()])) // { light: "value", dark: "value" }
])

export type TokenValue = z.infer<typeof TokenValueSchema>

// ============================================================================
// Color Tokens
// ============================================================================

export const ColorScaleSchema = z.record(TokenValueSchema)

export const ColorsSchema = z.object({
  primary: ColorScaleSchema,
  neutral: ColorScaleSchema,
  success: ColorScaleSchema.optional(),
  warning: ColorScaleSchema.optional(),
  error: ColorScaleSchema.optional(),
  info: ColorScaleSchema.optional()
})

export type Colors = z.infer<typeof ColorsSchema>

// ============================================================================
// Spacing Tokens
// ============================================================================

export const SpacingSchema = z.record(z.union([z.string(), z.number()]))

export type Spacing = z.infer<typeof SpacingSchema>

// ============================================================================
// Typography Tokens
// ============================================================================

export const TypographySchema = z.object({
  fontFamilies: z.record(z.string()),
  fontSizes: z.record(TokenValueSchema),
  fontWeights: z.record(z.union([z.string(), z.number()])),
  lineHeights: z.record(TokenValueSchema),
  letterSpacing: z.record(TokenValueSchema).optional()
})

export type Typography = z.infer<typeof TypographySchema>

// ============================================================================
// Border Radius Tokens
// ============================================================================

export const RadiiSchema = z.record(TokenValueSchema)

export type Radii = z.infer<typeof RadiiSchema>

// ============================================================================
// Shadow Tokens
// ============================================================================

export const ShadowsSchema = z.record(TokenValueSchema)

export type Shadows = z.infer<typeof ShadowsSchema>

// ============================================================================
// Breakpoint Tokens
// ============================================================================

export const BreakpointsSchema = z.record(z.union([z.string(), z.number()]))

export type Breakpoints = z.infer<typeof BreakpointsSchema>

// ============================================================================
// Z-Index Tokens
// ============================================================================

export const ZIndicesSchema = z.record(z.number())

export type ZIndices = z.infer<typeof ZIndicesSchema>

// ============================================================================
// Transition Tokens
// ============================================================================

export const TransitionsSchema = z.record(z.string())

export type Transitions = z.infer<typeof TransitionsSchema>

// ============================================================================
// Theme (Root)
// ============================================================================

export const ThemeSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  
  // Supported modes
  modes: z.array(z.string()).default(['light']), // e.g., ["light", "dark"]
  defaultMode: z.string().default('light'),
  
  // Token groups
  colors: ColorsSchema,
  spacing: SpacingSchema,
  typography: TypographySchema,
  radii: RadiiSchema,
  shadows: ShadowsSchema.optional(),
  breakpoints: BreakpointsSchema.optional(),
  zIndices: ZIndicesSchema.optional(),
  transitions: TransitionsSchema.optional()
})

export type Theme = z.infer<typeof ThemeSchema>

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateTheme(data: unknown) {
  const result = ThemeSchema.safeParse(data)
  
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
 * Get token value for specific mode
 */
export function getTokenValue(token: TokenValue, mode: string): string | number {
  if (typeof token === 'string' || typeof token === 'number') {
    return token
  }
  
  // Record with modes
  return token[mode] || token['light'] || Object.values(token)[0]
}

/**
 * Validate theme has all required modes
 */
export function validateThemeRules(theme: Theme): string[] {
  const warnings: string[] = []
  
  // Check defaultMode is in modes
  if (!theme.modes.includes(theme.defaultMode)) {
    warnings.push(
      `Default mode "${theme.defaultMode}" is not in modes array. ` +
      `Add "${theme.defaultMode}" to modes or change defaultMode.`
    )
  }
  
  // If multiple modes, check colors have mode values
  if (theme.modes.length > 1) {
    const checkColorScale = (scale: Record<string, TokenValue>, scaleName: string) => {
      for (const [key, value] of Object.entries(scale)) {
        if (typeof value === 'string' || typeof value === 'number') {
          warnings.push(
            `Color ${scaleName}.${key} is a simple value but theme has multiple modes. ` +
            `Consider using { light: "...", dark: "..." } format.`
          )
        }
      }
    }
    
    checkColorScale(theme.colors.primary, 'primary')
    checkColorScale(theme.colors.neutral, 'neutral')
  }
  
  return warnings
}

/**
 * Extract CSS custom properties from theme
 */
export function generateCSSVars(theme: Theme, mode: string): Record<string, string> {
  const vars: Record<string, string> = {}
  
  // Colors
  const addColorVars = (scale: Record<string, TokenValue>, prefix: string) => {
    for (const [key, value] of Object.entries(scale)) {
      vars[`--${prefix}-${key}`] = String(getTokenValue(value, mode))
    }
  }
  
  addColorVars(theme.colors.primary, 'color-primary')
  addColorVars(theme.colors.neutral, 'color-neutral')
  if (theme.colors.success) addColorVars(theme.colors.success, 'color-success')
  if (theme.colors.error) addColorVars(theme.colors.error, 'color-error')
  
  // Spacing
  for (const [key, value] of Object.entries(theme.spacing)) {
    vars[`--spacing-${key}`] = String(value)
  }
  
  // Typography
  for (const [key, value] of Object.entries(theme.typography.fontFamilies)) {
    vars[`--font-family-${key}`] = value
  }
  
  return vars
}

