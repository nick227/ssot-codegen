import { useQuery } from '@tanstack/react-query'
import { useSDK } from '../contexts/SDKContext'
import { transformToProfileSummary } from '../utils/profile'

export interface ProfileSummary {
  id: string
  userId: string
  name: string
  age: number
  distance?: number
  primaryPhoto?: string
  compatibilityScore?: number
  badges?: Array<{ id: string; label: string; color?: string }>
  topDimensions?: Array<{ id: string; label: string; score: number }>
  location?: string
  bio?: string
}

export function useProfileSummary(userId: string) {
  const sdk = useSDK()

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const profile = await sdk.profile.get(userId)
      
      // TODO: Fetch compatibility score if needed
      // TODO: Fetch primary photo from photos
      
      return transformToProfileSummary({
        id: profile.id,
        userId: profile.userId,
        name: profile.name,
        age: profile.age,
        location: profile.location,
        bio: profile.bio,
        primaryPhoto: undefined, // TODO: Fetch from photos
        compatibilityScore: undefined, // TODO: Fetch from compatibility service
      })
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

