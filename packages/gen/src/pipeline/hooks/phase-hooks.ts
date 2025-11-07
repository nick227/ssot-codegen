/**
 * Phase Hook System
 * 
 * Enables plugins to hook into the phase pipeline with:
 * - beforePhase: Run code before a phase executes
 * - afterPhase: Run code after a phase completes
 * - replacePhase: Completely replace a phase
 * - wrapPhase: Wrap a phase with before/after logic
 * 
 * Hooks receive strongly-typed context based on phase requirements.
 * 
 * @example
 * ```ts
 * // Add logging before code generation
 * hooks.beforePhase('generateCode', async (context: ContextAfterPhase3) => {
 *   console.log(`Generating code for ${context.modelNames.length} models...`)
 * })
 * 
 * // Modify context after parsing
 * hooks.afterPhase('parseSchema', async (context: ContextAfterPhase1) => {
 *   console.log(`Parsed ${context.modelNames.length} models`)
 *   // Can modify context here
 * })
 * ```
 */

import type { BaseContext } from '../typed-context.js'
import type { PhaseResult } from '../types.js'

// ============================================================================
// HOOK TYPES
// ============================================================================

/**
 * Hook that runs before a phase
 * 
 * @template TContext - Strongly-typed context available before phase
 */
export type BeforePhaseHook<TContext extends BaseContext> = (
  context: TContext
) => Promise<void> | void

/**
 * Hook that runs after a phase completes
 * 
 * @template TContext - Strongly-typed context after phase completes
 * @template TResult - Phase result data
 */
export type AfterPhaseHook<TContext extends BaseContext, TResult = unknown> = (
  context: TContext,
  result: PhaseResult<TResult>
) => Promise<void> | void

/**
 * Hook that replaces a phase entirely
 * 
 * @template TContext - Strongly-typed context required by phase
 * @template TResult - Phase result data
 */
export type ReplacePhaseHook<TContext extends BaseContext, TResult = unknown> = (
  context: TContext
) => Promise<PhaseResult<TResult>>

/**
 * Hook that wraps a phase (before + after)
 * 
 * @template TContext - Strongly-typed context
 * @template TResult - Phase result data
 */
export interface WrapPhaseHook<TContext extends BaseContext, TResult = unknown> {
  before?: BeforePhaseHook<TContext>
  after?: AfterPhaseHook<TContext, TResult>
}

/**
 * Error hook that runs when a phase fails
 */
export type ErrorHook = (
  phaseName: string,
  error: Error,
  context: BaseContext
) => Promise<void> | void

// ============================================================================
// HOOK REGISTRY
// ============================================================================

/**
 * Registry for phase hooks
 * 
 * Manages all registered hooks and provides type-safe access
 */
export class PhaseHookRegistry {
  private beforeHooks = new Map<string, Array<BeforePhaseHook<any>>>()
  private afterHooks = new Map<string, Array<AfterPhaseHook<any, any>>>()
  private replaceHooks = new Map<string, ReplacePhaseHook<any, any>>()
  private errorHooks: ErrorHook[] = []
  
  /**
   * Register a before hook
   * 
   * @param phaseName - Name of phase to hook (e.g., 'parseSchema')
   * @param hook - Hook function to run before phase
   * 
   * @example
   * ```ts
   * registry.beforePhase('generateCode', async (context: ContextAfterPhase3) => {
   *   console.log(`Generating for ${context.modelNames.length} models`)
   * })
   * ```
   */
  beforePhase<TContext extends BaseContext>(
    phaseName: string,
    hook: BeforePhaseHook<TContext>
  ): void {
    if (!this.beforeHooks.has(phaseName)) {
      this.beforeHooks.set(phaseName, [])
    }
    this.beforeHooks.get(phaseName)!.push(hook)
  }
  
  /**
   * Register an after hook
   * 
   * @param phaseName - Name of phase to hook
   * @param hook - Hook function to run after phase
   * 
   * @example
   * ```ts
   * registry.afterPhase('writeFiles', async (context, result) => {
   *   console.log(`Wrote ${result.filesGenerated} files`)
   * })
   * ```
   */
  afterPhase<TContext extends BaseContext, TResult = unknown>(
    phaseName: string,
    hook: AfterPhaseHook<TContext, TResult>
  ): void {
    if (!this.afterHooks.has(phaseName)) {
      this.afterHooks.set(phaseName, [])
    }
    this.afterHooks.get(phaseName)!.push(hook)
  }
  
  /**
   * Replace a phase entirely
   * 
   * @param phaseName - Name of phase to replace
   * @param hook - Replacement implementation
   * 
   * @example
   * ```ts
   * registry.replacePhase('generateCode', async (context: ContextAfterPhase3) => {
   *   // Custom code generation logic
   *   return { success: true, data: customFiles }
   * })
   * ```
   */
  replacePhase<TContext extends BaseContext, TResult = unknown>(
    phaseName: string,
    hook: ReplacePhaseHook<TContext, TResult>
  ): void {
    if (this.replaceHooks.has(phaseName)) {
      throw new Error(`Phase '${phaseName}' already has a replacement hook`)
    }
    this.replaceHooks.set(phaseName, hook)
  }
  
