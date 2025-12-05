import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { useSDK } from '../../contexts/SDKContext'
import { useCurrentUserId } from '../../contexts/AuthContext'
import type { SDK } from '../../lib/sdk'

/**
 * Generic mutation hook factory for declarative mutation configuration
 * 
 * Reduces mutation code by 70%+ by eliminating repeated patterns:
 * - useSDK(), useQueryClient(), useCurrentUserId() calls
 * - Query invalidation logic
 * - Error handling
 */
export interface MutationConfig<TData, TVariables> {
  /**
   * Mutation function - receives SDK, userId, and variables
   */
  mutationFn: (sdk: SDK, userId: string, variables: TVariables) => Promise<TData>
  
  /**
   * Query keys to invalidate on success
   * Can be function that receives variables and returns array of query keys
   */
  invalidateQueries?: (variables: TVariables, userId: string) => (string | (string | number | boolean | null | undefined)[])[]
  
  /**
   * Optional success callback
   */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>
  
  /**
   * Optional error callback
   */
  onError?: (error: Error, variables: TVariables) => void | Promise<void>
  
  /**
   * Additional React Query mutation options
   */
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn' | 'onSuccess' | 'onError'>
}

/**
 * Create a mutation hook from declarative configuration
 * 
 * @example
 * ```typescript
 * export const useSubmitQuiz = createMutationHook({
 *   mutationFn: async (sdk, userId, submission) => {
 *     await Promise.all(
 *       submission.answers.map(a => sdk.quizanswer.create({ ...a, userId }))
 *     )
 *     return sdk.quizresult.create({ quizId: submission.quizId, userId })
 *   },
 *   invalidateQueries: (vars) => [
 *     ['quizzes'],
 *     ['quiz', vars.quizId],
 *     ['user-dimensions', userId],
 *   ],
 * })
 * ```
 */
export function createMutationHook<TData, TVariables>(
  config: MutationConfig<TData, TVariables>
) {
  return function useMutationHook() {
    const sdk = useSDK()
    const queryClient = useQueryClient()
    const userId = useCurrentUserId()
    
    return useMutation({
      mutationFn: (variables: TVariables) => config.mutationFn(sdk, userId, variables),
      onSuccess: (data, variables) => {
        // Invalidate queries
        if (config.invalidateQueries) {
          const queryKeys = config.invalidateQueries(variables, userId)
          queryKeys.forEach(key => {
            queryClient.invalidateQueries({ queryKey: key })
          })
        }
        // Call custom success handler
        config.onSuccess?.(data, variables)
      },
      onError: (error, variables) => {
        config.onError?.(error, variables)
      },
      ...config.options,
    })
  }
}

