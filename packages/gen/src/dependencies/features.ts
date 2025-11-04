import type { FeatureSet, DependencySet } from './types.js'
import { VERSIONS } from './versions.js'

/**
 * Optional features that can be enabled/disabled
 * 
 * Developers can pick and choose features they need
 */

export const FEATURES = {
  /**
   * Structured logging with Pino
   */
  logging: {
    name: 'Structured Logging',
    description: 'JSON logging with Pino for production',
    dependencies: {
      runtime: {
        'pino': VERSIONS.pino,
        'pino-http': VERSIONS.pinoHttp,
      },
      dev: {
        'pino-pretty': VERSIONS.pinoPretty,
      }
    }
  },

  /**
   * Rate limiting for API protection
   */
  rateLimit: {
    name: 'Rate Limiting',
    description: 'Protect your API from abuse',
    dependencies: {
      runtime: {
        'express-rate-limit': VERSIONS.expressRateLimit,
      },
      dev: {}
    }
  },

  /**
   * Response compression
   */
  compression: {
    name: 'Response Compression',
    description: 'Gzip/Brotli compression for responses',
    dependencies: {
      runtime: {
        'compression': VERSIONS.compression,
      },
      dev: {}
    }
  },

  /**
   * Cookie support
   */
  cookies: {
    name: 'Cookie Support',
    description: 'Parse and handle cookies',
    dependencies: {
      runtime: {
        'cookie-parser': VERSIONS.cookieParser,
      },
      dev: {}
    }
  },

  /**
   * File uploads with Multer
   */
  fileUploads: {
    name: 'File Uploads',
    description: 'Handle multipart/form-data file uploads',
    dependencies: {
      runtime: {
        'multer': VERSIONS.multer,
      },
      dev: {
        '@types/multer': VERSIONS.typesMulter,
      }
    }
  },

  /**
   * HTTP request logging
   */
  httpLogging: {
    name: 'HTTP Request Logging',
    description: 'Log all HTTP requests with Morgan',
    dependencies: {
      runtime: {
        'morgan': VERSIONS.morgan,
      },
      dev: {
        '@types/morgan': VERSIONS.typesMorgan,
      }
    }
  },

  /**
   * Testing with Vitest
   */
  testing: {
    name: 'Testing Framework',
    description: 'Vitest for fast unit and integration tests',
    dependencies: {
      runtime: {},
      dev: {
        'vitest': VERSIONS.vitest,
        '@vitest/coverage-v8': VERSIONS.vitestCoverage,
        'supertest': VERSIONS.supertest,
        '@types/supertest': VERSIONS.typesSupertest,
      }
    }
  },

  /**
   * Linting with ESLint
   */
  linting: {
    name: 'Code Linting',
    description: 'ESLint for code quality',
    dependencies: {
      runtime: {},
      dev: {
        'eslint': VERSIONS.eslint,
        '@typescript-eslint/parser': VERSIONS.typescriptEslint,
        '@typescript-eslint/eslint-plugin': VERSIONS.typescriptEslint,
      }
    }
  },

  /**
   * Code formatting with Prettier
   */
  formatting: {
    name: 'Code Formatting',
    description: 'Prettier for consistent code style',
    dependencies: {
      runtime: {},
      dev: {
        'prettier': VERSIONS.prettier,
      }
    }
  },

  /**
   * Request validation
   */
  validation: {
    name: 'Request Validation',
    description: 'Express-validator for request validation',
    dependencies: {
      runtime: {
        'express-validator': VERSIONS.expressValidator,
      },
      dev: {}
    }
  },

  /**
   * Better error handling
   */
  errorHandling: {
    name: 'Error Handling',
    description: 'HTTP-errors for proper error objects',
    dependencies: {
      runtime: {
        'http-errors': VERSIONS.httpErrors,
      },
      dev: {}
    }
  },
} as const

export type FeatureName = keyof typeof FEATURES

/**
 * Get dependencies for enabled features
 */
export function resolveFeatures(features: FeatureName[]): DependencySet {
  const runtime: Record<string, string> = {}
  const dev: Record<string, string> = {}

  for (const feature of features) {
    const deps = FEATURES[feature].dependencies
    Object.assign(runtime, deps.runtime)
    Object.assign(dev, deps.dev)
  }

  return { runtime, dev }
}

/**
 * Get feature details
 */
export function getFeature(name: FeatureName) {
  return FEATURES[name]
}

/**
 * List all available features
 */
export function listFeatures(): Array<{ name: string; description: string }> {
  return Object.entries(FEATURES).map(([key, feature]) => ({
    name: key,
    description: feature.description,
  }))
}

/**
 * Recommended feature sets for common scenarios
 */
export const FEATURE_PRESETS = {
  // Minimal API
  api: ['rateLimit', 'compression', 'errorHandling'] as FeatureName[],
  
  // Production API
  production: [
    'logging',
    'rateLimit',
    'compression',
    'errorHandling',
    'httpLogging',
  ] as FeatureName[],
  
  // Full-featured API
  fullstack: [
    'logging',
    'rateLimit',
    'compression',
    'cookies',
    'fileUploads',
    'errorHandling',
    'httpLogging',
    'validation',
  ] as FeatureName[],
  
  // Development setup
  development: [
    'testing',
    'linting',
    'formatting',
  ] as FeatureName[],
} as const

