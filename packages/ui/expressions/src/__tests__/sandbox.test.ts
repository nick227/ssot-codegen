/**
 * Expression Sandbox Tests
 * 
 * Tests security boundaries for expression evaluation.
 */

import { describe, test, expect } from 'vitest'
import {
  SafeEvaluator,
  createSafeEvaluator,
  evaluateSafe,
  BudgetExceededError,
  SecurityError,
  DEFAULT_BUDGET
} from '../sandbox.js'
import type { ExpressionContext } from '../types.js'

const mockContext: ExpressionContext = {
  data: { value: 42, name: 'Test' },
  user: { id: 'user-123', roles: ['user'] },
  params: {},
  globals: {}
}

describe('SafeEvaluator', () => {
  describe('basic evaluation', () => {
    test('evaluates safe expressions', () => {
      const evaluator = createSafeEvaluator()
      
      const result = evaluator.evaluate(
        {
          type: 'operation',
          op: 'add',
          args: [
            { type: 'literal', value: 5 },
            { type: 'literal', value: 3 }
          ]
        },
        mockContext
      )
      
      expect(result).toBe(8)
    })
    
    test('evaluates field access', () => {
      const evaluator = createSafeEvaluator()
      
      const result = evaluator.evaluate(
        { type: 'field', path: 'value' },
        mockContext
      )
      
      expect(result).toBe(42)
    })
    
    test('evaluates conditions', () => {
      const evaluator = createSafeEvaluator()
      
      const result = evaluator.evaluate(
        {
          type: 'condition',
          op: 'eq',
          left: { type: 'literal', value: 5 },
          right: { type: 'literal', value: 5 }
        },
        mockContext
      )
      
      expect(result).toBe(true)
    })
  })
  
  describe('timeout protection', () => {
    test('throws error when timeout exceeded', () => {
      const evaluator = createSafeEvaluator({
        timeout: 1,  // 1ms timeout (very short)
        maxDepth: 200  // High depth so timeout hits first
      })
      
      // Create deeply nested expression that will timeout
      let expr: any = { type: 'literal', value: 1 }
      for (let i = 0; i < 100; i++) {
        expr = {
          type: 'operation',
          op: 'add',
          args: [expr, { type: 'literal', value: 1 }]
        }
      }
      
      expect(() => {
        evaluator.evaluate(expr, mockContext)
      }).toThrow(/timeout|depth/i)  // Either timeout or depth limit
    })
  })
  
  describe('operation count protection', () => {
    test('throws error when max operations exceeded', () => {
      const evaluator = createSafeEvaluator({
        maxOperations: 3,  // Very low limit
        maxDepth: 50  // Sufficient depth
      })
      
      // Create expression with exactly 4 operations (exceeds limit of 3)
      const expr = {
        type: 'operation',
        op: 'add',
        args: [
          { type: 'literal', value: 1 },
          {
            type: 'operation',
            op: 'add',
            args: [
              { type: 'literal', value: 1 },
              {
                type: 'operation',
                op: 'add',
                args: [
                  { type: 'literal', value: 1 },
                  {
                    type: 'operation',
                    op: 'add',
                    args: [
                      { type: 'literal', value: 1 },
                      { type: 'literal', value: 1 }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
      
      expect(() => {
        evaluator.evaluate(expr, mockContext)
      }).toThrow(BudgetExceededError)
    })
  })
  
  describe('depth protection', () => {
    test('enforces max depth via evaluator', () => {
      const evaluator = createSafeEvaluator({
        maxDepth: 3
      })
      
      // Create deeply nested expression
      let expr: any = { type: 'literal', value: 1 }
      for (let i = 0; i < 10; i++) {
        expr = {
          type: 'operation',
          op: 'add',
          args: [expr, { type: 'literal', value: 1 }]
        }
      }
      
      expect(() => {
        evaluator.evaluate(expr, mockContext)
      }).toThrow(/depth/i)
    })
  })
  
  describe('operation whitelist', () => {
    test('allows whitelisted operations', () => {
      const evaluator = createSafeEvaluator({
        allowedOperations: new Set(['add', 'multiply'])
      })
      
      const result = evaluator.evaluate(
        {
          type: 'operation',
          op: 'add',
          args: [
            { type: 'literal', value: 5 },
            { type: 'literal', value: 3 }
          ]
        },
        mockContext
      )
      
      expect(result).toBe(8)
    })
    
    test('blocks non-whitelisted operations', () => {
      const evaluator = createSafeEvaluator({
        allowedOperations: new Set(['add'])
      })
      
      expect(() => {
        evaluator.evaluate(
          {
            type: 'operation',
            op: 'concat',  // Not in whitelist
            args: [
              { type: 'literal', value: 'hello' },
              { type: 'literal', value: 'world' }
            ]
          },
          mockContext
        )
      }).toThrow(SecurityError)
      
      expect(() => {
        evaluator.evaluate(
          {
            type: 'operation',
            op: 'concat',
            args: []
          },
          mockContext
        )
      }).toThrow(/not allowed/i)
    })
  })
  
  describe('dangerous property protection', () => {
    test('blocks access to __proto__', () => {
      const evaluator = createSafeEvaluator()
      
      expect(() => {
        evaluator.evaluate(
          { type: 'field', path: '__proto__' },
          mockContext
        )
      }).toThrow(SecurityError)
    })
    
    test('blocks access to constructor', () => {
      const evaluator = createSafeEvaluator()
      
      expect(() => {
        evaluator.evaluate(
          { type: 'field', path: 'constructor' },
          mockContext
        )
      }).toThrow(SecurityError)
    })
    
    test('blocks access to prototype', () => {
      const evaluator = createSafeEvaluator()
      
      expect(() => {
        evaluator.evaluate(
          { type: 'field', path: 'prototype' },
          mockContext
        )
      }).toThrow(SecurityError)
    })
    
    test('blocks access to process', () => {
      const evaluator = createSafeEvaluator()
      
      expect(() => {
        evaluator.evaluate(
          { type: 'field', path: 'process.env' },
          mockContext
        )
      }).toThrow(SecurityError)
    })
    
    test('blocks access to global', () => {
      const evaluator = createSafeEvaluator()
      
      expect(() => {
        evaluator.evaluate(
          { type: 'field', path: 'global.process' },
          mockContext
        )
      }).toThrow(SecurityError)
    })
    
    test('blocks access to require', () => {
      const evaluator = createSafeEvaluator()
      
      expect(() => {
        evaluator.evaluate(
          { type: 'field', path: 'require' },
          mockContext
        )
      }).toThrow(SecurityError)
    })
    
    test('allows safe field access', () => {
      const evaluator = createSafeEvaluator()
      
      const result = evaluator.evaluate(
        { type: 'field', path: 'name' },
        mockContext
      )
      
      expect(result).toBe('Test')
    })
    
    test('allows safe nested field access', () => {
      const context: ExpressionContext = {
        data: { user: { profile: { name: 'John' } } },
        user: { id: '1', roles: [] },
        params: {},
        globals: {}
      }
      
      const evaluator = createSafeEvaluator()
      
      const result = evaluator.evaluate(
        { type: 'field', path: 'user.profile.name' },
        context
      )
      
      expect(result).toBe('John')
    })
  })
  
  describe('context freezing', () => {
    test('prevents mutation of context.data', () => {
      const context: ExpressionContext = {
        data: { value: 42 },
        user: { id: '1', roles: [] },
        params: {},
        globals: {}
      }
      
      const evaluator = createSafeEvaluator()
      evaluator.evaluate({ type: 'field', path: 'value' }, context)
      
      // Original context should not be mutated
      expect(context.data).toEqual({ value: 42 })
    })
    
    test('prevents mutation of context.user', () => {
      const context: ExpressionContext = {
        data: {},
        user: { id: '1', roles: ['user'] },
        params: {},
        globals: {}
      }
      
      const evaluator = createSafeEvaluator()
      evaluator.evaluate({ type: 'field', path: 'user.id' }, context)
      
      // Original context should not be mutated
      expect(context.user).toEqual({ id: '1', roles: ['user'] })
    })
  })
  
  describe('convenience functions', () => {
    test('createSafeEvaluator creates evaluator with custom budget', () => {
      const evaluator = createSafeEvaluator({
        maxDepth: 5,
        maxOperations: 50
      })
      
      expect(evaluator).toBeInstanceOf(SafeEvaluator)
    })
    
    test('evaluateSafe evaluates with default budget', () => {
      const result = evaluateSafe(
        {
          type: 'operation',
          op: 'add',
          args: [
            { type: 'literal', value: 10 },
            { type: 'literal', value: 20 }
          ]
        },
        mockContext
      )
      
      expect(result).toBe(30)
    })
  })
  
  describe('default budget', () => {
    test('has reasonable defaults', () => {
      expect(DEFAULT_BUDGET.maxDepth).toBe(10)
      expect(DEFAULT_BUDGET.maxOperations).toBe(100)
      expect(DEFAULT_BUDGET.timeout).toBe(100)
    })
  })
})

