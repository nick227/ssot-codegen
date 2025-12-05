import { useQuery } from '@tanstack/react-query'
import { useSDK } from '../contexts/SDKContext'
import { transformToProfileSummary } from '../utils/profile'
import type { ProfileSummary } from './useProfileSummary'

export interface DiscoveryFilters {
  ageMin?: number
  ageMax?: number
  location?: string
  gender?: string
  [key: string]: unknown
}

export interface DiscoveryPriorities {
  [dimensionId: string]: number
}

export function useDiscoveryFeed(
  userId: string,
  filters: DiscoveryFilters = {},
  priorities: DiscoveryPriorities = {}
) {
  const sdk = useSDK()

  return useQuery({
    queryKey: ['discovery-feed', userId, filters, priorities],
    queryFn: async () => {
      // TODO: Use Discovery service endpoint when available
      // For now, fetch profiles directly
      // Once Discovery service is implemented, use:
      // const result = await sdk.discoveryService.getFeed({ userId, filters, priorities })
      
      const profiles = await sdk.profile.list({
        take: 20,
        where: {
          // Apply basic filters
          ...(filters.ageMin && { age: { gte: filters.ageMin } }),
          ...(filters.ageMax && { age: { lte: filters.ageMax } }),
          ...(filters.gender && { gender: filters.gender }),
        },
      })

      return profiles.data.map((profile) =>
        transformToProfileSummary({
          id: profile.id,
          userId: profile.userId,
          name: profile.name,
          age: profile.age,
          location: profile.location,
          bio: profile.bio,
          primaryPhoto: undefined, // TODO: Fetch from photos
          compatibilityScore: undefined, // TODO: Calculate compatibility
        })
      ) as ProfileSummary[]
    },
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!userId,
  })
}
