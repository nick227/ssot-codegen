/**
 * Centralized version management for generated projects
 * 
 * Update this file to change dependency versions across all generated projects
 */

export const VERSIONS = {
  // Core Runtime
  prisma: '^5.22.0',
  zod: '^3.25.0',
  dotenv: '^17.2.0',
  
  // Web Frameworks
  express: '^4.21.0',
  expressAsyncErrors: '^3.1.1',
  fastify: '^4.28.1',
  
  // Security
  cors: '^2.8.5',
  helmet: '^8.1.0',
  expressRateLimit: '^7.4.0',
  
  // Logging
  pino: '^9.5.0',
  pinoHttp: '^10.3.0',
  pinoPretty: '^13.1.0',
  
  // Utilities
  compression: '^1.7.4',
  httpErrors: '^2.0.0',
  cookieParser: '^1.4.6',
  
  // Dev Tools
  typescript: '^5.9.0',
  tsx: '^4.20.0',
  typesNode: '^22.10.0',
  
  // Testing
  vitest: '^2.1.0',
  vitestCoverage: '^2.1.0',
  supertest: '^7.0.0',
  typesSupertest: '^6.0.0',
  
  // Linting & Formatting
  eslint: '^9.16.0',
  typescriptEslint: '^8.17.0',
  prettier: '^3.4.0',
  
  // Build Tools
  rimraf: '^6.0.0',
  
  // Express Specific
  morgan: '^1.10.0',
  expressValidator: '^7.2.0',
  multer: '^1.4.5',
  typesMorgan: '^1.9.9',
  typesExpress: '^5.0.0',
  typesCors: '^2.8.19',
  typesMulter: '^1.4.12',
  
  // Fastify Specific
  fastifyCors: '^10.0.1',
  fastifyHelmet: '^12.0.1',
  fastifyRateLimit: '^10.1.1',
  fastifyCompress: '^8.0.1',
  fastifySwagger: '^9.2.0',
  fastifySwaggerUi: '^5.0.1',
} as const

export type VersionKey = keyof typeof VERSIONS

/**
 * Version ranges for flexibility
 */
export const VERSION_RANGES = {
  // Allow major version flexibility
  express: { min: '4.17.0', max: '5.x', recommended: VERSIONS.express },
  fastify: { min: '4.0.0', max: '5.x', recommended: VERSIONS.fastify },
  prisma: { min: '5.0.0', max: '6.x', recommended: VERSIONS.prisma },
} as const

/**
 * Get version with optional override
 */
export function getVersion(key: VersionKey, override?: string): string {
  return override || VERSIONS[key]
}

/**
 * Validate version string
 */
export function isValidVersion(version: string): boolean {
  // Matches semver patterns: ^1.0.0, ~2.0.0, 1.2.3, >=1.0.0, etc.
  return /^[\^~>=<]?\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(version)
}

