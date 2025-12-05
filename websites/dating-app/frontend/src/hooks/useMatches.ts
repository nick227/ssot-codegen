import { useQuery } from '@tanstack/react-query'
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

export function useMatches(userId: string, _sortOption: 'compatibility' | 'recent' | 'name' = 'compatibility') {
  return useQuery({
    queryKey: ['matches', userId, _sortOption],
    queryFn: async () => {
      // TODO: Use Match service endpoint when available
      // For now, return empty array as placeholder
      // Match model exists in schema but SDK client not generated yet
      
      // Temporary: Return empty matches until Match service is implemented
      // Once Match routes are added, update this to:
      // const matches = await sdk.match.list({ where: { OR: [{ user1Id: userId }, { user2Id: userId }] } })
      
      return [] as MatchSummary[]
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!userId,
  })
}
