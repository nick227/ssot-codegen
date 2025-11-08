/**
 * Coordinates all file builders to create final GeneratedFiles output
 * Provides type-safe access to different file categories
 */

import { FileBuilder } from './file-builder.js'
import type { GeneratedFiles } from '../pipeline/types.js'
import type { IGenerationContext } from '../pipeline/generation-types.js'
import { toKebabCase } from '../utils/naming.js'
import type { ParsedModel } from '../dmmf-parser.js'

/**
 * Builder for complete GeneratedFiles structure
 * 
 * Features:
 * - Type-safe builders for each category
 * - Per-model builders for DTOs/validators
 * - Plugin builder management
 * - Immutable output
 * - Snapshot/restore for rollback
 */
export class GeneratedFilesBuilder {
  // Per-model file builders (contracts and validators organized by model)
  private readonly modelDTOs = new Map<string, FileBuilder>()
  private readonly modelValidators = new Map<string, FileBuilder>()
  
  // Single-file builders
  private readonly services: FileBuilder
  private readonly controllers: FileBuilder
  private readonly routes: FileBuilder
  private readonly sdk: FileBuilder
  private readonly registry: FileBuilder
  private readonly checklist: FileBuilder
  
  // Plugin builders (one per plugin)
  private readonly plugins = new Map<string, FileBuilder>()
  
  // Hook builders (one per framework)
  private readonly hooksCore: FileBuilder
  private readonly hooksReact: FileBuilder
  private readonly hooksVue: FileBuilder
  private readonly hooksZustand: FileBuilder
  private readonly hooksVanilla: FileBuilder
  private readonly hooksAngular: FileBuilder
  
  // Plugin outputs (for env vars and package.json merging)
  private pluginOutputs = new Map<string, unknown>()
  
  constructor(private readonly context: IGenerationContext) {
    this.services = new FileBuilder(context)
    this.controllers = new FileBuilder(context)
    this.routes = new FileBuilder(context)
    this.sdk = new FileBuilder(context)
    this.registry = new FileBuilder(context)
    this.checklist = new FileBuilder(context)
    
    this.hooksCore = new FileBuilder(context)
    this.hooksReact = new FileBuilder(context)
    this.hooksVue = new FileBuilder(context)
    this.hooksZustand = new FileBuilder(context)
    this.hooksVanilla = new FileBuilder(context)
    this.hooksAngular = new FileBuilder(context)
  }
  
  // ============================================================================
  // DTOs & Validators (per-model builders)
  // ============================================================================
  
  /**
   * Get DTO builder for a model
   */
  getDTOBuilder(modelName: string): FileBuilder {
    if (!this.modelDTOs.has(modelName)) {
      this.modelDTOs.set(modelName, new FileBuilder(this.context))
    }
    return this.modelDTOs.get(modelName)!
  }
  
  /**
   * Get validator builder for a model
   */
  getValidatorBuilder(modelName: string): FileBuilder {
    if (!this.modelValidators.has(modelName)) {
      this.modelValidators.set(modelName, new FileBuilder(this.context))
    }
    return this.modelValidators.get(modelName)!
  }
  
  // ============================================================================
  // Single-file builders
  // ============================================================================
  
  getServicesBuilder(): FileBuilder {
    return this.services
  }
  
  getControllersBuilder(): FileBuilder {
    return this.controllers
  }
  
  getRoutesBuilder(): FileBuilder {
    return this.routes
  }
  
  getSDKBuilder(): FileBuilder {
    return this.sdk
  }
  
  getRegistryBuilder(): FileBuilder {
    return this.registry
  }
  
  getChecklistBuilder(): FileBuilder {
    return this.checklist
  }
  
  // ============================================================================
  // Plugin builders
  // ============================================================================
  
  /**
   * Get builder for a plugin (creates if doesn't exist)
   * Type-safe: never returns undefined
   */
  getPluginBuilder(pluginName: string): FileBuilder {
    if (!this.plugins.has(pluginName)) {
      this.plugins.set(pluginName, new FileBuilder(this.context))
    }
    return this.plugins.get(pluginName)!
  }
  
  /**
   * Set plugin outputs (for env vars and package.json)
   */
  setPluginOutputs(outputs: Map<string, unknown>): void {
    this.pluginOutputs = outputs
  }
  
  // ============================================================================
  // Hook builders
  // ============================================================================
  
  getCoreHooksBuilder(): FileBuilder {
    return this.hooksCore
  }
  
  getReactHooksBuilder(): FileBuilder {
    return this.hooksReact
  }
  
  getVueHooksBuilder(): FileBuilder {
    return this.hooksVue
  }
  
  getZustandHooksBuilder(): FileBuilder {
    return this.hooksZustand
  }
  
  getVanillaHooksBuilder(): FileBuilder {
    return this.hooksVanilla
  }
  
  getAngularHooksBuilder(): FileBuilder {
    return this.hooksAngular
  }
  
