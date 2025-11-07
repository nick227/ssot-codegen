/**
 * Example 5: Custom Logger Integration
 * 
 * Shows how to integrate with popular logging libraries
 */

import { generate, type ProgressEvent } from '../index.js'
import winston from 'winston'
import pino from 'pino'

// ============================================================================
// Winston Integration
// ============================================================================

async function winstonExample() {
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({ filename: 'generation.log' }),
      new winston.transports.Console()
    ]
  })
  
  const result = await generate({
    schema: './schema.prisma',
    
    onProgress: (event: ProgressEvent) => {
      const logData = {
        type: event.type,
        phase: event.phase,
        model: event.model,
        filesGenerated: event.filesGenerated
      }
      
      switch (event.type) {
        case 'error':
          logger.error(event.message, logData)
          break
        case 'warning':
          logger.warn(event.message, logData)
          break
        default:
          logger.info(event.message, logData)
      }
    }
  })
  
  logger.info('Generation complete', {
    success: result.success,
    filesCreated: result.filesCreated,
    duration: result.duration
  })
}

// ============================================================================
// Pino Integration
// ============================================================================

async function pinoExample() {
  const logger = pino({
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  })
  
  const result = await generate({
    schema: './schema.prisma',
    
    onProgress: (event: ProgressEvent) => {
      logger.info({
        type: event.type,
        phase: event.phase,
        model: event.model,
        files: event.filesGenerated
      }, event.message)
    }
  })
  
  logger.info({
    success: result.success,
    files: result.filesCreated,
    duration: result.duration
  }, 'Generation complete')
}

// ============================================================================
// Custom Logger Class
// ============================================================================

class GenerationLogger {
  private logs: Array<ProgressEvent & { level: string }> = []
  
  async generate(schema: string) {
    const result = await generate({
      schema,
      
      onProgress: (event) => {
        const level = event.type === 'error' ? 'ERROR' : 
                     event.type === 'warning' ? 'WARN' : 'INFO'
        
        this.logs.push({ ...event, level })
        this.log(level, event.message)
      }
    })
    
    return result
  }
  
  private log(level: string, message: string) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [${level}] ${message}`)
  }
  
  getLogs() {
    return this.logs
  }
  
  getErrors() {
    return this.logs.filter(log => log.type === 'error')
  }
  
  getWarnings() {
    return this.logs.filter(log => log.type === 'warning')
  }
  
  exportToFile(path: string) {
    const fs = require('fs')
    fs.writeFileSync(path, JSON.stringify(this.logs, null, 2))
  }
}

async function customLoggerExample() {
  const logger = new GenerationLogger()
  const result = await logger.generate('./schema.prisma')
  
  // Export logs for debugging
  logger.exportToFile('./generation-log.json')
  
  console.log('\n📊 Summary:')
  console.log(`  Total events: ${logger.getLogs().length}`)
  console.log(`  Errors: ${logger.getErrors().length}`)
  console.log(`  Warnings: ${logger.getWarnings().length}`)
}

// Run examples (uncomment one)
// winstonExample().catch(console.error)
// pinoExample().catch(console.error)
// customLoggerExample().catch(console.error)

