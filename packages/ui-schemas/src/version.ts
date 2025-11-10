/**
 * Version Validation
 * 
 * Handles semver version checking between runtime and templates.
 * Enforces the version handshake redline.
 */

import { z } from 'zod'

// ============================================================================
// Version Schema
// ============================================================================

export const VersionSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be valid semver'),
  runtimeVersion: z.string().optional() // For templates
})

// ============================================================================
// Semver Parsing
// ============================================================================

export interface SemVer {
  major: number
  minor: number
  patch: number
}

export function parseSemVer(version: string): SemVer | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!match) return null
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10)
  }
}

export function parseSemVerRange(range: string): {
  operator: '^' | '~' | '>=' | '>' | '<=' | '<' | '=' | null
  version: SemVer
} | null {
  // Support: ^3.0.0, ~3.0.0, >=3.0.0, >3.0.0, <=3.0.0, <3.0.0, =3.0.0, 3.0.0
  const match = range.match(/^([\^~><=]?=?)?\s*(\d+\.\d+\.\d+)$/)
  if (!match) return null
  
  const operator = (match[1] as any) || null
  const version = parseSemVer(match[2])
  
  if (!version) return null
  
  return { operator, version }
}

// ============================================================================
// Version Comparison
// ============================================================================

export function compareVersions(a: SemVer, b: SemVer): number {
  if (a.major !== b.major) return a.major - b.major
  if (a.minor !== b.minor) return a.minor - b.minor
  return a.patch - b.patch
}

export function satisfiesRange(version: SemVer, range: string): boolean {
  const parsed = parseSemVerRange(range)
  if (!parsed) return false
  
  const cmp = compareVersions(version, parsed.version)
  
  switch (parsed.operator) {
    case '^': // Compatible with (same major)
      return version.major === parsed.version.major && cmp >= 0
    case '~': // Approximately equivalent (same major.minor)
      return version.major === parsed.version.major && 
             version.minor === parsed.version.minor && 
             cmp >= 0
    case '>=':
      return cmp >= 0
    case '>':
      return cmp > 0
    case '<=':
      return cmp <= 0
    case '<':
      return cmp < 0
    case '=':
    case null:
      return cmp === 0
    default:
      return false
  }
}

// ============================================================================
// Version Validation
// ============================================================================

export interface VersionCheckResult {
  compatible: boolean
  level: 'ok' | 'warning' | 'error'
  message: string
}

/**
 * Check if template version is compatible with runtime version
 * 
 * REDLINE: Hard-fail on major version mismatch
 */
export function checkVersionCompatibility(
  runtimeVersion: string,
  templateRuntimeVersionRequired: string
): VersionCheckResult {
  const runtime = parseSemVer(runtimeVersion)
  if (!runtime) {
    return {
      compatible: false,
      level: 'error',
      message: `Invalid runtime version: "${runtimeVersion}"`
    }
  }
  
  // Check if template requirements are satisfied
  if (!satisfiesRange(runtime, templateRuntimeVersionRequired)) {
    const required = parseSemVerRange(templateRuntimeVersionRequired)
    if (!required) {
      return {
        compatible: false,
        level: 'error',
        message: `Invalid template runtimeVersion range: "${templateRuntimeVersionRequired}"`
      }
    }
    
    // Major version mismatch = hard fail
    if (runtime.major !== required.version.major) {
      return {
        compatible: false,
        level: 'error',
        message: 
          `❌ INCOMPATIBLE: Runtime v${runtimeVersion} does not satisfy template requirement "${templateRuntimeVersionRequired}"\n\n` +
          `This template requires runtime v${required.version.major}.x.x but you have v${runtime.major}.x.x\n\n` +
          `💡 Upgrade runtime:\n` +
          `   npm install @ssot-ui/runtime@^${required.version.major}.0.0\n\n` +
          `Or use a compatible template version.`
      }
    }
    
    // Minor version mismatch = warning
    return {
      compatible: false,
      level: 'warning',
      message: 
        `⚠️  VERSION MISMATCH: Runtime v${runtimeVersion} may not fully support template requirement "${templateRuntimeVersionRequired}"\n\n` +
        `Template expects runtime v${required.version.major}.${required.version.minor}.x or higher\n\n` +
        `💡 Consider upgrading:\n` +
        `   npm install @ssot-ui/runtime@^${required.version.major}.${required.version.minor}.0`
    }
  }
  
  return {
    compatible: true,
    level: 'ok',
    message: `✅ Compatible: Runtime v${runtimeVersion} satisfies "${templateRuntimeVersionRequired}"`
  }
}

/**
 * Get version compatibility matrix for documentation
 */
export function getCompatibilityMatrix() {
  return `
Template Version → Runtime Version Compatibility:

  Template v1.x → Runtime v3.0.x - v3.2.x  ✅ Compatible
  Template v1.x → Runtime v4.x.x          ❌ Incompatible (major version change)
  Template v2.x → Runtime v3.3.x+         ✅ Compatible (if template requires ^3.3.0)
  
  Rules:
  - Major version must match (v3 template needs v3 runtime)
  - Minor version should satisfy range (^3.2.0 accepts 3.2.0+)
  - Patch version always compatible within minor
`
}

