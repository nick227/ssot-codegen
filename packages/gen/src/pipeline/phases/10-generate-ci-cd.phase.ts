/**
 * Phase 10: Generate CI/CD
 * 
 * Generates GitHub Actions workflows, Docker configs, and deployment templates
 */

import path from 'node:path'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'
import { writeFile } from '../phase-utilities.js'
import { 
  generateGitHubActionsCI,
  generateGitHubActionsDeploy,
  generateDockerfile,
  generateDockerCompose,
  generateDockerIgnore,
  generateCIReadme
} from '@/templates/ci.template.js'

export class GenerateCICDPhase extends GenerationPhase {
  readonly name = 'generateCICD'
  readonly order = 10
  
  getDescription(): string {
    return 'Generating CI/CD configurations'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { pathsConfig: cfg, generatorConfig } = context
    
    if (!cfg) {
      throw new Error('Paths config not found in context')
    }
    
    // Skip CI/CD generation if explicitly disabled (check if property exists)
    const skipCICD = generatorConfig && 'skipCICD' in generatorConfig 
      ? (generatorConfig as any).skipCICD 
      : false
    
    if (skipCICD === true) {
      return {
        success: true,
        filesGenerated: 0
      }
    }
    
    let filesGenerated = 0
    const projectRoot = path.join(cfg.rootDir, '..')
    
    // GitHub Actions workflows
    const githubDir = path.join(projectRoot, '.github', 'workflows')
    
    await writeFile(path.join(githubDir, 'ci.yml'), generateGitHubActionsCI())
    filesGenerated++
    
    await writeFile(path.join(githubDir, 'deploy.yml'), generateGitHubActionsDeploy())
    filesGenerated++
    
    // Docker configuration
    await writeFile(path.join(projectRoot, 'Dockerfile'), generateDockerfile())
    filesGenerated++
    
    await writeFile(path.join(projectRoot, 'docker-compose.yml'), generateDockerCompose())
    filesGenerated++
    
    await writeFile(path.join(projectRoot, '.dockerignore'), generateDockerIgnore())
    filesGenerated++
    
    // CI/CD documentation
    await writeFile(path.join(githubDir, 'README.md'), generateCIReadme())
    filesGenerated++
    
    return {
      success: true,
      filesGenerated
    }
  }
}

