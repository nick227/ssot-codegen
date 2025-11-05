/**
 * Utility to manage incremental project folders in generated/
 */
import fs from 'node:fs'
import path from 'node:path'

/**
 * Find the next available project-N folder
 * @param generatedDir The generated/ directory
 * @param projectBaseName Base project name (e.g., 'blog-example', 'minimal')
 * @returns Next available folder name (e.g., 'blog-example-1', 'blog-example-2')
 */
export function getNextProjectFolder(generatedDir: string, projectBaseName: string): string {
  const entries = fs.existsSync(generatedDir) ? fs.readdirSync(generatedDir) : []
  
  // Find all projectName-N folders
  const pattern = new RegExp(`^${escapeRegex(projectBaseName)}-(\\d+)$`)
  const projectFolders = entries.filter(entry => {
    const fullPath = path.join(generatedDir, entry)
    return fs.statSync(fullPath).isDirectory() && pattern.test(entry)
  })
  
  // Extract numbers and find max
  const numbers = projectFolders.map(folder => {
    const match = folder.match(pattern)
    return match ? parseInt(match[1], 10) : 0
  })
  
  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0
  const nextNumber = maxNumber + 1
  
  return `${projectBaseName}-${nextNumber}`
}

/**
 * Legacy function for backwards compatibility
 */
export function getNextGenFolder(baseDir: string): string {
  return getNextProjectFolder(baseDir, 'gen')
}

/**
 * Escape special regex characters in project name
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Find workspace root by looking for pnpm-workspace.yaml or package.json with workspaces
 */
export function findWorkspaceRoot(startDir: string): string {
  let currentDir = startDir
  
  while (true) {
    // Check for pnpm-workspace.yaml
    if (fs.existsSync(path.join(currentDir, 'pnpm-workspace.yaml'))) {
      return currentDir
    }
    
    // Check for package.json with workspaces
    const pkgPath = path.join(currentDir, 'package.json')
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
        if (pkg.workspaces) {
          return currentDir
        }
      } catch {
        // Ignore parse errors
      }
    }
    
    // Move up one directory
    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) {
      // Reached filesystem root, use startDir
      return startDir
    }
    currentDir = parentDir
  }
}

/**
 * Derive project name from schema path
 * examples/blog-example/schema.prisma → 'blog-example'
 * my-project/prisma/schema.prisma → 'my-project'
 */
export function deriveProjectName(schemaPath?: string): string {
  if (!schemaPath) return 'generated-project'
  
  const schemaDir = path.dirname(schemaPath)
  const schemaDirName = path.basename(schemaDir)
  
  // If schema is in prisma/ folder, use parent folder name
  if (schemaDirName === 'prisma') {
    return path.basename(path.dirname(schemaDir))
  }
  
  // Otherwise use the schema directory name
  return schemaDirName
}

/**
 * Get list of all gen-N folders sorted by number
 */
export function listGenFolders(baseDir: string): string[] {
  const entries = fs.existsSync(baseDir) ? fs.readdirSync(baseDir) : []
  
  const genFolders = entries
    .filter(entry => {
      const fullPath = path.join(baseDir, entry)
      return fs.statSync(fullPath).isDirectory() && /^gen-\d+$/.test(entry)
    })
    .sort((a, b) => {
      const numA = parseInt(a.match(/^gen-(\d+)$/)?.[1] || '0', 10)
      const numB = parseInt(b.match(/^gen-(\d+)$/)?.[1] || '0', 10)
      return numA - numB
    })
  
  return genFolders
}

/**
 * Clean up old gen-N folders, keeping only the most recent N
 * @param baseDir Directory containing gen folders
 * @param keepCount Number of recent folders to keep (default: 3)
 */
export function cleanupOldGenFolders(baseDir: string, keepCount: number = 3): string[] {
  const allFolders = listGenFolders(baseDir)
  
  if (allFolders.length <= keepCount) {
    return [] // Nothing to clean
  }
  
  const foldersToDelete = allFolders.slice(0, allFolders.length - keepCount)
  
  for (const folder of foldersToDelete) {
    const fullPath = path.join(baseDir, folder)
    fs.rmSync(fullPath, { recursive: true, force: true })
  }
  
  return foldersToDelete
}

