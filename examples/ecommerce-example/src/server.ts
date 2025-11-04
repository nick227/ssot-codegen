import { createApp } from './app.js'
import config from './config.js'
import prisma from './db.js'

const start = async () => {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected')

    const app = createApp()

    app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`)
      console.log(`📚 Health check: http://localhost:${config.port}/health`)
      console.log(`📡 API prefix: ${config.api.prefix}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

start()
