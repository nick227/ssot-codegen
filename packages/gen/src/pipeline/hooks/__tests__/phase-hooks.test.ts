/**
 * Phase Hooks System - Tests
 * 
 * Verifies hook registration, execution, and type safety
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PhaseHookRegistry } from '../phase-hooks.js'
import type { BaseContext } from '@/pipeline/typed-context.js'
import type { PhaseResult } from '@/pipeline/phase-runner.js'

describe('PhaseHookRegistry', () => {
  let registry: PhaseHookRegistry
  let mockContext: BaseContext
  
  beforeEach(() => {
    registry = new PhaseHookRegistry()
    mockContext = {
      config: { schemaPath: './test.prisma' },
      logger: {
        debug: () => {},
        error: () => {}
      } as any
    }
  })
  
  describe('beforePhase', () => {
    it('registers and executes before hooks', async () => {
      let executed = false
      
      registry.beforePhase('parseSchema', async (ctx) => {
        executed = true
        expect(ctx).toBe(mockContext)
      })
      
      await registry.executeBeforeHooks('parseSchema', mockContext)
      
      expect(executed).toBe(true)
    })
    
    it('executes multiple hooks in order', async () => {
      const order: number[] = []
      
      registry.beforePhase('generateCode', async () => order.push(1))
      registry.beforePhase('generateCode', async () => order.push(2))
      registry.beforePhase('generateCode', async () => order.push(3))
      
      await registry.executeBeforeHooks('generateCode', mockContext)
      
      expect(order).toEqual([1, 2, 3])
    })
  })
  
  describe('afterPhase', () => {
    it('registers and executes after hooks', async () => {
      let executedContext: any
      let executedResult: any
      
      const mockResult: PhaseResult = {
        success: true,
        filesGenerated: 5
      }
      
      registry.afterPhase('writeFiles', async (ctx, result) => {
        executedContext = ctx
        executedResult = result
      })
      
      await registry.executeAfterHooks('writeFiles', mockContext, mockResult)
      
      expect(executedContext).toBe(mockContext)
      expect(executedResult).toBe(mockResult)
      expect(executedResult.filesGenerated).toBe(5)
    })
    
    it('passes phase result to hooks', async () => {
      const mockResult: PhaseResult = {
        success: true,
        data: { custom: 'data' },
        filesGenerated: 10
      }
      
      registry.afterPhase('generateCode', async (ctx, result) => {
        expect(result.success).toBe(true)
        expect(result.filesGenerated).toBe(10)
        expect(result.data).toEqual({ custom: 'data' })
      })
      
      await registry.executeAfterHooks('generateCode', mockContext, mockResult)
    })
  })
  
  describe('replacePhase', () => {
    it('registers replacement hook', () => {
      registry.replacePhase('generateCode', async (ctx) => {
        return { success: true }
      })
      
      expect(registry.hasReplacement('generateCode')).toBe(true)
    })
    
    it('retrieves replacement hook', () => {
      const hook = async (ctx: BaseContext) => ({ success: true })
      
      registry.replacePhase('parseSchema', hook)
      
      const retrieved = registry.getReplacement('parseSchema')
      expect(retrieved).toBe(hook)
    })
    
    it('throws when replacing already-replaced phase', () => {
      registry.replacePhase('generateCode', async () => ({ success: true }))
      
      expect(() => {
        registry.replacePhase('generateCode', async () => ({ success: true }))
      }).toThrow('already has a replacement')
    })
  })
  
  describe('wrapPhase', () => {
    it('registers both before and after hooks', async () => {
      const calls: string[] = []
      
      registry.wrapPhase('generateCode', {
        before: async () => calls.push('before'),
        after: async () => calls.push('after')
      })
      
      await registry.executeBeforeHooks('generateCode', mockContext)
      calls.push('phase')
      await registry.executeAfterHooks('generateCode', mockContext, { success: true })
      
      expect(calls).toEqual(['before', 'phase', 'after'])
    })
    
    it('allows only before or only after', async () => {
      const calls: string[] = []
      
      registry.wrapPhase('writeFiles', {
        before: async () => calls.push('before')
      })
      
      await registry.executeBeforeHooks('writeFiles', mockContext)
      expect(calls).toEqual(['before'])
    })
  })
  
  describe('onError', () => {
    it('registers and executes error hooks', async () => {
      let capturedPhase = ''
      let capturedError: Error | null = null
      
      registry.onError(async (phase, error) => {
        capturedPhase = phase
        capturedError = error
      })
      
      const testError = new Error('Test error')
      await registry.executeErrorHooks('generateCode', testError, mockContext)
      
      expect(capturedPhase).toBe('generateCode')
      expect(capturedError).toBe(testError)
    })
    
    it('executes multiple error hooks', async () => {
      const calls: number[] = []
      
      registry.onError(async () => calls.push(1))
      registry.onError(async () => calls.push(2))
      
      await registry.executeErrorHooks('test', new Error(), mockContext)
      
      expect(calls).toEqual([1, 2])
    })
    
    it('continues if error hook throws', async () => {
      const calls: number[] = []
      
      registry.onError(async () => {
        calls.push(1)
        throw new Error('Hook error')
      })
      registry.onError(async () => calls.push(2))
      
      // Should not throw, both hooks should run
      await registry.executeErrorHooks('test', new Error(), mockContext)
      
      expect(calls).toEqual([1, 2])
    })
  })
  
  describe('clear', () => {
    it('removes all hooks', () => {
      registry.beforePhase('test', async () => {})
      registry.afterPhase('test', async () => {})
      registry.replacePhase('test', async () => ({ success: true }))
      registry.onError(async () => {})
      
      registry.clear()
      
      const stats = registry.getStats()
      expect(stats.beforeHooks.size).toBe(0)
      expect(stats.afterHooks.size).toBe(0)
      expect(stats.replacementHooks.length).toBe(0)
      expect(stats.errorHooks).toBe(0)
    })
  })
  
  describe('getStats', () => {
    it('returns hook statistics', () => {
      registry.beforePhase('parseSchema', async () => {})
      registry.beforePhase('parseSchema', async () => {})
      registry.afterPhase('generateCode', async () => {})
      registry.replacePhase('writeFiles', async () => ({ success: true }))
      registry.onError(async () => {})
      registry.onError(async () => {})
      
      const stats = registry.getStats()
      
      expect(stats.beforeHooks.get('parseSchema')).toBe(2)
      expect(stats.afterHooks.get('generateCode')).toBe(1)
      expect(stats.replacementHooks).toEqual(['writeFiles'])
      expect(stats.errorHooks).toBe(2)
    })
  })
})

describe('Hook Type Safety', () => {
  it('enforces correct context types', () => {
    const registry = new PhaseHookRegistry()
    
    // This demonstrates type safety at compile time
    // Uncomment to see TypeScript errors:
    
    // ❌ Wrong context type
    // registry.beforePhase<BaseContext>('parseSchema', async (context) => {
    //   const schema = context.schema
    //   //                      ^^^^^^ Compile error! schema doesn't exist in BaseContext
    // })
    
    // ✅ Correct context type
    registry.beforePhase('parseSchema', async (context) => {
      // context has correct type based on phase
    })
  })
})

