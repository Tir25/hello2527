import { useCallback, useEffect, useRef } from 'react'
import { presenceService } from '@/lib/services/presence.service'
import { logger } from '@/lib/logger'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const usePresence = (userId: string | undefined) => {
  const channelRef = useRef<RealtimeChannel | null>(null)

  const subscribe = useCallback(() => {
    if (!userId) return

    const result = presenceService.subscribeToPresence(userId, (presence) => {
      logger.info('usePresence', 'Presence state updated', presence)
    })

    if (result.success && result.channel) {
      channelRef.current = result.channel
    }
  }, [userId])

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      presenceService.unsubscribeFromPresence(channelRef.current)
      channelRef.current = null
    }
  }, [])

  useEffect(() => {
    subscribe()
    return () => {
      unsubscribe()
    }
  }, [subscribe, unsubscribe])

  return {
    subscribe,
    unsubscribe,
  }
}

