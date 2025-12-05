import { useQuery } from '@tanstack/react-query'
import { useSDK } from '../contexts/SDKContext'

export interface UserDimension {
  id: string
  dimensionId: string
  dimensionName: string
  score: number
  normalizedScore: number
  category: 'profile' | 'quiz' | 'behavior' | 'system'
}

export function useUserDimensions(userId: string) {
  const sdk = useSDK()

  return useQuery({
    queryKey: ['user-dimensions', userId],
    queryFn: async () => {
      const scores = await sdk.userdimensionscore.list({
        where: { userId },
        include: { dimension: true },
      })

      return scores.map((score) => ({
        id: score.id,
        dimensionId: score.dimensionId,
        dimensionName: score.dimension?.name || '',
        score: score.rawScore || 0,
        normalizedScore: score.normalizedScore || 0,
        category: (score.dimension?.category || 'profile') as UserDimension['category'],
      })) as UserDimension[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

