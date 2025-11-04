import 'dotenv/config'

export default {
  port: parseInt(process.env.PORT || '3003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  api: {
    prefix: process.env.API_PREFIX || '/api'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production-ai-chat',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    organization: process.env.OPENAI_ORGANIZATION || '',
    defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4',
    defaultTemperature: parseFloat(process.env.AI_DEFAULT_TEMPERATURE || '0.7'),
    defaultMaxTokens: parseInt(process.env.AI_DEFAULT_MAX_TOKENS || '2000', 10)
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '20', 10)
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  }
}

