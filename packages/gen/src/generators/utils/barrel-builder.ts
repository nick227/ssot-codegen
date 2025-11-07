/**
 * Barrel Builder - Standardized barrel file generation
 * 
 * Ensures consistent barrel exports across all layers with configurable extensions
 */

export class BarrelBuilder {
  /**
   * Generate model-level barrel (exports all files for a model)
   * 
   * @param modelLower - Model name in lowercase
   * @param files - Array of file names (without extension)
   * @param ext - File extension to use ('js' default, 'none' for no extension, 'ts' for TypeScript)
   */
  static modelBarrel(modelLower: string, files: string[], ext: 'js' | 'none' | 'ts' = 'js'): string {
    const exports = files.map(file => {
      const importPath = ext === 'none' ? `./${modelLower}.${file}` : `./${modelLower}.${file}.${ext}`
      return `export * from '${importPath}'`
    })
    return `// @generated barrel\n${exports.join('\n')}\n`
  }
  
  /**
   * Generate layer-level barrel (exports all models in a layer)
   */
  static layerBarrel(models: Array<{ name: string; lower: string }>, importPath: (model: string) => string): string {
    const exports = models.map(m => `export * as ${m.lower} from '${importPath(m.name)}'`)
    return `// @generated layer barrel\n${exports.join('\n')}\n`
  }
  
  /**
   * Generate simple barrel (just re-export files)
   * 
   * @param files - Array of file names (without extension)
   * @param ext - File extension to use ('js' default, 'none' for no extension, 'ts' for TypeScript)
   */
  static simple(files: string[], ext: 'js' | 'none' | 'ts' = 'js'): string {
    const exports = files.map(file => {
      const importPath = ext === 'none' ? `./${file}` : `./${file}.${ext}`
      return `export * from '${importPath}'`
    })
    return `// @generated barrel\n${exports.join('\n')}\n`
  }
}


