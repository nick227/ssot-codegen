/**
 * Platform Infrastructure Templates
 * 
 * Production-ready infrastructure modules for generated applications
 */

export function getConfigTemplate(): string {
  return `/**
 * Configuration Module
 * 
 * Loads and validates environment variables with type-safe configuration
 * using Zod for runtime validation.
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envFile = process.env.NODE_ENV === 'test' 
  ? '.env.test' 
  : process.env.NODE_ENV === 'production' 
    ? '.env' 
    : '.env.development';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Configuration schema with Zod validation
const configSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('localhost'),
  
  // API
  API_VERSION: z.string().default('v1'),
  API_PREFIX: z.string().default('/api'),
  
  // Database (supports PostgreSQL, MySQL, SQLite file URLs)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Security
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_PRETTY: z.coerce.boolean().default(false),
  
  // Features
  SWAGGER_ENABLED: z.coerce.boolean().default(false), // Disabled in production by default
  METRICS_ENABLED: z.coerce.boolean().default(false),
  
  // Pagination
  DEFAULT_PAGE_SIZE: z.coerce.number().int().positive().default(20),
  MAX_PAGE_SIZE: z.coerce.number().int().positive().default(100),
});

// Parse and validate configuration
function loadConfig() {
  const result = configSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Invalid configuration:');
    result.error.issues.forEach((issue) => {
      console.error(\`  - \${issue.path.join('.')}: \${issue.message}\`);
    });
    process.exit(1);
  }
  
  return result.data;
}

// Export typed configuration
export const config = loadConfig();
export type Config = z.infer<typeof configSchema>;

// Environment helpers
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

// API URL helpers
export const getApiUrl = (path: string = '') => {
  const base = \`http://\${config.HOST}:\${config.PORT}\${config.API_PREFIX}/\${config.API_VERSION}\`;
  return path ? \`\${base}\${path.startsWith('/') ? '' : '/'}\${path}\` : base;
};
`
}

export function getLoggerTemplate(): string {
  return `/**
 * Logger Module
 * 
 * Structured logging with Pino for high-performance, JSON-formatted logs
 */

import pino from 'pino';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import { config, isDevelopment } from './config.js';

// Create base logger
export const logger = pino({
  level: config.LOG_LEVEL,
  ...(config.LOG_PRETTY && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  }),
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

// HTTP request logger middleware
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    // Use existing request ID or generate new UUID
    const existingId = req.headers['x-request-id'];
    if (existingId && typeof existingId === 'string') return existingId;
    return randomUUID();
  },
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return \`\${req.method} \${req.url} \${res.statusCode}\`;
  },
  customErrorMessage: (req, res, err) => {
    return \`\${req.method} \${req.url} \${res.statusCode} - \${err.message}\`;
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      // Exclude sensitive headers
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'x-request-id': req.headers['x-request-id'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: {
        'content-type': res.getHeader('content-type'),
        'content-length': res.getHeader('content-length'),
      },
    }),
  },
});

// Convenience logging methods
export const logInfo = (message: string, data?: object) => logger.info(data, message);
export const logError = (message: string, error?: Error | object) => logger.error(error, message);
export const logWarn = (message: string, data?: object) => logger.warn(data, message);
export const logDebug = (message: string, data?: object) => logger.debug(data, message);
`
}

export function getErrorTemplate(): string {
  return `/**
 * Error Handling Module
 * 
 * Centralized error handling with Prisma error mapping
 * Following RFC 7807 Problem Details for HTTP APIs
 */

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from './logger.js';
import { config } from './config.js';

// RFC 7807 Problem Details interface
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  [key: string]: unknown;
}

// Custom application errors
export class AppError extends Error {
  constructor(
    public status: number,
    public title: string,
    message: string,
    public type: string = 'about:blank',
    public extensions?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors?: unknown) {
    super(400, 'Validation Error', message, '/errors/validation', { errors });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number) {
    const message = id ? \`\${resource} with id '\${id}' not found\` : \`\${resource} not found\`;
    super(404, 'Not Found', message, '/errors/not-found', { resource, id });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, field?: string) {
    super(409, 'Conflict', message, '/errors/conflict', { field });
    this.name = 'ConflictError';
  }
}

// Map Prisma errors to HTTP errors
export function mapPrismaError(error: unknown): AppError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        // Unique constraint violation
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] || 'field';
        return new ConflictError(
          \`A record with this \${field} already exists\`,
          field
        );
      }
      
      case 'P2025': {
        // Record not found
        const cause = error.meta?.cause as string | undefined;
        return new NotFoundError('Record', cause);
      }
      
      case 'P2003': {
        // Foreign key constraint violation
        const field = error.meta?.field_name as string | undefined;
        return new ConflictError(
          \`Invalid reference: \${field || 'related record'} does not exist\`,
          field
        );
      }
      
      case 'P2014': {
        // Required relation violation
        return new ConflictError(
          'Cannot delete record due to required relations'
        );
      }
      
      case 'P2011': {
        // Null constraint violation
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] || 'field';
        return new ValidationError(
          \`\${field} cannot be null\`,
          { field, constraint: 'not_null' }
        );
      }
      
      default: {
        logger.error({ prismaError: error }, 'Unhandled Prisma error');
        return new AppError(
          500,
          'Database Error',
          'An unexpected database error occurred',
          '/errors/database',
          { code: error.code }
        );
      }
    }
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError('Invalid data provided to database');
  }
  
  // Not a Prisma error
  throw error;
}

// Convert error to Problem Details format
function toProblemDetails(error: AppError, instance: string): ProblemDetails {
  return {
    type: error.type,
    title: error.title,
    status: error.status,
    detail: error.message,
    instance,
    ...error.extensions,
  };
}

// Global error handler middleware
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip if headers already sent
  if (res.headersSent) {
    return next(error);
  }
  
  let appError: AppError;
  
  // Convert known errors to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError
  ) {
    appError = mapPrismaError(error);
  } else {
    // Unknown error - log and return generic 500
    logger.error({ err: error, req }, 'Unhandled error');
    appError = new AppError(
      500,
      'Internal Server Error',
      config.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message
    );
  }
  
  // Log error with appropriate level
  if (appError.status >= 500) {
    logger.error({ err: error, req }, appError.message);
  } else if (appError.status >= 400) {
    logger.warn({ req, error: appError }, appError.message);
  }
  
  // Send Problem Details response
  const problem = toProblemDetails(appError, req.url);
  res.status(appError.status).json(problem);
}

// Async handler wrapper to catch promise rejections
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
`
}

