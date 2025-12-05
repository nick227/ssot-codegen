import { createQueryHook } from '../factories/useQueryFactory'
import type { ProfileSummary } from './useProfileSummary'

export interface MatchSummary extends ProfileSummary {
  matchId: string
  matchedAt: Date
  lastMessage?: {
    content: string
    sentAt: Date
    senderId: string
  }
  unreadCount?: number
}

/**
 * Matches Query Hook
 * 
 * Fetches user matches
 * Uses declarative query factory - only 5 lines!
 */
const useMatchesBase = createQueryHook({
  key: (params: { userId: string; sortOption: 'compatibility' | 'recent' | 'name' }) => 
    ['matches', params.userId, params.sortOption],
  fetcher: async (sdk, params: { userId: string; sortOption: 'compatibility' | 'recent' | 'name' }) => {
    // TODO: Use Match service endpoint when available
    // For now, return empty array as placeholder
    return []
  },
  transformer: () => [] as MatchSummary[],
  staleTime: 2 * 60 * 1000, // 2 minutes
  enabled: (params: { userId: string; sortOption: 'compatibility' | 'recent' | 'name' }) => !!params.userId,
})

export function useMatches(userId: string, sortOption: 'compatibility' | 'recent' | 'name' = 'compatibility') {
  return useMatchesBase({ userId, sortOption })
}

