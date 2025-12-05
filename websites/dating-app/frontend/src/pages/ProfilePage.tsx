import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MediaLoader } from '../components/ui/MediaLoader'
import { Card } from '../components/ui/Card'
import { Slider } from '../components/ui/Slider'
import { ButtonGroup } from '../components/ui/ButtonGroup'
import { InfoCard } from '../components/ui/InfoCard'
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton'
import { CompatibilityBadge } from '../components/compatibility/CompatibilityBadge'
import { CompatibilityBreakdown } from '../components/compatibility/CompatibilityBreakdown'
import { useProfileSummary } from '../hooks/useProfileSummary'
import { useUserDimensions } from '../hooks/useUserDimensions'
import { useCompatibility } from '../hooks/useCompatibility'
import { useEmitBehaviorEvent } from '../hooks/useEmitBehaviorEvent'
import { useCurrentUserId } from '../contexts/AuthContext'
import { getProfilePhotos, formatProfileLocation } from '../utils/profile'

export default function ProfilePage() {
  const { userId } = useParams<{ userId?: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('about')
  const currentUserId = useCurrentUserId()
  const profileUserId = userId || currentUserId
  const isOwnProfile = !userId || userId === currentUserId

  const { data: profile, isLoading: profileLoading } = useProfileSummary(profileUserId)
  const { data: dimensions, isLoading: dimensionsLoading } = useUserDimensions(profileUserId)
  const { data: compatibility } = useCompatibility(currentUserId, profileUserId)
  const emitEvent = useEmitBehaviorEvent()

  // Emit profile_view event when viewing other user's profile
  React.useEffect(() => {
    if (!isOwnProfile && profile) {
      emitEvent({
        eventType: 'profile_view',
        targetType: 'profile',
        targetId: profile.id,
        meta: {
          profile_meta: profile,
          compatibility_score: profile.compatibilityScore,
          source: 'profile_page',
        },
      })
    }
  }, [isOwnProfile, profile, emitEvent])

  if (profileLoading || dimensionsLoading) {
    return (
      <div className="p-4">
        <LoadingSkeleton variant="profile-header" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Profile not found</p>
      </div>
    )
  }

  const photos = getProfilePhotos(profile)

  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'photos', label: 'Photos' },
    { id: 'quizzes', label: 'Quizzes' },
    { id: 'dimensions', label: 'Dimensions' },
  ]

  return (
    <div className="p-4 space-y-6">
      {/* Profile Header */}
      <div className="space-y-4">
        <div className="relative">
          <MediaLoader variant="carousel" images={photos} />
          {!isOwnProfile && profile.compatibilityScore !== undefined && (
            <div className="absolute top-4 right-4">
              <CompatibilityBadge variant="large" score={profile.compatibilityScore} showIcon />
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
          <p className="text-gray-600">
            {formatProfileLocation(profile)}
            {!isOwnProfile && compatibility && (
              <span className="ml-2">• {Math.round(compatibility.overallScore)}% match</span>
            )}
          </p>
        </div>
      </div>

      {/* Your Dimensions Panel (Self Profile Only) */}
      {isOwnProfile && dimensions && dimensions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Dimensions</h2>
          <div className="grid grid-cols-2 gap-4">
            {dimensions.map((dimension) => (
              <Card key={dimension.id} variant="dimension">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      {dimension.dimensionName}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {Math.round(dimension.normalizedScore)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${dimension.normalizedScore}%` }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dimension Priority Editor (Self Profile Only) */}
      {isOwnProfile && dimensions && dimensions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Dimension Priorities</h2>
          <div className="space-y-4">
            {dimensions.slice(0, 5).map((dimension) => (
              <Slider
                key={dimension.id}
                variant="full"
                label={dimension.dimensionName}
                min={0}
                max={10}
                value={1.0}
                step={0.1}
                onChange={(value) => {
                  // TODO: Implement priority update hook
                  console.log(`Update priority for ${dimension.dimensionName}: ${value}`)
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <ButtonGroup
        variant="tabs"
        items={tabs}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === 'about' && (
        <div className="space-y-4">
          {profile.bio ? (
            <p className="text-gray-700">{profile.bio}</p>
          ) : (
            <p className="text-gray-500 italic">No bio yet</p>
          )}
        </div>
      )}

          {activeTab === 'quizzes' && (
            <div className="space-y-4">
              <InfoCard
                variant="quiz-nudge"
                message="Improve matches by answering 3 more questions"
                actionLabel="Take Quiz"
                onAction={() => navigate('/quizzes')}
              />
            </div>
          )}

      {activeTab === 'dimensions' && dimensions && (
        <div className="space-y-4">
          {dimensions.map((dimension) => (
            <Card key={dimension.id} variant="dimension">
              <div className="flex justify-between items-center">
                <span className="font-medium">{dimension.dimensionName}</span>
                <span className="text-primary font-bold">
                  {Math.round(dimension.normalizedScore)}%
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Compatibility Breakdown (Other User Only) */}
      {!isOwnProfile && compatibility && compatibility.breakdown.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Compatibility Breakdown</h2>
          <CompatibilityBreakdown
            variant="detailed"
            overallScore={compatibility.overallScore}
            dimensions={compatibility.breakdown}
            expandable
          />
        </div>
      )}

      {/* Action Buttons (Other User Only) */}
      {!isOwnProfile && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-200 safe-bottom">
          <div className="flex gap-4">
            <button
              onClick={() => {
                emitEvent({
                  eventType: 'profile_dislike',
                  targetType: 'profile',
                  targetId: profile.id,
                  meta: { profile_meta: profile },
                })
                navigate('/discovery')
              }}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Dislike
            </button>
            <button
              onClick={() => {
                emitEvent({
                  eventType: 'profile_like',
                  targetType: 'profile',
                  targetId: profile.id,
                  meta: { profile_meta: profile, compatibility_score: compatibility?.overallScore },
                })
                navigate('/matches')
              }}
              className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Like
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
