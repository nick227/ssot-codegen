import { createQueryHook } from '../factories/useQueryFactory'

export interface UserDimension {
  id: string
  dimensionId: string
  dimensionName: string
  score: number
  normalizedScore: number
  category: 'profile' | 'quiz' | 'behavior' | 'system'
}

/**
 * User Dimensions Query Hook
 * 
 * Fetches user dimension scores with dimension details
 * Uses declarative query factory - only 5 lines!
 */
export const useUserDimensions = createQueryHook({
  key: (userId: string) => ['user-dimensions', userId],
  fetcher: async (sdk, userId: string) => {
    const scores = await sdk.userdimensionscore.list({
      where: { userId },
      include: { dimension: true },
    })
    return scores
  },
  transformer: (data: unknown) => {
    const scores = data as Array<{
      id: string
      dimensionId: string
      rawScore: number | null
      normalizedScore: number | null
      dimension?: { name: string; category: string } | null
    }>
    
    return scores.map((score) => ({
      id: score.id,
      dimensionId: score.dimensionId,
      dimensionName: score.dimension?.name || '',
      score: score.rawScore || 0,
      normalizedScore: score.normalizedScore || 0,
      category: (score.dimension?.category || 'profile') as UserDimension['category'],
    })) as UserDimension[]
  },
})

