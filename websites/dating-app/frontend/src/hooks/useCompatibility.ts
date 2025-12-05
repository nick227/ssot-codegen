import { useQuery } from '@tanstack/react-query'
import { useSDK } from '../contexts/SDKContext'

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

export function useCompatibility(userId1: string, userId2: string) {
  const sdk = useSDK()

  return useQuery({
    queryKey: ['compatibility', userId1, userId2],
    queryFn: async () => {
      // Fetch compatibility score
      const score = await sdk.compatibilityscore.findOne({
        OR: [
          { userId1, userId2 },
          { userId1: userId2, userId2: userId1 },
        ],
      })

      if (!score) {
        // Return default if no score exists yet
        return {
          overallScore: 0,
          breakdown: [],
          userId1,
          userId2,
        } as CompatibilityData
      }

      // TODO: Fetch dimension breakdown when available
      // For now, return basic compatibility data
      return {
        overallScore: score.score || 0,
        breakdown: [], // TODO: Fetch breakdown from compatibility service
        userId1: score.userId1,
        userId2: score.userId2,
      } as CompatibilityData
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId1 && !!userId2 && userId1 !== userId2,
  })
}
