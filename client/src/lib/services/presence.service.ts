import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface PresenceServiceResponse {
  success: boolean
  error?: string
  channel?: RealtimeChannel
}

export const presenceService = {
  subscribeToPresence(
    userId: string,
    onPresenceChange: (presence: unknown) => void
  ): PresenceServiceResponse {
    try {
      const channel = supabase
        .channel(`presence:${userId}`)
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          onPresenceChange(state)
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          logger.info('presence:join', `User ${key} joined`, newPresences)
          const state = channel.presenceState()
          onPresenceChange(state)
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          logger.info('presence:leave', `User ${key} left`, leftPresences)
          const state = channel.presenceState()
          onPresenceChange(state)
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channel.track({
              user_id: userId,
              online_at: new Date().toISOString(),
            })
            logger.info('presence:subscribe', 'Successfully subscribed to presence channel')
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('presence:subscribe', 'Channel subscription error')
          }
        })

      return {
        success: true,
        channel,
      }
    } catch (error) {
      logger.error('presence:subscribe', 'Failed to subscribe to presence', error)
      return {
        success: false,
        error: 'Failed to subscribe to presence updates',
      }
    }
  },

  unsubscribeFromPresence(channel: RealtimeChannel | null): void {
    if (channel) {
      supabase
        .removeChannel(channel)
        .then(() => {
          logger.info('presence:unsubscribe', 'Channel removed successfully')
        })
        .catch((err) => {
          logger.error('presence:unsubscribe', 'Error removing channel', err)
        })
    }
  },
}

