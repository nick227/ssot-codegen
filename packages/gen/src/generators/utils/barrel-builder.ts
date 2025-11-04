/**
 * Barrel Builder - Standardized barrel file generation
 * 
 * Ensures consistent barrel exports across all layers
 */

export class BarrelBuilder {
  /**
   * Generate model-level barrel (exports all files for a model)
   */
  static modelBarrel(modelLower: string, files: string[]): string {
    const exports = files.map(file => `export * from './${modelLower}.${file}.js'`)
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
   */
  static simple(files: string[]): string {
    const exports = files.map(file => `export * from './${file}.js'`)
    return `// @generated barrel\n${exports.join('\n')}\n`
  }
}

