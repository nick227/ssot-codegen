import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import 'express-async-errors'
import config from './config.js'
import { errorHandler, notFoundHandler } from './middleware.js'

export const createApp = () => {
  const app = express()

  // Security & parsing
  app.use(helmet())
  app.use(cors({ origin: config.cors.origin }))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // API routes
  // TODO: Import and register your generated routes here
  // Example:
  // import { todoRoutes } from '@gen/routes/todo'
  // app.use(`${config.api.prefix}/todos`, todoRoutes)

  // Error handling
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
