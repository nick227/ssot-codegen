import { createQueryHook } from '../factories/useQueryFactory'
import { transformToProfileSummary } from '../../utils/profile'

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

/**
 * Profile Summary Query Hook
 * 
 * Fetches and transforms profile data for display
 * Uses declarative query factory - only 5 lines!
 */
export const useProfileSummary = createQueryHook({
  key: (userId: string) => ['profile', userId],
  fetcher: async (sdk, userId: string) => {
    const profile = await sdk.profile.get(userId)
    return profile
  },
  transformer: (data: unknown) => {
    const profile = data as {
      id: string
      userId: string
      name: string
      age: number
      location?: string | null
      bio?: string | null
    }
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
  enabled: (userId: string) => !!userId,
})
