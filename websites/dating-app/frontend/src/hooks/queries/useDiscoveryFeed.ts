import { createQueryHook } from '../factories/useQueryFactory'
import { transformToProfileSummary } from '../../utils/profile'
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

/**
 * Discovery Feed Query Hook
 * 
 * Fetches discovery feed with filters and priorities
 * Uses declarative query factory - only 10 lines!
 */
export const useDiscoveryFeed = createQueryHook({
  key: (params: { userId: string; filters: DiscoveryFilters; priorities: DiscoveryPriorities }) => 
    ['discovery-feed', params.userId, params.filters, params.priorities],
  fetcher: async (sdk, params: { userId: string; filters: DiscoveryFilters; priorities: DiscoveryPriorities }) => {
    // TODO: Use Discovery service endpoint when available
    // For now, fetch profiles directly
    const profiles = await sdk.profile.list({
      take: 20,
      where: {
        ...(params.filters.ageMin && { age: { gte: params.filters.ageMin } }),
        ...(params.filters.ageMax && { age: { lte: params.filters.ageMax } }),
        ...(params.filters.gender && { gender: params.filters.gender }),
      },
    })
    return profiles
  },
  transformer: (data: unknown) => {
    const profiles = data as { data: Array<{
      id: string
      userId: string
      name: string
      age: number
      location?: string | null
      bio?: string | null
    }> }
    
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
  enabled: (params: { userId: string; filters: DiscoveryFilters; priorities: DiscoveryPriorities }) => !!params.userId,
})

// Wrapper to match existing API (takes separate params)
const useDiscoveryFeedBase = createQueryHook({
  key: (params: { userId: string; filters: DiscoveryFilters; priorities: DiscoveryPriorities }) => 
    ['discovery-feed', params.userId, params.filters, params.priorities],
  fetcher: async (sdk, params: { userId: string; filters: DiscoveryFilters; priorities: DiscoveryPriorities }) => {
    // TODO: Use Discovery service endpoint when available
    // For now, fetch profiles directly
    const profiles = await sdk.profile.list({
      take: 20,
      where: {
        ...(params.filters.ageMin && { age: { gte: params.filters.ageMin } }),
        ...(params.filters.ageMax && { age: { lte: params.filters.ageMax } }),
        ...(params.filters.gender && { gender: params.filters.gender }),
      },
    })
    return profiles
  },
  transformer: (data: unknown) => {
    const profiles = data as { data: Array<{
      id: string
      userId: string
      name: string
      age: number
      location?: string | null
      bio?: string | null
    }> }
    
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
  enabled: (params: { userId: string; filters: DiscoveryFilters; priorities: DiscoveryPriorities }) => !!params.userId,
})

export function useDiscoveryFeed(
  userId: string,
  filters: DiscoveryFilters = {},
  priorities: DiscoveryPriorities = {}
) {
  return useDiscoveryFeedBase({ userId, filters, priorities })
}

