/**
 * Manifest Generator
 * 
 * Generates manifest files for tracking generated projects
 */

import { createHash } from 'crypto'
import type { ProjectConfig } from './website-schema-types.js'

export interface ProjectManifest {
  projectId: string
  name: string
  schema: string
  baseConfig?: string
  customizations?: any
  generatedAt: string
  checksum: string
  version: string
  filesGenerated: number
  metadata?: {
    schemaHash?: string
    configHash?: string
  }
}

/**
 * Generate checksum for content
 */
export function generateChecksum(content: string): string {
  return createHash('sha256').update(content).digest('hex').substring(0, 16)
}

/**
 * Generate project manifest
 */
export function generateManifest(
  project: ProjectConfig,
  schemaContent: string,
  configContent: string,
  filesGenerated: number
): ProjectManifest {
  const schemaHash = generateChecksum(schemaContent)
  const configHash = generateChecksum(configContent)
  const combinedHash = generateChecksum(schemaContent + configContent + JSON.stringify(project.customizations || {}))

  return {
    projectId: project.id,
    name: project.name,
    schema: typeof project.schema === 'string' ? project.schema : project.schema.schemaPath,
    baseConfig: typeof project.schema === 'string' ? undefined : project.schema.uiConfigPath,
    customizations: project.customizations,
    generatedAt: new Date().toISOString(),
    checksum: combinedHash,
    version: '1.0.0',
    filesGenerated,
    metadata: {
      schemaHash,
      configHash
    }
  }
}

/**
 * Generate bulk manifest
 */
export interface BulkManifest {
  generatedAt: string
  projects: ProjectManifest[]
  summary: {
    totalProjects: number
    totalFiles: number
    successful: number
    failed: number
  }
}

export function generateBulkManifest(
  projectManifests: ProjectManifest[],
  summary: { totalFiles: number; successful: number; failed: number }
): BulkManifest {
  return {
    generatedAt: new Date().toISOString(),
    projects: projectManifests,
    summary: {
      totalProjects: projectManifests.length,
      ...summary
    }
  }
}

