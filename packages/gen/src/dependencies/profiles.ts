import type { DependencyProfile, DependencySet } from './types.js'
import { VERSIONS } from './versions.js'

/**
 * Dependency profiles for different project types
 * 
 * Developers can choose a profile or customize their own
 */

// Minimal - Just the essentials
export const MINIMAL_PROFILE: DependencyProfile = {
  name: 'minimal',
  description: 'Bare minimum dependencies - you add what you need',
  runtime: {
    '@prisma/client': VERSIONS.prisma,
    'dotenv': VERSIONS.dotenv,
  },
  dev: {
    'typescript': VERSIONS.typescript,
    'tsx': VERSIONS.tsx,
    'prisma': VERSIONS.prisma,
    '@types/node': VERSIONS.typesNode,
  }
}

// Standard - Balanced for most projects
export const STANDARD_PROFILE: DependencyProfile = {
  name: 'standard',
  description: 'Production-ready setup with essential middleware',
  runtime: {
    '@prisma/client': VERSIONS.prisma,
    'zod': VERSIONS.zod,
    'dotenv': VERSIONS.dotenv,
    'cors': VERSIONS.cors,
    'helmet': VERSIONS.helmet,
    'compression': VERSIONS.compression,
  },
  dev: {
    'typescript': VERSIONS.typescript,
    'tsx': VERSIONS.tsx,
    'prisma': VERSIONS.prisma,
    '@types/node': VERSIONS.typesNode,
    'rimraf': VERSIONS.rimraf,
  }
}

// Production - Everything you need for production
export const PRODUCTION_PROFILE: DependencyProfile = {
  name: 'production',
  description: 'Full production setup with logging, monitoring, and security',
  runtime: {
    '@prisma/client': VERSIONS.prisma,
    'zod': VERSIONS.zod,
    'dotenv': VERSIONS.dotenv,
    'cors': VERSIONS.cors,
    'helmet': VERSIONS.helmet,
    'compression': VERSIONS.compression,
    'pino': VERSIONS.pino,
    'pino-http': VERSIONS.pinoHttp,
    'http-errors': VERSIONS.httpErrors,
    'express-rate-limit': VERSIONS.expressRateLimit,
  },
  dev: {
    'typescript': VERSIONS.typescript,
    'tsx': VERSIONS.tsx,
    'prisma': VERSIONS.prisma,
    '@types/node': VERSIONS.typesNode,
    'pino-pretty': VERSIONS.pinoPretty,
    'rimraf': VERSIONS.rimraf,
  }
}

// Full - Everything including testing and linting
export const FULL_PROFILE: DependencyProfile = {
  name: 'full',
  description: 'Complete setup with testing, linting, and all features',
  runtime: {
    '@prisma/client': VERSIONS.prisma,
    'zod': VERSIONS.zod,
    'dotenv': VERSIONS.dotenv,
    'cors': VERSIONS.cors,
    'helmet': VERSIONS.helmet,
    'compression': VERSIONS.compression,
    'pino': VERSIONS.pino,
    'pino-http': VERSIONS.pinoHttp,
    'http-errors': VERSIONS.httpErrors,
    'express-rate-limit': VERSIONS.expressRateLimit,
    'cookie-parser': VERSIONS.cookieParser,
  },
  dev: {
    'typescript': VERSIONS.typescript,
    'tsx': VERSIONS.tsx,
    'prisma': VERSIONS.prisma,
    '@types/node': VERSIONS.typesNode,
    'pino-pretty': VERSIONS.pinoPretty,
    'vitest': VERSIONS.vitest,
    '@vitest/coverage-v8': VERSIONS.vitestCoverage,
    'supertest': VERSIONS.supertest,
    '@types/supertest': VERSIONS.typesSupertest,
    'eslint': VERSIONS.eslint,
    '@typescript-eslint/parser': VERSIONS.typescriptEslint,
    '@typescript-eslint/eslint-plugin': VERSIONS.typescriptEslint,
    'prettier': VERSIONS.prettier,
    'rimraf': VERSIONS.rimraf,
  }
}

/**
 * All available profiles
 */
export const PROFILES = {
  minimal: MINIMAL_PROFILE,
  standard: STANDARD_PROFILE,
  production: PRODUCTION_PROFILE,
  full: FULL_PROFILE,
} as const

export type ProfileName = keyof typeof PROFILES

/**
 * Get profile by name
 */
export function getProfile(name: ProfileName): DependencyProfile {
  return PROFILES[name]
}

/**
 * List all available profiles
 */
export function listProfiles(): Array<{ name: string; description: string }> {
  return Object.values(PROFILES).map(p => ({
    name: p.name,
    description: p.description,
  }))
}

