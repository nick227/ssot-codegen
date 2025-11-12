/**
 * Configuration Merger
 * 
 * Deep merge utility for UI configurations with array override behavior
 */

/**
 * Deep merge two objects, with arrays being replaced (not concatenated)
 */
export function deepMerge<T extends Record<string, any>>(
  base: T,
  override: Partial<T>
): T {
  if (!override || typeof override !== 'object' || Array.isArray(override)) {
    return (override as unknown) as T
  }

  if (!base || typeof base !== 'object' || Array.isArray(base)) {
    return (override as unknown) as T
  }

  const result = { ...base }

  for (const key in override) {
    if (override[key] === undefined) {
      continue // Skip undefined values
    }

    if (Array.isArray(override[key])) {
      // Arrays are replaced, not merged
      result[key] = override[key] as any
    } else if (
      override[key] !== null &&
      typeof override[key] === 'object' &&
      !Array.isArray(override[key]) &&
      base[key] !== null &&
      typeof base[key] === 'object' &&
      !Array.isArray(base[key])
    ) {
      // Recursively merge nested objects
      result[key] = deepMerge(base[key], override[key])
    } else {
      // Primitive values or null are replaced
      result[key] = override[key] as any
    }
  }

  return result
}

/**
 * Merge customizations into base UI config
 */
export function mergeCustomizations(
  baseConfig: any,
  customizations: any
): any {
  if (!customizations || typeof customizations !== 'object') {
    return baseConfig
  }

  return deepMerge(baseConfig, customizations)
}