export function getSecurityTemplate(): string {
  return `/**
 * Security Middleware Module
 * 
 * Security headers, CORS, rate limiting, and other protective measures
 */

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import { Request, Response } from 'express';
import { config, isProduction } from './config.js';

// Helmet configuration for security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  } : false, // Disable CSP in development for easier debugging
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// CORS configuration
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = config.CORS_ORIGIN.split(',').map(o => o.trim());
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development
    if (!isProduction) return callback(null, true);
    
    // Check against whitelist
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
});

// Rate limiting to prevent abuse
export const rateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    type: '/errors/rate-limit',
    title: 'Too Many Requests',
    status: 429,
    detail: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in test environment
  skip: () => config.NODE_ENV === 'test',
});

// HTTP Parameter Pollution protection
export const parameterPollutionProtection = hpp();

// Trust proxy settings (for load balancers)
export const configureTrustProxy = (app: any) => {
  if (isProduction) {
    app.set('trust proxy', 1); // Trust first proxy
  }
};
`
}

export function getHealthTemplate(): string {
  return `/**
 * Health Check Module
 * 
 * Liveness and readiness probes for container orchestration
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const prisma = new PrismaClient();

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks?: {
    database?: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
  };
}

/**
 * Liveness probe
 * Returns 200 if the process is running
 * Used by orchestrators to know if the container needs restart
 */
export async function livenessCheck(req: Request, res: Response): Promise<void> {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
  
  res.status(200).json(health);
}

/**
 * Readiness probe  
 * Returns 200 if the service is ready to accept traffic
 * Checks database connectivity with timeout
 */
export async function readinessCheck(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {},
  };
  
  // Check database connection with 5s timeout
  try {
    const dbCheck = Promise.race([
      prisma.$queryRaw\`SELECT 1\`,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      )
    ]);
    
    await dbCheck;
    const responseTime = Date.now() - startTime;
    
    health.checks!.database = {
      status: 'up',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    health.status = 'unhealthy';
    health.checks!.database = {
      status: 'down',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    
    logger.error({ err: error }, 'Database health check failed');
    
    return res.status(503).json(health);
  }
  
  res.status(200).json(health);
}

/**
 * Graceful shutdown handler
 * Closes database connections and HTTP server cleanly
 */
export async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(\`\${signal} received, starting graceful shutdown...\`);
  
  try {
    // Close Prisma connection
    await prisma.$disconnect();
    logger.info('Database connection closed');
    
    // Exit process
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Error during graceful shutdown');
    process.exit(1);
  }
}

// Register shutdown handlers
export function registerShutdownHandlers(): void {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error({ err: error }, 'Uncaught exception');
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });
  
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
    gracefulShutdown('UNHANDLED_REJECTION');
  });
}
`
}

export function getEnvExampleTemplate(dbName: string = 'app'): string {
  return `# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# API Configuration
API_VERSION=v1
API_PREFIX=/api

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public"

# Security
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_PRETTY=false

# Features
SWAGGER_ENABLED=false
METRICS_ENABLED=false

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
`
}

export function getEnvDevelopmentTemplate(dbName: string): string {
  return `# Development Environment
NODE_ENV=development
PORT=3000
HOST=localhost

# API Configuration
API_VERSION=v1
API_PREFIX=/api

# Database (Update with your local database)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/${dbName}_dev?schema=public"

# Security (Permissive for development)
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging (Pretty print in development)
LOG_LEVEL=debug
LOG_PRETTY=true

# Features (Enabled for development)
SWAGGER_ENABLED=true
METRICS_ENABLED=true

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
`
}

export function getEnvTestTemplate(): string {
  return `# Test Environment
NODE_ENV=test
PORT=3001
HOST=localhost

# API Configuration
API_VERSION=v1
API_PREFIX=/api

# Database (In-memory SQLite or test database)
DATABASE_URL="file:./test.db"

# Security (Disabled for tests)
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10000

# Logging (Silent in tests)
LOG_LEVEL=error
LOG_PRETTY=false

# Features (Disabled for faster tests)
SWAGGER_ENABLED=false
METRICS_ENABLED=false

# Pagination
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=50
`
}

