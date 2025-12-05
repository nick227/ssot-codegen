import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CardStack } from '../components/layout/CardStack'
import { Card } from '../components/ui/Card'
import { CompatibilityBadge } from '../components/compatibility/CompatibilityBadge'
import { BadgeGroup } from '../components/ui/BadgeGroup'
import { Button } from '../components/ui/Button'
import { PageStateHandler } from '../components/layout/PageStateHandler'
import { useDiscoveryFeed } from '../hooks/useDiscoveryFeed'
import { useEmitBehaviorEvent } from '../hooks/useEmitBehaviorEvent'
import { useCurrentUserId } from '../contexts/AuthContext'
import { getProfilePhotos, formatProfileLocation } from '../utils/profile'
import type { ProfileSummary } from '../hooks/useProfileSummary'

export default function DiscoveryPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({})
  const [priorities] = useState<Record<string, number>>({})
  const currentUserId = useCurrentUserId()
  
  const { data: profiles = [], isLoading } = useDiscoveryFeed(currentUserId, filters, priorities)
  const emitEvent = useEmitBehaviorEvent()

  const handleSwipe = (profile: ProfileSummary, direction: 'left' | 'right') => {
    const eventType = direction === 'right' ? 'profile_like' : 'profile_dislike'
    
    emitEvent({
      eventType,
      targetType: 'profile',
      targetId: profile.id,
      meta: {
        profile_meta: profile,
        compatibility_score: profile.compatibilityScore,
        source: 'discovery_swipe',
      },
    })

    // Navigate to matches if liked
    if (direction === 'right') {
      // TODO: Check if match occurred, then navigate
      // For now, just continue swiping
    }
  }

  const handleCardClick = (profile: ProfileSummary) => {
    navigate(`/profile/${profile.userId}`)
  }

  const renderProfileCard = (profile: ProfileSummary) => {
    const photos = getProfilePhotos(profile)
    
    return (
      <Card
        variant="discovery"
        onClick={() => handleCardClick(profile)}
        className="h-[600px] flex flex-col"
      >
        <>
          {/* Photo Section */}
          <div className="relative flex-1 rounded-lg overflow-hidden mb-4">
            {photos.length > 0 ? (
              <img
                src={photos[0]}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No photo</span>
              </div>
            )}
            
            {/* Compatibility Badge Overlay */}
            {profile.compatibilityScore !== undefined && (
              <div className="absolute top-4 right-4">
                <CompatibilityBadge variant="medium" score={profile.compatibilityScore} showIcon />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="space-y-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
              <p className="text-gray-600">
                {formatProfileLocation(profile)}
              </p>
            </div>

            {/* Dimension Badges */}
            {profile.badges && profile.badges.length > 0 && (
              <BadgeGroup badges={profile.badges} maxVisible={4} />
            )}

            {/* Bio Preview */}
            {profile.bio && (
              <p className="text-sm text-gray-700 line-clamp-2">{profile.bio}</p>
            )}
          </div>
        </>
      </Card>
    )
  }

  return (
    <PageStateHandler
      isLoading={isLoading}
      isEmpty={!profiles || profiles.length === 0}
      emptyMessage="No more profiles to discover"
      emptyActionLabel="Reset Filters"
      onEmptyAction={() => setFilters({})}
      loadingComponent={
        <div className="p-4">
          <LoadingSkeleton variant="custom" className="h-[600px]" />
        </div>
      }
      className="p-4"
    >
      <div className="max-w-md mx-auto">
        {/* Card Stack */}
        <div className="h-[600px] mb-6">
          <CardStack
            cards={profiles}
            renderCard={renderProfileCard}
            onSwipe={handleSwipe}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            variant="secondary"
            size="large"
            onClick={() => {
              if (profiles.length > 0) {
                handleSwipe(profiles[0], 'left')
              }
            }}
            disabled={profiles.length === 0}
          >
            Dislike
          </Button>
          <Button
            variant="primary"
            size="large"
            onClick={() => {
              if (profiles.length > 0) {
                handleSwipe(profiles[0], 'right')
              }
            }}
            disabled={profiles.length === 0}
          >
            Like
          </Button>
        </div>
      </div>
    </PageStateHandler>
  )
}
