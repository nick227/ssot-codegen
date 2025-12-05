import type { ProfileSummary } from '../hooks/useProfileSummary'

/**
 * Extract photos array from profile
 */
export function getProfilePhotos(profile: ProfileSummary | undefined): string[] {
  return profile?.primaryPhoto ? [profile.primaryPhoto] : []
}

/**
 * Format profile age and location
 */
export function formatProfileLocation(profile: ProfileSummary | undefined): string {
  if (!profile) return ''
  const parts = [profile.age.toString()]
  if (profile.location) parts.push(profile.location)
  return parts.join(' • ')
}

/**
 * Transform raw profile data to ProfileSummary
 */
export function transformToProfileSummary(data: {
  id: string
  userId: string
  name: string
  age: number
  location?: string | null
  bio?: string | null
  primaryPhoto?: string | null
  compatibilityScore?: number | null
}): ProfileSummary {
  return {
    id: data.id,
    userId: data.userId,
    name: data.name,
    age: data.age,
    location: data.location || undefined,
    bio: data.bio || undefined,
    primaryPhoto: data.primaryPhoto || undefined,
    compatibilityScore: data.compatibilityScore || undefined,
    badges: [],
    topDimensions: [],
  }
}

