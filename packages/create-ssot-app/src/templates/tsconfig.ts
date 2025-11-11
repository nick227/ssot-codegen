/**
 * Generate tsconfig.json
 */

import type { ProjectConfig } from '../prompts.js'

export function generateTsConfig(config?: ProjectConfig): string {
  // V3 runtime uses different paths (root-level templates, app, lib)
  const isV3 = config?.generateUI && config?.uiMode === 'v3-runtime'
  
  const tsConfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      lib: isV3 ? ['ES2022', 'DOM'] : ['ES2022'],
      jsx: isV3 ? 'preserve' as const : undefined,
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      allowJs: true,
      outDir: './dist',
      rootDir: isV3 ? '.' : './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      declaration: !isV3,
      declarationMap: !isV3,
      sourceMap: true,
      incremental: isV3,
      paths: isV3 ? {
        '@/*': ['./*']
      } : {
        '@/*': ['./src/*'],
        '@generated/*': ['./generated/*']
      }
    },
    include: isV3 ? ['app/**/*', 'lib/**/*', 'templates/**/*'] : ['src/**/*', 'generated/**/*'],
    exclude: ['node_modules', 'dist', '.next']
  }

  return JSON.stringify(tsConfig, null, 2) + '\n'
}