  // ============================================================================
  // Build & Restore
  // ============================================================================
  
  /**
   * Build final immutable GeneratedFiles structure
   */
  build(): GeneratedFiles {
    return {
      contracts: this.buildContractsMap(),
      validators: this.buildValidatorsMap(),
      services: this.services.build(),
      controllers: this.controllers.build(),
      routes: this.routes.build(),
      sdk: this.sdk.build(),
      registry: this.registry.getFileCount() > 0 ? this.registry.build() : undefined,
      checklist: this.checklist.getFileCount() > 0 ? this.checklist.build() : undefined,
      plugins: this.buildPluginsMap(),
      pluginOutputs: this.pluginOutputs,
      hooks: {
        core: this.hooksCore.build(),
        react: this.hooksReact.getFileCount() > 0 ? this.hooksReact.build() : undefined,
        vue: this.hooksVue.getFileCount() > 0 ? this.hooksVue.build() : undefined,
        zustand: this.hooksZustand.getFileCount() > 0 ? this.hooksZustand.build() : undefined,
        vanilla: this.hooksVanilla.getFileCount() > 0 ? this.hooksVanilla.build() : undefined,
        angular: this.hooksAngular.getFileCount() > 0 ? this.hooksAngular.build() : undefined
      }
    }
  }
  
  /**
   * Build contracts map (organized by model)
   */
  private buildContractsMap(): Map<string, Map<string, string>> {
    const result = new Map<string, Map<string, string>>()
    
    for (const [modelName, builder] of this.modelDTOs) {
      const files = builder.build()
      if (files.size > 0) {
        result.set(modelName, new Map(files))
      }
    }
    
    return result
  }
  
  /**
   * Build validators map (organized by model)
   */
  private buildValidatorsMap(): Map<string, Map<string, string>> {
    const result = new Map<string, Map<string, string>>()
    
    for (const [modelName, builder] of this.modelValidators) {
      const files = builder.build()
      if (files.size > 0) {
        result.set(modelName, new Map(files))
      }
    }
    
    return result
  }
  
  /**
   * Build plugins map (organized by plugin)
   */
  private buildPluginsMap(): Map<string, Map<string, string>> {
    const result = new Map<string, Map<string, string>>()
    
    for (const [pluginName, builder] of this.plugins) {
      const files = builder.build()
      if (files.size > 0) {
        result.set(pluginName, new Map(files))
      }
    }
    
    return result
  }
  
  /**
   * Restore from snapshot (for rollback)
   */
  restore(snapshot: GeneratedFiles): void {
    // Clear all builders
    this.clearAll()
    
    // Restore contracts
    for (const [modelName, files] of snapshot.contracts) {
      const builder = this.getDTOBuilder(modelName)
      builder.restore(files)
    }
    
    // Restore validators
    for (const [modelName, files] of snapshot.validators) {
      const builder = this.getValidatorBuilder(modelName)
      builder.restore(files)
    }
    
    // Restore single-file builders
    this.services.restore(snapshot.services)
    this.controllers.restore(snapshot.controllers)
    this.routes.restore(snapshot.routes)
    this.sdk.restore(snapshot.sdk)
    
    if (snapshot.registry) {
      this.registry.restore(snapshot.registry)
    }
    
    if (snapshot.checklist) {
      this.checklist.restore(snapshot.checklist)
    }
    
    // Restore plugins
    if (snapshot.plugins) {
      for (const [pluginName, files] of snapshot.plugins) {
        const builder = this.getPluginBuilder(pluginName)
        builder.restore(files)
      }
    }
    
    // Restore plugin outputs
    if (snapshot.pluginOutputs) {
      this.pluginOutputs = snapshot.pluginOutputs
    }
    
    // Restore hooks
    this.hooksCore.restore(snapshot.hooks.core)
    if (snapshot.hooks.react) this.hooksReact.restore(snapshot.hooks.react)
    if (snapshot.hooks.vue) this.hooksVue.restore(snapshot.hooks.vue)
    if (snapshot.hooks.zustand) this.hooksZustand.restore(snapshot.hooks.zustand)
    if (snapshot.hooks.vanilla) this.hooksVanilla.restore(snapshot.hooks.vanilla)
    if (snapshot.hooks.angular) this.hooksAngular.restore(snapshot.hooks.angular)
  }
  
  /**
   * Clear all builders
   */
  private clearAll(): void {
    this.modelDTOs.forEach(b => b.clear())
    this.modelValidators.forEach(b => b.clear())
    this.services.clear()
    this.controllers.clear()
    this.routes.clear()
    this.sdk.clear()
    this.registry.clear()
    this.checklist.clear()
    this.plugins.forEach(b => b.clear())
    this.hooksCore.clear()
    this.hooksReact.clear()
    this.hooksVue.clear()
    this.hooksZustand.clear()
    this.hooksVanilla.clear()
    this.hooksAngular.clear()
    this.pluginOutputs.clear()
  }
}

