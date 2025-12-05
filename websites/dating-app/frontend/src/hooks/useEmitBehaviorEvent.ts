import { useCallback } from 'react'
import { useSDK } from '../contexts/SDKContext'

// Event types from Prisma schema
export type EventType = 
  | 'profile_view'
  | 'profile_like'
  | 'profile_dislike'
  | 'quiz_open'
  | 'quiz_take'
  | 'quiz_like'
  | 'quiz_dislike'
  | 'message_sent'
  | 'match_view'

export type TargetType = 
  | 'profile'
  | 'quiz'
  | 'message'
  | 'match'

export interface BehaviorEventMeta {
  [key: string]: string | number | boolean | null | undefined
}

export interface EmitBehaviorEventParams {
  eventType: EventType
  targetType: TargetType
  targetId: string
  meta?: BehaviorEventMeta
}

export function useEmitBehaviorEvent() {
  const sdk = useSDK()

  const emitEvent = useCallback(
    async (params: EmitBehaviorEventParams) => {
      try {
        await sdk.behaviorevent.create({
          eventType: params.eventType,
          targetType: params.targetType,
          targetId: params.targetId,
          meta: params.meta || {},
        })
      } catch (error) {
        // Silently fail - event tracking shouldn't break the UI
        console.error('Failed to emit behavior event:', error)
      }
    },
    [sdk]
  )

  return emitEvent
}

