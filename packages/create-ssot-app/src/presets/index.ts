/**
 * Presets for common application types
 * 
 * M0: 3 presets to simplify scaffolding
 */

import { MEDIA_PRESET_SCHEMA, MEDIA_PRESET_APP_CONFIG } from './media-preset.js'
import { MARKETPLACE_PRESET_SCHEMA, MARKETPLACE_PRESET_APP_CONFIG } from './marketplace-preset.js'
import { SAAS_PRESET_SCHEMA, SAAS_PRESET_APP_CONFIG } from './saas-preset.js'

export interface Preset {
  name: string
  description: string
  schema: string
  appConfig: any
}

export const PRESETS: Record<string, Preset> = {
  media: {
    name: 'Media Platform',
    description: 'Music/video sharing (User, Track, Playlist) - like SoundCloud',
    schema: MEDIA_PRESET_SCHEMA,
    appConfig: MEDIA_PRESET_APP_CONFIG
  },
  
  marketplace: {
    name: 'Marketplace',
    description: 'E-commerce platform (User, Product, Order) - like Shopify',
    schema: MARKETPLACE_PRESET_SCHEMA,
    appConfig: MARKETPLACE_PRESET_APP_CONFIG
  },
  
  saas: {
    name: 'SaaS Platform',
    description: 'Multi-tenant SaaS (Org, User, Subscription)',
    schema: SAAS_PRESET_SCHEMA,
    appConfig: SAAS_PRESET_APP_CONFIG
  }
}

export function getPreset(name: string): Preset | null {
  return PRESETS[name] || null
}

export function listPresets(): Preset[] {
  return Object.values(PRESETS)
}

