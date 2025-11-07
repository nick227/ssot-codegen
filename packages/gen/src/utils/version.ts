/**
 * Version Utilities
 * 
 * Centralized version reading from package.json
 */

import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

/**
 * Read generator version dynamically from package.json
 * 
 * @returns Generator version string
 */
export async function getGeneratorVersion(): Promise<string> {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const packagePath = path.join(__dirname, '../../package.json')
    const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
    return packageJson.version || '0.4.0'
  } catch {
    return '0.4.0' // Fallback version
  }
}

