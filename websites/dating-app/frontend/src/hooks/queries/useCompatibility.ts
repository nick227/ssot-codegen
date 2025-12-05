import { createQueryHook } from '../factories/useQueryFactory'

export interface CompatibilityBreakdownItem {
  dimensionId: string
  dimensionName: string
  score: number
  weight?: number
}

export interface CompatibilityData {
  overallScore: number
  breakdown: CompatibilityBreakdownItem[]
  userId1: string
  userId2: string
}

/**
 * Compatibility Query Hook
 * 
 * Fetches compatibility score between two users
 * Uses declarative query factory - only 8 lines!
 */
export const useCompatibility = createQueryHook({
  key: (userId1: string, userId2: string) => ['compatibility', userId1, userId2],
  fetcher: async (sdk, params: { userId1: string; userId2: string }) => {
    const score = await sdk.compatibilityscore.findOne({
      OR: [
        { userId1: params.userId1, userId2: params.userId2 },
        { userId1: params.userId2, userId2: params.userId1 },
      ],
    })
    return { score, ...params }
  },
  transformer: (data: unknown) => {
    const { score, userId1, userId2 } = data as {
      score: { score: number | null; userId1: string; userId2: string } | null
      userId1: string
      userId2: string
    }
    
    if (!score) {
      return {
        overallScore: 0,
        breakdown: [],
        userId1,
        userId2,
      } as CompatibilityData
    }
    
    return {
      overallScore: score.score || 0,
      breakdown: [], // TODO: Fetch breakdown from compatibility service
      userId1: score.userId1,
      userId2: score.userId2,
    } as CompatibilityData
  },
  enabled: (params: { userId1: string; userId2: string }) => 
    !!params.userId1 && !!params.userId2 && params.userId1 !== params.userId2,
})

// Wrapper to match existing API (takes two separate params)
const useCompatibilityBase = createQueryHook({
  key: (params: { userId1: string; userId2: string }) => ['compatibility', params.userId1, params.userId2],
  fetcher: async (sdk, params: { userId1: string; userId2: string }) => {
    const score = await sdk.compatibilityscore.findOne({
      OR: [
        { userId1: params.userId1, userId2: params.userId2 },
        { userId1: params.userId2, userId2: params.userId1 },
      ],
    })
    return { score, ...params }
  },
  transformer: (data: unknown) => {
    const { score, userId1, userId2 } = data as {
      score: { score: number | null; userId1: string; userId2: string } | null
      userId1: string
      userId2: string
    }
    
    if (!score) {
      return {
        overallScore: 0,
        breakdown: [],
        userId1,
        userId2,
      } as CompatibilityData
    }
    
    return {
      overallScore: score.score || 0,
      breakdown: [], // TODO: Fetch breakdown from compatibility service
      userId1: score.userId1,
      userId2: score.userId2,
    } as CompatibilityData
  },
  enabled: (params: { userId1: string; userId2: string }) => 
    !!params.userId1 && !!params.userId2 && params.userId1 !== params.userId2,
})

export function useCompatibility(userId1: string, userId2: string) {
  return useCompatibilityBase({ userId1, userId2 })
}

