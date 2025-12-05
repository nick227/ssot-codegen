import pino from 'pino'
import pinoHttp from 'pino-http'

// Create base logger
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  
  // Pretty print in development
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,

  // Production logging format
  formatters: process.env.NODE_ENV === 'production'
    ? {
        level: (label) => ({ level: label }),
        bindings: (bindings) => ({
          pid: bindings.pid,
          host: bindings.hostname,
          node_version: process.version,
        }),
      }
    : undefined,

  // Add timestamp
  timestamp: pino.stdTimeFunctions.isoTime,

  // Custom serializers
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: {
        'content-type': res.getHeader('content-type'),
      },
    }),
    err: pino.stdSerializers.err,
  },
})

// HTTP logger middleware
export const httpLogger = pinoHttp({
  logger,
  
  // Generate request ID
  genReqId: (req) => req.headers['x-request-id'] || req.id,

  // Custom log level based on status code
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error'
    if (res.statusCode >= 400) return 'warn'
    if (res.statusCode >= 300) return 'info'
    return 'debug'
  },

  // Don't log health checks in production
  autoLogging: {
    ignore: (req) => 
      process.env.NODE_ENV === 'production' && req.url === '/health',
  },

  // Custom success message
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} - ${res.statusCode}`
  },

  // Custom error message
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`
  },
})

export default logger

