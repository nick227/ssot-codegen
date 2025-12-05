import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListView } from '../components/layout/ListView'
import { Card } from '../components/ui/Card'
import { CompatibilityBadge } from '../components/compatibility/CompatibilityBadge'
import { Badge } from '../components/ui/Badge'
import { MediaLoader } from '../components/ui/MediaLoader'
import { ButtonGroup } from '../components/ui/ButtonGroup'
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { useMatches } from '../hooks/useMatches'
import { useEmitBehaviorEvent } from '../hooks/useEmitBehaviorEvent'
import { useCurrentUserId } from '../contexts/AuthContext'
import { getProfilePhotos, formatProfileLocation } from '../utils/profile'
import type { MatchSummary } from '../hooks/useMatches'

export default function MatchesPage() {
  const navigate = useNavigate()
  const [sortOption, setSortOption] = useState<'compatibility' | 'recent' | 'name'>('compatibility')
  const currentUserId = useCurrentUserId()
  
  const { data: matches = [], isLoading } = useMatches(currentUserId, sortOption)
  const emitEvent = useEmitBehaviorEvent()

  const handleMatchClick = (match: MatchSummary) => {
    emitEvent({
      eventType: 'match_view',
      targetType: 'match',
      targetId: match.matchId,
      meta: { match_meta: match },
    })
    navigate(`/messages?matchId=${match.matchId}`)
  }

  const renderMatchCard = (match: MatchSummary) => {
    const photos = getProfilePhotos(match)
    
    return (
      <Card
        key={match.matchId}
        variant="match"
        onClick={() => handleMatchClick(match)}
        className="flex gap-4 p-4"
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          <MediaLoader variant="single" images={photos} className="w-16 h-16 rounded-full" />
        </div>

        {/* Match Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate">{match.name}</h3>
              <p className="text-sm text-gray-600">
                {formatProfileLocation(match)}
              </p>
            </div>
            {match.compatibilityScore !== undefined && (
              <CompatibilityBadge variant="small" score={match.compatibilityScore} />
            )}
          </div>

          {/* Last Message Preview */}
          {match.lastMessage && (
            <p className="text-sm text-gray-600 truncate mb-1">
              {match.lastMessage.content}
            </p>
          )}

          {/* Match Date & Unread */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Matched {new Date(match.matchedAt).toLocaleDateString()}
            </span>
            {match.unreadCount && match.unreadCount > 0 && (
              <Badge variant="unread" size="small">
                {match.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </Card>
    )
  }

  const sortOptions = [
    { id: 'compatibility', label: 'Compatibility' },
    { id: 'recent', label: 'Recent' },
    { id: 'name', label: 'Name' },
  ] as const

  return (
    <PageStateHandler
      isLoading={isLoading}
      isEmpty={!matches || matches.length === 0}
      emptyMessage="No matches yet"
      emptySubMessage="Keep swiping to find matches!"
      loadingComponent={
        <div className="p-4 space-y-4">
          <LoadingSkeleton variant="card-list" count={3} />
        </div>
      }
      className="p-4 space-y-4"
    >
      {/* Sort Options */}
      <div className="flex justify-end">
        <ButtonGroup
          variant="actions"
          items={sortOptions}
          activeId={sortOption}
          onChange={(id) => setSortOption(id as typeof sortOption)}
        />
      </div>

      {/* Matches List */}
      <ListView
        items={matches}
        renderItem={renderMatchCard}
      />
    </PageStateHandler>
  )
}
