/**
 * Integration Tests Setup
 */

import { beforeAll, afterAll } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Test output directory
export const TEST_OUTPUT_DIR = path.join(__dirname, '.temp')

beforeAll(async () => {
  // Create temp directory for test outputs
  if (!fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true })
  }
})

afterAll(async () => {
  // Cleanup temp directory
  if (fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true })
  }
})

