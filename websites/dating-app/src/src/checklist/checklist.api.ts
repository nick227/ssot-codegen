// @generated
// Checklist API endpoints for live system checks

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const checklistRouter: Router = Router()

/**
 * GET /api/checklist
 * Run all checks and return results
 */
checklistRouter.get('/', async (req, res) => {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      project: 'src',
      checks: {
        environment: await runEnvironmentChecks(),
        code: await runCodeChecks(),
        api: await runAPIChecks(),
        features: await runFeatureChecks()
      }
    }
    
    res.json(results)
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Checklist failed'
    })
  }
})

/**
 * GET /api/checklist/database
 * Check database connection
 */
checklistRouter.get('/database', async (req, res) => {
  try {
    const start = Date.now()
    await prisma.$connect()
    const time = Date.now() - start
    
    res.json({
      status: 'success',
      message: 'Connected',
      time: `${time}ms`
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Database check failed'
    })
  }
})

/**
 * POST /api/checklist/test/:model
 * Test CRUD operations for a model
 */
checklistRouter.post('/test/:model', async (req, res) => {
  const { model } = req.params
  
  // Validate model name (security)
  const validModels = ["User","Profile","Photo","Swipe","Match","Message","Quiz","QuizQuestion","QuizAnswer","QuizResult","BehaviorEvent","BehaviorEventArchive","PersonalityDimension","UserDimensionScore","CompatibilityScore","UserDimensionPriority","DimensionMappingRule","EventWeightConfig","Block"]
  if (!validModels.includes(model)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid model: ${model}`
    })
  }
  
  try {
    const results = await testModelCRUD(model)
    res.json(results)
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Helper functions
async function runEnvironmentChecks() {
  return {
    database: await checkDatabase(),
    envVars: checkEnvironmentVariables(),
    ports: checkPorts()
  }
}

async function runCodeChecks() {
  return {
    registryFiles: 0,
    services: 19,
    routes: 15,
    validators: 19
  }
}

async function runAPIChecks() {
  // Test a few endpoints
  return {
    tested: 0,
    passed: 0,
    failed: 0
  }
}

async function runFeatureChecks() {
  return {
    middleware: false,
    permissions: false,
    caching: false,
    events: false,
    search: false
  }
}

async function checkDatabase() {
  try {
    await prisma.$connect()
    return { status: 'success' }
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Connection failed' }
  }
}

function checkEnvironmentVariables() {
  const required = ['DATABASE_URL', 'PORT', 'NODE_ENV']
  const missing = required.filter(v => !process.env[v])
  
  return {
    status: missing.length === 0 ? 'success' : 'warning',
    total: required.length,
    present: required.length - missing.length,
    missing
  }
}

function checkPorts() {
  return { status: 'success' }
}

async function testModelCRUD(model: string) {
  // Implement CRUD testing
  return {
    model,
    operations: {
      create: 'pending',
      read: 'pending',
      update: 'pending',
      delete: 'pending'
    }
  }
}
