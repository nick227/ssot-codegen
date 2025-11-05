/**
 * Utility to manage incremental gen-N folders
 */
import fs from 'node:fs'
import path from 'node:path'

/**
 * Find the next available gen-N folder number
 * @param baseDir Directory to search in (usually the project root)
 * @returns Next available folder name (e.g., 'gen-1', 'gen-2')
 */
export function getNextGenFolder(baseDir: string): string {
  const entries = fs.existsSync(baseDir) ? fs.readdirSync(baseDir) : []
  
  // Find all gen-N folders
  const genFolders = entries.filter(entry => {
    const fullPath = path.join(baseDir, entry)
    return fs.statSync(fullPath).isDirectory() && /^gen-\d+$/.test(entry)
  })
  
  // Extract numbers and find max
  const numbers = genFolders.map(folder => {
    const match = folder.match(/^gen-(\d+)$/)
    return match ? parseInt(match[1], 10) : 0
  })
  
  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0
  const nextNumber = maxNumber + 1
  
  return `gen-${nextNumber}`
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