  /**
   * Wrap a phase with before/after hooks
   * 
   * @param phaseName - Name of phase to wrap
   * @param hooks - Before and/or after hooks
   * 
   * @example
   * ```ts
   * registry.wrapPhase('parseSchema', {
   *   before: async (ctx) => console.log('Parsing...'),
   *   after: async (ctx, result) => console.log('Parsed!')
   * })
   * ```
   */
  wrapPhase<TContext extends BaseContext, TResult = unknown>(
    phaseName: string,
    hooks: WrapPhaseHook<TContext, TResult>
  ): void {
    if (hooks.before) {
      this.beforePhase(phaseName, hooks.before)
    }
    if (hooks.after) {
      this.afterPhase(phaseName, hooks.after)
    }
  }
  
  /**
   * Register error hook
   * 
   * @param hook - Hook to run when any phase fails
   * 
   * @example
   * ```ts
   * registry.onError(async (phaseName, error, context) => {
   *   logger.error(`Phase ${phaseName} failed:`, error)
   * })
   * ```
   */
  onError(hook: ErrorHook): void {
    this.errorHooks.push(hook)
  }
  
  /**
   * Execute all before hooks for a phase
   */
  async executeBeforeHooks<TContext extends BaseContext>(
    phaseName: string,
    context: TContext
  ): Promise<void> {
    const hooks = this.beforeHooks.get(phaseName) || []
    
    for (const hook of hooks) {
      await hook(context)
    }
  }
  
  /**
   * Execute all after hooks for a phase
   */
  async executeAfterHooks<TContext extends BaseContext, TResult = unknown>(
    phaseName: string,
    context: TContext,
    result: PhaseResult<TResult>
  ): Promise<void> {
    const hooks = this.afterHooks.get(phaseName) || []
    
    for (const hook of hooks) {
      await hook(context, result)
    }
  }
  
  /**
   * Check if phase has a replacement hook
   */
  hasReplacement(phaseName: string): boolean {
    return this.replaceHooks.has(phaseName)
  }
  
  /**
   * Get replacement hook for phase
   */
  getReplacement<TContext extends BaseContext, TResult = unknown>(
    phaseName: string
  ): ReplacePhaseHook<TContext, TResult> | undefined {
    return this.replaceHooks.get(phaseName)
  }
  
  /**
   * Execute error hooks
   */
  async executeErrorHooks(
    phaseName: string,
    error: Error,
    context: BaseContext
  ): Promise<void> {
    for (const hook of this.errorHooks) {
      try {
        await hook(phaseName, error, context)
      } catch (hookError) {
        // Don't let error hooks fail the error handling
        console.error(`Error in error hook: ${hookError}`)
      }
    }
  }
  
  /**
   * Clear all hooks (useful for testing)
   */
  clear(): void {
    this.beforeHooks.clear()
    this.afterHooks.clear()
    this.replaceHooks.clear()
    this.errorHooks = []
  }
  
  /**
   * Get statistics about registered hooks
   */
  getStats(): {
    beforeHooks: Map<string, number>
    afterHooks: Map<string, number>
    replacementHooks: string[]
    errorHooks: number
  } {
    return {
      beforeHooks: new Map(
        Array.from(this.beforeHooks.entries()).map(([phase, hooks]) => [phase, hooks.length])
      ),
      afterHooks: new Map(
        Array.from(this.afterHooks.entries()).map(([phase, hooks]) => [phase, hooks.length])
      ),
      replacementHooks: Array.from(this.replaceHooks.keys()),
      errorHooks: this.errorHooks.length
    }
  }
}

// ============================================================================
// GLOBAL HOOK REGISTRY (Singleton)
// ============================================================================

let globalRegistry: PhaseHookRegistry | null = null

/**
 * Get global hook registry (creates if doesn't exist)
 */
export function getHookRegistry(): PhaseHookRegistry {
  if (!globalRegistry) {
    globalRegistry = new PhaseHookRegistry()
  }
  return globalRegistry
}

/**
 * Reset global hook registry (for testing)
 */
export function resetHookRegistry(): void {
  globalRegistry = null
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Register a before hook on global registry
 */
export function beforePhase<TContext extends BaseContext>(
  phaseName: string,
  hook: BeforePhaseHook<TContext>
): void {
  getHookRegistry().beforePhase(phaseName, hook)
}

/**
 * Register an after hook on global registry
 */
export function afterPhase<TContext extends BaseContext, TResult = unknown>(
  phaseName: string,
  hook: AfterPhaseHook<TContext, TResult>
): void {
  getHookRegistry().afterPhase(phaseName, hook)
}

/**
 * Replace a phase on global registry
 */
export function replacePhase<TContext extends BaseContext, TResult = unknown>(
  phaseName: string,
  hook: ReplacePhaseHook<TContext, TResult>
): void {
  getHookRegistry().replacePhase(phaseName, hook)
}

/**
 * Wrap a phase on global registry
 */
export function wrapPhase<TContext extends BaseContext, TResult = unknown>(
  phaseName: string,
  hooks: WrapPhaseHook<TContext, TResult>
): void {
  getHookRegistry().wrapPhase(phaseName, hooks)
}

/**
 * Register error hook on global registry
 */
export function onError(hook: ErrorHook): void {
  getHookRegistry().onError(hook)
}

